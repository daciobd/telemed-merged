import express from "express";
import { pool } from "./db/pool.js";

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
 * Autosave / upsert
 */
router.put("/prontuario/:consultaId", async (req, res) => {
  try {
    const { consultaId } = req.params;
    if (!consultaId) {
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
      return res.status(400).json({ error: "status inválido (use 'draft' ou 'final')." });
    }

    const existing = await getProntuarioByConsultaId(consultaId);
    if (existing?.status === "final") {
      return res.status(409).json({
        error: "Prontuário finalizado não pode ser alterado.",
        status: "final",
        finalized_at: existing.finalized_at,
      });
    }

    const hipotesesCidJson = Array.isArray(hipoteses_cid) ? hipoteses_cid : [];
    const iaMetadataJson = ia_metadata && typeof ia_metadata === "object" ? ia_metadata : {};

    const { rows } = await pool.query(
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

    return res.json(rows[0]);
  } catch (err) {
    console.error("[prontuario][PUT] erro:", err);
    return res.status(500).json({ error: "Erro interno ao salvar prontuário." });
  }
});

/**
 * POST /api/consultorio/prontuario/:consultaId/finalizar
 */
router.post("/prontuario/:consultaId/finalizar", async (req, res) => {
  try {
    const { consultaId } = req.params;
    if (!consultaId) {
      return res.status(400).json({ error: "consultaId é obrigatório." });
    }

    const existing = await getProntuarioByConsultaId(consultaId);
    if (!existing) {
      return res.status(404).json({ error: "Prontuário não encontrado para finalizar." });
    }

    if (existing.status === "final") {
      return res.json({
        ok: true,
        status: "final",
        finalized_at: existing.finalized_at,
        message: "Prontuário já estava finalizado.",
      });
    }

    const { rows } = await pool.query(
      `
      UPDATE prontuarios_consulta
         SET status = 'final',
             finalized_at = now(),
             updated_at = now()
       WHERE consulta_id = $1
       RETURNING consulta_id, status, finalized_at, updated_at;
      `,
      [consultaId]
    );

    return res.json({ ok: true, ...rows[0] });
  } catch (err) {
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

export default router;
