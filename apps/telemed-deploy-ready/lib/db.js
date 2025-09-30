// lib/db.js - Funções de acesso ao Postgres
import pg from "pg";

export const pool = new pg.Pool({ 
  connectionString: process.env.DATABASE_URL,
  // Configurações de pool para produção
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Busca a última consulta do paciente com suas orientações
 * @param {number} patientId - ID do paciente
 * @returns {Promise<{encounter: object, orientations: array}|null>}
 */
export async function getLastEncounterWithOrientations(patientId) {
  try {
    // Buscar última consulta
    const encounterResult = await pool.query(
      `SELECT * FROM encounters WHERE patient_id = $1 ORDER BY date DESC LIMIT 1`,
      [patientId]
    );

    const encounter = encounterResult.rows[0];
    if (!encounter) return null;

    // Buscar orientações da consulta
    const orientationsResult = await pool.query(
      `SELECT * FROM orientations WHERE encounter_id = $1 ORDER BY id ASC`,
      [encounter.id]
    );

    return {
      encounter,
      orientations: orientationsResult.rows
    };
  } catch (error) {
    console.error('❌ Database error in getLastEncounterWithOrientations:', error);
    throw error;
  }
}

/**
 * Cria tabelas necessárias se não existirem (para desenvolvimento)
 * Em produção, use migrations adequadas
 */
export async function ensureTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS encounters (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER NOT NULL,
        doctor_id INTEGER NOT NULL,
        date TIMESTAMP NOT NULL DEFAULT NOW(),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS orientations (
        id SERIAL PRIMARY KEY,
        encounter_id INTEGER NOT NULL REFERENCES encounters(id),
        orientation_type VARCHAR(100),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log('✅ Database tables ensured');
  } catch (error) {
    console.error('❌ Error ensuring tables:', error);
  }
}

/**
 * Seed de dados de exemplo para desenvolvimento
 */
export async function seedExampleData() {
  try {
    // Verificar se já existe dados
    const check = await pool.query('SELECT COUNT(*) FROM encounters');
    if (parseInt(check.rows[0].count) > 0) {
      console.log('⏭️ Database already has data, skipping seed');
      return;
    }

    // Criar consulta de exemplo
    const encounterResult = await pool.query(
      `INSERT INTO encounters (patient_id, doctor_id, date, notes) 
       VALUES (1, 1, '2025-09-25', 'Consulta de acompanhamento cardiológico')
       RETURNING id`
    );
    const encounterId = encounterResult.rows[0].id;

    // Criar orientações de exemplo
    await pool.query(
      `INSERT INTO orientations (encounter_id, orientation_type, content) VALUES
       ($1, 'medicamento', 'Losartana 50mg - 1 comprimido pela manhã, todos os dias. Tomar sempre no mesmo horário, após o café da manhã, com um copo de água.'),
       ($1, 'exercicio', 'Caminhadas leves de 20-30 minutos, 3x por semana. Evitar exercícios intensos. Se sentir falta de ar ou cansaço excessivo, parar e descansar.'),
       ($1, 'retorno', 'Próxima consulta agendada para 25/10/2025. Trazer resultados dos exames solicitados.'),
       ($1, 'dieta', 'Dieta hipossódica (reduzir sal). Evitar alimentos processados e embutidos. Aumentar consumo de frutas e vegetais.')`,
      [encounterId]
    );

    console.log('✅ Example data seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}
