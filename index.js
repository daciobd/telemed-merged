// TeleMed Monorepo - Start TeleMed Frontend
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Iniciando TeleMed Server...');

// Change to telemed-deploy-ready directory and start it
const frontendPath = join(__dirname, 'apps', 'telemed-deploy-ready');
const serverFile = join(frontendPath, 'server.js');

console.log('📁 Servidor:', serverFile);

process.chdir(frontendPath);

// Start the telemed frontend server
const child = spawn('node', ['server.js'], { 
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '5000' }
});

child.on('error', (error) => {
  console.error('Failed to start telemed server:', error);
  process.exit(1);
});

child.on('close', (code) => {
  console.log(`Telemed server exited with code ${code}`);
  process.exit(code);
});
