// routes/demo.js - Rotas de demonstração para Dr. AI

import { randomUUID } from "crypto";

/**
 * Helper para obter corpo da requisição
 */
function getBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

/**
 * Helper para enviar JSON
 */
function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

/**
 * Seed de dados de demonstração
 */
export async function handleDemoSeed(req, res) {
  try {
    const { pool } = await import('../lib/db.js');
    
    // IDs fictícios
    const drId = 1;
    const pRecent = 1; // paciente com consulta recente
    const pExpired = 999; // paciente com consulta expirada
    
    // Limpar dados antigos de demo (opcional) - deletar orientations primeiro
    await pool.query(`
      DELETE FROM orientations 
      WHERE encounter_id IN (
        SELECT id FROM encounters WHERE patient_id IN ($1, $2)
      )
    `, [pRecent, pExpired]);
    
    await pool.query('DELETE FROM encounters WHERE patient_id IN ($1, $2)', [pRecent, pExpired]);
    
    // Consulta recente (10 dias atrás) - Cardiologia (limite 60 dias)
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 10);
    
    const recentEncounter = await pool.query(`
      INSERT INTO encounters (patient_id, doctor_id, date, specialty, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [pRecent, drId, recentDate, 'Cardiologia', 'Consulta de acompanhamento cardiológico - DEMO']);
    
    const recentEncounterId = recentEncounter.rows[0].id;
    
    // Orientações para consulta recente
    await pool.query(`
      INSERT INTO orientations (encounter_id, orientation_type, content) VALUES
      ($1, 'medicamento', 'Losartana 50mg - 1 comprimido pela manhã, todos os dias. Tomar sempre no mesmo horário, após o café da manhã.'),
      ($1, 'exercicio', 'Caminhadas leves de 20-30 minutos, 3x por semana. Evitar exercícios intensos.'),
      ($1, 'dieta', 'Dieta hipossódica (reduzir sal). Evitar alimentos processados.')
    `, [recentEncounterId]);
    
    // Consulta expirada (100 dias atrás) - Psiquiatria (limite 30 dias)
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 100);
    
    const expiredEncounter = await pool.query(`
      INSERT INTO encounters (patient_id, doctor_id, date, specialty, notes)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [pExpired, drId, expiredDate, 'Psiquiatria', 'Consulta para ansiedade - DEMO']);
    
    const expiredEncounterId = expiredEncounter.rows[0].id;
    
    // Orientações para consulta expirada
    await pool.query(`
      INSERT INTO orientations (encounter_id, orientation_type, content) VALUES
      ($1, 'medicamento', 'Sertralina 50mg - 1 comprimido à noite.'),
      ($1, 'recomendacao', 'Higiene do sono. Retorno em 30 dias.')
    `, [expiredEncounterId]);
    
    console.log('✅ Demo seed criado:', { recentEncounterId, expiredEncounterId });
    
    return sendJSON(res, 200, {
      ok: true,
      patients: { 
        recent: pRecent, 
        expired: pExpired 
      },
      encounters: {
        recent: recentEncounterId,
        expired: expiredEncounterId
      }
    });
  } catch (error) {
    console.error('❌ Error in demo seed:', error);
    return sendJSON(res, 500, { 
      ok: false, 
      error: 'Failed to seed demo data' 
    });
  }
}

/**
 * Spike controlado para demonstrar rate limiting
 */
export async function handleDemoSpike(req, res) {
  try {
    const body = await getBody(req);
    const { 
      apiUrl = '/api/ai/answer', 
      patientId = 1, // Usa patientId criado no seed
      seconds = 10, 
      rps = 40 
    } = body;
    
    const end = Date.now() + Number(seconds) * 1000;
    let sent = 0;
    let ok = 0;
    
    // Função para disparar uma requisição
    async function fireOnce() {
      try {
        const { default: fetch } = await import('node-fetch');
        const host = `http://localhost:${process.env.PORT || 5000}`;
        
        const response = await fetch(`${host}${apiUrl}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            patientId,
            question: 'Você pode repetir as orientações da última consulta?'
          })
        });
        
        if (response.ok) ok++;
      } catch (err) {
        // Silenciar erros (esperado rate limit)
      }
      sent++;
    }
    
    // Executar spike em background (fire-and-forget)
    (async function runner() {
      while (Date.now() < end) {
        const batch = Array.from({ length: rps }, () => fireOnce());
        await Promise.all(batch);
        await new Promise(r => setTimeout(r, 1000));
      }
      console.log(`✅ Spike concluído: ${sent} requisições enviadas, ${ok} bem-sucedidas`);
    })();
    
    return sendJSON(res, 200, {
      ok: true,
      message: `Spike iniciado: ~${rps} req/s por ${seconds}s`
    });
  } catch (error) {
    console.error('❌ Error in demo spike:', error);
    return sendJSON(res, 500, { 
      ok: false, 
      error: 'Failed to start spike' 
    });
  }
}
