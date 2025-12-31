export const CONSULTATION_STATUS = {
  PENDING: "pending",
  DOCTOR_MATCHED: "doctor_matched",
  PAYMENT_PENDING: "payment_pending",
  PAID: "paid",
  SCHEDULED: "scheduled",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  CANCELLED_BY_PATIENT: "cancelled_by_patient",
  CANCELLED_BY_DOCTOR: "cancelled_by_doctor",
  CANCELLED: "cancelled",
  NO_SHOW: "no_show",
  EXPIRED: "expired",
} as const;

export type ConsultationStatus =
  typeof CONSULTATION_STATUS[keyof typeof CONSULTATION_STATUS];

export const STATUS_REQUIRES_PAYMENT: ConsultationStatus[] = [
  CONSULTATION_STATUS.SCHEDULED,
  CONSULTATION_STATUS.IN_PROGRESS,
  CONSULTATION_STATUS.COMPLETED,
];

export const TERMINAL_STATUSES: ConsultationStatus[] = [
  CONSULTATION_STATUS.COMPLETED,
  CONSULTATION_STATUS.CANCELLED,
  CONSULTATION_STATUS.CANCELLED_BY_PATIENT,
  CONSULTATION_STATUS.CANCELLED_BY_DOCTOR,
  CONSULTATION_STATUS.NO_SHOW,
  CONSULTATION_STATUS.EXPIRED,
];

export function canAdvanceToStatus(
  currentStatus: string,
  targetStatus: ConsultationStatus,
  isPaid: boolean
): { allowed: boolean; reason?: string } {
  if (STATUS_REQUIRES_PAYMENT.includes(targetStatus) && !isPaid) {
    return {
      allowed: false,
      reason: `Consulta não pode avançar para "${targetStatus}" sem pagamento confirmado.`,
    };
  }

  if (TERMINAL_STATUSES.includes(currentStatus as ConsultationStatus)) {
    return {
      allowed: false,
      reason: `Consulta já está em estado terminal "${currentStatus}".`,
    };
  }

  return { allowed: true };
}
