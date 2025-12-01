import type { Config } from "drizzle-kit";

export default {
  dialect: "postgresql",
  driver: "pg",
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
};
