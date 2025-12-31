-- Adiciona o status 'payment_pending' ao enum consultation_status
-- Executar no Render Shell: psql "$DATABASE_URL" -f db/migrations/add_payment_pending_status.sql

ALTER TYPE consultation_status ADD VALUE IF NOT EXISTS 'payment_pending' AFTER 'doctor_matched';
