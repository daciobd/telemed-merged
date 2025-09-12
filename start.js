#!/usr/bin/env node

// Simplified TeleMed Startup Script for Cloud Run
// Starts only the main frontend application on port 5000

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting TeleMed Application...');

// Ensure PORT is set to 5000 for Cloud Run
process.env.PORT = process.env.PORT || '5000';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Port: ${process.env.PORT}`);
console.log(`OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? 'configured' : 'missing'}`);

const frontendPath = join(__dirname, 'apps', 'telemed-deploy-ready');

console.log(`📂 Starting frontend from: ${frontendPath}`);

// Start the frontend server
const child = spawn('npm', ['run', 'start'], {
  cwd: frontendPath,
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    PORT: '5000',
    NODE_ENV: 'production'
  }
});

child.on('error', (error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});

child.on('close', (code) => {
  console.log(`🔴 Application exited with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  child.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down...');
  child.kill();
  process.exit(0);
});

console.log('✅ Startup script running. Application should be available on port 5000');