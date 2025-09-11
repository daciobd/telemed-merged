// TeleMed Production Coordinator
// Manages all microservices in production mode

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting TeleMed Platform - Production Mode');

// Service configurations
const services = [
  {
    name: 'docs-automation',
    path: 'apps/telemed-docs-automation',
    command: 'npm',
    args: ['run', 'start'],
    port: 5000,
    env: { ...process.env, NODE_ENV: 'production', PORT: '5000' }
  },
  {
    name: 'auction-service',
    path: 'apps/auction-service',
    command: 'npm',
    args: ['run', 'start'],
    port: 3001,
    env: { ...process.env, NODE_ENV: 'production', PORT: '3001' }
  },
  {
    name: 'telemed-internal',
    path: 'apps/telemed-internal',
    command: 'npm',
    args: ['run', 'start'],
    port: 3002,
    env: { ...process.env, NODE_ENV: 'production', PORT: '3002' }
  },
  {
    name: 'productivity-service',
    path: 'apps/productivity-service',
    command: 'npm',
    args: ['run', 'start'],
    port: 3003,
    env: { ...process.env, NODE_ENV: 'production', PORT: '3003' }
  },
  {
    name: 'frontend',
    path: 'apps/telemed-deploy-ready',
    command: 'npm',
    args: ['run', 'start'],
    port: 8080,
    env: { ...process.env, NODE_ENV: 'production', PORT: '8080' }
  }
];

const runningServices = [];

// Function to start a service
function startService(service) {
  return new Promise((resolve, reject) => {
    console.log(`📡 Starting ${service.name} on port ${service.port}...`);
    
    const servicePath = join(__dirname, service.path);
    
    const child = spawn(service.command, service.args, {
      cwd: servicePath,
      stdio: 'inherit',
      shell: true,
      env: service.env
    });

    child.on('error', (error) => {
      console.error(`❌ Failed to start ${service.name}:`, error);
      reject(error);
    });

    child.on('close', (code) => {
      console.log(`🔴 ${service.name} exited with code ${code}`);
      if (code !== 0) {
        reject(new Error(`${service.name} exited with code ${code}`));
      }
    });

    runningServices.push({ name: service.name, process: child });
    
    // Give service time to start before resolving
    setTimeout(() => {
      console.log(`✅ ${service.name} started successfully`);
      resolve();
    }, 2000);
  });
}

// Function to handle graceful shutdown
function setupGracefulShutdown() {
  const shutdown = () => {
    console.log('\n🛑 Shutting down all services...');
    
    runningServices.forEach(service => {
      console.log(`🔴 Stopping ${service.name}...`);
      service.process.kill();
    });
    
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Main execution
async function startAllServices() {
  try {
    setupGracefulShutdown();
    
    // In production, we might want to start services sequentially to manage dependencies
    // or start them in parallel for faster startup
    
    console.log('🎯 Starting services in parallel...');
    
    // Start all services in parallel
    await Promise.all(services.map(service => startService(service)));
    
    console.log('🎉 All TeleMed services are running in production mode!');
    console.log('📊 Service Status:');
    runningServices.forEach(service => {
      console.log(`  ✅ ${service.name} - PID: ${service.process.pid}`);
    });
    
  } catch (error) {
    console.error('💥 Failed to start all services:', error);
    process.exit(1);
  }
}

startAllServices();