import { Router } from 'express';
import { pool } from '../../db';

const router = Router();

// Auth já está garantida no nível do router pai via internalOnly middleware

/**
 * @route GET /api/internal/marketing/cac-real/details
 * @desc Detalhes do CAC Real por período
 */
router.get('/cac-real/details', async (req, res) => {
  try {
    const { from, to, groupBy = 'day' } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Parâmetros "from" e "to" são obrigatórios'
      });
    }

    // Query de exemplo - ajuste para seu schema
    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        'marketing_data' as metric
      FROM consultations 
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY DATE(created_at)
      ORDER BY date
      LIMIT 10
    `;

    const result = await pool.query(query, [from, to]);

    res.json({
      success: true,
      data: result.rows,
      meta: { from, to, groupBy }
    });

  } catch (error) {
    console.error('Erro marketing details:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados'
    });
  }
});

/**
 * @route GET /api/internal/marketing/cac-real/alerts
 * @desc Alertas/anomalias
 */
router.get('/cac-real/alerts', async (req, res) => {
  res.json({
    success: true,
    alerts: [
      { type: 'high_cac', message: 'CAC acima do esperado', date: '2024-12-30' }
    ]
  });
});

export default router;
