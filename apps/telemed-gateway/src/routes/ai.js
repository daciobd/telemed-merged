// apps/telemed-gateway/src/routes/ai.js
import { Router } from "express";
import { openai, ensureOpenAIKey } from "../lib/openai.js";

const router = Router();

/**
 * GET /ai/ping
 * Objetivo: validar a integração com a OpenAI.
 * Comportamento:
 * - Verifica se a chave existe.
 * - Faz uma chamada mínima ao modelo "gpt-4o-mini" (barata e rápida).
 * - Retorna status, modelo e uso de tokens.
 */
router.get("/ping", async (req, res) => {
  try {
    ensureOpenAIKey();

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Você é um verificador de saúde do sistema." },
        { role: "user", content: "Responda somente 'ok'." },
      ],
      max_tokens: 5,
      temperature: 0,
    });

    const choice = response.choices?.[0]?.message?.content ?? "";
    return res.status(200).json({
      ok: true,
      replied: choice,
      model: response.model,
      usage: response.usage, // tokens de prompt/completion → ajuda a estimar custo
    });
  } catch (err) {
    const status = err?.status ?? 500;
    return res.status(status).json({
      ok: false,
      error: err?.message ?? "Falha ao consultar a API da OpenAI",
    });
  }
});

export default router;