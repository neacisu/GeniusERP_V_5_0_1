#!/bin/bash

# Script pentru generarea certificatelor Wazuh
# Acest script va genera certificatele necesare pentru comunicarea securizată între componentele Wazuh

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CERTS_DIR="${SCRIPT_DIR}/certs"

echo "Generare certificate Wazuh..."

# Creează directorul pentru certificate dacă nu există
mkdir -p "${CERTS_DIR}"

# Generează certificatele folosind containerul oficial Wazuh
docker run --rm \
  -v "${CERTS_DIR}":/certs \
  -e NODE_NAME=wazuh-indexer \
  wazuh/wazuh-certs-generator:0.0.2

echo "Certificate generate cu succes în: ${CERTS_DIR}"
echo ""
echo "IMPORTANT: Păstrează aceste certificate în siguranță!"
echo "Certificate generate:"
ls -lah "${CERTS_DIR}"

