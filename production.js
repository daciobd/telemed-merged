#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

process.on('unhandledRejection', (e) => { console.error(e); process.exit(1); });

// Cloud Run/Replit passam a porta via env.
// Use a fornecida ou 5000 como fallback para o Replit.
const PORT = String(process.env.PORT || 5000);

// Se DR_AI estiver habilitado mas sem chave, desabilita para não quebrar o boot
if (process.env.DR_AI_ENABLED === '1' && !process.env.OPENAI_API_KEY) {
  console.warn('[boot] DR_AI_ENABLED=1 mas sem OPENAI_API_KEY → desabilitando Dr. AI');
  process.env.DR_AI_ENABLED = '0';
}

console.log(`[boot] Starting TeleMed frontend service on port ${PORT}`);

// Start the main frontend service (telemed-deploy-ready)
const frontendPath = join(__dirname, 'apps', 'telemed-deploy-ready');

const child = spawn('node', ['server.js'], {
  cwd: frontendPath,
  stdio: 'inherit',
  env: { 
    ...process.env, 
    PORT,
    NODE_ENV: 'production',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
    DR_AI_ENABLED: process.env.DR_AI_ENABLED || '0'
  },
});

// Graceful shutdown handlers for Cloud Run
function setupGracefulShutdown() {
  const shutdown = (signal) => {
    console.log(`\n[boot] Received ${signal}, shutting down gracefully...`);
    child.kill('SIGTERM');
    
    // Give child process time to shutdown gracefully, then force exit
    setTimeout(() => {
      console.log('[boot] Force exit after timeout');
      process.exit(0);
    }, 5000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

setupGracefulShutdown();
child.on('exit', (code) => process.exit(code ?? 0));