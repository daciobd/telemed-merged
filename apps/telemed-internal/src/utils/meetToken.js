import jwt from "jsonwebtoken";

const MEET_TOKEN_SECRET = process.env.MEET_TOKEN_SECRET || process.env.JWT_SECRET || null;
const MEET_EARLY_MINUTES = Number(process.env.MEET_EARLY_MINUTES || 10);
const MEET_LATE_MINUTES = Number(process.env.MEET_LATE_MINUTES || 60);

export function signMeetToken({
  consultationId,
  role,
  scheduledForISO,
  durationMinutes = 30,
}) {
  if (!MEET_TOKEN_SECRET) throw new Error("MEET_TOKEN_SECRET_not_configured");

  const scheduledMs = new Date(scheduledForISO).getTime();
  if (!Number.isFinite(scheduledMs)) throw new Error("invalid_scheduledFor");

  const startMs = scheduledMs - MEET_EARLY_MINUTES * 60_000;
  const endMs = scheduledMs + durationMinutes * 60_000 + MEET_LATE_MINUTES * 60_000;

  const nbf = Math.floor(startMs / 1000);
  const exp = Math.floor(endMs / 1000);

  const now = Math.floor(Date.now() / 1000);
  const notBeforeSeconds = Math.max(0, nbf - now);
  const expiresInSeconds = Math.max(60, exp - now);

  const token = jwt.sign(
    { cid: Number(consultationId), role },
    MEET_TOKEN_SECRET,
    {
      issuer: "telemed",
      audience: "consultorio-meet",
      notBefore: notBeforeSeconds,
      expiresIn: expiresInSeconds,
    },
  );

  return { token, nbf, exp };
}

export function signMeetTokenPatient({ consultationId, scheduledForISO, durationMinutes }) {
  return signMeetToken({ consultationId, role: "patient", scheduledForISO, durationMinutes });
}

export function signMeetTokenDoctor({ consultationId, scheduledForISO, durationMinutes }) {
  return signMeetToken({ consultationId, role: "doctor", scheduledForISO, durationMinutes });
}

export function verifyMeetToken(token, consultationId) {
  if (!MEET_TOKEN_SECRET) throw new Error("MEET_TOKEN_SECRET_not_configured");

  const payload = jwt.verify(token, MEET_TOKEN_SECRET, {
    issuer: "telemed",
    audience: "consultorio-meet",
  });

  if (!payload || Number(payload.cid) !== Number(consultationId)) {
    const err = new Error("meet_token_cid_mismatch");
    err.code = "cid_mismatch";
    throw err;
  }
  if (payload.role !== "doctor" && payload.role !== "patient") {
    const err = new Error("meet_token_role_invalid");
    err.code = "role_invalid";
    throw err;
  }
  return payload;
}

export function getMeetTokenSecret() {
  return MEET_TOKEN_SECRET;
}
