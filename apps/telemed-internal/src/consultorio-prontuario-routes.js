import express from "express";
import PDFDocument from "pdfkit";
import { pool } from "./db/pool.js";
import { diffProntuario, insertAudit } from "./services/prontuarioAudit.service.js";

const router = express.Router();

/**
 * Helper: busca prontuário por consulta_id
 */
async function getProntuarioByConsultaId(consultaId) {
  const { rows } = await pool.query(
    `SELECT *
       FROM prontuarios_consulta
      WHERE consulta_id = $1
      LIMIT 1`,
    [consultaId]
  );
  return rows[0] || null;
}

/**
 * GET /api/consultorio/prontuario/:consultaId
 */
router.get("/prontuario/:consultaId", async (req, res) => {
  try {
    const { consultaId } = req.params;

    if (!consultaId) {
      return res.status(400).json({ error: "consultaId é obrigatório." });
    }

    const prontuario = await getProntuarioByConsultaId(consultaId);
    if (!prontuario) {
      return res.status(404).json({ error: "Prontuário não encontrado." });
    }

    return res.json(prontuario);
  } catch (err) {
    console.error("[prontuario][GET] erro:", err);
    return res.status(500).json({ error: "Erro interno ao buscar prontuário." });
  }
});

/**
 * PUT /api/consultorio/prontuario/:consultaId
 * Autosave / upsert com auditoria transacional
 */
router.put("/prontuario/:consultaId", async (req, res) => {
  const client = await pool.connect();
  try {
    const { consultaId } = req.params;
    if (!consultaId) {
      client.release();
      return res.status(400).json({ error: "consultaId é obrigatório." });
    }

    const {
      medico_id,
      paciente_id,
      status = "draft",
      queixa_principal,
      anamnese,
      hipoteses_texto,
      hipoteses_cid,
      exames,
      prescricao,
      encaminhamentos,
      alertas,
      seguimento,
      ia_metadata,
    } = req.body || {};

    if (!["draft", "final"].includes(status)) {
      client.release();
      return res.status(400).json({ error: "status inválido (use 'draft' ou 'final')." });
    }

    await client.query("BEGIN");

    const beforeRes = await client.query(
      `SELECT * FROM prontuarios_consulta WHERE consulta_id = $1 LIMIT 1`,
      [consultaId]
    );
    const before = beforeRes.rows[0] || null;
    const isCreate = !before;

    if (before?.status === "final") {
      await client.query("ROLLBACK");
      client.release();
      return res.status(409).json({
        error: "Prontuário finalizado não pode ser alterado.",
        status: "final",
        finalized_at: before.finalized_at,
      });
    }

    const hipotesesCidJson = Array.isArray(hipoteses_cid) ? hipoteses_cid : [];
    const iaMetadataJson = ia_metadata && typeof ia_metadata === "object" ? ia_metadata : {};

    const { rows } = await client.query(
      `
      INSERT INTO prontuarios_consulta (
        consulta_id, medico_id, paciente_id, status,
        queixa_principal, anamnese,
        hipoteses_texto, hipoteses_cid,
        exames, prescricao, encaminhamentos, alertas, seguimento,
        ia_metadata
      )
      VALUES (
        $1, $2, $3, $4,
        $5, $6,
        $7, $8::jsonb,
        $9, $10, $11, $12, $13,
        $14::jsonb
      )
      ON CONFLICT (consulta_id) DO UPDATE SET
        medico_id = COALESCE(EXCLUDED.medico_id, prontuarios_consulta.medico_id),
        paciente_id = COALESCE(EXCLUDED.paciente_id, prontuarios_consulta.paciente_id),
        status = EXCLUDED.status,
        queixa_principal = COALESCE(EXCLUDED.queixa_principal, prontuarios_consulta.queixa_principal),
        anamnese = COALESCE(EXCLUDED.anamnese, prontuarios_consulta.anamnese),
        hipoteses_texto = COALESCE(EXCLUDED.hipoteses_texto, prontuarios_consulta.hipoteses_texto),
        hipoteses_cid = CASE
          WHEN EXCLUDED.hipoteses_cid IS NULL THEN prontuarios_consulta.hipoteses_cid
          ELSE EXCLUDED.hipoteses_cid
        END,
        exames = COALESCE(EXCLUDED.exames, prontuarios_consulta.exames),
        prescricao = COALESCE(EXCLUDED.prescricao, prontuarios_consulta.prescricao),
        encaminhamentos = COALESCE(EXCLUDED.encaminhamentos, prontuarios_consulta.encaminhamentos),
        alertas = COALESCE(EXCLUDED.alertas, prontuarios_consulta.alertas),
        seguimento = COALESCE(EXCLUDED.seguimento, prontuarios_consulta.seguimento),
        ia_metadata = prontuarios_consulta.ia_metadata || EXCLUDED.ia_metadata,
        updated_at = now()
      RETURNING *;
      `,
      [
        consultaId,
        medico_id || null,
        paciente_id || null,
        status,
        queixa_principal ?? null,
        anamnese ?? null,
        hipoteses_texto ?? null,
        JSON.stringify(hipotesesCidJson),
        exames ?? null,
        prescricao ?? null,
        encaminhamentos ?? null,
        alertas ?? null,
        seguimento ?? null,
        JSON.stringify(iaMetadataJson),
      ]
    );
    const after = rows[0];

    const actor = {
      id: req.user?.id || medico_id || null,
      email: req.user?.email || null,
      role: req.user?.role || "doctor",
    };
    const diff = diffProntuario(before || {}, after);

    await insertAudit({
      client,
      prontuarioId: after.id,
      actor,
      action: isCreate ? "create" : "update",
      diff,
      req,
    });

    await client.query("COMMIT");
    client.release();
    return res.json(after);
  } catch (err) {
    await client.query("ROLLBACK");
    client.release();
    console.error("[prontuario][PUT] erro:", err);
    return res.status(500).json({ error: "Erro interno ao salvar prontuário." });
  }
});

