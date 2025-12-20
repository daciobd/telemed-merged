import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
});

pool.on("connect", () => {
  console.log("✅ [prontuario-pool] Conexão estabelecida");
});

pool.on("error", (err) => {
  console.error("❌ [prontuario-pool] Erro no pool:", err.message);
});
