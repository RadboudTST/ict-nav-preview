#!/bin/bash
# Stop alle draaiende dev servers

echo "🛑 Stopping all Vite dev servers..."

# Kill all vite processes
pkill -f "vite" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Dev server(s) stopped"
else
    echo "ℹ️  No running dev servers found"
fi
