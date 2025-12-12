// Configuração centralizada da OpenAI
// Lê env em RUNTIME (não import-time) para evitar problemas no Render

export const getOpenAIKey = () =>
  process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY;

export const isOpenAIConfigured = () => Boolean(getOpenAIKey());

export const logOpenAIStatus = () => {
  const k = getOpenAIKey();
  if (k) {
    console.log("🤖 OpenAI client inicializado.");
  } else {
    console.warn("⚠️ OPENAI_API_KEY não definida. Endpoints de IA ficarão desativados.");
  }
};
