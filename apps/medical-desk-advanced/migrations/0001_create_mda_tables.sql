-- Migração idempotente para tabelas MDA
-- Gate: Migração validada em staging

-- Criar tabelas MDA com prefixo mda_ (idempotente)
CREATE TABLE IF NOT EXISTS mda_consultations (
  id SERIAL PRIMARY KEY,
  patient_id TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  symptoms JSONB,
  ai_analysis JSONB,
  prescription JSONB,
  session_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mda_ai_analyses (
  id SERIAL PRIMARY KEY,
  consultation_id INTEGER REFERENCES mda_consultations(id) ON DELETE CASCADE,
  symptoms JSONB NOT NULL,
  triage TEXT NOT NULL CHECK (triage IN ('baixa', 'media', 'alta')),
  recommendations JSONB,
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  model_version TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mda_telemedicine_sessions (
  id SERIAL PRIMARY KEY,
  consultation_id INTEGER REFERENCES mda_consultations(id) ON DELETE CASCADE,
  room_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed', 'failed')),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  recording_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mda_prescriptions (
  id SERIAL PRIMARY KEY,
  consultation_id INTEGER REFERENCES mda_consultations(id) ON DELETE CASCADE,
  medications JSONB NOT NULL,
  instructions TEXT,
  validity TIMESTAMP WITH TIME ZONE,
  pdf_url TEXT,
  digital_signature TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance (idempotente)
CREATE INDEX IF NOT EXISTS idx_mda_consultations_doctor_id ON mda_consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_mda_consultations_patient_id ON mda_consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_mda_consultations_status ON mda_consultations(status);
CREATE INDEX IF NOT EXISTS idx_mda_consultations_created_at ON mda_consultations(created_at);

CREATE INDEX IF NOT EXISTS idx_mda_ai_analyses_consultation_id ON mda_ai_analyses(consultation_id);
CREATE INDEX IF NOT EXISTS idx_mda_ai_analyses_triage ON mda_ai_analyses(triage);

CREATE INDEX IF NOT EXISTS idx_mda_telemedicine_sessions_consultation_id ON mda_telemedicine_sessions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_mda_telemedicine_sessions_room_id ON mda_telemedicine_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_mda_telemedicine_sessions_status ON mda_telemedicine_sessions(status);

CREATE INDEX IF NOT EXISTS idx_mda_prescriptions_consultation_id ON mda_prescriptions(consultation_id);

-- Criar triggers para updated_at (idempotente)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_mda_consultations_updated_at ON mda_consultations;
CREATE TRIGGER update_mda_consultations_updated_at
  BEFORE UPDATE ON mda_consultations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE mda_consultations IS 'Consultas do Medical Desk Advanced';
COMMENT ON TABLE mda_ai_analyses IS 'Análises de IA para sintomas e triagem';
COMMENT ON TABLE mda_telemedicine_sessions IS 'Sessões de telemedicina avançada';
COMMENT ON TABLE mda_prescriptions IS 'Prescrições digitais geradas por IA';

-- Verificação final da migração
DO $$
BEGIN
  -- Verificar se todas as tabelas foram criadas
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mda_consultations') THEN
    RAISE EXCEPTION 'Falha na criação da tabela mda_consultations';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mda_ai_analyses') THEN
    RAISE EXCEPTION 'Falha na criação da tabela mda_ai_analyses';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mda_telemedicine_sessions') THEN
    RAISE EXCEPTION 'Falha na criação da tabela mda_telemedicine_sessions';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'mda_prescriptions') THEN
    RAISE EXCEPTION 'Falha na criação da tabela mda_prescriptions';
  END IF;
  
  RAISE NOTICE 'Migração MDA 0001 executada com sucesso - todas as tabelas foram criadas';
END
$$;