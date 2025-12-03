import { safeLogger, hashPatientId, redactPII } from "./safe-log.js";

export async function auditInteraction({ encounterId, patientId, question, answer, escalation, emergency }) {
  try {
    // TODO: persistir em DB quando disponível (Prisma/Drizzle)
    // await db.aiInteraction.create({ data: { ... } });
  } catch (e) {
    safeLogger.error({ err: String(e) }, "auditInteraction failed");
  }
  
  safeLogger.info({
    pid: patientId != null ? hashPatientId(patientId) : "anon",
    flags: { escalation: !!escalation, emergency: !!emergency }
  }, "ai_interaction");

  // Logs com redação (sem PII)
  safeLogger.debug({ encounterId, q: redactPII(question), a: redactPII(answer) });
}
