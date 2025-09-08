// index.js (raiz)
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

const app = express();
app.use(cors());
app.use(morgan('dev'));

const PORT = process.env.PORT || 5000;
const INTERNAL_TOKEN = process.env.INTERNAL_TOKEN;
const HEADER_NAME = process.env.INTERNAL_HEADER || 'X-Internal-Token';

app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok', service: 'telemed-internal', ts: new Date().toISOString() });
});

function auth(req, res, next) {
  if (!INTERNAL_TOKEN) return res.status(500).json({ error: 'missing INTERNAL_TOKEN' });
  const bearer = req.get('Authorization');
  const header = req.get(HEADER_NAME);
  let token = null;
  if (bearer?.startsWith('Bearer ')) token = bearer.slice(7);
  if (!token && header) token = header;
  if (token !== INTERNAL_TOKEN) return res.status(401).json({ error: 'invalid token' });
  next();
}

app.get('/api/dr-ai/health', auth, (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

app.listen(PORT, () => console.log(`[telemed-internal] listening on :${PORT}`));
