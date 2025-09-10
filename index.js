// TeleMed Monorepo - Proxy to Docs Automation Service  
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting TeleMed Docs Automation Service (TypeScript)...');

// Change to docs automation directory and start it
const docsPath = join(__dirname, 'apps', 'telemed-docs-automation');
process.chdir(docsPath);

// Start the docs automation service
const child = spawn('npm', ['run', 'dev'], { 
  stdio: 'inherit',
  shell: true 
});

child.on('error', (error) => {
  console.error('Failed to start docs automation service:', error);
  process.exit(1);
});

child.on('close', (code) => {
  console.log(`Docs automation service exited with code ${code}`);
  process.exit(code);
});
