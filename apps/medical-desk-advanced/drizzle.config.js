// Configuração Drizzle para MDA com prefixo mda_
export default {
  schema: './src/shared/schema.js',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL
  },
  // Garantir que as tabelas tenham prefixo mda_
  tablesFilter: ['mda_*'],
  verbose: true,
  strict: true
};