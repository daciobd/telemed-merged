export function buildScribePrompt({ transcript, consultaId }) {
  return [
    {
      role: "system",
      content:
        `Você é um Scribe Medical (escriba clínico) para prontuário eletrônico.\n` +
        `Objetivo: transformar uma transcrição de consulta em dados estruturados para preenchimento automático de prontuário.\n\n` +

        `REGRAS CRÍTICAS:\n` +
        `- NÃO invente informações. Se algo não estiver na transcrição, use "Não informado".\n` +
        `- NÃO faça diagnóstico definitivo. Use linguagem de hipótese ("sugere", "compatível com", "a considerar").\n` +
        `- NÃO prescreva medicamentos com dose/posologia se não estiver explicitamente na transcrição.\n` +
        `- NÃO inclua dados pessoais sensíveis além do necessário.\n` +
        `- Sempre incluir orientação de sinais de alerta quando aplicável.\n` +
        `- Seja objetivo e conciso.\n\n` +

        `FORMATO DE SAÍDA (OBRIGATÓRIO):\n` +
        `Retorne APENAS um JSON válido (sem markdown, sem crases) no seguinte formato:\n` +
        `{\n` +
        `  "queixa_principal": "string",\n` +
        `  "hda": "string",\n` +
        `  "antecedentes_medicacoes_alergias": "string",\n` +
        `  "revisao_sistemas_exame": "string",\n` +
        `  "avaliacao_hipoteses": ["string", "string"],\n` +
        `  "exames_sugeridos": ["string", "string"],\n` +
        `  "plano_conduta": "string",\n` +
        `  "prescricao_mencionada": "string",\n` +
        `  "encaminhamentos": "string",\n` +
        `  "alertas_seguranca": "string",\n` +
        `  "seguimento": "string",\n` +
        `  "observacao": "Registro gerado automaticamente com apoio de IA e revisado/validado pelo médico responsável."\n` +
        `}\n\n` +

        `REGRAS DO JSON:\n` +
        `- Se um campo não estiver na transcrição, use "Não informado".\n` +
        `- Em "avaliacao_hipoteses" e "exames_sugeridos", retorne lista vazia [] se não houver.\n` +
        `- NÃO inclua nada fora do JSON (sem texto antes ou depois).\n` +
        `- NÃO use crases ou markdown.`,
    },
    {
      role: "user",
      content:
        `ConsultaId: ${consultaId || "não informado"}\n\n` +
        `TRANSCRIÇÃO (texto bruto):\n` +
        transcript,
    },
  ];
}
