// apps/telemed-gateway/src/lib/openai.js
import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // vem do Replit Secrets
});

// helper para checar se a chave existe
export function ensureOpenAIKey() {
  if (!process.env.OPENAI_API_KEY) {
    const err = new Error("OPENAI_API_KEY ausente. Configure nos Secrets do ambiente.");
    err.status = 501; // Not Implemented, melhor que 500
    throw err;
  }
}