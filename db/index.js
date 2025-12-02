// Wrapper ESM para o módulo CommonJS `index.cjs`
// Assim podemos usar tanto:
//   import dbModule from "../../../db/index.js"
//   const { db } = await import("../../../db/index.js")

import * as dbModule from './index.cjs';

// Tenta descobrir qual é o objeto de conexão do Drizzle:
// - se o CJS expõe `db`, usamos;
// - se expõe `default`, usamos;
// - senão, usamos o módulo inteiro.
export const db =
  dbModule.db ||
  dbModule.default ||
  dbModule;

// Default export (para `import dbModule from ...`)
export default dbModule;

// Reexporta tudo que o index.cjs tiver
export * from './index.cjs';
