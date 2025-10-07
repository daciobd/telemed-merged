// routes/auth.js — stub simples para piloto
const express = require('express');
const router = express.Router();

// Aceita qualquer id/senha/role e devolve token de 24h (PILOTO — não usar em produção)
router.post('/login', (req, res) => {
  const { id, password, role } = req.body || {};
  if (!id || !password || !role) return res.status(400).json({ ok:false, error:'missing_fields' });

  const user  = { id, role, name: role==='medico' ? 'Dr(a). Teste' : 'Paciente Teste' };
  const token = Buffer.from(JSON.stringify({ sub:id, role, exp: Date.now()+24*60*60*1000 })).toString('base64');
  return res.json({ ok:true, token, user });
});

router.post('/logout', (_req,res) => res.json({ ok:true }));
router.get('/me', (_req,res) => res.json({ ok:true, user:null })); // implemente se desejar

module.exports = router;
