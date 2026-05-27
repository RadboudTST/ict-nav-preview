#!/bin/bash

# RU Nav Editor Deploy Script
# Bouwt de app en kopieert naar de Windows productie PC via SMB

# Ga naar de project root (één map omhoog van scripts/)
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR/.."

# ============================================================
# CONFIGURATIE
# ============================================================
# Standaard waarden (kunnen worden overschreven via .deploy-config)
WINDOWS_IP="131.174.248.13"
SMB_SHARE="C$"
REMOTE_PATH="temp/wallboard/ru-nav-prototype"

# Laad configuratie uit bestand indien aanwezig
CONFIG_FILE="$SCRIPT_DIR/.deploy-config"
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
    echo "Configuratie geladen uit .deploy-config"
fi

SMB_PATH="/Volumes/$SMB_SHARE/$REMOTE_PATH"

# Kleuren
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo ""
echo "=============================================="
echo "     RU NAV EDITOR DEPLOY"
echo "=============================================="
echo ""
echo "  Target: $WINDOWS_IP"
echo "  Path:   $REMOTE_PATH"
echo ""

# Check SMB verbinding, probeer te connecten indien nodig
echo "[1/4] SMB verbinding controleren..."
if [ ! -d "$SMB_PATH" ]; then
    echo -e "${YELLOW}[...]${NC} SMB niet verbonden, verbinden..."

    # Mount via AppleScript (gebruikt opgeslagen Keychain credentials)
    osascript -e "
        try
            mount volume \"smb://$WINDOWS_IP/$SMB_SHARE\"
        end try
    " 2>/dev/null

    # Wacht tot mount klaar is (max 5 seconden)
    for i in {1..5}; do
        if [ -d "$SMB_PATH" ]; then
            break
        fi
        sleep 1
    done

    # Check opnieuw
    if [ ! -d "$SMB_PATH" ]; then
        echo -e "${RED}[FOUT]${NC} Kon niet automatisch verbinden"
        echo ""
        echo "       Verbind handmatig via Finder:"
        echo "       1. Cmd+K"
        echo "       2. smb://$WINDOWS_IP/$SMB_SHARE"
        echo "       3. Vink 'Remember this password' aan"
        echo ""
        echo "       Of maak $SCRIPT_DIR/.deploy-config met:"
        echo "       WINDOWS_IP=\"$WINDOWS_IP\""
        echo "       SMB_SHARE=\"$SMB_SHARE\""
        echo "       REMOTE_PATH=\"$REMOTE_PATH\""
        echo ""
        read -p "Druk Enter om af te sluiten..."
        exit 1
    fi
    echo -e "${GREEN}[OK]${NC} SMB verbonden"
else
    echo -e "${GREEN}[OK]${NC} SMB verbinding actief"
fi

# Build
echo ""
echo "[2/4] Building..."
npm run build 2>&1
if [ $? -ne 0 ]; then
    echo -e "${RED}[FOUT]${NC} Build mislukt"
    exit 1
fi
echo -e "${GREEN}[OK]${NC} Build voltooid"

# Verify local dist exists
if [ ! -f "dist/index.html" ]; then
    echo -e "${RED}[FOUT]${NC} dist/index.html niet gevonden na build"
    exit 1
fi

# Count local files
LOCAL_COUNT=$(find dist -type f | wc -l | tr -d ' ')
echo "      $LOCAL_COUNT bestanden in dist/"

# Copy dist
echo ""
echo "[3/4] Kopiëren dist/ naar productie..."

# Maak remote directory als die niet bestaat
if [ ! -d "$SMB_PATH" ]; then
    mkdir -p "$SMB_PATH"
fi

# Verwijder oude dist op remote
if [ -d "$SMB_PATH/dist" ]; then
    rm -rf "$SMB_PATH/dist"
    if [ $? -ne 0 ]; then
        echo -e "${RED}[FOUT]${NC} Kon oude dist niet verwijderen"
        exit 1
    fi
fi

# Kopieer nieuwe dist
cp -r dist "$SMB_PATH/"
if [ $? -ne 0 ]; then
    echo -e "${RED}[FOUT]${NC} Kopiëren dist mislukt"
    echo "       Check of de SMB verbinding nog actief is"
    exit 1
fi

# Verifieer kopie
if [ ! -f "$SMB_PATH/dist/index.html" ]; then
    echo -e "${RED}[FOUT]${NC} Verificatie mislukt - index.html niet aanwezig op remote"
    exit 1
fi

REMOTE_COUNT=$(find "$SMB_PATH/dist" -type f | wc -l | tr -d ' ')
echo -e "${GREEN}[OK]${NC} dist/ gekopieerd ($REMOTE_COUNT bestanden)"

if [ "$LOCAL_COUNT" != "$REMOTE_COUNT" ]; then
    echo -e "${YELLOW}[WARN]${NC} Bestandsaantal verschilt (lokaal: $LOCAL_COUNT, remote: $REMOTE_COUNT)"
fi

# Copy scripts (bat files and nginx config)
echo ""
echo "[4/4] Kopiëren beheerscripts..."
SCRIPTS_COPIED=0
for file in INSTALL.bat UPDATE.bat nginx-windows.conf rotate-logs.bat; do
    if [ -f "scripts/$file" ]; then
        cp "scripts/$file" "$SMB_PATH/"
        if [ $? -eq 0 ]; then
            ((SCRIPTS_COPIED++))
        fi
    fi
done

if [ $SCRIPTS_COPIED -gt 0 ]; then
    echo -e "${GREEN}[OK]${NC} $SCRIPTS_COPIED beheerscripts gekopieerd"
else
    echo -e "${YELLOW}[WARN]${NC} Geen beheerscripts gekopieerd"
fi

# Done
echo ""
echo "=============================================="
echo -e "${GREEN}     DEPLOY VOLTOOID${NC}"
echo "=============================================="
echo ""
echo "Volgende stappen op Windows ($WINDOWS_IP):"
echo ""
echo "  Eerste keer:"
echo "  1. Open: \\\\$WINDOWS_IP\\$SMB_SHARE\\$REMOTE_PATH"
echo "  2. Dubbelklik: INSTALL.bat (als administrator)"
echo ""
echo "  Updates:"
echo "  1. Dubbelklik: UPDATE.bat"
echo "  2. Kies: [1] Update"
echo ""
echo "De app is dan actief op http://$WINDOWS_IP:3333"
echo ""
read -p "Druk Enter om af te sluiten..."
