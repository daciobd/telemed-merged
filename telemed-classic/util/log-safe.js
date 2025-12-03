// util/log-safe.js - Armazenamento seguro LGPD-compliant com truncamento + hash

import { createHash } from "crypto";

/**
 * Armazena texto de forma segura: trunca + gera hash SHA-256
 * LGPD-compliant: não armazena conteúdo completo com PII
 * 
 * @param {string} text - Texto a ser armazenado
 * @param {number} max - Tamanho máximo do truncamento (default: 500)
 * @returns {{ truncated: string, digest: string }}
 */
export function safeStore(text, max = 500) {
  if (!text) {
    return { truncated: "", digest: "" };
  }
  
  // Hash SHA-256 do texto completo (para detecção de duplicatas)
  const digest = createHash("sha256")
    .update(text, "utf8")
    .digest("hex");
  
  // Truncar para não armazenar PII completo
  const truncated = text.slice(0, max);
  
  return { truncated, digest };
}

/**
 * Pseudonimiza ID de paciente usando salt
 * @param {number|string} patientId - ID do paciente
 * @param {string} salt - Salt para hashing (env PSEUDONYM_SALT)
 * @returns {string} Hash pseudonimizado
 */
export function pseudonymize(patientId, salt) {
  if (!salt) {
    console.warn("⚠️ PSEUDONYM_SALT não definido, usando ID direto (não recomendado em produção)");
    return String(patientId);
  }
  
  return createHash("sha256")
    .update(`${patientId}:${salt}`, "utf8")
    .digest("hex")
    .slice(0, 16); // 16 caracteres suficientes
}
