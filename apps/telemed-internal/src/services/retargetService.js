import { pool } from "../db/pool.js";

export async function runMigration() {
  try {
    await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS retarget_queue (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        session_id TEXT NOT NULL,
        user_id UUID,
        trigger_event TEXT NOT NULL,
        trigger_at TIMESTAMPTZ NOT NULL,
        phone TEXT,
        email TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        sent_at TIMESTAMPTZ,
        reason TEXT,
        utm_campaign TEXT,
        utm_source TEXT,
        utm_medium TEXT,
        properties JSONB NOT NULL DEFAULT '{}'::jsonb
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_retarget_status_created
        ON retarget_queue(status, created_at DESC);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_retarget_session_trigger
        ON retarget_queue(session_id, trigger_event, trigger_at DESC);
    `);

    console.log("✅ Tabela retarget_queue migrada com sucesso");
  } catch (err) {
    console.error("[retarget] migration error:", err);
  }
}

export async function findEligibleForRetarget(minutesDelay = 30) {
  const sql = `
    WITH triggers AS (
      SELECT
        session_id,
        event_name AS trigger_event,
        created_at AS trigger_at,
        utm_campaign,
        utm_source,
        utm_medium,
        properties
      FROM telemetry_events
      WHERE
        event_name IN ('offer_created', 'booking_started')
        AND created_at < now() - interval '${minutesDelay} minutes'
        AND created_at > now() - interval '24 hours'
    ),
    confirmed AS (
      SELECT DISTINCT session_id
      FROM telemetry_events
      WHERE event_name = 'booking_confirmed'
        AND created_at > now() - interval '24 hours'
    ),
    already_queued AS (
      SELECT DISTINCT session_id, trigger_event
      FROM retarget_queue
      WHERE status IN ('pending', 'sent')
        AND created_at > now() - interval '24 hours'
    )
    SELECT t.*
    FROM triggers t
    LEFT JOIN confirmed c ON t.session_id = c.session_id
    LEFT JOIN already_queued aq ON t.session_id = aq.session_id AND t.trigger_event = aq.trigger_event
    WHERE c.session_id IS NULL
      AND aq.session_id IS NULL
    ORDER BY t.trigger_at DESC
    LIMIT 100
  `;

  const { rows } = await pool.query(sql);
  return rows;
}

export async function enqueueRetarget(item) {
  const sql = `
    INSERT INTO retarget_queue (
      session_id, trigger_event, trigger_at,
      utm_campaign, utm_source, utm_medium,
      properties, status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
    ON CONFLICT DO NOTHING
    RETURNING id
  `;

  const { rows } = await pool.query(sql, [
    item.session_id,
    item.trigger_event,
    item.trigger_at,
    item.utm_campaign,
    item.utm_source,
    item.utm_medium,
    item.properties || {},
  ]);

  return rows[0]?.id || null;
}

export async function processRetargetQueue() {
  const eligible = await findEligibleForRetarget(30);
  let enqueued = 0;

  for (const item of eligible) {
    const id = await enqueueRetarget(item);
    if (id) enqueued++;
  }

  return { checked: eligible.length, enqueued };
}

export async function getRetargetStats() {
  const sql = `
    SELECT
      status,
      COUNT(*) AS count,
      COUNT(*) FILTER (WHERE created_at > now() - interval '24 hours') AS last_24h,
      COUNT(*) FILTER (WHERE created_at > now() - interval '7 days') AS last_7d
    FROM retarget_queue
    GROUP BY status
  `;

  const { rows } = await pool.query(sql);

  const stats = {
    pending: { total: 0, last_24h: 0, last_7d: 0 },
    sent: { total: 0, last_24h: 0, last_7d: 0 },
    skipped: { total: 0, last_24h: 0, last_7d: 0 },
    failed: { total: 0, last_24h: 0, last_7d: 0 },
  };

  for (const row of rows) {
    stats[row.status] = {
      total: parseInt(row.count),
      last_24h: parseInt(row.last_24h),
      last_7d: parseInt(row.last_7d),
    };
  }

  return stats;
}

export async function getPendingRetargets(limit = 50) {
  const sql = `
    SELECT *
    FROM retarget_queue
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT $1
  `;

  const { rows } = await pool.query(sql, [limit]);
  return rows;
}

export async function markRetargetSent(id, reason = null) {
  await pool.query(
    `UPDATE retarget_queue SET status = 'sent', sent_at = now(), reason = $2 WHERE id = $1`,
    [id, reason]
  );
}

export async function markRetargetSkipped(id, reason) {
  await pool.query(
    `UPDATE retarget_queue SET status = 'skipped', reason = $2 WHERE id = $1`,
    [id, reason]
  );
}

export async function markRetargetFailed(id, reason) {
  await pool.query(
    `UPDATE retarget_queue SET status = 'failed', reason = $2 WHERE id = $1`,
    [id, reason]
  );
}

runMigration();
