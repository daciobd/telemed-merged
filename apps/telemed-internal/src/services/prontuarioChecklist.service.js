/**
 * Serviço de validação de checklist para prontuários
 * Garante qualidade mínima antes de finalizar
 */

const CHECKLIST_RULES = [
  {
    code: "MISSING_QUEIXA",
    label: "Queixa principal obrigatória",
    field: "queixa_principal",
    mode: "block",
    validate: (p) => !!p.queixa_principal?.trim(),
  },
  {
    code: "MISSING_ANAMNESE",
    label: "Anamnese/HDA obrigatória",
    field: "anamnese",
    mode: "block",
    validate: (p) => !!p.anamnese?.trim(),
  },
  {
    code: "MISSING_CID",
    label: "Hipótese diagnóstica com CID obrigatória",
    field: "hipoteses_cid",
    mode: "block",
    validate: (p) => {
      const cids = p.hipoteses_cid;
      if (!cids) return false;
      if (Array.isArray(cids)) return cids.length > 0;
      return false;
    },
  },
  {
    code: "MISSING_SEGUIMENTO",
    label: "Conduta/Plano/Seguimento obrigatório",
    field: "seguimento",
    mode: "block",
    validate: (p) => !!p.seguimento?.trim(),
  },
  {
    code: "MISSING_PRESCRICAO",
    label: "Prescrição não preenchida (recomendado)",
    field: "prescricao",
    mode: "warn",
    validate: (p) => !!p.prescricao?.trim(),
  },
  {
    code: "MISSING_ALERTAS",
    label: "Orientações/Alertas não preenchidos (recomendado)",
    field: "alertas",
    mode: "warn",
    validate: (p) => !!p.alertas?.trim(),
  },
  {
    code: "MISSING_EXAMES",
    label: "Exames não solicitados (opcional)",
    field: "exames",
    mode: "warn",
    validate: (p) => !!p.exames?.trim(),
  },
  {
    code: "MISSING_ENCAMINHAMENTOS",
    label: "Encaminhamentos não preenchidos (opcional)",
    field: "encaminhamentos",
    mode: "warn",
    validate: (p) => !!p.encaminhamentos?.trim(),
  },
];

/**
 * Valida prontuário contra checklist
 * @param {Object} prontuario - Objeto do prontuário
 * @returns {{ ok: boolean, mode: 'block'|'warn'|'ok', issues: Array, warnings: Array }}
 */
export function validateChecklist(prontuario) {
  const issues = [];
  const warnings = [];

  for (const rule of CHECKLIST_RULES) {
    const passed = rule.validate(prontuario);
    if (!passed) {
      const item = {
        code: rule.code,
        label: rule.label,
        field: rule.field,
        mode: rule.mode,
      };
      if (rule.mode === "block") {
        issues.push(item);
      } else {
        warnings.push(item);
      }
    }
  }

  const hasBlocks = issues.length > 0;
  const hasWarnings = warnings.length > 0;

  return {
    ok: !hasBlocks,
    mode: hasBlocks ? "block" : hasWarnings ? "warn" : "ok",
    issues,
    warnings,
  };
}

/**
 * Registra evento de qualidade no banco
 */
export async function logQualityEvent(pool, { prontuarioId, medicoId, event, issues }) {
  await pool.query(
    `INSERT INTO prontuario_quality_events (prontuario_id, medico_id, event, issues_json)
     VALUES ($1, $2, $3, $4::jsonb)`,
    [prontuarioId, medicoId, event, JSON.stringify(issues || [])]
  );
}

export { CHECKLIST_RULES };
