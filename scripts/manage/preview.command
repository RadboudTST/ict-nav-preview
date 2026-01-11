#!/bin/bash
# Preview de productie build

cd "$(dirname "$0")/../.."

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo "⚠️  No build found. Running build first..."
    npm run build
fi

echo "👁️  Starting preview server..."
echo ""

npm run preview
