import express from 'express';

const router = express.Router();
const base = (process.env.VITE_RC_BASE_URL || process.env.RC_BASE_URL || 'https://receita-certa-daciobd.replit.app').replace(/\/$/, '');

router.get('/rc/health', async (_req, res) => {
  try {
    const r = await fetch(`${base}/api/health`);
    const data = await r.json().catch(() => ({}));
    res.status(r.ok ? 200 : 500).json(data);
  } catch (e: any) {
    res.status(500).json({ ok: false, error: e?.message || 'rc_unreachable' });
  }
});

export default router;