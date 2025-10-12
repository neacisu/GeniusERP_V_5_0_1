#!/bin/bash
# Loki Logger - Helper pentru logging din scripturi bash către Loki
# Utilizare: source ./loki-logger.sh

# Configurare
LOKI_URL=${LOKI_URL:-"http://localhost:3100"}
LOKI_PUSH_API="$LOKI_URL/loki/api/v1/push"
SCRIPT_NAME=$(basename "$0" .sh)
HOSTNAME=$(hostname)

# Culori pentru console
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funcție pentru trimitere log la Loki
# Parametri: $1 = level (info|warning|error), $2 = message, $3 = extra_labels (opțional)
send_to_loki() {
  local level="$1"
  local message="$2"
  local extra_labels="$3"
  
  # Timestamp în nanosecunde (Loki format)
  local timestamp=$(date +%s%N)
  
  # Construiește JSON pentru Loki
  local json_payload=$(cat <<EOF
{
  "streams": [
    {
      "stream": {
        "job": "bash-scripts",
        "script": "$SCRIPT_NAME",
        "hostname": "$HOSTNAME",
        "level": "$level"
        ${extra_labels:+,$extra_labels}
      },
      "values": [
        ["$timestamp", "$message"]
      ]
    }
  ]
}
EOF
)

  # Trimite la Loki (silent, nu afișa erori dacă Loki nu e disponibil)
  curl -s -X POST "$LOKI_PUSH_API" \
    -H "Content-Type: application/json" \
    -d "$json_payload" &> /dev/null || true
}

# Funcție principală de logging
# Parametri: $1 = level, $2 = message, $3 = extra_labels (opțional)
log_message() {
  local level=$1
  local message=$2
  local extra_labels=$3
  local color=$NC
  
  # Alege culoarea pentru console
  case $level in
    "info"|"INFO") 
      color=$GREEN
      level="info"
      ;;
    "warning"|"WARNING") 
      color=$YELLOW
      level="warning"
      ;;
    "error"|"ERROR") 
      color=$RED
      level="error"
      ;;
    "debug"|"DEBUG") 
      color=$BLUE
      level="debug"
      ;;
    *) 
      level="info"
      ;;
  esac
  
  # Afișare în console
  local level_upper=$(echo "$level" | tr '[:lower:]' '[:upper:]')
  echo -e "${color}[$(date +"%Y-%m-%d %H:%M:%S")] [$level_upper] $message${NC}"
  
  # Trimite la Loki în background
  send_to_loki "$level" "$message" "$extra_labels" &
}

# Funcții shortcut pentru niveluri diferite
log_info() {
  log_message "info" "$1" "$2"
}

log_warning() {
  log_message "warning" "$1" "$2"
}

log_error() {
  log_message "error" "$1" "$2"
}

log_debug() {
  log_message "debug" "$1" "$2"
}

# Funcție specială pentru log de backup
log_backup() {
  local operation="$1"  # start|success|error
  local details="$2"
  local extra_labels='"operation": "backup", "status": "'$operation'"'
  
  case $operation in
    "start")
      log_message "info" "🔄 Backup început: $details" "$extra_labels"
      ;;
    "success")
      log_message "info" "✅ Backup finalizat cu succes: $details" "$extra_labels"
      ;;
    "error")
      log_message "error" "❌ Backup eșuat: $details" "$extra_labels"
      ;;
  esac
}

# Funcție specială pentru log de deploy
log_deploy() {
  local operation="$1"  # start|success|error|progress
  local details="$2"
  local extra_labels='"operation": "deploy", "status": "'$operation'"'
  
  case $operation in
    "start")
      log_message "info" "🚀 Deploy început: $details" "$extra_labels"
      ;;
    "progress")
      log_message "info" "⏳ Deploy în progres: $details" "$extra_labels"
      ;;
    "success")
      log_message "info" "✅ Deploy finalizat cu succes: $details" "$extra_labels"
      ;;
    "error")
      log_message "error" "❌ Deploy eșuat: $details" "$extra_labels"
      ;;
  esac
}

# Funcție pentru verificare disponibilitate Loki
check_loki() {
  if curl -s "$LOKI_URL/ready" &> /dev/null; then
    echo -e "${GREEN}✓ Loki disponibil la $LOKI_URL${NC}"
    return 0
  else
    echo -e "${YELLOW}⚠ Loki indisponibil la $LOKI_URL (logurile vor fi doar în console)${NC}"
    return 1
  fi
}

# Funcție pentru query logs din Loki pentru acest script
query_script_logs() {
  local limit="${1:-20}"
  
  echo "📋 Ultimele $limit loguri din script '$SCRIPT_NAME':"
  echo ""
  
  curl -s -G "$LOKI_URL/loki/api/v1/query_range" \
    --data-urlencode "query={job=\"bash-scripts\",script=\"$SCRIPT_NAME\"}" \
    --data-urlencode "limit=$limit" \
    --data-urlencode "start=$(date -u -v-1H +%s)000000000" \
    --data-urlencode "end=$(date -u +%s)000000000" | \
    python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    results = data.get('data', {}).get('result', [])
    if results:
        for result in results:
            for entry in result.get('values', [])[:$limit]:
                print(entry[1])
    else:
        print('Nu s-au găsit loguri.')
except:
    print('Eroare la interogarea Loki.')
" 2>/dev/null || echo "Loki indisponibil pentru query."
}

# Export funcțiile
export -f send_to_loki
export -f log_message
export -f log_info
export -f log_warning
export -f log_error
export -f log_debug
export -f log_backup
export -f log_deploy
export -f check_loki
export -f query_script_logs

# Mesaj de inițializare (opțional, comentează dacă nu vrei)
# log_info "Loki Logger inițializat pentru script: $SCRIPT_NAME"

