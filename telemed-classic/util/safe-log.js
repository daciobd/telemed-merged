import crypto from "crypto";

const LOG_LEVEL = (process.env.LOG_LEVEL || "info");
const RANK = { error:0, warn:1, info:2, debug:3 };
const LOG_PII = String(process.env.LOG_PII || "false").toLowerCase() === "true";
const LOG_SAMPLE_RATE = Number(process.env.LOG_SAMPLE_RATE || 1);
const PSEUDONYM_SALT = process.env.PSEUDONYM_SALT || "change-me";

const EMAIL_RE = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g;
const PHONE_RE = /\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}[- ]?\d{4}\b/g;
const CPF_RE   = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|\b\d{11}\b/g;
const RG_RE    = /\b\d{1,2}\.\d{3}\.\d{3}-[\dX]\b/g;

export function hashPatientId(id) {
  const h = crypto.createHmac("sha256", PSEUDONYM_SALT);
  h.update(String(id));
  return h.digest("hex").slice(0, 16);
}

export function redactPII(text) {
  if (!text) return text;
  return text
    .replace(EMAIL_RE, "<email>")
    .replace(PHONE_RE, "<telefone>")
    .replace(CPF_RE, "<cpf>")
    .replace(RG_RE, "<rg>");
}

function should(level){ return RANK[level] <= RANK[LOG_LEVEL]; }
function sampled(){ return LOG_SAMPLE_RATE >= 1 ? true : Math.random() < LOG_SAMPLE_RATE; }
function sanitize(obj){
  try {
    const s = typeof obj === "string" ? obj : JSON.stringify(obj);
    const red = LOG_PII ? s : redactPII(s);
    return red.length > 2000 ? red.slice(0, 2000) + "…<truncated>" : red;
  } catch { return "<unserializable>"; }
}

export const safeLogger = {
  error(o, m){ if(should("error") && sampled()) console.error("[error]", sanitize(o), m??""); },
  warn (o, m){ if(should("warn")  && sampled()) console.warn ("[warn]" , sanitize(o), m??""); },
  info (o, m){ if(should("info")  && sampled()) console.info ("[info]" , sanitize(o), m??""); },
  debug(o, m){ if(should("debug") && sampled()) console.debug("[debug]", sanitize(o), m??""); },
};
