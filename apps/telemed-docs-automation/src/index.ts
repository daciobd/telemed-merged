import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import generationRouter from './routes/generation.js';

const app = express();

const ORIGINS = (process.env.CORS_ORIGINS || process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: ORIGINS.length ? ORIGINS : true,
  methods: ["GET","POST","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","X-Internal-Token"],
  credentials: false
}));

app.use(express.json({ limit: '2mb' }));
app.use(morgan('tiny'));

app.get('/healthz', (_req, res) => res.json({ ok: true }));
app.use('/generate', generationRouter);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`[telemed-docs-automation] listening on :${PORT}`);
});