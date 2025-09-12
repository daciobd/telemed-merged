// TeleMed Production Coordinator - Simplified for Cloud Run
// Manages the main frontend application on port 5000

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting TeleMed Frontend - Production Mode');

// Main service configuration for Cloud Run deployment
const mainService = {
  name: 'frontend',
  path: 'apps/telemed-deploy-ready',
  command: 'npm',
  args: ['run', 'start'],
  port: 5000,
  env: { 
    ...process.env, 
    NODE_ENV: 'production', 
    PORT: '5000',
    // Add OPENAI_API_KEY to environment for any AI features
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || ''
  }
};

let runningProcess = null;

// Function to start the main service
function startMainService() {
  return new Promise((resolve, reject) => {
    console.log(`📡 Starting ${mainService.name} on port ${mainService.port}...`);
    
    const servicePath = join(__dirname, mainService.path);
    
    const child = spawn(mainService.command, mainService.args, {
      cwd: servicePath,
      stdio: 'inherit',
      shell: true,
      env: mainService.env
    });

    child.on('error', (error) => {
      console.error(`❌ Failed to start ${mainService.name}:`, error);
      reject(error);
    });

    child.on('close', (code) => {
      console.log(`🔴 ${mainService.name} exited with code ${code}`);
      if (code !== 0) {
        reject(new Error(`${mainService.name} exited with code ${code}`));
      }
    });

    runningProcess = child;
    
    // Give service time to start before resolving
    setTimeout(() => {
      console.log(`✅ ${mainService.name} started successfully on port ${mainService.port}`);
      resolve();
    }, 2000);
  });
}

// Function to handle graceful shutdown
function setupGracefulShutdown() {
  const shutdown = () => {
    console.log('\n🛑 Shutting down service...');
    
    if (runningProcess) {
      console.log(`🔴 Stopping ${mainService.name}...`);
      runningProcess.kill();
    }
    
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Main execution
async function startService() {
  try {
    setupGracefulShutdown();
    
    console.log('🎯 Starting main frontend service...');
    
    // Start the main service
    await startMainService();
    
    console.log('🎉 TeleMed frontend is running in production mode!');
    console.log(`📊 Service Status: ✅ ${mainService.name} - PID: ${runningProcess.pid}`);
    
  } catch (error) {
    console.error('💥 Failed to start service:', error);
    process.exit(1);
  }
}

startService();