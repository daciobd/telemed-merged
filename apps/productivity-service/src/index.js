import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import os from 'os';
import multer from 'multer';
import { openaiTranscribe, openaiSOAP } from './providers/openai.js';

const app = express();
const prisma = new PrismaClient();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('tiny'));

function auth(roles = []) {
  return (req, res, next) => {
    const h = req.header('Authorization');
    if (!h) return res.status(401).json({ error: 'Missing Authorization' });
    const [t, tk] = h.split(' ');
    if (t !== 'Bearer') return res.status(401).json({ error: 'Invalid Authorization' });
    try {
      const p = jwt.verify(tk, process.env.JWT_SECRET || 'dev-secret');
      if (roles.length && !roles.includes(p.role)) return res.status(403).json({ error: 'Forbidden' });
      req.user = { id: p.sub, role: p.role, email: p.email };
      next();
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}
app.get('/healthz', (_req, res) => res.json({ ok: true }));

// Upload + transcribe
const upload = multer({ dest: os.tmpdir() });
app.post('/ai/scribe/upload', auth(['physician']), upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'missing file' });
    const text = process.env.OPENAI_API_KEY
      ? await openaiTranscribe({ filePath: req.file.path })
      : '(stub) transcrição';
    const t = await prisma.transcript.create({
      data: { consultId: req.body.consultId || 'unknown', text, diarized: false, lang: 'pt-BR' },
    });
    res.json({ transcriptId: t.id, text });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  } finally {
    try {
      fs.unlinkSync(req.file?.path);
    } catch {}
  }
});

// Summarize (SOAP)
app.post('/ai/summarize', auth(['physician']), async (req, res) => {
  const { consultId, transcriptId } = req.body || {};
  if (!consultId) return res.status(400).json({ error: 'consultId required' });
  let transcript = '';
  if (transcriptId) {
    const t = await prisma.transcript.findUnique({ where: { id: transcriptId } });
    transcript = t?.text || '';
  }
  if (!transcript) {
    const t = await prisma.transcript.findFirst({
      where: { consultId },
      orderBy: { createdAt: 'desc' },
    });
    transcript = t?.text || '';
  }
  let soap = { S: 'Resumo...', O: '', A: '', P: '' };
  if (process.env.OPENAI_API_KEY) {
    soap = await openaiSOAP({ transcript, model: process.env.OPENAI_LLM_MODEL || 'gpt-4o-mini' });
  }
  const s = await prisma.aISummary.create({ data: { consultId, soap, confidence: 0.75 } });
  res.json({ summaryId: s.id, soap: s.soap });
});

// Codes
app.post('/ai/codes/suggest', auth(['physician']), async (req, res) => {
  const { consultId } = req.body || {};
  if (!consultId) return res.status(400).json({ error: 'consultId required' });
  const items = [
    {
      codeSystem: 'CID10',
      code: 'R51.9',
      description: 'Cefaleia, não especificada',
      score: 0.81,
      rationale: 'termos: cefaleia, dor de cabeça',
    },
    {
      codeSystem: 'CID10',
      code: 'J06.9',
      description: 'Infecção aguda vias aéreas superiores',
      score: 0.64,
      rationale: 'termos: febre, dor de garganta',
    },
    {
      codeSystem: 'SIGTAP',
      code: '03.01.06.001-9',
      description: 'Consulta médica em atenção básica',
      score: 0.72,
      rationale: 'consulta',
    },
  ];
  const created = await Promise.all(
    items.map((i) =>
      prisma.codeSuggestion.create({
        data: { consultId, ...i }, // <- JS spread correto
      })
    )
  );
  res.json({ suggestions: created });
});

app.post('/ai/codes/feedback', auth(['physician']), async (req, res) => {
  const { suggestionId, accepted } = req.body || {};
  const upd = await prisma.codeSuggestion.update({
    where: { id: suggestionId },
    data: { accepted },
  });
  res.json({ ok: true, id: upd.id });
});

// Notes
app.get('/notes', auth(['physician']), async (req, res) => {
  const { patientId } = req.query;
  const items = await prisma.note.findMany({
    where: { patientId: String(patientId || '') },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json({ items });
});
app.post('/notes', auth(['physician']), async (req, res) => {
  const { patientId, consultId, text, pinned } = req.body || {};
  if (!patientId || !text)
    return res.status(400).json({ error: 'patientId and text required' });
  const n = await prisma.note.create({
    data: {
      patientId,
      consultId: consultId || null,
      authorId: req.user.id,
      text,
      pinned: !!pinned,
    },
  });
  res.json({ id: n.id });
});
app.patch('/notes/:id', auth(['physician']), async (req, res) => {
  const { text, pinned } = req.body || {};
  const n = await prisma.note.update({
    where: { id: req.params.id },
    data: { text, pinned: pinned ?? undefined },
  });
  res.json({ ok: true, id: n.id });
});
app.delete('/notes/:id', auth(['physician']), async (req, res) => {
  await prisma.note.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// Followups
app.post('/followups/suggest', auth(['physician']), async (req, res) => {
  const { consultId, code } = req.body || {};
  if (!consultId || !code)
    return res.status(400).json({ error: 'consultId and code required' });
  const f = await prisma.followup.create({
    data: { consultId, patientId: 'unknown', suggestedFor: code, accepted: false },
  });
  res.json({ followupId: f.id, suggestionDays: 30 });
});
app.post('/followups/accept', auth(['physician']), async (req, res) => {
  const { followupId, slot } = req.body || {};
  const f = await prisma.followup.update({
    where: { id: followupId },
    data: { accepted: true, slot: slot ? new Date(slot) : null },
  });
  res.json({ ok: true, followupId: f.id });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log('productivity-service on', PORT));
