import pg from "pg";
const { Pool } = pg;

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.warn("⚠️ DATABASE_URL não definida. Prontuário da consulta ficará indisponível.");
}

const needsSsl =
  process.env.DATABASE_SSL === "true" ||
  (dbUrl && dbUrl.includes("sslmode=require"));

export const pool = new Pool({
  connectionString: dbUrl,
  ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
});

pool.on("connect", () => {
  console.log("✅ [prontuario-pool] Conexão estabelecida");
});

pool.on("error", (err) => {
  console.error("❌ [prontuario-pool] Erro no pool:", err.message);
});
// Log mascarado para debug de conexão
const maskedUrl = dbUrl 
  ? dbUrl.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@').slice(0, 80) + '...'
  : 'NOT_DEFINED';
console.log("[DB POOL]", { 
  maskedUrl,
  hasDbUrl: !!dbUrl,
  envKeys: Object.keys(process.env).filter(k => k.includes('PG') || k.includes('DATABASE') || k.includes('POSTGRES')).join(',')
});
