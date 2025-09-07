const upstream = process.env.INTERNAL_HEALTH || 'https://telemed-internal.onrender.com/ai/echo';
const headerName = process.env.INTERNAL_HEADER || 'X-Internal-Token';
const token = process.env.INTERNAL_TOKEN || '';

export default function registerDrAIProxy(app) {
  app.get('/api/dr-ai/health', async (_req, res) => {
    try {
      const r = await fetch(upstream, { 
        method: 'POST',
        headers: { 
          [headerName]: token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ping: 'health-check' })
      });
      const data = await r.json();
      
      // Se a resposta tem ok: true, está funcionando
      if (data.ok) {
        res.json({ status: 'ok', ts: new Date().toISOString() });
      } else {
        res.status(r.status || 502).json({ status: 'fail', details: 'AI service unavailable', data, ts: new Date().toISOString() });
      }
    } catch (e) {
      res.status(502).json({ status: 'fail', details: String(e), ts: new Date().toISOString() });
    }
  });
}