/**
 * POST /api/consultorio/prontuario/:consultaId/finalizar
 * Com auditoria transacional
 */
router.post("/prontuario/:consultaId/finalizar", async (req, res) => {
  const client = await pool.connect();
  try {
    const { consultaId } = req.params;
    if (!consultaId) {
      client.release();
      return res.status(400).json({ error: "consultaId é obrigatório." });
    }

    await client.query("BEGIN");

    const beforeRes = await client.query(
      `SELECT * FROM prontuarios_consulta WHERE consulta_id = $1 LIMIT 1`,
      [consultaId]
    );
    const before = beforeRes.rows[0];

    if (!before) {
      await client.query("ROLLBACK");
      client.release();
      return res.status(404).json({ error: "Prontuário não encontrado para finalizar." });
    }

    if (before.status === "final") {
      await client.query("ROLLBACK");
      client.release();
      return res.json({
        ok: true,
        status: "final",
        finalized_at: before.finalized_at,
        message: "Prontuário já estava finalizado.",
      });
    }

    const { rows } = await client.query(
      `UPDATE prontuarios_consulta
         SET status = 'final',
             finalized_at = now(),
             updated_at = now()
       WHERE consulta_id = $1
       RETURNING *`,
      [consultaId]
    );
    const after = rows[0];

    const actor = {
      id: req.user?.id || before.medico_id || null,
      email: req.user?.email || null,
      role: req.user?.role || "doctor",
    };
    const diff = diffProntuario(before, after);

    await insertAudit({
      client,
      prontuarioId: after.id,
      actor,
      action: "finalize",
      diff,
      req,
    });

    await client.query("COMMIT");
    client.release();
    return res.json({ ok: true, consulta_id: after.consulta_id, status: after.status, finalized_at: after.finalized_at });
  } catch (err) {
    await client.query("ROLLBACK");
    client.release();
    console.error("[prontuario][FINALIZAR] erro:", err);
    return res.status(500).json({ error: "Erro interno ao finalizar prontuário." });
  }
});

/**
 * POST /api/consultorio/prontuario/_migrate (PROTEGIDO)
 * Requer header: x-internal-token: <INTERNAL_TOKEN>
 */
