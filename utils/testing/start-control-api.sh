#!/bin/bash

###############################################################################
# Script de Pornire Test Control API
# 
# Funcționalități:
# - Pornește API-ul de control pentru orchestrator
# - Servește control panel HTML
# - Expune endpoints pentru start/stop/clear logs
###############################################################################

set -e

# Culori pentru output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "================================================================================"
echo "🚀 GeniusERP - Test Control API Startup"
echo "================================================================================"
echo -e "${NC}"

# Directoare
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_FILE="$SCRIPT_DIR/control-api.ts"
CONTROL_PANEL="$SCRIPT_DIR/dashboard/control-panel.html"
LOGS_DIR="$SCRIPT_DIR/logs"

# Verifică dacă fișierele există
if [ ! -f "$API_FILE" ]; then
  echo -e "${RED}❌ Eroare: Nu găsesc control-api.ts la $API_FILE${NC}"
  exit 1
fi

if [ ! -f "$CONTROL_PANEL" ]; then
  echo -e "${YELLOW}⚠️  Warning: Nu găsesc control-panel.html la $CONTROL_PANEL${NC}"
fi

# Creare director logs dacă nu există
if [ ! -d "$LOGS_DIR" ]; then
  echo -e "${YELLOW}📁 Creare director logs...${NC}"
  mkdir -p "$LOGS_DIR"
fi

# Verifică dacă portul este liber
PORT=${TEST_CONTROL_PORT:-9091}
if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
  echo -e "${RED}❌ Eroare: Portul $PORT este deja folosit${NC}"
  echo -e "${YELLOW}   Pentru a opri procesul existent, rulează:${NC}"
  echo -e "${YELLOW}   kill \$(lsof -t -i:$PORT)${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Port $PORT disponibil${NC}"

# Verifică dacă tsx este instalat
if ! command -v tsx &> /dev/null; then
  echo -e "${RED}❌ Eroare: tsx nu este instalat${NC}"
  echo -e "${YELLOW}   Instalează cu: npm install -g tsx${NC}"
  exit 1
fi

echo -e "${GREEN}✓ tsx găsit${NC}"

# Pornire API
echo ""
echo -e "${BLUE}🚀 Pornire Test Control API...${NC}"
echo ""

# Export environment variables
export TEST_CONTROL_PORT=$PORT
export NODE_ENV=${NODE_ENV:-development}

# Servire control panel via http-server în background (optional)
if command -v http-server &> /dev/null; then
  echo -e "${GREEN}🌐 Pornire HTTP server pentru control panel...${NC}"
  cd "$SCRIPT_DIR/dashboard"
  http-server -p $((PORT + 1)) --cors -s -o &
  HTTP_SERVER_PID=$!
  echo -e "${GREEN}   Control Panel disponibil la: http://localhost:$((PORT + 1))/control-panel.html${NC}"
  cd "$SCRIPT_DIR"
fi

# Pornire API
echo -e "${GREEN}🎮 API Control disponibil la: http://localhost:$PORT${NC}"
echo ""
echo -e "${YELLOW}Endpoints disponibile:${NC}"
echo -e "  ${BLUE}•${NC} GET  http://localhost:$PORT/health"
echo -e "  ${BLUE}•${NC} GET  http://localhost:$PORT/status"
echo -e "  ${BLUE}•${NC} POST http://localhost:$PORT/start"
echo -e "  ${BLUE}•${NC} POST http://localhost:$PORT/stop"
echo -e "  ${BLUE}•${NC} POST http://localhost:$PORT/restart"
echo -e "  ${BLUE}•${NC} POST http://localhost:$PORT/clear-logs"
echo -e "  ${BLUE}•${NC} POST http://localhost:$PORT/clear-metrics"
echo -e "  ${BLUE}•${NC} GET  http://localhost:$PORT/metrics"
echo -e "  ${BLUE}•${NC} GET  http://localhost:$PORT/logs"
echo ""
echo -e "${GREEN}================================================================================${NC}"
echo ""

# Cleanup on exit
cleanup() {
  echo ""
  echo -e "${YELLOW}🛑 Oprire servicii...${NC}"
  
  if [ ! -z "$HTTP_SERVER_PID" ]; then
    kill $HTTP_SERVER_PID 2>/dev/null || true
  fi
  
  echo -e "${GREEN}✅ Servicii oprite${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Pornire API (blocking)
tsx "$API_FILE"

# Dacă ajungem aici, API-ul s-a oprit
cleanup

