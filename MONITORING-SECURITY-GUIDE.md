# 🛡️ Ghid Monitoring, Securitate și Calitate - GeniusERP

Acest document descrie toate instrumentele de monitoring, securitate și calitate integrate în aplicația GeniusERP și cum să le folosești.

## 📋 Cuprins

1. [Overview](#overview)
2. [Monitoring Stack](#monitoring-stack)
   - [Prometheus](#prometheus)
   - [Grafana](#grafana)
   - [Loki & Promtail](#loki--promtail)
3. [Security Stack](#security-stack)
   - [Falco](#falco)
   - [Wazuh](#wazuh)
   - [Trivy](#trivy)
4. [Quality Stack](#quality-stack)
   - [Sentry](#sentry)
   - [ESLint](#eslint)
5. [Configurare Inițială](#configurare-inițială)
6. [Ghid de Utilizare](#ghid-de-utilizare)
7. [Troubleshooting](#troubleshooting)

---

## Overview

GeniusERP integrează un stack complet de instrumente pentru:
- **Monitoring**: Metrici în timp real, dashboards și alerte
- **Logging**: Agregare centralizată de logs
- **Securitate**: Detectare intruziuni, scanare vulnerabilități
- **Calitate**: Error tracking și static code analysis

### Arhitectura Serviciilor

```
┌─────────────────────────────────────────────────────────┐
│                    GeniusERP Stack                      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐    ┌──────────┐    ┌──────────────┐  │
│  │ Application │ -> │ Metrics  │ -> │  Prometheus  │  │
│  │   (Node)    │    │Middleware│    │              │  │
│  └─────────────┘    └──────────┘    └──────┬───────┘  │
│         │                                   │          │
│         │ logs                              │ metrics  │
│         v                                   v          │
│  ┌─────────────┐    ┌──────────┐    ┌──────────────┐  │
│  │  Promtail   │ -> │   Loki   │    │   Grafana    │  │
│  │             │    │          │<-->│ (Dashboards) │  │
│  └─────────────┘    └──────────┘    └──────────────┘  │
│                                                         │
│  ┌─────────────┐    ┌──────────┐    ┌──────────────┐  │
│  │    Falco    │ -> │  Wazuh   │ -> │   Wazuh      │  │
│  │ (Runtime)   │    │ Manager  │    │  Dashboard   │  │
│  └─────────────┘    └──────────┘    └──────────────┘  │
│                                                         │
│  ┌─────────────┐    ┌──────────┐                      │
│  │   Trivy     │    │  Sentry  │                      │
│  │  (Vuln)     │    │ (Errors) │                      │
│  └─────────────┘    └──────────┘                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔍 Monitoring Stack

### Prometheus

**Ce face:** Colectează metrici din aplicație (CPU, memorie, request rate, error rate, latency)

**Acces:** http://localhost:9090

**Metrici disponibile:**
- `geniuserp_process_*` - Metrici proces Node.js
- `geniuserp_http_request_duration_seconds` - Latency HTTP requests
- `geniuserp_http_requests_total` - Total requests
- `geniuserp_http_request_errors_total` - Total errors

**Exemple query-uri:**
```promql
# Request rate per second
rate(geniuserp_http_requests_total[5m])

# Error rate
rate(geniuserp_http_request_errors_total[5m])

# P95 latency
histogram_quantile(0.95, rate(geniuserp_http_request_duration_seconds_bucket[5m]))

# Memory usage
process_resident_memory_bytes / 1024 / 1024
```

### Grafana

**Ce face:** Vizualizează metrici și logs într-un dashboard interactive

**Acces:** http://localhost:4000
**Credențiale:** admin / admin123

**Configurare inițială:**
1. Deschide Grafana la http://localhost:4000
2. Login cu admin/admin123
3. Datasource-urile (Prometheus și Loki) sunt deja configurate automat
4. Creează dashboard-uri:
   - Click pe "+" → "Dashboard" → "Add new panel"
   - Selectează Prometheus ca datasource
   - Adaugă query-uri pentru metrici

**Dashboard-uri recomandate:**
- **Application Overview**: Request rate, error rate, latency
- **System Resources**: CPU, memory, disk usage
- **Logs Explorer**: Vizualizare și filtrare logs

**Configurare alerte:**
1. În panel, click pe "Alert" tab
2. Configurează condiția (ex: error rate > 10%)
3. Adaugă notification channel (email, Slack, etc.)

### Loki & Promtail

**Ce face:** Agregare centralizată de logs de la toate containerele

**Acces:** Prin Grafana → Explore → Loki datasource

**Query logs:**
```logql
# Toate logs de la app
{container="geniuserp-app"}

# Filtrare după nivel
{container="geniuserp-app"} |= "ERROR"

# Rate de erori
rate({container="geniuserp-app"} |= "ERROR" [5m])

# Logs din Falco
{job="falco"}

# Logs din Wazuh
{job="wazuh-manager"}
```

**Exemplu utilizare:**
1. Deschide Grafana → Explore
2. Selectează Loki
3. Folosește query: `{container="geniuserp-app"} |= "ERROR"`
4. Vizualizează logs în timp real

---

## 🛡️ Security Stack

### Falco

**Ce face:** Monitorizare runtime security - detectează comportamente suspecte în containere

**Monitorizare:**
```bash
# Vezi logs Falco
docker logs -f geniuserp-falco

# Sau în Grafana Loki
{job="falco"}
```

**Teste:**
```bash
# Trigger alert: citește fișier sensibil
docker exec -it geniuserp-app cat /etc/shadow

# Falco va detecta și va genera alert
```

**Reguli custom:** Editează `monitoring/falco/falco_rules_custom.yaml`

### Wazuh

**Ce face:** SIEM complet - Security Information and Event Management

**Acces:** https://localhost:9443
**Credențiale:** admin / SecretPassword

**Componente:**
- **Wazuh Indexer**: OpenSearch pentru stocare evenimente (port 9200)
- **Wazuh Manager**: Procesare și analiză (ports 1514, 1515, 55000)
- **Wazuh Dashboard**: UI pentru vizualizare

**Configurare inițială:**
1. Accesează https://localhost:9443
2. Accept self-signed certificate
3. Login cu admin/SecretPassword
4. Explorează Security Events, File Integrity, Vulnerability Detection

**Integrare Falco → Wazuh:**
Falco trimite events prin syslog către Wazuh Manager (port 1514)

**Alerting:**
- Configurează în Settings → Modules → Notifications
- Suportă email, Slack, webhooks

### Trivy

**Ce face:** Scanează vulnerabilități în imagini Docker și dependențe

**Utilizare:**

```bash
# Scanare completă (imagine + filesystem)
npm run scan:vulnerabilities

# Doar imagine Docker
npm run scan:image

# Doar filesystem (dependențe npm)
npm run scan:fs

# Raport JSON
docker run --rm -v $(pwd):/app aquasec/trivy:latest fs \
  --format json --output /app/trivy-report.json /app
```

**Interpretare rezultate:**
- **CRITICAL**: Patch imediat
- **HIGH**: Patch în max 7 zile
- **MEDIUM**: Planifică patch
- **LOW**: Informativ

**Automatizare:**
Adaugă în CI/CD pipeline pentru scanare la fiecare build.

---

## ✨ Quality Stack

### Sentry

**Ce face:** Error tracking și performance monitoring pentru frontend și backend

**Setup:**

1. **Creează cont pe Sentry.io:**
   - Vizitează https://sentry.io și creează cont gratuit
   - Creează un proiect pentru "Node.js" (backend)
   - Creează un proiect pentru "React" (frontend)
   - Copiază DSN pentru fiecare

2. **Configurează .env:**
   ```bash
   SENTRY_DSN=https://your-backend-key@o123456.ingest.sentry.io/123456
   VITE_SENTRY_DSN=https://your-frontend-key@o123456.ingest.sentry.io/123456
   ```

3. **Restart aplicația:**
   ```bash
   docker-compose up -d --build
   ```

**Testare:**

Backend:
```typescript
// Trigger manual error
import { captureException } from './server/middlewares/sentry.middleware';
captureException(new Error('Test error from backend'));
```

Frontend:
```typescript
// Trigger manual error
import { captureException } from './client/src/lib/sentry';
captureException(new Error('Test error from frontend'));
```

**Utilizare:**
- Dashboard Sentry va arăta toate erorile
- Stack traces complete cu source maps
- Performance monitoring (request duration, etc.)
- Session replay pentru debugging frontend

### ESLint

**Ce face:** Analiză statică a codului pentru găsirea bug-uri și menținerea calității

**Utilizare:**

```bash
# Verifică toate fișierele
npm run lint

# Fix automat probleme
npm run lint:fix

# Generează raport JSON
npm run lint:report
```

**Configurare IDE:**
- VSCode: Instalează extensia "ESLint"
- Settings → Format on Save: Enable
- Erori vor apărea în timp real

**Reguli:**
- TypeScript best practices
- React hooks rules
- Unused variables warnings
- Console statements warnings

---

## ⚙️ Configurare Inițială

### 1. Copiază fișierul de environment

```bash
cp env.example.txt .env
```

### 2. Editează .env cu valorile tale

Esențiale:
- `SENTRY_DSN` și `VITE_SENTRY_DSN` (după crearea contului Sentry)
- `JWT_SECRET`, `JWT_REFRESH_SECRET`, `SESSION_SECRET` (generează valori sigure)
- `SMTP_*` pentru email notifications
- Alte secrets după necesitate

### 3. Start serviciile (Development)

```bash
# Start toate serviciile (primă dată va dura mai mult)
docker-compose up -d

# Verifică status
docker-compose ps

# Vezi logs
docker-compose logs -f
```

### 4. Start serviciile (Production)

```bash
# Folosește production config
docker-compose -f docker-compose.prod.yml up -d
```

### 5. Verifică accesul la UI-uri

- ✅ **Aplicație**: http://localhost:5000
- ✅ **Prometheus**: http://localhost:9090
- ✅ **Grafana**: http://localhost:4000 (admin/admin123)
- ✅ **Wazuh**: https://localhost:9443 (admin/SecretPassword)
- ✅ **Adminer**: http://localhost:8080

---

## 📖 Ghid de Utilizare

### Workflow Zilnic

1. **Dimineața - Health Check:**
   ```bash
   # Verifică servicii
   docker-compose ps
   
   # Quick metrics check
   curl http://localhost:5000/metrics
   
   # Health endpoint
   curl http://localhost:5000/health
   ```

2. **Monitoring activ:**
   - Deschide Grafana (http://localhost:4000)
   - Verifică dashboard-ul principal
   - Monitorizează error rate și latency

3. **La detectarea unei probleme:**
   - **Metrici**: Grafana → Găsește spike-ul
   - **Logs**: Grafana Explore → Loki → Filtrează după timestamp
   - **Errors**: Verifică Sentry pentru stack traces
   - **Security**: Wazuh Dashboard → Security Events

### Debugging Workflow

1. **Problema raportată:**
   - Check Sentry pentru error details
   - Check timestamp-ul erorii

2. **Context gathering:**
   - Grafana Loki: `{container="geniuserp-app"} |= "ERROR"`
   - Filter by timestamp
   - Check logs înainte/după eroare

3. **Metrics correlation:**
   - Verifică în Prometheus dacă e spike de CPU/memory
   - Verifică request rate la timpul erorii

4. **Security check:**
   - Wazuh → Check dacă e security event
   - Falco logs pentru runtime anomalies

### Alerting Strategy

**Critice (immediate):**
- Error rate > 5%
- Latency P95 > 2s
- Memory usage > 90%
- Security alerts (Falco/Wazuh)

**Warning (15 min):**
- Error rate > 1%
- Latency P95 > 1s
- Memory usage > 80%

**Info:**
- Deployment notifications
- Trivy vulnerabilities scans

---

## 🚨 Troubleshooting

### Serviciile nu pornesc

```bash
# Verifică logs pentru erori
docker-compose logs

# Verifică resurse Docker
docker system df

# Restart clean
docker-compose down -v
docker-compose up -d
```

### Wazuh nu pornește

Wazuh necesită multe resurse. Verifică:
```bash
# Verifică memory limit
docker stats

# Eventual mărește memory pentru Docker Desktop
# Settings → Resources → Memory: minim 8GB
```

### Prometheus nu scrape metrici

```bash
# Verifică endpoint metrici
curl http://localhost:5000/metrics

# Verifică targets în Prometheus
# http://localhost:9090/targets

# Verifică network connectivity
docker exec geniuserp-prometheus ping app
```

### Grafana nu vede datasources

```bash
# Verifică provisioning
docker exec geniuserp-grafana ls -la /etc/grafana/provisioning/datasources/

# Restart Grafana
docker-compose restart grafana
```

### Falco erori

Falco necesită privilegii:
```bash
# Verifică dacă rulează privileged
docker inspect geniuserp-falco | grep Privileged

# Check logs
docker logs geniuserp-falco
```

### Sentry nu trimite events

```bash
# Verifică DSN în environment
docker exec geniuserp-app env | grep SENTRY

# Test manual
# În cod, trigger o eroare test
```

---

## 📊 Best Practices

### Monitoring
- ✅ Creează dashboard-uri pentru fiecare microserviciu
- ✅ Setează alerte pentru metrici critice
- ✅ Review dashboards săptămânal pentru patterns
- ✅ Documentează incident-uri și RCA (Root Cause Analysis)

### Security
- ✅ Review Wazuh alerts zilnic
- ✅ Run Trivy scan la fiecare deploy
- ✅ Update Falco rules pentru use-cases specific
- ✅ Regular security audits

### Quality
- ✅ Fix Sentry errors în maxim 48h
- ✅ Run `npm run lint` înainte de commit
- ✅ Zero ESLint warnings în production
- ✅ Monitor error trends în Sentry

### Performance
- ✅ P95 latency < 500ms
- ✅ Error rate < 0.1%
- ✅ Memory usage stable (no leaks)
- ✅ Regular load testing

---

## 🔗 Resurse Utile

- **Prometheus**: https://prometheus.io/docs/
- **Grafana**: https://grafana.com/docs/
- **Loki**: https://grafana.com/docs/loki/
- **Falco**: https://falco.org/docs/
- **Wazuh**: https://documentation.wazuh.com/
- **Trivy**: https://aquasecurity.github.io/trivy/
- **Sentry**: https://docs.sentry.io/
- **ESLint**: https://eslint.org/docs/

---

## 🎯 Next Steps

1. **Săptămâna 1**: Familiarizare cu toate UI-urile
2. **Săptămâna 2**: Creează dashboard-uri custom în Grafana
3. **Săptămâna 3**: Configurează alerte critice
4. **Săptămâna 4**: Optimizează pe baza metricilor

---

**Notă**: Acest ghid este un document viu. Actualizează-l pe măsură ce descoperi best practices noi!

Pentru suport: neacsu.alex@gmail.com

