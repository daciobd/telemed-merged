#!/bin/bash
set -e

echo "🔍 Current directory: $(pwd)"
echo "📁 Listing workspace:"
ls -la

echo ""
echo "📂 Entering medical-desk-advanced/client..."
cd apps/medical-desk-advanced/client

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building application..."
npm run build

echo "✅ Build complete!"
echo "📊 Build output:"
ls -lh dist/
