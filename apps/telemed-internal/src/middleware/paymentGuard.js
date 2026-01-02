import { pool } from "../db/pool.js";

const STATUS_REQUIRES_PAYMENT = ["scheduled", "in_progress", "completed"];

export async function checkPaymentBeforeStatusChange(consultationId, newStatus) {
  if (!STATUS_REQUIRES_PAYMENT.includes(newStatus)) {
    return { allowed: true };
  }

  // 1) Descobrir doctor_id da consulta
  const consult = await pool.query(
    `SELECT doctor_id
     FROM consultations
     WHERE id = $1
     LIMIT 1`,
    [consultationId]
  );

  if (consult.rows.length === 0) {
    // Se não achou consulta, não bloqueia aqui (deixa outras camadas lidarem)
    return { allowed: true };
  }

  const doctorId = consult.rows[0].doctor_id;

  // 2) Ver se o consultório exige pré-pagamento
  const settings = await pool.query(
    `SELECT require_prepayment
     FROM virtual_office_settings
     WHERE doctor_id = $1
     LIMIT 1`,
    [doctorId]
  );

  const requirePrepayment =
    settings.rows.length > 0 ? !!settings.rows[0].require_prepayment : true; // default: true

  if (!requirePrepayment) {
    return { allowed: true };
  }

  // 3) Exigir pagamento confirmado
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

      if (!newStatus) return next();

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
