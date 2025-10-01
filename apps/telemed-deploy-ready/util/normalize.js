// util/normalize.js - Normalização linguística para detecção de keywords

/**
 * Normaliza texto removendo acentos, pontuação e convertendo para minúsculas
 * Útil para detecção robusta de keywords independente de formatação
 * 
 * @param {string} text - Texto para normalizar
 * @returns {string} Texto normalizado
 * 
 * @example
 * normalize("Está com dor?") // "esta com dor"
 * normalize("FALTA DE AR!!!") // "falta de ar"
 * normalize("Você está bem?") // "voce esta bem"
 */
export function normalize(text) {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .normalize('NFD')                      // Decompõe caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '')      // Remove marcas diacríticas (acentos)
    .toLowerCase()                         // Converte para minúsculas
    .replace(/[^\w\s]/g, ' ')             // Remove pontuação, mantém espaços
    .replace(/\s+/g, ' ')                 // Normaliza múltiplos espaços
    .trim();                              // Remove espaços das extremidades
}

/**
 * Verifica se uma keyword está presente no texto (case-insensitive, sem acentos)
 * Usa word boundary para evitar falsos positivos
 * 
 * @param {string} text - Texto onde buscar
 * @param {string} keyword - Palavra-chave a buscar
 * @returns {boolean} True se encontrada
 * 
 * @example
 * containsKeyword("Estou com dor no peito", "dor no peito") // true
 * containsKeyword("Adorei o atendimento", "dor") // false (word boundary)
 */
export function containsKeyword(text, keyword) {
  const normalizedText = normalize(text);
  const normalizedKeyword = normalize(keyword);
  
  // Usar word boundary para evitar matches parciais
  // Ex: "dor" não deve dar match em "adorei"
  const pattern = new RegExp(`\\b${escapeRegex(normalizedKeyword)}\\b`, 'i');
  return pattern.test(normalizedText);
}

/**
 * Verifica se alguma keyword de uma lista está presente no texto
 * 
 * @param {string} text - Texto onde buscar
 * @param {string[]} keywords - Array de palavras-chave
 * @returns {{ found: boolean, keyword: string|null }} Resultado da busca
 */
export function findKeyword(text, keywords) {
  for (const keyword of keywords) {
    if (containsKeyword(text, keyword)) {
      return { found: true, keyword };
    }
  }
  return { found: false, keyword: null };
}

/**
 * Escapa caracteres especiais de regex
 * @param {string} str - String para escapar
 * @returns {string} String escapada
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
