import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ensure dependencies are installed
console.log('📦 Ensuring dependencies...');
try {
  execSync('npm install --omit=dev --legacy-peer-deps', {
    cwd: __dirname,
    stdio: 'pipe'
  });
  console.log('✅ Dependencies ready');
} catch (e) {
  console.log('⚠️ npm install warning (continuing anyway):', e.message);
}

// Now import and run the server
import('./production.cjs').catch(e => {
  console.error('Failed to load production.cjs:', e);
  process.exit(1);
});
