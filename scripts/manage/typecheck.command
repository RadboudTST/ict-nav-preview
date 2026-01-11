#!/bin/bash
# Run TypeScript type checking

cd "$(dirname "$0")/../.."

echo "🔍 Running TypeScript type check..."
echo ""

npm run typecheck

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ No type errors found!"
else
    echo ""
    echo "❌ Type errors detected"
    exit 1
fi
