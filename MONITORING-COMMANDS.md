# 🛠️ Comenzi Utile - Monitoring, Securitate, Calitate

Colecție de comenzi frecvent folosite pentru operarea stack-ului de monitoring și securitate.

---

## 🐳 Docker Management

### Start/Stop Servicii

```bash
# Start toate serviciile
docker-compose up -d

# Start doar monitoring stack
docker-compose up -d prometheus grafana loki promtail

# Start doar security stack
docker-compose up -d falco wazuh-indexer wazuh-manager wazuh-dashboard

# Stop toate serviciile
docker-compose down

# Stop și șterge volumes (ATENȚIE: pierdere date!)
docker-compose down -v

# Restart un serviciu specific
docker-compose restart grafana
docker-compose restart prometheus

# Rebuild și restart aplicația
docker-compose up -d --build app
```

### Logs și Debugging

```bash
# Logs în timp real de la toate serviciile
docker-compose logs -f

# Logs de la un serviciu specific
docker-compose logs -f app
docker-compose logs -f grafana
docker-compose logs -f falco
docker-compose logs -f wazuh-manager

# Ultimele 100 linii
docker-compose logs --tail=100

# Logs cu timestamp
docker-compose logs -f -t

# Exec în container
docker exec -it geniuserp-app bash
docker exec -it geniuserp-grafana sh
docker exec -it geniuserp-prometheus sh
```

### Status și Monitoring

```bash
# Status toate serviciile
docker-compose ps

# Resource usage în timp real
docker stats

# Disk usage Docker
docker system df

# Inspect container
docker inspect geniuserp-app | jq '.[0].State'
docker inspect geniuserp-grafana | jq '.[0].Config.Env'

# Network inspect
docker network ls
docker network inspect geniuserp-network
```

---

## 📊 Prometheus

### Query-uri Utile

```bash
# Test endpoint metrici
curl http://localhost:5000/metrics

# Query Prometheus API direct
curl 'http://localhost:9090/api/v1/query?query=up'

# Request rate (requests per second)
curl 'http://localhost:9090/api/v1/query?query=rate(geniuserp_http_requests_total[5m])'

# Memory usage
curl 'http://localhost:9090/api/v1/query?query=process_resident_memory_bytes'
```

### PromQL Examples

```promql
# Total requests
geniuserp_http_requests_total

# Request rate per second
rate(geniuserp_http_requests_total[5m])

# Error rate
rate(geniuserp_http_request_errors_total[5m])

# P95 latency
histogram_quantile(0.95, rate(geniuserp_http_request_duration_seconds_bucket[5m]))

# P99 latency
histogram_quantile(0.99, rate(geniuserp_http_request_duration_seconds_bucket[5m]))

# Memory usage în MB
process_resident_memory_bytes / 1024 / 1024

# CPU usage
rate(process_cpu_user_seconds_total[5m])

# Request rate by status code
sum(rate(geniuserp_http_requests_total[5m])) by (status_code)

# Error rate percentage
(rate(geniuserp_http_request_errors_total[5m]) / rate(geniuserp_http_requests_total[5m])) * 100

# Top 5 slowest endpoints
topk(5, geniuserp_http_request_duration_seconds)
```

### Reload Config

```bash
# Reload Prometheus config fără restart
curl -X POST http://localhost:9090/-/reload

# Sau restart
docker-compose restart prometheus
```

---

## 📊 Grafana

### Management

```bash
# Reset admin password
docker exec -it geniuserp-grafana grafana-cli admin reset-admin-password newpassword

# List installed plugins
docker exec -it geniuserp-grafana grafana-cli plugins ls

# Install plugin
docker exec -it geniuserp-grafana grafana-cli plugins install <plugin-name>
docker-compose restart grafana

# Backup Grafana data
docker cp geniuserp-grafana:/var/lib/grafana ./grafana-backup

# Restore Grafana data
docker cp ./grafana-backup/. geniuserp-grafana:/var/lib/grafana
docker-compose restart grafana
```

### API Usage

```bash
# Get all dashboards
curl -u admin:admin123 http://localhost:4000/api/dashboards/home

# Get datasources
curl -u admin:admin123 http://localhost:4000/api/datasources

# Create API key
curl -X POST -H "Content-Type: application/json" \
  -u admin:admin123 \
  -d '{"name":"api-key","role":"Admin"}' \
  http://localhost:4000/api/auth/keys

# Test datasource
curl -u admin:admin123 http://localhost:4000/api/datasources/1/health
```

---

## 📝 Loki & Promtail

### LogQL Queries

