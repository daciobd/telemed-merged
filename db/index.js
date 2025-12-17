// db/index.js - conexão Drizzle + Postgres (ESM, sem index.cjs)

import { drizzle } from "drizzle-orm/node-postgres";
import pkg from "pg";
import * as schema from "./schema.cjs";

const { Pool } = pkg;

// Tenta achar a URL do banco em variáveis de ambiente comuns
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_CONNECTION_STRING;

console.log('🔵 [DB] Tentando conectar ao banco...');
console.log('🔵 [DB] DATABASE_URL existe?', !!process.env.DATABASE_URL);
console.log('🔵 [DB] POSTGRES_URL existe?', !!process.env.POSTGRES_URL);
console.log('🔵 [DB] URL (primeiros 30 chars):', connectionString?.substring(0, 30) + '...');

if (!connectionString) {
  console.error(
    "❌ Nenhuma variável de ambiente de banco encontrada (DATABASE_URL / POSTGRES_URL / POSTGRES_CONNECTION_STRING).",
  );
  throw new Error(
    "Configure a URL do Postgres em DATABASE_URL (ou POSTGRES_URL) para inicializar o db.",
  );
}

// Pool do Postgres
const pool = new Pool({
  connectionString,
});

// Log de eventos do pool
pool.on('connect', () => {
  console.log('✅ [DB] Conexão estabelecida com sucesso');
});

pool.on('error', (err) => {
  console.error('❌ [DB] Erro na conexão:', err.message);
});

// Instância Drizzle
export const db = drizzle(pool, { schema });

// Reexporta o schema, se alguém quiser usar
export * from "./schema.cjs";

export default { db, schema };
