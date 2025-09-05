import express from 'express';
import cors from 'cors';

const app = express();
app.use(express.json());

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN; // https://telemed-deploy-ready.onrender.com
app.use(cors({ origin: FRONTEND_ORIGIN ? [FRONTEND_ORIGIN] : true, credentials: true }));

app.get('/healthz', (req, res) => res.json({ ok: true }));

// MVP: heurística simples só para a demo
app.post('/suggest/cids', async (req, res) => {
  const { text } = req.body || {};
  if (!text || !text.trim()) return res.status(400).json({ ok: false, error: 'bad_request' });

  const t = text.toLowerCase();
  const suggestions = [];
  if (t.includes('dor torác') || t.includes('dor no peito')) suggestions.push({ system: 'CID10', code: 'I20', label: 'Angina pectoris' });
  if (t.includes('dispneia')) suggestions.push({ system: 'CID10', code: 'R06.0', label: 'Dispneia' });
  if (t.includes('sudorese')) suggestions.push({ system: 'CID10', code: 'R61', label: 'Hiperidrose' });

  return res.json({ ok: true, suggestions });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log('productivity-service on', PORT));