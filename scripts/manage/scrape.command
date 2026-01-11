#!/bin/bash
# Scrape content van ru.nl ICT pagina's

cd "$(dirname "$0")/../.."

echo "🌐 Scraping ru.nl ICT content..."
echo ""
echo "⚠️  Dit kan enkele minuten duren (500ms delay tussen requests)"
echo ""

npx tsx scripts/scrape-ru-content.ts

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Scraping complete!"
else
    echo ""
    echo "❌ Scraping failed"
    exit 1
fi
