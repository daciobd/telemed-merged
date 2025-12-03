import crypto from 'crypto';
import pg from 'pg';

const { Pool } = pg;

const HAS_DB = !!process.env.DATABASE_URL;
const pool = HAS_DB ? new Pool({ 
  connectionString: process.env.DATABASE_URL, 
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
}) : null;

const TZ = 'America/Sao_Paulo';
const RETENTION_DAYS = Number(process.env.TELEMETRY_RETENTION_DAYS || 7);
const MEMORY_LIMIT = Number(process.env.TELEMETRY_MEMORY_LIMIT || 5000);

const allowedEvents = ['tour_start','tour_step','ask_submitted','ask_error','cta_click','page_view'];

function sha256(s) { 
  return crypto.createHash('sha256').update(s).digest('hex'); 
}

function anonIdFromHints(req, sessionId) {
  const salt = new Date().toISOString().slice(0,10);
  const ua = (req.headers['user-agent'] || '').slice(0,120);
  const accept = (req.headers['accept'] || '').slice(0,64);
  return sha256(`${salt}:${ua}:${accept}:${sessionId || ''}`);
}

function sanitize(payload) {
  const out = {
    event_name: payload.event_name,
    ts: payload.ts,
    session_id: payload.session_id,
    role: (payload.role === 'patient' || payload.role === 'doctor') ? payload.role : undefined,
    page: String(payload.page || '').slice(0,64),
    version: payload.version ? String(payload.version).slice(0,32) : undefined,
    trace_id: payload.trace_id ? String(payload.trace_id).slice(0,64) : undefined,
    duration_ms: (Number.isFinite(payload.duration_ms) && payload.duration_ms >= 0) ? Math.floor(payload.duration_ms) : undefined,
    event_props: {}
  };
  const ep = payload.event_props || {};
  if (ep.step_index != null) out.event_props.step_index = Math.max(0, Math.min(64, parseInt(ep.step_index,10) || 0));
  if (ep.http_status != null) out.event_props.http_status = parseInt(ep.http_status,10) || undefined;
  if (ep.retry_count != null) out.event_props.retry_count = Math.max(0, parseInt(ep.retry_count,10) || 0);
  return out;
}

const mem = [];
function memInsert(e) {
  mem.push(e);
  while (mem.length > MEMORY_LIMIT) mem.shift();
}

function memCleanup() {
  const cutoff = Date.now() - RETENTION_DAYS*24*60*60*1000;
  let i = 0;
  while (i < mem.length && new Date(mem[i].ts).getTime() < cutoff) i++;
  if (i > 0) mem.splice(0, i);
}

function memMetrics(rangeMs) {
  const now = Date.now();
  const from = now - rangeMs;
  const rows = mem.filter(e => new Date(e.ts).getTime() >= from);
  const activeUsers = new Set(rows.map(r => r.user_anon_id)).size;
  const asks = rows.filter(r => r.event_name === 'ask_submitted').length;
  const errors = rows.filter(r => r.event_name === 'ask_error' || ((r.event_props||{}).http_status|0) >= 500).length;
  const durations = rows.filter(r => r.event_name === 'ask_submitted' && Number.isFinite(r.duration_ms)).map(r => r.duration_ms);
  const avg = durations.length ? (durations.reduce((a,b)=>a+b,0)/durations.length) : null;
  
  const byHourMap = new Map();
  for (const r of rows) {
    const d = new Date(r.ts);
    const hourKey = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours());
    const k = hourKey.toISOString();
    byHourMap.set(k, (byHourMap.get(k)||0)+1);
  }
  const by_hour = [...byHourMap.entries()].sort(([a],[b])=>a.localeCompare(b)).map(([hour,events])=>({hour, events}));

  const byEvent = {};
  const topPages = {};
  for (const r of rows) {
    byEvent[r.event_name] = (byEvent[r.event_name]||0)+1;
    topPages[r.page] = (topPages[r.page]||0)+1;
  }
  
  return {
    totals: { active_users: activeUsers, asks, errors, avg_duration: avg },
    series: { by_hour },
    breakdowns: {
      by_event: Object.entries(byEvent).map(([event_name,c])=>({event_name, c})).sort((a,b)=>b.c-a.c),
      top_pages: Object.entries(topPages).map(([page,c])=>({page, c})).sort((a,b)=>b.c-a.c).slice(0,10)
    }
  };
}

