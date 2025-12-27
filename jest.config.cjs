/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  transform: {},
  moduleFileExtensions: ['js', 'mjs'],
  testMatch: ['**/tests/**/*.test.mjs', '**/tests/**/*.test.js'],
  testTimeout: 60000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
};

module.exports = config;