router.post("/prontuario/_migrate", async (req, res) => {
  try {
    const token = req.headers["x-internal-token"];
    if (!process.env.INTERNAL_TOKEN || token !== process.env.INTERNAL_TOKEN) {
      return res.status(401).json({ error: "Não autorizado." });
    }

    await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS prontuarios_consulta (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        consulta_id TEXT NOT NULL UNIQUE,
        medico_id TEXT,
        paciente_id TEXT,
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'final')),
        queixa_principal TEXT,
        anamnese TEXT,
        hipoteses_texto TEXT,
        hipoteses_cid JSONB NOT NULL DEFAULT '[]'::jsonb,
        exames TEXT,
        prescricao TEXT,
        encaminhamentos TEXT,
        alertas TEXT,
        seguimento TEXT,
        ia_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        finalized_at TIMESTAMPTZ
      );
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_prontuario_consulta_id
      ON prontuarios_consulta (consulta_id);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_prontuario_status_updated
      ON prontuarios_consulta (status, updated_at DESC);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_prontuario_hipoteses_cid_gin
      ON prontuarios_consulta USING GIN (hipoteses_cid);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_prontuario_ia_metadata_gin
      ON prontuarios_consulta USING GIN (ia_metadata);
    `);

    await pool.query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await pool.query(`
      DROP TRIGGER IF EXISTS trg_prontuario_updated_at ON prontuarios_consulta;
    `);

    await pool.query(`
      CREATE TRIGGER trg_prontuario_updated_at
      BEFORE UPDATE ON prontuarios_consulta
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
    `);

    return res.json({ ok: true, message: "Migração do prontuário aplicada com sucesso." });
  } catch (err) {
    console.error("[prontuario][MIGRATE] erro:", err);
    return res.status(500).json({ error: "Falha ao aplicar migração.", detail: String(err?.message || err) });
  }
});

/**
 * GET /api/consultorio/prontuario/:consultaId/pdf
 * Gera PDF do prontuário usando PDFKit.
 * - Não inclui ia_metadata.notas_privadas
 * - Se status != 'final', adiciona watermark "RASCUNHO"
 */
router.get("/prontuario/:consultaId/pdf", async (req, res) => {
  try {
    const { consultaId } = req.params;

    if (!consultaId) {
      return res.status(400).json({ error: "consultaId é obrigatório." });
    }

    const prontuario = await getProntuarioByConsultaId(consultaId);
    if (!prontuario) {
      return res.status(404).json({ error: "Prontuário não encontrado." });
    }

    const {
      status,
      updated_at,
      created_at,
      queixa_principal,
      anamnese,
      hipoteses_cid,
      hipoteses_texto,
      exames,
      prescricao,
      encaminhamentos,
      alertas,
      seguimento,
      ia_metadata,
    } = prontuario;

    const assinatura = ia_metadata?.assinatura || null;
    const assinado_em = ia_metadata?.assinado_em || null;
    const assinado_por = ia_metadata?.assinado_por || null;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="prontuario-${consultaId}.pdf"`);

    const doc = new PDFDocument({ size: "A4", margin: 48 });
    doc.pipe(res);

    if (status !== "final") {
      addWatermark(doc, "RASCUNHO");
    }

    doc.fontSize(16).text("PRONTUÁRIO MÉDICO", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`ID: ${consultaId}`, { align: "center" });
    doc.moveDown(1);

    doc.fontSize(12).text("Informações", { underline: true });
    doc.moveDown(0.4);
    doc.fontSize(10);

    const datasLine = [
      created_at ? `Criado em: ${fmtDate(created_at)}` : null,
      updated_at ? `Atualizado em: ${fmtDate(updated_at)}` : null,
      status ? `Status: ${status}` : null,
    ].filter(Boolean).join("  |  ");

    if (datasLine) doc.text(datasLine);
    doc.moveDown(1);

    pdfSection(doc, "Queixa Principal", queixa_principal);
    pdfSection(doc, "Anamnese", anamnese);
    pdfSection(doc, "Hipótese Diagnóstica", formatHipoteses(hipoteses_cid, hipoteses_texto));
    pdfSection(doc, "Exames", exames);
    pdfSection(doc, "Prescrição", prescricao);
    pdfSection(doc, "Encaminhamentos", encaminhamentos);
    pdfSection(doc, "Alertas", alertas);
    pdfSection(doc, "Seguimento", seguimento);

    doc.moveDown(1);
    doc.fontSize(12).text("Assinatura", { underline: true });
    doc.moveDown(0.4);
    doc.fontSize(10);

    if (status === "final") {
      if (assinado_por || assinado_em) {
        doc.text(
          [
            assinado_por ? `Assinado por: ${assinado_por}` : null,
            assinado_em ? `Assinado em: ${fmtDate(assinado_em)}` : null,
          ].filter(Boolean).join("  |  ")
        );
        doc.moveDown(0.6);
      }

      if (assinatura && assinatura.startsWith("data:image/")) {
        try {
          const imgBuffer = dataUrlToBuffer(assinatura);
          const x = doc.page.margins.left;
          const y = doc.y;
          doc.image(imgBuffer, x, y, { width: 220 });
          doc.moveDown(4);
        } catch {
          doc.text("(Falha ao renderizar imagem da assinatura)");
        }
      } else {
        doc.text("(Sem assinatura gráfica)");
      }
    } else {
      doc.text("Documento em rascunho. Assinatura disponível apenas após finalização.");
    }

    doc.moveDown(1.5);
    doc.fontSize(8).text(
      `Documento gerado em ${fmtDate(new Date())} • TeleMed`,
      { align: "center" }
    );

    doc.end();
  } catch (err) {
    console.error("[prontuario][PDF] erro:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Erro ao gerar PDF" });
    }
  }
});

