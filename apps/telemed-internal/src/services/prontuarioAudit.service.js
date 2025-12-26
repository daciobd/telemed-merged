const AUDIT_FIELDS = [
  "status",
  "queixa_principal",
  "anamnese",
  "hipoteses_texto",
  "hipoteses_cid",
  "exames",
  "prescricao",
  "encaminhamentos",
  "alertas",
  "seguimento",
  "finalized_at",
  "signed_at",
  "ia_metadata",
];

export function diffProntuario(before = {}, after = {}) {
  const changed = [];
  const beforeDiff = {};
  const afterDiff = {};

  for (const field of AUDIT_FIELDS) {
    const b = before[field];
    const a = after[field];

    if (JSON.stringify(b ?? null) !== JSON.stringify(a ?? null)) {
      changed.push(field);
      beforeDiff[field] = b ?? null;
      afterDiff[field] = a ?? null;
    }
  }

  return {
    changedFields: changed,
    before: Object.keys(beforeDiff).length ? beforeDiff : null,
    after: Object.keys(afterDiff).length ? afterDiff : null,
  };
}

export async function insertAudit({
  client,
  prontuarioId,
  actor,
  action,
  diff,
  req,
}) {
  if (!diff.changedFields.length && action === "update") {
    return;
  }

  const sql = `
    INSERT INTO prontuario_audit (
      prontuario_id,
      actor_user_id,
      actor_email,
      actor_role,
      action,
      changed_fields,
      before,
      after,
      ip,
      user_agent,
      request_id
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11
    )
  `;

  const params = [
    prontuarioId,
    actor?.id || null,
    actor?.email || null,
    actor?.role || "system",
    action,
    diff.changedFields,
    diff.before ? JSON.stringify(diff.before) : null,
    diff.after ? JSON.stringify(diff.after) : null,
    req?.ip || req?.headers?.["x-forwarded-for"] || null,
    req?.headers?.["user-agent"] || null,
    req?.headers?.["x-request-id"] || null,
  ];

  await client.query(sql, params);
}
