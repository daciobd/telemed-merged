import { Router } from 'express';

const router = Router();

/**
 * GET /api/consultorio/agenda?doctorId=1&date=YYYY-MM-DD
 * Opcional: startHour=8&endHour=18&slotMinutes=30
 */
router.get('/agenda', async (req, res) => {
  try {
    const doctorId = Number(req.query.doctorId);
    const dateStr = String(req.query.date || '');

    const startHour = Number(req.query.startHour ?? 8);
    const endHour = Number(req.query.endHour ?? 18);
    const slotMinutes = Number(req.query.slotMinutes ?? 30);

    if (!Number.isFinite(doctorId) || doctorId <= 0) {
      return res.status(400).json({ ok: false, error: 'doctorId_invalid' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return res.status(400).json({ ok: false, error: 'date_invalid', hint: 'use YYYY-MM-DD' });
    }

    if (!Number.isFinite(startHour) || !Number.isFinite(endHour) || startHour < 0 || endHour > 24 || startHour >= endHour) {
      return res.status(400).json({ ok: false, error: 'hours_invalid' });
    }

    if (!Number.isFinite(slotMinutes) || slotMinutes <= 0 || slotMinutes > 240) {
      return res.status(400).json({ ok: false, error: 'slotMinutes_invalid' });
    }

    const dayStart = `${dateStr} 00:00:00`;
    const dayEnd = `${dateStr} 23:59:59`;

    const { pool } = await import('../db/pool.js');

    const q = `
      SELECT id, patient_id, status, scheduled_for, COALESCE(duration, 30) AS duration
      FROM consultations
      WHERE doctor_id = $1
        AND scheduled_for >= $2::timestamp
        AND scheduled_for <= $3::timestamp
        AND status IN ('pending','scheduled','in_progress')
      ORDER BY scheduled_for ASC, id ASC;
    `;

    const r = await pool.query(q, [doctorId, dayStart, dayEnd]);
    const consultations = r.rows || [];

    const toMinutes = (ts) => {
      const s = (ts instanceof Date)
        ? ts.toISOString().slice(0, 19).replace('T', ' ')
        : String(ts);
      const hh = Number(s.slice(11, 13));
      const mm = Number(s.slice(14, 16));
      return hh * 60 + mm;
    };

    const occupied = consultations.map((c) => {
      const startMin = toMinutes(c.scheduled_for);
      const duration = Number(c.duration || 30);
      return {
        startMin,
        endMin: startMin + duration,
        consultationId: c.id,
        patientId: c.patient_id,
        status: c.status,
        duration,
      };
    });

    const slots = [];
    const firstMin = startHour * 60;
    const lastMin = endHour * 60;

    for (let m = firstMin; m < lastMin; m += slotMinutes) {
      const hh = String(Math.floor(m / 60)).padStart(2, '0');
      const mm = String(m % 60).padStart(2, '0');
      const time = `${hh}:${mm}`;

      const hit = occupied.find(o => (m < o.endMin) && (m + slotMinutes > o.startMin));

      if (hit) {
        slots.push({
          time,
          status: hit.status,
          consultationId: hit.consultationId,
          patientId: hit.patientId,
        });
      } else {
        slots.push({ time, status: 'free' });
      }
    }

    return res.json({
      ok: true,
      doctorId,
      date: dateStr,
      startHour,
      endHour,
      slotMinutes,
      slots,
      blockingConsultations: consultations.map(c => ({
        id: c.id,
        status: c.status,
        patientId: c.patient_id,
        scheduledFor: c.scheduled_for,
        duration: Number(c.duration || 30),
      })),
    });
  } catch (err) {
    console.error('[consultorio/agenda] error:', err);
    return res.status(500).json({ ok: false, error: 'internal_error' });
  }
});

export default router;
