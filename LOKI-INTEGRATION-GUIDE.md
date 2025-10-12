# 🔍 **LOKI INTEGRATION - DOCUMENTAȚIE COMPLETĂ**

## **📋 Ce am implementat**

### **1. Docker Compose - TOATE serviciile monitorizate**

✅ **Development** (`docker-compose.yml`):
- `geniuserp-app` - Aplicația principală
- `postgres` - Database
- `adminer` - DB Admin
- `prometheus` - Metrics
- `grafana` - Dashboards
- `loki` - Log aggregation
- `promtail` - Log collector
- `falco` - Security monitoring

✅ **Production** (`docker-compose.prod.yml`):
- Toate serviciile de mai sus
- `nginx` - Reverse proxy
- `db-backup` - Database backup service
- `wazuh-indexer`, `wazuh-manager`, `wazuh-dashboard` - SIEM (când activat)

### **2. Node.js/Express Application Logging**

✅ **Winston + Loki Transport** instalat:
```bash
npm install winston winston-loki
```

✅ **Logger Central** creat în `server/common/logger/loki-logger.ts`:
- Winston logger cu transport Loki
- Console output pentru development
- Structured logging cu context
- Module-based logging
- Automatic error tracking

✅ **Middleware-uri integrate**:
- `loggingMiddleware` - Loghează toate request-urile HTTP
- Integrat în `server/index.ts` și `server/modules/index.ts`

### **3. Bash Scripts** Integration

✅ **Loki Logger** pentru bash scripts (`scripts/loki-logger.sh`):
- Funcții: `log_info`, `log_warning`, `log_error`
- Helper functions: `log_backup`, `log_deploy`
- Query helper: `query_script_logs`

✅ **Scripts modificate**:
- `db-backup.sh` - Loghează backup operations
- `db-restore.sh` - Loghează restore operations
- `deploy-with-credentials.sh` - Loghează deployment
- `monitoring-health-check.sh` (NOU) - Health check complet cu Loki logging

---

## **🚀 Cum să folosești Loki în aplicație**

### **A. În TypeScript/Node.js**

#### **1. Import Logger în modul tău:**

```typescript
import { createModuleLogger } from '../common/logger/loki-logger';

const logger = createModuleLogger('numele-modulului-tau');
```

#### **2. Folosește logger-ul:**

```typescript
// Info
logger.info('Operațiune reușită', { userId: 123, action: 'create' });

// Warning
logger.warn('Utilizator aproape de limită', { userId: 123, limit: 100 });

// Error (cu Error object)
try {
  // cod
} catch (error) {
  logger.error('Eroare la procesare', error, { userId: 123 });
}

// Debug (doar în development)
logger.debug('Debug info', { detail1: 'value1' });
```

#### **3. Log Business Operations:**

```typescript
import { logOperation } from '../common/logger/loki-logger';

// Start operation
logOperation('create-invoice', 'start', { invoiceId: 'INV-123', companyId: 1 });

// Success
logOperation('create-invoice', 'success', { invoiceId: 'INV-123', amount: 1000 });

// Error
logOperation('create-invoice', 'error', { invoiceId: 'INV-123', reason: 'validation failed' });
```

### **B. În Bash Scripts**

```bash
#!/bin/bash

# Încarcă Loki Logger
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/loki-logger.sh"

# Folosește funcțiile
log_info "Script pornit"
log_warning "Atenție: spațiu pe disk scăzut"
log_error "Eroare critică"

# Pentru operațiuni specifice
log_backup "start" "Database: geniuserp"
# ... cod backup ...
log_backup "success" "File: backup.sql.gz, Size: 50MB"

# Query logs
query_script_logs 10  # Ultimele 10 loguri ale acestui script
```

---

## **📊 Cum să cauți loguri în Loki**

### **1. În Grafana (CEL MAI UȘOR)**

```
http://localhost:4000
User: admin
Pass: admin123
```

**Dashboards disponibile:**
- 📋 **Loguri & Erori Aplicație** - Vezi toate erorile
- 🐳 **Docker & Containere** - Loguri per container
- 🛡️ **Securitate** - Evenimente Falco

**Folosește "Explore":**
1. Click pe "Explore" (iconița busola) în sidebar
2. Selectează "Loki" ca datasource
3. Scrie query și rulează

### **2. LogQL - Limbajul de query Loki**

#### **Query-uri de bază:**

```logql
# Toate logurile aplicației
{job="geniuserp-app"}

# Doar erori
{job="geniuserp-app"} |= "error"
{job="geniuserp-app"} |~ "(?i)error"  # case insensitive

# Loguri dintr-un modul specific
{job="geniuserp-app",module="invoicing"}

# Loguri dintr-un bash script
{job="bash-scripts",script="db-backup"}

# Exclude INFO messages
{job="geniuserp-app"} != "info"

# Combinații complexe
{job="geniuserp-app"} |~ "(?i)(error|warn)" != "connection refused"
```

#### **Query-uri avansate:**

```logql
# Numărul de erori pe oră
sum(count_over_time({job="geniuserp-app"} |~ "(?i)error"[1h]))

# Erori grupate pe modul
sum by(module) (count_over_time({job="geniuserp-app"} |= "error"[1h]))

# Backup operations reușite
{job="bash-scripts",operation="backup",status="success"}

# HTTP requests lente (> 1000ms)
{job="geniuserp-app"} |= "duration" | json | duration > 1000
```

### **3. Din Terminal (curl)**

