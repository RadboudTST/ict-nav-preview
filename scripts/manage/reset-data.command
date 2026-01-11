#!/bin/bash
# Reset applicatie data (clear localStorage)

cd "$(dirname "$0")/../.."

echo "🗑️  Dit script opent de browser console instructies..."
echo ""
echo "Om de app data te resetten:"
echo ""
echo "1. Open de app in de browser"
echo "2. Open Developer Tools (Cmd+Option+I of F12)"
echo "3. Ga naar Console tab"
echo "4. Voer uit: localStorage.clear()"
echo "5. Herlaad de pagina (Cmd+R)"
echo ""
echo "Of klik op 'Terugzetten' > 'Beide structuren terugzetten' in de app"
echo ""

# Open the app
open http://localhost:5173
