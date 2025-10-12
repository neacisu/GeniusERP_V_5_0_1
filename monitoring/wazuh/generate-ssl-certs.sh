#!/bin/bash

# Script complet pentru generarea certificatelor SSL pentru Wazuh
# Folosește tool-ul oficial wazuh-certs-tool

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CERTS_DIR="${SCRIPT_DIR}/certs"
CONFIG_DIR="${SCRIPT_DIR}/config"

echo "=========================================="
echo "  GENERARE CERTIFICATE SSL WAZUH"
echo "=========================================="
echo ""

# Verifică dacă există fișierul de configurare
if [ ! -f "${CONFIG_DIR}/instances.yml" ]; then
    echo "❌ EROARE: Fișierul ${CONFIG_DIR}/instances.yml nu există!"
    exit 1
fi

# Creează director pentru certificate
mkdir -p "${CERTS_DIR}"

# Descarcă tool-ul de generare certificate
echo "📥 Descărcare wazuh-certs-tool..."
cd "${CERTS_DIR}"
curl -sO https://packages.wazuh.com/4.7/wazuh-certs-tool.sh
chmod +x wazuh-certs-tool.sh

# Generează certificatele
echo "🔐 Generare certificate SSL..."
./wazuh-certs-tool.sh -A

# Creează arhivă cu certificatele pentru fiecare nod
echo "📦 Creare arhive certificate..."
./wazuh-certs-tool.sh -wi wazuh-indexer
./wazuh-certs-tool.sh -wm wazuh-manager
./wazuh-certs-tool.sh -wd wazuh-dashboard

echo ""
echo "✅ Certificate generate cu succes!"
echo ""
echo "📁 Certificate disponibile în: ${CERTS_DIR}"
ls -lh "${CERTS_DIR}"/*.tar

echo ""
echo "⚠️  IMPORTANT: Păstrează aceste certificate în siguranță!"
echo "    Nu le comite în Git!"