```bash
# Labels disponibile
curl -s http://localhost:3100/loki/api/v1/labels | jq

# Jobs monitorizate
curl -s http://localhost:3100/loki/api/v1/label/job/values | jq

# Query loguri
curl -G "http://localhost:3100/loki/api/v1/query_range" \
  --data-urlencode 'query={job="geniuserp-app"} |= "error"' \
  --data-urlencode 'limit=10'
```

---

## **🔧 Configurare & Environment Variables**

### **Variabile de mediu pentru Loki Logger:**

```bash
# .env sau docker-compose.yml
LOKI_HOST=http://localhost:3100  # Default pentru dev
LOG_LEVEL=debug                  # info | debug | warn | error
NODE_ENV=development             # development | production
```

### **Locații importante:**

- **Logger central:** `server/common/logger/loki-logger.ts`
- **Middleware:** `server/middlewares/logging.middleware.ts`
- **Bash logger:** `scripts/loki-logger.sh`
- **Configurare Loki:** `monitoring/loki/loki-config.yml`
- **Configurare Promtail:** `monitoring/promtail/promtail-config.yml`

---

## **📈 Monitoring & Health Check**

### **Script complet de health check:**

```bash
./scripts/monitoring-health-check.sh
```

**Ce verifică:**
- ✅ Status toate serviciile
- 📊 Metrici Prometheus active
- 🔍 Loguri Loki (câte job-uri monitorizează)
- ⚠️ Erori în ultima oră
- 📈 Utilizare resurse Docker

### **Query logs din script:**

```bash
./scripts/monitoring-health-check.sh --show-logs
```

---

## **🎯 Best Practices**

### **1. Folosește Module Loggers**

```typescript
// ❌ NU folosi console.log
console.log('User created');

// ✅ Folosește logger cu modul
const logger = createModuleLogger('users');
logger.info('User created', { userId: 123 });
```

### **2. Adaugă Context**

```typescript
// ❌ NU - fără context
logger.error('Eroare');

// ✅ DA - cu context
logger.error('Eroare la creare invoice', error, {
  userId: req.user.id,
  companyId: req.user.companyId,
  invoiceData: invoice,
});
```

### **3. Folosește Niveluri Corecte**

- **`debug`**: Informații pentru debugging (doar în development)
- **`info`**: Operațiuni normale, flow-ul aplicației
- **`warn`**: Situații anormale dar nedeclective
- **`error`**: Erori care necesită atenție

### **4. Log Operations Importante**

```typescript
// Business operations
logOperation('anaf-sync', 'start', { companyId: 1 });
// ... cod ...
logOperation('anaf-sync', 'success', { companiesProcessed: 10 });
```

---

## **🐛 Debugging cu Loki**

### **Scenariu 1: Aplicația crashuiește**

```logql
# Vezi ultimele 100 erori
{job="geniuserp-app"} |= "error" | tail 100

# Vezi stack traces
{job="geniuserp-app"} |= "stack"
```

### **Scenariu 2: Request lent**

```logql
# Vezi toate request-urile cu durata lor
{job="geniuserp-app"} |= "duration" | json | duration > 500
```

### **Scenariu 3: ANAF sync nu merge**

```logql
{job="geniuserp-app",module="integrations"} |~ "(?i)anaf"
```

### **Scenariu 4: Vezi logs dintr-un backup**

```logql
{job="bash-scripts",script="db-backup"} | json
```

---

## **✅ Checklist Integrare Completă**

- [x] Winston + winston-loki instalat
- [x] Logger central creat
- [x] Middleware de logging adăugat în Express
- [x] server/index.ts modificat să folosească logger
- [x] server/modules/index.ts modificat să folosească logger
- [x] Loki labels adăugate în TOATE serviciile docker-compose
- [x] Bash logger creat pentru scripturi
- [x] db-backup.sh integrat cu Loki
- [x] db-restore.sh integrat cu Loki
- [x] deploy-with-credentials.sh integrat cu Loki
- [x] monitoring-health-check.sh creat cu Loki support
- [x] 9 Dashboard-uri Grafana create și funcționale
- [x] Documentație completă

---

## **🎊 URMĂTORII PAȘI**

### **Pentru a integra în restul modulelor:**

1. **Înlocuiește console.log în module importante:**
   ```typescript
   // În fiecare modul major (invoicing, accounting, crm, etc.)
   import { createModuleLogger } from '../common/logger/loki-logger';
   const logger = createModuleLogger('nume-modul');
   
   // Înlocuiește console.log cu logger.info
   // Înlocuiește console.error cu logger.error
   ```

2. **Adaugă business metrics tracking:**
   ```typescript
   import { logOperation } from '../common/logger/loki-logger';
   
   logOperation('create-invoice', 'success', { invoiceId, amount });
   ```

3. **Query și analizează logs:**
   - Deschide Grafana: http://localhost:4000
   - Mergi la Explore
   - Caută pattern-uri în loguri
   - Creează alerte pentru erori critice

---

## **📞 Quick Reference**

| Task | Command/URL |
|------|-------------|
| Grafana Dashboards | http://localhost:4000 (admin:admin123) |
| Prometheus | http://localhost:9090 |
| Loki Query API | http://localhost:3100 |
| Health Check | `./scripts/monitoring-health-check.sh` |
| Query Logs (Terminal) | `curl -G http://localhost:3100/loki/api/v1/query_range --data-urlencode 'query={job="geniuserp-app"}'` |
| Import Logger | `import { createModuleLogger } from '../common/logger/loki-logger'` |
| Bash Logger | `source ./scripts/loki-logger.sh` |

---

**🎉 LOKI ESTE COMPLET INTEGRAT ÎN TOATĂ APLICAȚIA!**

