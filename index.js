// TeleMed Monorepo - Proxy to Docs Automation Service  
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting TeleMed Deploy Ready Frontend Service...');

// Change to deploy ready directory and start it
const frontendPath = join(__dirname, 'apps', 'telemed-deploy-ready');
process.chdir(frontendPath);

// Start the frontend service with server.js
const child = spawn('node', ['server.js'], { 
  stdio: 'inherit',
  shell: true 
});

child.on('error', (error) => {
  console.error('Failed to start docs automation service:', error);
  process.exit(1);
});

child.on('close', (code) => {
  console.log(`Frontend service exited with code ${code}`);
  process.exit(code);
});
