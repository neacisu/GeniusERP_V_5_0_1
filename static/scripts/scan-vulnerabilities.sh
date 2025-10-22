#!/bin/bash

# Script pentru scanarea vulnerabilităților cu Trivy
# Scanează atât imaginea Docker cât și filesystem-ul pentru dependențe vulnerabile

set -e

echo "======================================"
echo "  Scanare Vulnerabilități GeniusERP  "
echo "======================================"
echo ""

# Culori pentru output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}1. Scanare imagine Docker: geniuserp-app${NC}"
echo "--------------------------------------"
docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v $HOME/.cache:/root/.cache \
  aquasec/trivy:latest image \
  --severity HIGH,CRITICAL \
  --format table \
  geniuserp-app || echo -e "${RED}Imaginea nu există sau nu poate fi scanată${NC}"

echo ""
echo -e "${YELLOW}2. Scanare filesystem pentru dependențe vulnerabile${NC}"
echo "--------------------------------------"
docker run --rm \
  -v "$(pwd)":/app \
  -v $HOME/.cache:/root/.cache \
  aquasec/trivy:latest fs \
  --severity HIGH,CRITICAL \
  --format table \
  /app

echo ""
echo -e "${GREEN}Scanare completă!${NC}"
echo ""
echo "Pentru raport detaliat JSON, rulează:"
echo "  docker run --rm -v \$(pwd):/app aquasec/trivy:latest fs --format json --output /app/trivy-report.json /app"

