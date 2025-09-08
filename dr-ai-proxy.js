
const upstream   = process.env.INTERNAL_HEALTH || 'https://telemed-internal.onrender.com/api/dr-ai/health';
const headerName = process.env.INTERNAL_HEADER || 'X-Internal-Token';
const token      = process.env.INTERNAL_TOKEN || '';

export default function registerDrAIProxy(app) {
  app.get('/api/dr-ai/health', async (_req, res) => {
    try {
      const r = await fetch(upstream, {
        method: 'GET',
        headers: token ? { [headerName]: token } : {},
        redirect: 'manual'
      });
      res.status(r.status);
      const ct = r.headers.get('content-type'); if (ct) res.set('content-type', ct);
      const ab = await r.arrayBuffer(); res.send(Buffer.from(ab));
    } catch (e) {
      res.status(502).json({ status:'fail', details:String(e), ts:new Date().toISOString() });
    }
  });
};
