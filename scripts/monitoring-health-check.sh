#!/bin/bash
# GeniusERP Monitoring & Health Check Script
# Verifică starea tuturor serviciilor și raportează în Loki

# Încarcă Loki Logger
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/loki-logger.sh" 2>/dev/null || {
  echo "⚠ Loki Logger indisponibil, se continuă fără logging."
  log_info() { echo "[INFO] $1"; }
  log_warning() { echo "[WARNING] $1"; }
  log_error() { echo "[ERROR] $1"; }
}

# Culori
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║        GeniusERP - Monitoring & Health Check              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

ERRORS=0
WARNINGS=0

# Funcție helper pentru verificare serviciu
check_service() {
  local service_name="$1"
  local container_name="$2"
  local port="$3"
  local health_endpoint="$4"
  
  echo -n "Verificare $service_name... "
  
  # Verifică dacă containerul rulează
  if ! docker ps | grep -q "$container_name"; then
    echo -e "${RED}✗ Container oprit${NC}"
    log_error "Service DOWN: $service_name (container: $container_name)" '"service": "'$service_name'", "status": "down"'
    ((ERRORS++))
    return 1
  fi
  
  # Verifică portul dacă e specificat
  if [ -n "$port" ]; then
    if ! nc -z localhost "$port" 2>/dev/null; then
      echo -e "${YELLOW}⚠ Port $port inaccesibil${NC}"
      log_warning "Service WARNING: $service_name (port $port inaccesibil)" '"service": "'$service_name'", "status": "warning"'
      ((WARNINGS++))
      return 1
    fi
  fi
  
  # Verifică health endpoint dacă e specificat
  if [ -n "$health_endpoint" ]; then
    if ! curl -sf "$health_endpoint" &> /dev/null; then
      echo -e "${YELLOW}⚠ Health check failed${NC}"
      log_warning "Service WARNING: $service_name (health check failed)" '"service": "'$service_name'", "status": "warning"'
      ((WARNINGS++))
      return 1
    fi
  fi
  
  echo -e "${GREEN}✓ OK${NC}"
  log_info "Service UP: $service_name" '"service": "'$service_name'", "status": "healthy"'
  return 0
}

# Verifică serviciile de bază
echo -e "${BLUE}═══ Core Services ═══${NC}"
check_service "PostgreSQL" "geniuserp-postgres" "5433" ""
check_service "GeniusERP App" "geniuserp-app" "5000" "http://localhost:5000/health"
check_service "Adminer" "geniuserp-adminer" "8080" ""

echo ""
echo -e "${BLUE}═══ Monitoring Stack ═══${NC}"
check_service "Prometheus" "geniuserp-prometheus" "9090" "http://localhost:9090/-/healthy"
check_service "Loki" "geniuserp-loki" "3100" "http://localhost:3100/ready"
check_service "Promtail" "geniuserp-promtail" "" ""
check_service "Grafana" "geniuserp-grafana" "4000" "http://localhost:4000/api/health"

echo ""
echo -e "${BLUE}═══ Security Stack ═══${NC}"
check_service "Falco" "geniuserp-falco" "" ""

# Verifică Wazuh (doar dacă rulează)
if docker ps | grep -q "geniuserp-wazuh"; then
  echo ""
  echo -e "${BLUE}═══ Wazuh SIEM ═══${NC}"
  check_service "Wazuh Indexer" "geniuserp-wazuh-indexer" "9200" ""
  check_service "Wazuh Manager" "geniuserp-wazuh-manager" "55000" ""
  check_service "Wazuh Dashboard" "geniuserp-wazuh-dashboard" "9443" ""
else
  echo -e "${YELLOW}⚠ Wazuh dezactivat (folosește docker-compose --profile wazuh up -d pentru activare)${NC}"
fi

echo ""
echo -e "${BLUE}═══ Metrics & Statistics ═══${NC}"

