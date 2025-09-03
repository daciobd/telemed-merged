import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { v4 as uuid } from 'uuid';
import { renderTemplate } from '../services/templateEngine.js';
import { htmlToSimplePdf } from '../services/pdf.js';
import { sendToReceitaCerta } from '../services/receitaCerta.js';
import { ConsultationSummary, PrescriptionPayload, AttestationPayload, GeneratedDoc } from '../domain/types.js';
import fs from 'node:fs';
import path from 'node:path';

const router = Router();
const TEMPLATES = {
  prescription: fs.readFileSync('templates/prescription.hbs', 'utf8'),
  attestation: fs.readFileSync('templates/attestation.hbs', 'utf8')
};

router.post(
  '/prescription',
  body('summary').isObject(),
  body('payload').isObject(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const summary = req.body.summary as ConsultationSummary;
    const payload = req.body.payload as PrescriptionPayload;

    const html = renderTemplate(TEMPLATES.prescription, { summary, payload, now: new Date().toISOString() });
    const id = uuid();
    const filename = `prescription_${id}.pdf`;
    const pdfPath = await htmlToSimplePdf(html, 'out', filename);

    const generated: GeneratedDoc = {
      id,
      kind: 'prescription',
      pdfPath,
      filename,
      metadata: { consultationId: summary.consultationId, patientId: summary.patient.id }
    };

    // Send to Receita Certa (MVP: best-effort)
    const rc = await sendToReceitaCerta({ summary, payload });

    res.json({ ok: true, doc: generated, receitaCerta: rc });
  }
);

router.post(
  '/attestation',
  body('summary').isObject(),
  body('payload').isObject(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const summary = req.body.summary as ConsultationSummary;
    const payload = req.body.payload as AttestationPayload;

    const html = renderTemplate(TEMPLATES.attestation, { summary, payload, now: new Date().toISOString() });
    const id = uuid();
    const filename = `attestation_${id}.pdf`;
    const pdfPath = await htmlToSimplePdf(html, 'out', filename);

    const generated: GeneratedDoc = {
      id,
      kind: 'attestation',
      pdfPath,
      filename,
      metadata: { consultationId: summary.consultationId, patientId: summary.patient.id }
    };

    res.json({ ok: true, doc: generated });
  }
);

// Generic endpoint to notify patient with the generated link (to be hosted by Telemed CDN or S3)
router.post(
  '/notify',
  body('patient').isObject(),
  body('message').isString(),
  body('attachmentUrl').optional().isString(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    // Import on demand to avoid circular
    const { notifyPatient } = await import('../services/notifier.js');
    await notifyPatient(req.body.patient, req.body.message, req.body.attachmentUrl);
    res.json({ ok: true });
  }
);

export default router;