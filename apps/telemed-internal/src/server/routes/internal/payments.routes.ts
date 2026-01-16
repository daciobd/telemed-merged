import { Router } from "express";
import { pool } from "../../db";

const router = Router();

router.post("/payments/confirm", async (req, res) => {
  const { consultationId } = req.body ?? {};
  const id = Number(consultationId);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "missing_or_invalid_consultationId" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Pega payment atual (pra idempotência e para garantir que existe)
    const pay0 = await client.query(
      `SELECT id, consultation_id, status, paid_at, amount
       FROM payments
       WHERE consultation_id = $1
       LIMIT 1;`,
      [id],
    );

    if (pay0.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "payment_not_found" });
    }

    let paymentRow = pay0.rows[0];

    // Se estiver pending, marca como paid. Se já estiver paid, segue (idempotente).
    if (paymentRow.status === "pending") {
      const pay1 = await client.query(
        `
        UPDATE payments
        SET status = 'paid',
            paid_at = COALESCE(paid_at, now())
        WHERE consultation_id = $1
          AND status = 'pending'
        RETURNING id, consultation_id, status, paid_at, amount;
        `,
        [id],
      );
      // pay1.rowCount deve ser 1 aqui
      paymentRow = pay1.rows[0] ?? paymentRow;
    }

    // Atualiza consulta para scheduled se estiver pending; se já estiver scheduled, ok.
    await client.query(
      `
      UPDATE consultations
      SET status = 'scheduled'
      WHERE id = $1
        AND status = 'pending';
      `,
      [id],
    );

    // Busca a consulta e retorna sempre
    const cons = await client.query(
      `
      SELECT id, status, scheduled_for
      FROM consultations
      WHERE id = $1
      LIMIT 1;
      `,
      [id],
    );

    if (cons.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "consultation_not_found" });
    }

    await client.query("COMMIT");

    return res.json({
      ok: true,
      payment: paymentRow,
      consultation: cons.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return res.status(500).json({ error: "internal_error" });
  } finally {
    client.release();
  }
});

export default router;