# Verifică metrici Prometheus
echo -n "Verificare metrici Prometheus... "
METRICS_COUNT=$(curl -s http://localhost:9090/api/v1/targets 2>/dev/null | grep -o '"up"' | wc -l)
if [ "$METRICS_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✓ $METRICS_COUNT target(e) active${NC}"
else
  echo -e "${RED}✗ Niciun target activ${NC}"
  ((ERRORS++))
fi

# Verifică loguri Loki
echo -n "Verificare loguri Loki... "
LOKI_JOBS=$(curl -s http://localhost:3100/loki/api/v1/label/job/values 2>/dev/null | grep -o '"' | wc -l)
if [ "$LOKI_JOBS" -gt 10 ]; then
  JOBS_COUNT=$((LOKI_JOBS / 4))  # Aproximativ
  echo -e "${GREEN}✓ $JOBS_COUNT job-uri monitorizate${NC}"
  
  # Afișează job-urile
  echo "  Jobs: $(curl -s http://localhost:3100/loki/api/v1/label/job/values 2>/dev/null | python3 -c "import sys, json; print(', '.join(json.load(sys.stdin).get('data', [])))" 2>/dev/null || echo "N/A")"
else
  echo -e "${RED}✗ Loki nu colectează loguri${NC}"
  ((ERRORS++))
fi

# Verifică volumul de loguri
echo -n "Verificare volum loguri (ultima oră)... "
LOGS_LAST_HOUR=$(curl -s -G "http://localhost:3100/loki/api/v1/query" \
  --data-urlencode 'query=sum(count_over_time({job=~".+"}[1h]))' 2>/dev/null | \
  python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data',{}).get('result',[{}])[0].get('value',[0,'0'])[1])" 2>/dev/null || echo "0")

if [ "$LOGS_LAST_HOUR" -gt 100 ]; then
  echo -e "${GREEN}✓ $LOGS_LAST_HOUR linii${NC}"
else
  echo -e "${YELLOW}⚠ $LOGS_LAST_HOUR linii (poate fi OK dacă aplicația e puțin utilizată)${NC}"
fi

# Verifică erori în ultima oră
echo -n "Verificare erori (ultima oră)... "
ERRORS_LAST_HOUR=$(curl -s -G "http://localhost:3100/loki/api/v1/query" \
  --data-urlencode 'query=sum(count_over_time({job=~".+"} |~ "(?i)error"[1h]))' 2>/dev/null | \
  python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data',{}).get('result',[{}])[0].get('value',[0,'0'])[1])" 2>/dev/null || echo "0")

if [ "$ERRORS_LAST_HOUR" -eq 0 ]; then
  echo -e "${GREEN}✓ 0 erori${NC}"
elif [ "$ERRORS_LAST_HOUR" -lt 10 ]; then
  echo -e "${YELLOW}⚠ $ERRORS_LAST_HOUR erori${NC}"
  log_warning "Erori detectate în ultima oră: $ERRORS_LAST_HOUR" '"metric": "errors_count", "period": "1h"'
else
  echo -e "${RED}✗ $ERRORS_LAST_HOUR erori${NC}"
  log_error "Număr mare de erori în ultima oră: $ERRORS_LAST_HOUR" '"metric": "errors_count", "period": "1h"'
  ((ERRORS++))
fi

echo ""
echo -e "${BLUE}═══ Docker Resources ═══${NC}"

# Verifică utilizare resurse
echo "Utilizare resurse containere:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | head -10

echo ""
echo -e "${BLUE}═══ Summary ═══${NC}"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ Toate serviciile funcționează normal!${NC}"
  log_info "✅ Health check PASSED: Toate serviciile OK" '"health_check": "passed", "errors": 0, "warnings": 0'
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠ $WARNINGS warning(e) detectat(e)${NC}"
  log_warning "⚠ Health check WARNING: $WARNINGS probleme minore" '"health_check": "warning", "errors": 0, "warnings": '$WARNINGS
else
  echo -e "${RED}❌ $ERRORS eroare/erori și $WARNINGS warning(e) detectate!${NC}"
  log_error "❌ Health check FAILED: $ERRORS erori, $WARNINGS warnings" '"health_check": "failed", "errors": '$ERRORS', "warnings": '$WARNINGS
  exit 1
fi

echo ""
echo -e "${BLUE}═══ Acțiuni Disponibile ═══${NC}"
echo "📊 Vezi dashboards: http://localhost:4000 (Grafana, admin:admin123)"
echo "📈 Vezi metrici: http://localhost:9090 (Prometheus)"
echo "🔍 Query loguri: curl -G http://localhost:3100/loki/api/v1/query --data-urlencode 'query={job=\"geniuserp-app\"}'"
echo "📋 Vezi loguri script: $0 --show-logs"

# Opțiune pentru a afișa loguri
if [ "$1" = "--show-logs" ]; then
  echo ""
  echo -e "${BLUE}═══ Loguri Recente Monitoring ═══${NC}"
  query_script_logs 20
fi

