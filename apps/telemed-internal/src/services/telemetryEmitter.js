import { pool } from "../db/pool.js";

export async function emitTelemetryEvent({
  eventName,
  sessionId = null,
  userId = null,
  utm = {},
  properties = {},
  referrer = null,
  path = null,
  ip = null,
  userAgent = null,
}) {
  try {
    const sql = `
      INSERT INTO telemetry_events (
        event_name, session_id, user_id,
        utm_source, utm_medium, utm_campaign, utm_content, utm_term,
        referrer, path, ip, user_agent, properties
      ) VALUES (
        $1,$2,$3,
        $4,$5,$6,$7,$8,
        $9,$10,$11,$12,$13
      )
      RETURNING id, created_at
    `;

    const params = [
      eventName,
      sessionId,
      userId,
      utm.source ? String(utm.source).slice(0, 120) : null,
      utm.medium ? String(utm.medium).slice(0, 120) : null,
      utm.campaign ? String(utm.campaign).slice(0, 200) : null,
      utm.content ? String(utm.content).slice(0, 200) : null,
      utm.term ? String(utm.term).slice(0, 200) : null,
      referrer ? String(referrer).slice(0, 800) : null,
      path,
      ip ? String(ip).slice(0, 80) : null,
      userAgent ? String(userAgent).slice(0, 500) : null,
      properties,
    ];

    const r = await pool.query(sql, params);
    return { ok: true, id: r.rows[0].id, createdAt: r.rows[0].created_at };
  } catch (err) {
    console.error("[telemetry] emit error:", err.message);
    return { ok: false, error: err.message };
  }
}
