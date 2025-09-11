#!/bin/bash

# TeleMed Monorepo Build Script
# This script builds all services in the correct order

set -e

echo "🚀 Building TeleMed Platform - All Services"

# Build docs automation service (TypeScript compilation)
echo "📄 Building docs automation service..."
cd apps/telemed-docs-automation
npm ci
npm run build
cd ../..

# Build auction service (Prisma generation)
echo "🏠 Building auction service..."
cd apps/auction-service
npm ci
npm run build
cd ../..

# Build internal service (Prisma generation)
echo "🔧 Building internal service..."
cd apps/telemed-internal
npm ci
npm run build
cd ../..

# Build productivity service (Prisma generation)
echo "⚡ Building productivity service..."
cd apps/productivity-service
npm ci
npm run build
cd ../..

# Build frontend (static files)
echo "🌐 Building frontend..."
cd apps/telemed-deploy-ready
npm ci
npm run build
cd ../..

echo "✅ All services built successfully!"