/**
 * POST /api/consultorio/prontuario/:consultaId/assinar
 * Salva assinatura (dataURL) no ia_metadata com auditoria
 */
router.post("/prontuario/:consultaId/assinar", async (req, res) => {
  const client = await pool.connect();
  try {
    const { consultaId } = req.params;
    const { assinatura_data_url, assinado_por } = req.body || {};

    if (!assinatura_data_url || !String(assinatura_data_url).startsWith("data:image/")) {
      client.release();
      return res.status(400).json({ error: "assinatura_data_url inválida (data:image/...)" });
    }

    await client.query("BEGIN");

    const beforeRes = await client.query(
      `SELECT * FROM prontuarios_consulta WHERE consulta_id = $1 LIMIT 1`,
      [consultaId]
    );
    const before = beforeRes.rows[0];

    if (!before) {
      await client.query("ROLLBACK");
      client.release();
      return res.status(404).json({ error: "Prontuário não encontrado" });
    }

    if (before.status !== "final") {
      await client.query("ROLLBACK");
      client.release();
      return res.status(409).json({ error: "Só é possível assinar após finalizar o atendimento" });
    }

    const ia_metadata = before.ia_metadata || {};
    ia_metadata.assinatura = assinatura_data_url;
    ia_metadata.assinado_em = new Date().toISOString();
    ia_metadata.assinado_por = assinado_por || "Médico responsável";

    const { rows } = await client.query(
      `UPDATE prontuarios_consulta
       SET ia_metadata = $1::jsonb,
           signed_at = now()
       WHERE consulta_id = $2
       RETURNING *`,
      [JSON.stringify(ia_metadata), consultaId]
    );
    const after = rows[0];

    const actor = {
      id: req.user?.id || before.medico_id || null,
      email: req.user?.email || null,
      role: req.user?.role || "doctor",
    };
    const diff = diffProntuario(before, after);

    await insertAudit({
      client,
      prontuarioId: after.id,
      actor,
      action: "sign",
      diff,
      req,
    });

    await client.query("COMMIT");
    client.release();
    res.json({ ok: true, ia_metadata: after.ia_metadata, signed_at: after.signed_at });
  } catch (err) {
    await client.query("ROLLBACK");
    client.release();
    console.error("[prontuario][ASSINAR] erro:", err);
    res.status(500).json({ error: "Erro ao assinar" });
  }
});

/* ---------- PDF helpers ---------- */

function pdfSection(doc, title, text) {
  doc.fontSize(12).text(title, { underline: true });
  doc.moveDown(0.4);
  doc.fontSize(10);
  const content = (text ?? "").toString().trim();
  doc.text(content.length ? content : "-", { align: "left" });
  doc.moveDown(1);
}

function formatHipoteses(hipotesesCid, hipotesesTexto) {
  const parts = [];
  if (Array.isArray(hipotesesCid) && hipotesesCid.length > 0) {
    parts.push(hipotesesCid.map((h) => `${h.codigo} - ${h.descricao}`).join("\n"));
  }
  if (hipotesesTexto) {
    parts.push(hipotesesTexto);
  }
  return parts.join("\n\n") || "";
}

function fmtDate(d) {
  try {
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleString("pt-BR");
  } catch {
    return String(d);
  }
}

function addWatermark(doc, label) {
  doc.save();
  doc.rotate(-35, { origin: [doc.page.width / 2, doc.page.height / 2] });
  doc.fontSize(72).opacity(0.15).text(label, 80, doc.page.height / 2 - 60, {
    align: "center",
    width: doc.page.width - 160,
  });
  doc.opacity(1).restore();
}

function dataUrlToBuffer(dataUrl) {
  const base64 = dataUrl.split(",")[1] || "";
  return Buffer.from(base64, "base64");
}

export default router;
