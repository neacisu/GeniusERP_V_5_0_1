#!/bin/bash

# Script pentru generarea certificatelor Wazuh
# Acest script va genera certificatele necesare pentru comunicarea securizată între componentele Wazuh

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CERTS_DIR="${SCRIPT_DIR}/certs"
CONFIG_DIR="${SCRIPT_DIR}/config"

echo "Generare certificate Wazuh..."

# Creează directoarele pentru certificate și config dacă nu există
mkdir -p "${CERTS_DIR}"
mkdir -p "${CONFIG_DIR}"

# Verifică dacă există fișierul de configurare
if [ ! -f "${CONFIG_DIR}/certs.yml" ]; then
    echo "EROARE: Fișierul de configurare ${CONFIG_DIR}/certs.yml nu există!"
    exit 1
fi

# Generează certificatele folosind containerul oficial Wazuh
docker run --rm \
  -v "${CONFIG_DIR}":/config \
  -v "${CERTS_DIR}":/certs \
  wazuh/wazuh-certs-generator:0.0.2

echo "Certificate generate cu succes în: ${CERTS_DIR}"
echo ""
echo "IMPORTANT: Păstrează aceste certificate în siguranță!"
echo "Certificate generate:"
ls -lah "${CERTS_DIR}"

