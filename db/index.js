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

// Instância Drizzle
export const db = drizzle(pool, { schema });

// Reexporta o schema, se alguém quiser usar
export * from "./schema.cjs";

export default { db, schema };
