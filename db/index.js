// Shim para compatibilizar CommonJS (index.cjs) com import ESM { db } from '.../db/index.js'
const dbModule = require('./index.cjs');

// Tenta achar o objeto de conexão em dbModule.db, dbModule.default ou no próprio módulo.
const db =
  dbModule.db ||
  dbModule.default ||
  dbModule;

module.exports = {
  ...dbModule,
  db,
};
