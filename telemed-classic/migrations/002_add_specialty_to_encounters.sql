-- Migration: Add specialty column to encounters table
-- This enables age-based consultation policy (30-120 days per specialty)

-- Add specialty column to encounters
ALTER TABLE encounters 
ADD COLUMN specialty VARCHAR(100);

-- Create index for faster queries by specialty
CREATE INDEX idx_encounters_specialty ON encounters(specialty);

-- Add some common medical specialties as examples
COMMENT ON COLUMN encounters.specialty IS 'Medical specialty for the encounter (e.g., Cardiologia, Pediatria, Clínica Geral)';
