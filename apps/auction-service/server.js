// server.js (genérico p/ API + health + raiz informativa)
import express from 'express';

const app = express();
const service = process.env.SERVICE_NAME || 'telemed-auction';
const version = process.env.RENDER_GIT_COMMIT || process.env.GIT_COMMIT || 'unknown';

app.get('/healthz', (_, res) => res.status(200).json({ ok: true }));
app.get('/health', (_, res) => res.status(200).json({ ok: true }));
app.get('/', (_, res) => {
  res.json({
    service,
    status: 'running',
    version,
    endpoints: ['/', '/healthz', '/health'],
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`${service} listening on ${port}`));