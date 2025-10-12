// TeleMed Monorepo - Start TeleMed Internal Gateway
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Iniciando TeleMed Internal Gateway...');

// Change to telemed-internal directory and start it
const gatewayPath = join(__dirname, 'apps', 'telemed-internal');
const serverFile = join(gatewayPath, 'src', 'index.js');

console.log('📁 Gateway:', serverFile);

process.chdir(gatewayPath);

// Start the telemed internal gateway (serves frontend + proxies)
const child = spawn('node', ['src/index.js'], { 
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '5000' }
});

child.on('error', (error) => {
  console.error('Failed to start telemed gateway:', error);
  process.exit(1);
});

child.on('close', (code) => {
  console.log(`Telemed gateway exited with code ${code}`);
  process.exit(code);
});
