import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const PORT = process.env.PORT || '5000';
const proc = spawn('node', ['server-prod.cjs'], {
  cwd: dirname(fileURLToPath(import.meta.url)),
  env: { ...process.env, PORT },
  stdio: 'inherit'
});

process.on('SIGTERM', () => {
  proc.kill('SIGTERM');
  process.exit(0);
});
