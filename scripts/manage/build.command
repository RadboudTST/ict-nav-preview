#!/bin/bash
# Build voor productie

cd "$(dirname "$0")/../.."

echo "🔨 Building for production..."
echo ""

npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build completed successfully!"
    echo "📁 Output in: dist/"
else
    echo ""
    echo "❌ Build failed"
    exit 1
fi