async function ensureTable() {
  if (!HAS_DB) return;
  const ddl = `
    CREATE TABLE IF NOT EXISTS events (
      id           TEXT PRIMARY KEY,
      ts           TIMESTAMPTZ NOT NULL,
      session_id   TEXT NOT NULL,
      user_anon_id TEXT NOT NULL,
      role         TEXT,
      page         TEXT NOT NULL,
      event_name   TEXT NOT NULL,
      version      TEXT,
      trace_id     TEXT,
      duration_ms  INTEGER,
      event_props  JSONB NOT NULL DEFAULT '{}'::jsonb
    );
    CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);
    CREATE INDEX IF NOT EXISTS idx_events_event_name ON events(event_name);
    CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_anon_id);
    CREATE INDEX IF NOT EXISTS idx_events_page ON events(page);
  `;
  const client = await pool.connect();
  try { 
    await client.query(ddl); 
  } finally { 
    client.release(); 
  }
}

function parseRange(range) {
  if (!range) return 24*60*60*1000;
  if (range.endsWith('h')) return parseInt(range,10)*60*60*1000;
  if (range.endsWith('d')) return parseInt(range,10)*24*60*60*1000;
  return 24*60*60*1000;
}

export async function installTelemetry() {
  await ensureTable();

  // Limpeza periódica
  setInterval(async () => {
    try {
      if (HAS_DB) {
        const client = await pool.connect();
        try {
          await client.query(`DELETE FROM events WHERE ts < now() - ($1 || ' days')::interval`, [RETENTION_DAYS.toString()]);
        } finally { 
          client.release(); 
        }
      } else {
        memCleanup();
      }
    } catch {}
  }, 24*60*60*1000);
}

export async function handleTelemetryEvent(req, res) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const raw = JSON.parse(body || '{}');
      
      if (!allowedEvents.includes(raw.event_name)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'invalid_event' }));
        return;
      }

      const safe = sanitize(raw);
      const user_anon_id = anonIdFromHints(req, safe.session_id);
      const id = sha256(`${safe.ts}:${safe.session_id}:${safe.event_name}:${Math.random()}`);
      const record = { id, user_anon_id, ...safe };

      if (HAS_DB) {
        const client = await pool.connect();
        try {
          await client.query(
            `INSERT INTO events (id, ts, session_id, user_anon_id, role, page, event_name, version, trace_id, duration_ms, event_props)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [id, new Date(safe.ts), safe.session_id, user_anon_id, safe.role||null, safe.page, safe.event_name, safe.version||null, safe.trace_id||null, safe.duration_ms||null, safe.event_props||{}]
          );
        } finally { 
          client.release(); 
        }
      } else {
        memInsert(record);
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: 'persist_failed' }));
    }
  });
}

export async function handleTelemetryPing(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true, message: 'Telemetry endpoint is working' }));
}

export async function handleTelemetryMetrics(req, res) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const range = url.searchParams.get('range') || '24h';
    
    console.log('[Telemetry] HAS_DB:', HAS_DB, 'range:', range);
    
    if (!HAS_DB) {
      const m = memMetrics(parseRange(range));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ window: range, timezone: TZ, now_iso: new Date().toISOString(), ...m }));
      return;
    }

    const client = await pool.connect();
    try {
      const hours = parseInt(range.replace(/[hd]$/, ''), 10) || 24;
      const intervalStr = `${hours} hours`;
      
      const totals = await client.query(`
        SELECT
          (SELECT COUNT(DISTINCT user_anon_id) FROM events WHERE ts >= now() - interval '${intervalStr}') AS active_users,
          (SELECT COUNT(*) FROM events WHERE ts >= now() - interval '${intervalStr}' AND event_name='ask_submitted') AS asks,
          (SELECT COUNT(*) FROM events WHERE ts >= now() - interval '${intervalStr}' AND (event_name='ask_error' OR COALESCE((event_props->>'http_status')::int,0) >= 500)) AS errors,
          (SELECT AVG(duration_ms) FROM events WHERE ts >= now() - interval '${intervalStr}' AND event_name='ask_submitted' AND duration_ms IS NOT NULL) AS avg_duration
      `);

      const byHour = await client.query(`
        SELECT date_trunc('hour', (ts AT TIME ZONE $1)) AS hour, COUNT(*) AS events
        FROM events WHERE ts >= now() - interval '${intervalStr}' GROUP BY 1 ORDER BY 1
      `,[TZ]);

      const byEvent = await client.query(`
        SELECT event_name, COUNT(*) AS c FROM events WHERE ts >= now() - interval '${intervalStr}' GROUP BY 1 ORDER BY 2 DESC
      `);

      const topPages = await client.query(`
        SELECT page, COUNT(*) AS c FROM events WHERE ts >= now() - interval '${intervalStr}' GROUP BY 1 ORDER BY 2 DESC LIMIT 10
      `);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        window: range,
        timezone: TZ,
        now_iso: new Date().toISOString(),
        totals: totals.rows[0],
        series: { by_hour: byHour.rows },
        breakdowns: { by_event: byEvent.rows, top_pages: topPages.rows }
      }));
    } finally { 
      client.release(); 
    }
  } catch (e) {
    console.error('Telemetry metrics error:', e);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'metrics_failed', message: e.message }));
  }
}
