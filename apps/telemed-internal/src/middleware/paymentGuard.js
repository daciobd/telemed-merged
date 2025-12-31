import { pool } from "../db/pool.js";

const STATUS_REQUIRES_PAYMENT = ["scheduled", "in_progress", "completed"];

export async function checkPaymentBeforeStatusChange(consultationId, newStatus) {
  if (!STATUS_REQUIRES_PAYMENT.includes(newStatus)) {
    return { allowed: true };
  }

  const result = await pool.query(
    `SELECT p.status as payment_status, p.paid_at
     FROM payments p
     WHERE p.consultation_id = $1
       AND p.status = 'completed'
       AND p.paid_at IS NOT NULL
     LIMIT 1`,
    [consultationId]
  );

  const isPaid = result.rows.length > 0;

  if (!isPaid) {
    return {
      allowed: false,
      reason: `Consulta não pode avançar para "${newStatus}" sem pagamento confirmado.`,
    };
  }

  return { allowed: true };
}

export function paymentGuardMiddleware(extractStatusFn) {
  return async (req, res, next) => {
    try {
      const consultationId = parseInt(req.params.id);
      const newStatus = extractStatusFn(req);

      if (!newStatus) {
        return next();
      }

      const check = await checkPaymentBeforeStatusChange(consultationId, newStatus);

      if (!check.allowed) {
        return res.status(402).json({
          error: "Pagamento obrigatório",
          message: check.reason,
          code: "PAYMENT_REQUIRED",
        });
      }

      next();
    } catch (error) {
      console.error("[PaymentGuard] Erro:", error);
      next();
    }
  };
}
