-- Adiciona o status 'payment_pending' ao enum consultation_status
-- Executar no Render Shell: psql "$DATABASE_URL" -f db/migrations/add_payment_pending_status.sql
-- Idempotente: pode rodar múltiplas vezes sem erro

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'consultation_status'
      AND e.enumlabel = 'payment_pending'
  ) THEN
    ALTER TYPE consultation_status ADD VALUE 'payment_pending';
  END IF;
END$$;
