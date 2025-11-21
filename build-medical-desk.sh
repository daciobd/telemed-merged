#!/bin/bash
set -e

echo "🔍 Current directory: $(pwd)"
echo "📁 Listing workspace:"
ls -la | head -20

echo ""
echo "📂 Checking medical-desk structure:"
ls -la apps/medical-desk-advanced/

echo ""
echo "📂 Entering medical-desk-advanced/client..."
cd apps/medical-desk-advanced/client

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building application..."
npm run build

echo "✅ Build complete!"
ls -lh dist/assets/ | head -5
