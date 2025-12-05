#!/usr/bin/env node

// TeleMed Production Server Starter
// Uses bundled production server if available, falls back to index.js

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const bundledPath = path.join(__dirname, 'production-full.cjs');
const indexPath = path.join(__dirname, 'index.js');

// Check which file to use
let serverPath;
if (fs.existsSync(bundledPath)) {
  console.log('🚀 Using bundled production server');
  serverPath = bundledPath;
} else if (fs.existsSync(indexPath)) {
  console.log('🚀 Using development server (ESM)');
  serverPath = indexPath;
} else {
  console.error('❌ No server file found!');
  process.exit(1);
}

console.log(`   Entry: ${serverPath}`);
console.log(`   PORT: ${process.env.PORT || 5000}`);

// Use require for CJS, spawn for ESM
if (serverPath.endsWith('.cjs')) {
  require(serverPath);
} else {
  // Spawn node for ESM modules
  const server = spawn('node', [serverPath], {
    stdio: 'inherit',
    env: process.env
  });

  server.on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });

  server.on('close', (code) => {
    process.exit(code || 0);
  });

  process.on('SIGTERM', () => server.kill('SIGTERM'));
  process.on('SIGINT', () => server.kill('SIGINT'));
}
