import { Router } from "express";
import { pool } from "../../db";

const router = Router();

router.post("/payments/confirm", async (req, res) => {
  try {
    const { consultationId } = req.body ?? {};
    const id = Number(consultationId);

    if (!id || Number.isNaN(id)) {
      return res.status(400).json({ error: "missing_or_invalid_consultationId" });
    }

    const pay = await pool.query(
      `
      UPDATE payments
      SET status = 'paid',
          paid_at = now()
      WHERE consultation_id = $1
        AND status = 'pending'
      RETURNING id, consultation_id, status, paid_at, amount;
      `,
      [id]
    );

    if (pay.rowCount === 0) {
      return res.status(404).json({ error: "payment_not_found_or_not_pending" });
    }

    const cons = await pool.query(
      `
      UPDATE consultations
      SET status = 'scheduled'
      WHERE id = $1
        AND status = 'pending'
      RETURNING id, status, scheduled_for;
      `,
      [id]
    );

    return res.json({
      ok: true,
      payment: pay.rows[0],
      consultation: cons.rows[0] ?? null,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "internal_error" });
  }
});

export default router;
