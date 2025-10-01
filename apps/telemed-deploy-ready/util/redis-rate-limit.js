// util/redis-rate-limit.js
// Redis sliding window limiter por paciente e por IP.
// Requer REDIS_URL. Usa ZSET com timestamps (ms). TTL = 70s por chave.

import { createClient } from "redis";

const WINDOW_MS = 60_000;
const TTL_SEC = 70;

/**
 * Cria rate limiter com Redis usando sliding window
 * @param {object} opts - Configurações
 * @param {string} opts.url - URL de conexão Redis
 * @param {number} opts.perMinuteByPatient - Limite por paciente/minuto
 * @param {number} opts.perMinuteByIp - Limite por IP/minuto
 */
export function makeRedisRateLimiter({ url, perMinuteByPatient, perMinuteByIp }) {
  const client = createClient({ url });
  client.on("error", (e) => console.error("[redis] error", e));

  /**
   * Verifica se requisição está dentro do limite
   * @param {object} args - Argumentos
   * @param {number} args.patientId - ID do paciente
   * @param {string} args.ip - IP do cliente
   * @returns {Promise<{ok: boolean, retryAfterSec?: number}>}
   */
  async function allow({ patientId, ip }) {
    if (!client.isOpen) await client.connect();
    const now = Date.now();

    const kPatient = `rate:patient:${patientId}`;
    const kIp = `rate:ip:${ip}`;

    const [okP, retryP] = await checkAndInsert(client, kPatient, now, perMinuteByPatient);
    const [okI, retryI] = await checkAndInsert(client, kIp, now, perMinuteByIp);

    if (!okP || !okI) {
      const retryAfterSec = Math.max(retryP ?? 0, retryI ?? 0);
      return { ok: false, retryAfterSec };
    }
    return { ok: true };
  }

  return { allow, _client: client };
}

/**
 * Verifica e insere timestamp no Redis usando ZSET
 */
async function checkAndInsert(client, key, now, limit) {
  const min = now - WINDOW_MS;
  
  // Remove janelas antigas
  await client.zRemRangeByScore(key, 0, min);
  
  // Conta itens atuais
  const count = await client.zCard(key);
  
  if (count >= limit) {
    // Pega o mais antigo pra calcular retry-after
    const oldest = await client.zRange(key, 0, 0, { WITHSCORES: true });
    const oldestScore = Number(Array.isArray(oldest) ? oldest[1] : oldest?.score ?? now);
    const retryMs = WINDOW_MS - (now - oldestScore);
    return [false, Math.ceil(retryMs / 1000)];
  }
  
  // Insere o timestamp atual
  await client.zAdd(key, [{ score: now, value: String(now) }]);
  await client.expire(key, TTL_SEC);
  
  return [true, null];
}
