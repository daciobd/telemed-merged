-- Migration: AI Interactions Table
-- Data: 2025-10-01
-- Descrição: Tabela para armazenar interações com Dr. AI de forma LGPD-compliant
--            Usa truncamento + hash para não armazenar PII completo

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Tabela de interações com Dr. AI
CREATE TABLE IF NOT EXISTS ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id INTEGER NOT NULL,
  encounter_id INTEGER NULL REFERENCES encounters(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Pergunta do usuário (truncada + hash)
  user_question_trunc TEXT NOT NULL,
  user_question_hash CHAR(64) NOT NULL,
  
  -- Resposta da IA (truncada + hash)
  ai_response_trunc TEXT NOT NULL,
  ai_response_hash CHAR(64) NOT NULL,
  
  -- Flags de escalação e emergência
  escalation_triggered BOOLEAN NOT NULL DEFAULT FALSE,
  escalation_reason TEXT NULL,
  
  -- Compliance LGPD
  pii_redacted BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Metadados técnicos (modelo usado, versão, etc)
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_patient_created 
  ON ai_interactions (patient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_encounter 
  ON ai_interactions (encounter_id) 
  WHERE encounter_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_qhash 
  ON ai_interactions (user_question_hash);

CREATE INDEX IF NOT EXISTS idx_ai_created 
  ON ai_interactions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_escalation 
  ON ai_interactions (escalation_triggered) 
  WHERE escalation_triggered = TRUE;

-- RLS (Row Level Security) - Opcional para multi-tenant
-- Descomente se tiver coluna clinic_id ou tenant_id
-- ALTER TABLE ai_interactions ENABLE ROW LEVEL SECURITY;

-- Exemplo de política RLS (ajustar conforme arquitetura)
-- CREATE POLICY p_ai_tenant ON ai_interactions
--   USING (clinic_id = current_setting('app.current_clinic_id', true)::uuid);

-- Função de retenção automática (180 dias)
-- Criar job com pg_cron ou executar via cron externo
-- SELECT cron.schedule('purge_ai_interactions_180d',
--   '7 3 * * *',
--   $$DELETE FROM ai_interactions WHERE created_at < now() - interval '180 days'$$
-- );

COMMENT ON TABLE ai_interactions IS 'Interações com Dr. AI - LGPD compliant com truncamento e hash';
COMMENT ON COLUMN ai_interactions.user_question_trunc IS 'Pergunta truncada (max 500 chars) para não armazenar PII completo';
COMMENT ON COLUMN ai_interactions.user_question_hash IS 'SHA-256 hash da pergunta completa para detecção de duplicatas';
COMMENT ON COLUMN ai_interactions.pii_redacted IS 'Flag indicando que PII foi redatado/truncado';
COMMENT ON COLUMN ai_interactions.metadata IS 'JSON com modelo usado, versão, latência, etc';
