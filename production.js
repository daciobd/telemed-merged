#!/usr/bin/env node
import { execSync, spawnSync } from 'child_process';
import { existsSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nodeModulesPath = path.join(__dirname, 'node_modules');

console.log('🚀 TeleMed Production Startup');
console.log(`📍 Working dir: ${__dirname}`);

// Ensure node_modules exists and is recent
let needsInstall = true;
if (existsSync(nodeModulesPath)) {
  try {
    const stats = statSync(nodeModulesPath);
    const ageSeconds = (Date.now() - stats.mtimeMs) / 1000;
    if (ageSeconds < 300) { // Less than 5 minutes old
      console.log('✅ node_modules found and recent');
      needsInstall = false;
    } else {
      console.log('⚠️  node_modules exists but is old, refreshing...');
    }
  } catch (e) {
    console.log('⚠️  Could not stat node_modules:', e.message);
  }
} else {
  console.log('❌ node_modules missing - installing...');
}

// Install if needed
if (needsInstall) {
  try {
    console.log('📦 Running: npm ci --only=prod --no-save --legacy-peer-deps');
    const result = spawnSync('npm', ['ci', '--only=prod', '--no-save', '--legacy-peer-deps'], {
      cwd: __dirname,
      stdio: 'inherit',
      timeout: 120000
    });
    
    if (result.error) {
      console.error('❌ npm ci failed:', result.error.message);
      console.log('🔄 Trying npm install instead...');
      spawnSync('npm', ['install', '--omit=dev', '--legacy-peer-deps'], {
        cwd: __dirname,
        stdio: 'inherit',
        timeout: 120000
      });
    }
  } catch (e) {
    console.error('❌ Dependency installation error:', e.message);
    // Continue anyway - maybe deps are already there
  }
}

// Verify express is available
try {
  require.resolve('express');
  console.log('✅ Dependencies verified');
} catch (e) {
  console.error('❌ Missing express - dependencies not properly installed');
  process.exit(1);
}

// Load and start server
console.log('🔄 Loading server...');
import('./production.cjs').catch(e => {
  console.error('❌ Failed to load production.cjs:', e);
  process.exit(1);
});
