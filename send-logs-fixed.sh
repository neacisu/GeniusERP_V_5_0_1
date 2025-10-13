#!/bin/bash
# Script pentru trimitere logs către Loki cu labels-uri corecte

echo "📤 Trimit logs TypeScript către Loki..."
docker exec geniuserp-app tail -10 /var/log/typescript-checker.log | grep "^{" | while read -r line; do
  # Extract service și alte labels din JSON
  service=$(echo "$line" | jq -r '.service // "typescript-checker"')
  target=$(echo "$line" | jq -r '.target // "unknown"')
  severity=$(echo "$line" | jq -r '.severity // "info"')
  
  timestamp_ns="$(date +%s)000000000"
  
  curl -s -X POST "http://localhost:3100/loki/api/v1/push" \
    -H "Content-Type: application/json" \
    --data-raw "{\"streams\": [{\"stream\": {\"job\": \"geniuserp-app\", \"service\": \"$service\", \"target\": \"$target\", \"severity\": \"$severity\"}, \"values\": [[\"$timestamp_ns\", $(echo "$line" | jq -R .)]]}]}"
done

echo "📤 Trimit logs ESLint către Loki..."
docker exec geniuserp-app tail -50 /var/log/eslint-checker.log | grep "^{" | while read -r line; do
  service=$(echo "$line" | jq -r '.service // "eslint-checker"')
  target=$(echo "$line" | jq -r '.target // "unknown"')
  severity=$(echo "$line" | jq -r '.severity // "info"')
  
  timestamp_ns="$(date +%s)000000000"
  
  curl -s -X POST "http://localhost:3100/loki/api/v1/push" \
    -H "Content-Type: application/json" \
    --data-raw "{\"streams\": [{\"stream\": {\"job\": \"geniuserp-app\", \"service\": \"$service\", \"target\": \"$target\", \"severity\": \"$severity\"}, \"values\": [[\"$timestamp_ns\", $(echo "$line" | jq -R .)]]}]}"
done

echo "✅ Logs trimise către Loki cu labels-uri corecte!"
echo ""
echo "🔍 Verifică în Grafana:"
echo "  - Dashboard TypeScript: http://localhost:4000/d/typescript-errors"
echo "  - Dashboard ESLint: http://localhost:4000/d/eslint-errors"

