#!/bin/bash
# Clean build artifacts en caches

cd "$(dirname "$0")/../.."

echo "🧹 Cleaning build artifacts..."

# Remove dist folder
if [ -d "dist" ]; then
    rm -rf dist
    echo "  ✓ Removed dist/"
fi

# Remove node_modules/.vite cache
if [ -d "node_modules/.vite" ]; then
    rm -rf node_modules/.vite
    echo "  ✓ Removed Vite cache"
fi

# Remove TypeScript build info
if [ -f "tsconfig.tsbuildinfo" ]; then
    rm -f tsconfig.tsbuildinfo
    echo "  ✓ Removed TypeScript build info"
fi

echo ""
echo "✅ Clean complete!"
