// Configuração centralizada da OpenAI
// Prioriza OPENAI_API_KEY, usa OPEN_AI_KEY como fallback

export const OPENAI_KEY = 
  process.env.OPENAI_API_KEY || 
  process.env.OPEN_AI_KEY;

export const isOpenAIConfigured = () => Boolean(OPENAI_KEY);

// Log de inicialização
if (OPENAI_KEY) {
  console.log("🤖 OpenAI client inicializado.");
} else {
  console.warn("⚠️ OPENAI_API_KEY não definida. Endpoints de IA ficarão desativados.");
}
