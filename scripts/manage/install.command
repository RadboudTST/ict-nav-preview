#!/bin/bash
# Installeer dependencies

cd "$(dirname "$0")/../.."

echo "📦 Installing dependencies..."
echo ""

npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Dependencies installed!"
else
    echo ""
    echo "❌ Installation failed"
    exit 1
fi
