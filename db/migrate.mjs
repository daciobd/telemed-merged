import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { sql } from 'drizzle-orm';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

console.log('🔄 Criando tabelas no banco de dados...\n');

try {
  // Criar ENUMs
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE user_role AS ENUM ('patient', 'doctor', 'admin');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);
  
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE account_type AS ENUM ('marketplace', 'virtual_office', 'hybrid');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);
  
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE monthly_plan AS ENUM ('basic', 'professional', 'premium', 'none');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);
  
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE consultation_status AS ENUM ('pending', 'doctor_matched', 'scheduled', 'in_progress', 'completed', 'cancelled');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);
  
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE consultation_type AS ENUM ('primeira_consulta', 'retorno', 'urgente', 'check_up');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `);

  console.log('✅ ENUMs criados\n');

  // Criar tabela users
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role user_role NOT NULL DEFAULT 'patient',
      full_name TEXT NOT NULL,
      phone TEXT,
      cpf TEXT UNIQUE,
      profile_image TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('✅ Tabela users criada');

  // Criar tabela patients
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS patients (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
      date_of_birth TIMESTAMP,
      gender TEXT,
      address JSONB,
      medical_history JSONB,
      emergency_contact JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('✅ Tabela patients criada');

  // Criar tabela doctors
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS doctors (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
      crm TEXT NOT NULL UNIQUE,
      crm_state TEXT NOT NULL,
      specialties JSONB,
      account_type account_type DEFAULT 'marketplace',
      monthly_plan monthly_plan DEFAULT 'none',
      plan_start_date TIMESTAMP,
      plan_end_date TIMESTAMP,
      custom_url TEXT UNIQUE,
      consultation_pricing JSONB,
      is_available_marketplace BOOLEAN DEFAULT true,
      min_price_marketplace DECIMAL(10, 2),
      bio TEXT,
      education JSONB,
      experience JSONB,
      certificates JSONB,
      availability JSONB,
      consultation_duration INTEGER DEFAULT 30,
      rating DECIMAL(3, 2) DEFAULT 0,
      total_consultations INTEGER DEFAULT 0,
      is_verified BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('✅ Tabela doctors criada');

  // Criar tabela virtual_office_settings
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS virtual_office_settings (
      id SERIAL PRIMARY KEY,
      doctor_id INTEGER NOT NULL UNIQUE REFERENCES doctors(id),
      auto_accept_bookings BOOLEAN DEFAULT false,
      require_prepayment BOOLEAN DEFAULT true,
      allow_cancellation BOOLEAN DEFAULT true,
      cancellation_hours INTEGER DEFAULT 24,
      custom_branding JSONB,
      welcome_message TEXT,
      booking_instructions TEXT,
      google_calendar_id TEXT,
      google_calendar_sync BOOLEAN DEFAULT false,
      email_notifications BOOLEAN DEFAULT true,
      whatsapp_notifications BOOLEAN DEFAULT false,
      sms_notifications BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('✅ Tabela virtual_office_settings criada');

  // Criar tabela consultations
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS consultations (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER NOT NULL REFERENCES patients(id),
      doctor_id INTEGER REFERENCES doctors(id),
      consultation_type consultation_type NOT NULL,
      is_marketplace BOOLEAN DEFAULT true,
      scheduled_for TIMESTAMP,
      duration INTEGER DEFAULT 30,
      patient_offer DECIMAL(10, 2),
      agreed_price DECIMAL(10, 2),
      platform_fee DECIMAL(10, 2),
      doctor_earnings DECIMAL(10, 2),
      status consultation_status DEFAULT 'pending',
      chief_complaint TEXT,
      clinical_notes TEXT,
      diagnosis TEXT,
      prescription JSONB,
      meeting_url TEXT,
      meeting_started_at TIMESTAMP,
      meeting_ended_at TIMESTAMP,
      patient_rating INTEGER,
      patient_feedback TEXT,
      doctor_rating INTEGER,
      doctor_feedback TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('✅ Tabela consultations criada');

  // Criar tabela bids
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS bids (
      id SERIAL PRIMARY KEY,
      consultation_id INTEGER NOT NULL REFERENCES consultations(id),
      doctor_id INTEGER NOT NULL REFERENCES doctors(id),
      bid_amount DECIMAL(10, 2) NOT NULL,
      message TEXT,
      is_accepted BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('✅ Tabela bids criada');

  // Criar índices
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_consultations_patient ON consultations(patient_id);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_consultations_doctor ON consultations(doctor_id);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_bids_consultation ON bids(consultation_id);`);
  await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_doctors_custom_url ON doctors(custom_url);`);
  
  console.log('✅ Índices criados\n');
  console.log('🎉 Migração concluída com sucesso!\n');
  
} catch (error) {
  console.error('❌ Erro na migração:', error.message);
  process.exit(1);
} finally {
  await pool.end();
}