```logql
# Toate logs de la app
{container="geniuserp-app"}

# Logs cu ERROR
{container="geniuserp-app"} |= "ERROR"

# Logs cu ERROR sau WARN
{container="geniuserp-app"} |~ "ERROR|WARN"

# Logs fără health checks
{container="geniuserp-app"} != "/health"

# Rate de erori
rate({container="geniuserp-app"} |= "ERROR" [5m])

# Count by level
sum(count_over_time({container="geniuserp-app"} |= "ERROR" [1h]))

# Logs de la Falco
{job="falco"}

# Logs de la Wazuh
{job="wazuh-manager"}

# Logs din ultimele 15 minute cu ERROR
{container="geniuserp-app"} |= "ERROR" | __timestamp__ >= now() - 15m
```

### Promtail Management

```bash
# Check Promtail logs
docker logs geniuserp-promtail

# Verify Promtail is scraping
curl http://localhost:9080/metrics | grep promtail

# Reload config
docker-compose restart promtail
```

---

## 🛡️ Falco

### Monitoring

```bash
# Live logs
docker logs -f geniuserp-falco

# Filter warnings only
docker logs geniuserp-falco 2>&1 | grep -i warning

# Filter critical alerts
docker logs geniuserp-falco 2>&1 | grep -i critical

# JSON formatted logs
docker logs geniuserp-falco 2>&1 | jq '.'
```

### Trigger Tests

```bash
# Test 1: Read sensitive file
docker exec -it geniuserp-app cat /etc/shadow

# Test 2: Write to /etc (should be blocked)
docker exec -it geniuserp-app touch /etc/test-file

# Test 3: Unexpected shell spawn
docker exec -it geniuserp-app /bin/sh -c "whoami"

# Test 4: Network activity
docker exec -it geniuserp-app nc -v google.com 443
```

---

## 🛡️ Wazuh

### Management

```bash
# Check Wazuh manager status
docker exec -it geniuserp-wazuh-manager /var/ossec/bin/wazuh-control status

# Restart Wazuh manager
docker exec -it geniuserp-wazuh-manager /var/ossec/bin/wazuh-control restart

# Check active agents
docker exec -it geniuserp-wazuh-manager /var/ossec/bin/agent_control -l

# View Wazuh manager logs
docker exec -it geniuserp-wazuh-manager tail -f /var/ossec/logs/ossec.log

# Check indexer status
curl -X GET "http://localhost:9200/_cat/health?v"

# Check indices
curl -X GET "http://localhost:9200/_cat/indices?v"
```

### API Usage

```bash
# Get API token
curl -u wazuh-wui:MyS3cr37P450r.*- -k -X POST \
  "https://localhost:55000/security/user/authenticate" \
  | jq -r '.data.token'

# Use token (replace TOKEN)
TOKEN="your-token-here"

# Get agents list
curl -k -X GET "https://localhost:55000/agents" \
  -H "Authorization: Bearer $TOKEN" | jq

# Get security events
curl -k -X GET "https://localhost:55000/security/events" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 🔍 Trivy

### Scanning

```bash
# Full scan
npm run scan:vulnerabilities

# Scan Docker image
npm run scan:image

# Scan filesystem
npm run scan:fs

# Detailed JSON report
docker run --rm -v $(pwd):/app \
  aquasec/trivy:latest fs \
  --format json --output /app/trivy-report.json /app

# Only show CRITICAL
docker run --rm -v $(pwd):/app \
  aquasec/trivy:latest fs \
  --severity CRITICAL /app

# Scan specific package-lock.json
docker run --rm -v $(pwd):/app \
  aquasec/trivy:latest fs \
  --scanners vuln /app/package-lock.json

# Scan with SBOM output
docker run --rm -v $(pwd):/app \
  aquasec/trivy:latest fs \
  --format cyclonedx --output /app/sbom.json /app
```

### Ignore False Positives

Creează `.trivyignore`:
```bash
cat > .trivyignore << 'EOF'
# Ignore specific CVE
CVE-2021-12345

# Ignore with expiration
CVE-2021-67890 exp:2025-12-31
EOF
```

---

## 🎯 Sentry

### Testing

```bash
# Backend error test
docker exec -it geniuserp-app node -e "
  const Sentry = require('@sentry/node');
  Sentry.captureException(new Error('Test Backend Error'));
  setTimeout(() => console.log('Sent to Sentry'), 2000);
"

# Frontend error test (în browser console)
# F12 → Console:
import('@sentry/react').then(Sentry => {
  Sentry.captureException(new Error('Test Frontend Error'));
});
```

### Capture Custom Events

Backend:
```typescript
import { captureException, captureMessage } from './server/middlewares/sentry.middleware';

// Capture exception
try {
  // code
} catch (error) {
  captureException(error, { userId: '123', action: 'payment' });
}

// Capture message
captureMessage('Payment processed successfully', 'info');
```

Frontend:
```typescript
import { captureException, setUser } from './client/src/lib/sentry';

// Set user context
setUser({
  id: '123',
  email: 'user@example.com',
  username: 'johndoe'
});

