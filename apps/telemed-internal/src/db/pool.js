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
console.log("[DB POOL]", {
  databaseUrl: process.env.DATABASE_URL?.slice(0, 30),
});
