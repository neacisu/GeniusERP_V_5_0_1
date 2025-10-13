# 🧪 GeniusERP - Sistem Complet de Testare

Sistem exhaustiv de testare pentru toate modulele GeniusERP cu orchestrator central, monitorizare în timp real și dashboard interactiv.

## 📋 Cuprins

- [Prezentare Generală](#prezentare-generală)
- [Arhitectură](#arhitectură)
- [Instalare](#instalare)
- [Utilizare](#utilizare)
- [Control Panel](#control-panel)
- [Dashboard Grafana](#dashboard-grafana)
- [Framework-uri de Testare](#framework-uri-de-testare)
- [Tipuri de Teste](#tipuri-de-teste)
- [API Reference](#api-reference)

## 🎯 Prezentare Generală

Sistemul de testare GeniusERP oferă:

- ✅ **21 Module** - Teste complete pentru toate modulele aplicației
- 🎮 **Control Panel** - Interfață web pentru control orchestrator
- 📊 **Dashboard Grafana** - Monitorizare în timp real
- 🔄 **Orchestrator Central** - Execuție paralelă și coordonată
- 📝 **Logging Avansat** - Winston + Loki integration
- 📈 **Metrics** - Prometheus pentru tracking performanță
- 🚨 **Alerting** - Notificări automate pentru eșecuri
- 🐛 **Sentry Integration** - Raportare erori în producție

## 🏗️ Arhitectură

```
utils/testing/
├── orchestrator.ts              # Orchestrator central
├── control-api.ts               # API pentru control start/stop
├── start-control-api.sh         # Script pornire API control
├── config/                      # Configurații framework-uri
│   ├── jest.config.ts
│   ├── vitest.config.ts
│   ├── mocha.config.js
│   ├── playwright.config.ts
│   ├── cypress.config.ts
│   ├── artillery.config.yml
│   ├── k6.config.js
│   └── jmeter.jmx
├── shared/                      # Utilități partajate
│   ├── test-types.ts
│   ├── test-helpers.ts
│   ├── logger.ts
│   ├── metrics.ts
│   └── sentry-reporter.ts
├── dashboard/                   # Dashboard și control
│   ├── test-dashboard.json      # Dashboard Grafana
│   ├── test-alerts.yml          # Configurație alerting
│   └── control-panel.html       # Control panel web
├── modules/                     # Teste per modul
│   ├── admin/
│   ├── accounting/
│   ├── auth/
│   └── ... (21 module total)
├── logs/                        # Log-uri teste
├── reports/                     # Rapoarte generate
└── coverage/                    # Coverage reports
```

## 📦 Instalare

### 1. Instalare Dependencies

```bash
cd /Users/alexneacsu/Projects/GeniusERP/GeniusERP_V_5

# Instalare dependencies pentru testare
npm install --save-dev \
  jest@^29.7.0 \
  vitest@^1.0.0 \
  mocha@^10.2.0 \
  chai@^4.3.10 \
  supertest@^6.3.3 \
  @playwright/test@^1.40.0 \
  cypress@^13.6.0 \
  @testing-library/react@^14.1.2 \
  @testing-library/jest-dom@^6.1.5 \
  @types/jest@^29.5.0 \
  @types/mocha@^10.0.0 \
  @types/chai@^4.3.0 \
  @types/supertest@^6.0.0 \
  jest-junit@^16.0.0

# Artillery pentru load testing
npm install -g artillery@latest

# http-server pentru serving control panel
npm install -g http-server
```

### 2. Configurare Environment

Creați fișier `.env` sau adăugați în `.env` existent:

```bash
# Test Control API
TEST_CONTROL_PORT=9091

# Metrics Server
METRICS_PORT=9090

# Loki URL
LOKI_URL=http://localhost:3100

# Sentry DSN (optional)
SENTRY_DSN=your-sentry-dsn-here

# Webhook pentru notificări (optional)
WEBHOOK_URL=https://hooks.slack.com/your-webhook

# Test Database
TEST_DATABASE_URL=postgresql://test:test@localhost:5432/geniuserp_test
```

### 3. Creare Directoare

```bash
cd utils/testing
mkdir -p logs reports coverage/{jest,vitest,mocha,playwright,cypress}
```

## 🚀 Utilizare

### Pornire Control API

```bash
cd utils/testing
./start-control-api.sh
```

Acest script pornește:
- Control API pe portul `9091`
- Control Panel web pe portul `9092`

### Pornire Orchestrator (CLI)

```bash
# Rulare toate testele
tsx orchestrator.ts --modules all --verbose --dashboard

# Rulare teste pentru module specifice
tsx orchestrator.ts --modules admin,accounting,auth --types unit,integration

# Rulare cu paralelism maxim
tsx orchestrator.ts --parallel 8 --verbose

# Rulare cu fail-fast
tsx orchestrator.ts --fail-fast --retry 2

# Rulare doar teste unit
tsx orchestrator.ts --types unit --parallel 6
```

#### Opțiuni CLI

| Opțiune | Descriere | Default |
|---------|-----------|---------|
| `-m, --modules <modules...>` | Module de testat | `all` |
| `-t, --types <types...>` | Tipuri teste (unit, integration, e2e, performance, security) | `all` |
| `-f, --frameworks <frameworks...>` | Framework-uri specifice | `all` |
| `-p, --parallel <number>` | Număr workers paraleli | `4` |
| `-v, --verbose` | Logging detaliat | `false` |
| `-d, --dashboard` | Actualizare live Grafana | `false` |
| `-r, --report <formats...>` | Formate export (json, html, xml) | `json,html` |
| `--fail-fast` | Oprire la primul test eșuat | `false` |
| `--retry <number>` | Număr reîncercări pentru teste failed | `0` |

## 🎮 Control Panel

Control Panel-ul oferă o interfață web pentru managementul testelor.

### Acces

Deschideți în browser: `http://localhost:9092/control-panel.html`

### Funcționalități

#### ▶️ Start Teste
- Configurare module, tipuri, paralelism
- Pornire automată orchestrator
- Feedback în timp real

#### ⏹️ Stop Teste
- Oprire graceful a orchestrator-ului
- Timeout 10s pentru force kill

#### 🔄 Restart
- Restart complet orchestrator
- Păstrare configurație

#### 🧹 Clear Logs
- Ștergere fișiere log
- Afișare spațiu eliberat

#### 📊 Reset Metrics
- Resetare toate metrics Prometheus
- Reinițializare counters și gauges

#### 🔄 Refresh Status
- Actualizare manuală status
- Update logs recent

### Screenshot Control Panel

```
┌─────────────────────────────────────────────────┐
│  🎮 GeniusERP Test Control Panel                │
│  Control Central pentru Orchestrator Teste      │
├─────────────────────────────────────────────────┤
│  Status: ● RUNNING                 Uptime: 5m  │
├─────────────────────────────────────────────────┤
│  [▶️ Start] [⏹️ Stop] [🔄 Restart]              │
│  [🧹 Clear Logs] [📊 Reset Metrics] [🔄 Refresh]│
├─────────────────────────────────────────────────┤
│  Configurație Teste:                            │
│  Module: admin, accounting                      │
│  Tipuri: ☑ Unit ☑ Integration ☐ E2E           │
│  Workers: 4                                     │
├─────────────────────────────────────────────────┤
│  📜 Recent Logs:                                │
│  [12:34:56] INFO  Test started...              │
│  [12:34:57] INFO  Module admin - 10/10 passed  │
│  [12:34:58] ERROR Test failed: connection...   │
└─────────────────────────────────────────────────┘
```

## 📊 Dashboard Grafana

### Import Dashboard

1. Deschide Grafana: `http://localhost:3000`
2. Navighează la **Dashboards** → **Import**
3. Upload `utils/testing/dashboard/test-dashboard.json`
4. Selectează datasources:
   - Prometheus: `prometheus`
   - Loki: `loki`

### Panouri Dashboard

#### 📈 Overview
- Total Teste
- Teste Passed
- Teste Failed
- Success Rate (gauge)
- Teste Active

#### 📊 Test Execution Rate
- Grafic time-series cu rata de execuție
- Passed vs Failed pe minut

#### 🥧 Teste per Modul
- Pie chart cu distribuția testelor
- Breakdown per modul

#### 📋 Status per Modul și Tip
- Tabel detaliat cu status
- Filtrare pe modul, tip, framework

#### ⏱️ Durata Teste
- Histogram cu p95 și p99
- Breakdown per modul

#### 📝 Test Errors (Loki)
- Live stream erori din Loki
- Filtrare pe severity

#### 💾 Utilizare Memorie
- Tracking memorie în timpul testelor
- Alert pentru > 2GB

#### 📜 Live Logs Stream
- Toate log-urile în timp real
- Filtrare și search

### Alerts Configurate

| Alert | Condiție | Severity |
|-------|----------|----------|
| High Failure Rate | > 10% teste failed | Warning |
| Critical Failure Rate | > 20% teste failed | Critical |
| Long Test Duration | p95 > 30s | Warning |
| High Memory Usage | > 2GB | Warning |
| Module Test Failure | > 5 failed în modul | Warning |
| No Active Tests | 0 teste active 15min | Info |
| High Timeout Rate | > 3 timeouts | Warning |
| Error Spike | Rate creștere bruscă | Critical |

## 🧰 Framework-uri de Testare

### Jest (Unit Tests - Services & Controllers)

```bash
# Rulare Jest
npm run test:jest

# Cu coverage
npm run test:jest -- --coverage

# Watch mode
npm run test:jest -- --watch
```

### Vitest (Unit Tests - Schema & Utils)

```bash
# Rulare Vitest
npm run test:vitest

# UI mode
npm run test:vitest -- --ui

# Coverage
npm run test:vitest -- --coverage
```

### Mocha + Chai (Integration Tests)

```bash
# Rulare Mocha
npm run test:mocha

# Specific file
npm run test:mocha -- utils/testing/modules/admin/integration/*.test.ts
```

### Playwright (E2E Tests - Cross-browser)

```bash
# Rulare Playwright
npm run test:playwright

# Specific browser
npm run test:playwright -- --project=chromium

# UI mode
npm run test:playwright -- --ui

# Debug mode
npm run test:playwright -- --debug
```

### Cypress (E2E Tests - UI)

```bash
# Rulare Cypress (headless)
npm run test:cypress

# Interactive mode
npm run test:cypress:open
```

### Artillery (Load Testing)

```bash
# Rulare Artillery
artillery run utils/testing/config/artillery.config.yml

# Cu report
artillery run --output report.json utils/testing/config/artillery.config.yml
artillery report report.json
```

### k6 (Stress Testing)

```bash
# Rulare k6
k6 run utils/testing/config/k6.config.js

# Cu output în InfluxDB
k6 run --out influxdb=http://localhost:8086/k6 utils/testing/config/k6.config.js
```

### JMeter (Endurance Testing)

```bash
# Rulare JMeter (CLI mode)
jmeter -n -t utils/testing/config/jmeter.jmx -l results.jtl

# Cu HTML report
jmeter -n -t utils/testing/config/jmeter.jmx -l results.jtl -e -o report/
```

## 📝 Tipuri de Teste

### Unit Tests
- Servicii: Logică business, metode individuale
- Controllers: Request handling, validări
- Schema: Validări Zod, transformări
- Utils: Funcții helper, formatări

### Integration Tests
- API Endpoints: Request/Response flow complet
- Database: Operații CRUD, transactions
- Auth Flow: Login, permissions, tokens
- Relații: Foreign keys, joins

### E2E Tests
- User Workflows: Fluxuri complete utilizator
- UI Interactions: Click, type, navigate
- Form Submissions: Validări, submit, feedback
- Multi-step Processes: Wizard-uri, checkout

### Performance Tests
- Load Testing: 100-1000 utilizatori concurenți
- Stress Testing: Până la breaking point
- Spike Testing: Creșteri bruște trafic
- Endurance Testing: Rulare 2-4 ore
- Response Time: Assertions pe latency

### Security Tests
- Authentication: Bypass attempts, brute force
- Authorization: RBAC, permissions
- Input Validation: XSS, SQL injection, CSRF
- Rate Limiting: DDoS protection
- Password Policies: Strength, expiry
- Token Security: JWT, refresh tokens

## 🔌 API Reference

### Control API

Base URL: `http://localhost:9091`

#### GET /health

Status health check API.

**Response:**
```json
{
  "status": "ok",
  "service": "test-control-api",
  "timestamp": "2025-10-13T10:30:00.000Z"
}
```

#### GET /status

Status curent orchestrator.

**Response:**
```json
{
  "status": "running",
  "pid": 12345,
  "lastStartTime": "2025-10-13T10:25:00.000Z",
  "lastStopTime": null,
  "uptime": 300000
}
```

#### POST /start

Pornește orchestrator-ul.

**Request Body:**
```json
{
  "modules": ["admin", "accounting"],
  "types": ["unit", "integration"],
  "parallel": 4,
  "verbose": true,
  "dashboard": true,
  "failFast": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Orchestrator pornit cu succes",
  "pid": 12345,
  "config": { ... },
  "startTime": "2025-10-13T10:25:00.000Z"
}
```

#### POST /stop

Oprește orchestrator-ul.

**Response:**
```json
{
  "success": true,
  "message": "Orchestrator oprit cu succes",
  "stopTime": "2025-10-13T10:30:00.000Z"
}
```

#### POST /restart

Restart orchestrator.

**Request Body:** (same as /start)

#### POST /clear-logs

Șterge log-urile.

**Response:**
```json
{
  "success": true,
  "message": "Logs șterse cu succes",
  "clearedFiles": 2,
  "freedSpace": "125.45 MB",
  "timestamp": "2025-10-13T10:30:00.000Z"
}
```

#### POST /clear-metrics

Resetează metrics Prometheus.

**Response:**
```json
{
  "success": true,
  "message": "Metrics resetate cu succes",
  "timestamp": "2025-10-13T10:30:00.000Z"
}
```

#### GET /metrics

Metrics în format Prometheus.

**Response:** (text/plain)
```
# HELP geniuserp_tests_total Total tests executed
# TYPE geniuserp_tests_total counter
geniuserp_tests_total{module="admin",test_type="unit"} 45
...
```

#### GET /logs?lines=100&type=all

Log-uri recente.

**Query Params:**
- `lines`: Număr linii (default: 100)
- `type`: all | errors (default: all)

**Response:**
```json
{
  "logs": [
    {
      "timestamp": "2025-10-13T10:30:00.000Z",
      "level": "info",
      "message": "Test started...",
      "module": "admin"
    }
  ],
  "total": 1250,
  "returned": 100,
  "file": "/path/to/logs/test-all.log"
}
```

#### POST /test/:module

Pornește teste pentru un modul specific.

**URL Params:**
- `module`: Numele modulului (admin, accounting, etc.)

**Request Body:**
```json
{
  "types": ["unit", "integration"],
  "parallel": 4
}
```

## 📚 Exemple

### Exemplu 1: Rulare Teste Admin Module

```bash
# CLI
tsx orchestrator.ts --modules admin --types all --verbose

# API
curl -X POST http://localhost:9091/test/admin \
  -H "Content-Type: application/json" \
  -d '{
    "types": ["unit", "integration", "security"],
    "parallel": 4
  }'
```

### Exemplu 2: Monitoring în Timp Real

1. Pornește Control API:
```bash
./start-control-api.sh
```

2. Pornește teste:
```bash
tsx orchestrator.ts --modules all --dashboard --verbose
```

3. Deschide dashboards:
- Control Panel: http://localhost:9092/control-panel.html
- Grafana: http://localhost:3000/d/geniuserp-tests
- Prometheus: http://localhost:9090/metrics

### Exemplu 3: CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: |
          cd utils/testing
          tsx orchestrator.ts \
            --modules all \
            --types unit,integration \
            --parallel 4 \
            --report json,xml \
            --fail-fast
      
      - name: Upload test results
        uses: actions/upload-artifact@v2
        with:
          name: test-results
          path: utils/testing/reports/
```

## 🐛 Troubleshooting

### Port-uri deja folosite

```bash
# Verifică ce proces folosește portul
lsof -i :9091

# Oprește procesul
kill $(lsof -t -i:9091)
```

### Erori de permisiuni

```bash
chmod +x utils/testing/*.sh
chmod +x utils/testing/orchestrator.ts
```

### Loki nu este disponibil

Verifică în logger.ts - sistemul va funcționa fără Loki, dar fără integrare.

```bash
# Pornește Loki (optional)
docker run -d -p 3100:3100 grafana/loki:latest
```

## 📄 Licență

MIT License - GeniusERP © 2025