// Capture exception
captureException(new Error('Something went wrong'));
```

---

## ✨ ESLint

### Linting

```bash
# Lint all files
npm run lint

# Lint specific directory
npx eslint server/
npx eslint client/src/

# Lint specific file
npx eslint server/index.ts

# Fix automatically
npm run lint:fix

# Fix specific file
npx eslint --fix server/index.ts

# Show warnings and errors separately
npm run lint -- --quiet  # Only errors
npm run lint -- --max-warnings 0  # Treat warnings as errors

# Generate HTML report
npx eslint . --ext .ts,.tsx --format html --output-file eslint-report.html
open eslint-report.html

# Generate JSON report
npm run lint:report
cat eslint-report.json | jq '.[] | select(.errorCount > 0)'
```

### Pre-commit Hook

Instalează Husky pentru auto-lint:
```bash
npm install --save-dev husky lint-staged

# Setup husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npx lint-staged"

# Configure lint-staged în package.json
cat >> package.json << 'EOF'
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "git add"]
  }
}
EOF
```

---

## 🔧 Maintenance

### Backup

```bash
# Backup toate volumes
docker run --rm \
  -v geniuserp_prometheus_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/prometheus-$(date +%Y%m%d).tar.gz -C /data .

docker run --rm \
  -v geniuserp_grafana_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/grafana-$(date +%Y%m%d).tar.gz -C /data .

docker run --rm \
  -v geniuserp_loki_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/loki-$(date +%Y%m%d).tar.gz -C /data .
```

### Restore

```bash
# Restore Grafana
docker run --rm \
  -v geniuserp_grafana_data:/data \
  -v $(pwd)/backups:/backup \
  alpine sh -c "cd /data && tar xzf /backup/grafana-20241012.tar.gz"

docker-compose restart grafana
```

### Cleanup

```bash
# Remove unused containers
docker container prune -f

# Remove unused images
docker image prune -a -f

# Remove unused volumes
docker volume prune -f

# Remove ALL unused data
docker system prune -a --volumes -f

# Check disk space saved
docker system df
```

---

## 📊 Health Checks

### Quick Status Check

```bash
#!/bin/bash
# save as check-health.sh

echo "🏥 GeniusERP Health Check"
echo "========================"

# App health
echo -n "App: "
curl -s http://localhost:5000/health | jq -r '.status' || echo "❌ DOWN"

# Prometheus
echo -n "Prometheus: "
curl -s http://localhost:9090/-/healthy && echo "✅ UP" || echo "❌ DOWN"

# Grafana
echo -n "Grafana: "
curl -s http://localhost:4000/api/health | jq -r '.database' || echo "❌ DOWN"

# Loki
echo -n "Loki: "
curl -s http://localhost:3100/ready && echo "✅ UP" || echo "❌ DOWN"

# Wazuh Indexer
echo -n "Wazuh Indexer: "
curl -s http://localhost:9200/_cluster/health | jq -r '.status' || echo "❌ DOWN"

echo ""
echo "Docker Containers:"
docker-compose ps | grep -E 'Up|Restarting|Exit'
```

```bash
chmod +x check-health.sh
./check-health.sh
```

---

## 🚨 Emergency Procedures

### Complete Reset

```bash
# ⚠️ ATENȚIE: Acest lucru va șterge TOATE datele!

# 1. Stop toate serviciile
docker-compose down -v

# 2. Șterge toate imagini GeniusERP
docker images | grep geniuserp | awk '{print $3}' | xargs docker rmi -f

# 3. Curăță sistem
docker system prune -a --volumes -f

# 4. Rebuild de la zero
docker-compose build --no-cache
docker-compose up -d

# 5. Verifică
docker-compose ps
```

### Service-Specific Reset

```bash
# Reset Grafana (pierdere dashboards!)
docker-compose down grafana
docker volume rm geniuserp_grafana_data
docker-compose up -d grafana

# Reset Prometheus (pierdere metrici istorice!)
docker-compose down prometheus
docker volume rm geniuserp_prometheus_data
docker-compose up -d prometheus

# Reset Wazuh (pierdere evenimente securitate!)
docker-compose down wazuh-indexer wazuh-manager wazuh-dashboard
docker volume rm geniuserp_wazuh_indexer_data geniuserp_wazuh_manager_data
docker-compose up -d wazuh-indexer wazuh-manager wazuh-dashboard
```

---

## 📖 Documentation Links

- Main Guide: [MONITORING-SECURITY-GUIDE.md](./MONITORING-SECURITY-GUIDE.md)
- Quick Start: [QUICK-START-TESTING.md](./QUICK-START-TESTING.md)
- Main README: [README.md](./README.md)

---

**💡 Tip:** Salvează această pagină în bookmarks pentru acces rapid la comenzi!

