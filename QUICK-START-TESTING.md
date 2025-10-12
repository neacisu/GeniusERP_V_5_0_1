# 🚀 Quick Start - Testare Monitoring, Securitate, Calitate

Ghid rapid pentru testarea tuturor instrumentelor integrate în GeniusERP.

---

## 📋 Pre-requisites

```bash
# Asigură-te că ai Docker Desktop pornit
docker --version
docker-compose --version

# Configurează .env
cp env.example.txt .env
# Editează .env cu valorile tale (vezi secțiunea Sentry mai jos)
```

---

## Faza 1: Monitoring Stack ✅

### 1.1 Start serviciile

```bash
# Pornește toate serviciile (prima dată va dura ~5-10 minute)
docker-compose up -d

# Verifică status
docker-compose ps

# Toate serviciile ar trebui să fie "Up" sau "healthy"
```

### 1.2 Testare Prometheus

```bash
# Verifică endpoint metrici din aplicație
curl http://localhost:5000/metrics

# Ar trebui să vezi metrici precum:
# geniuserp_http_requests_total
# geniuserp_process_cpu_user_seconds_total
# etc.

# Deschide Prometheus UI
open http://localhost:9090
```

**În Prometheus UI:**
1. Click pe "Status" → "Targets"
2. Verifică că `geniuserp_app` target este **UP** (verde)
3. În query box, tastează: `geniuserp_http_requests_total`
4. Click "Execute" → Ar trebui să vezi date

### 1.3 Testare Grafana

```bash
# Deschide Grafana
open http://localhost:4000
```

**Login:** admin / admin123

**Test datasources:**
1. Click pe "⚙️" (Settings) → "Data sources"
2. Verifică **Prometheus** și **Loki** - ambele ar trebui să fie verzi (connected)

**Creează primul dashboard:**
1. Click "+" → "Dashboard" → "Add new panel"
2. În query box: `rate(geniuserp_http_requests_total[5m])`
3. Click "Apply" → "Save dashboard"
4. Numește: "GeniusERP Overview"

### 1.4 Testare Loki & Promtail

**În Grafana:**
1. Click pe "Explore" (🔍 icon din sidebar)
2. Selectează "Loki" din dropdown
3. În query builder:
   - Label: `container`
   - Value: `geniuserp-app`
4. Click "Run query"

**Ar trebui să vezi logs de la aplicație!**

**Testare filtrare:**
```logql
# Doar logs cu ERROR
{container="geniuserp-app"} |= "ERROR"

# Logs de la Falco (după ce pornești Falco în Faza 2)
{job="falco"}
```

**✅ Faza 1 completă dacă:**
- ✅ Prometheus UI arată target UP
- ✅ Grafana arată metrici
- ✅ Grafana arată logs din Loki

---

## Faza 2: Security Stack 🛡️

### 2.1 Start serviciile de securitate

Serviciile Falco și Wazuh sunt deja pornite din Faza 1. Dacă nu:

```bash
docker-compose up -d falco wazuh-indexer wazuh-manager wazuh-dashboard
```

**⚠️ Notă:** Wazuh necesită ~5 minute pentru prima pornire.

### 2.2 Testare Falco

```bash
# Verifică logs Falco
docker logs geniuserp-falco --tail 50

# Trigger un test alert: citește fișier sensibil
docker exec -it geniuserp-app cat /etc/shadow 2>/dev/null || echo "Alert triggered!"

# Verifică din nou logs - ar trebui să vezi un warning de la Falco
docker logs geniuserp-falco --tail 10
```

**Logs Falco în Grafana:**
1. Grafana → Explore → Loki
2. Query: `{job="falco"}`
3. Ar trebui să vezi alertele de securitate

### 2.3 Testare Wazuh

```bash
# Verifică status Wazuh
docker-compose ps | grep wazuh

# Deschide Wazuh Dashboard
open https://localhost:9443
```

**Login:** admin / SecretPassword

**⚠️ Ignore SSL warning** (self-signed certificate în development)

**În Wazuh Dashboard:**
1. Prima dată va lua ~30 secunde să se încarce
2. Click "Skip" pentru wizard
3. Navigate: "Security Events" → Dashboard
4. Ar trebui să vezi evenimente (chiar dacă sunt puține)

**Check integration:**
1. Click "Modules" → "Security events"
2. Filterează: Last 24 hours
3. Caută evenimente de la Falco (dacă ai făcut trigger-ul de mai sus)

### 2.4 Testare Trivy

```bash
# Scanare completă (va dura ~2-3 minute prima dată)
npm run scan:vulnerabilities

# Doar imagine Docker
npm run scan:image

# Doar filesystem
npm run scan:fs
```

**Interpretare rezultate:**
- Trivy va lista toate vulnerabilitățile găsite
- Focus pe **HIGH** și **CRITICAL**
- Pentru fiecare CVE, Trivy arată package-ul afectat și fix-ul disponibil

**✅ Faza 2 completă dacă:**
- ✅ Falco detectează și loghează evenimente suspecte
- ✅ Wazuh Dashboard se deschide și arată evenimente
- ✅ Trivy scanează și arată vulnerabilități

---

## Faza 3: Quality Stack ✨

### 3.1 Setup Sentry (One-time)

**Dacă NU ai cont Sentry:**

1. **Creează cont gratuit:**
   ```bash
   open https://sentry.io/signup/
   ```

2. **Creează 2 proiecte:**
   - Nume: "GeniusERP Backend" → Platformă: Node.js → Copiază DSN
   - Nume: "GeniusERP Frontend" → Platformă: React → Copiază DSN

3. **Editează .env:**
   ```bash
   nano .env
   # Sau folosește editorul preferat
   ```
   
   Adaugă:
   ```
   SENTRY_DSN=https://your-backend-key@o123456.ingest.sentry.io/123456
   VITE_SENTRY_DSN=https://your-frontend-key@o123456.ingest.sentry.io/123456
   ```

4. **Rebuild aplicația:**
   ```bash
   docker-compose up -d --build app
   ```

**⚠️ Dacă sari peste Sentry:**
- Aplicația va funcționa normal
- Va apărea warning în logs: "SENTRY_DSN nu este configurat"
- Error tracking va fi disabled

### 3.2 Testare Sentry

**Test Backend Error:**

```bash
# Trigger eroare test în backend
# Opțiunea 1: Direct în logs
docker exec -it geniuserp-app node -e "
  require('@sentry/node').captureException(new Error('Test Backend Error'));
  setTimeout(() => console.log('Done'), 2000);
"

# Opțiunea 2: Prin API (dacă ai endpoint de test)
curl -X POST http://localhost:5000/api/test/error
```

**Verifică în Sentry:**
1. Deschide https://sentry.io
2. Selectează proiectul "GeniusERP Backend"
3. În ~30 secunde, ar trebui să apară eroarea
4. Click pe eroare → Vezi stack trace complet

**Test Frontend Error:**

1. Deschide aplicația: http://localhost:5000
2. Deschide Console (F12)
3. Tastează:
   ```javascript
   import('@sentry/react').then(Sentry => {
     Sentry.captureException(new Error('Test Frontend Error'));
   });
   ```

**Verifică în Sentry:**
- Selectează "GeniusERP Frontend"
- Eroarea ar trebui să apară în ~30 secunde

### 3.3 Testare ESLint

```bash
# Rulează linting pe tot codul
npm run lint

# Vor apărea warning-uri și erori
# Exemplu output:
# server/index.ts
#   45:7  warning  'server' is assigned but never used  @typescript-eslint/no-unused-vars

# Fix automat ce poate fi fixed
npm run lint:fix

# Rulează din nou pentru a vedea ce a rămas
npm run lint

# Generează raport JSON
npm run lint:report
cat eslint-report.json | jq '.[] | select(.errorCount > 0) | .filePath'
```

**Integrare IDE (VSCode):**
1. Instalează extensia "ESLint"
2. Reload VSCode
3. Erorile vor apărea în fișiere automat (sublinii roșii/galbene)

**✅ Faza 3 completă dacă:**
- ✅ Sentry capturează erori din backend
- ✅ Sentry capturează erori din frontend
- ✅ ESLint rulează și detectează probleme

---

## 📊 Verificare Completă - All Systems Go!

După finalizarea tuturor fazelor:

```bash
# 1. Verifică toate serviciile sunt UP
docker-compose ps

# Output așteptat: ~15-17 containere "Up" sau "healthy"
# geniuserp-app, postgres, prometheus, grafana, loki, promtail, 
# falco, wazuh-indexer, wazuh-manager, wazuh-dashboard

# 2. Verifică health endpoint
curl http://localhost:5000/health
# Output: {"status":"ok","timestamp":"..."}

# 3. Verifică metrici
curl http://localhost:5000/metrics | head -20

# 4. Quick test toate UI-urile
open http://localhost:5000          # App
open http://localhost:4000          # Grafana
open http://localhost:9090          # Prometheus
open https://localhost:9443         # Wazuh
```

**Checklist Final:**
- [ ] Aplicația răspunde pe http://localhost:5000
- [ ] Prometheus arată target UP
- [ ] Grafana vizualizează metrici și logs
- [ ] Falco detectează events
- [ ] Wazuh Dashboard funcționează
- [ ] Trivy scanează vulnerabilități
- [ ] Sentry capturează erori (dacă configurat)
- [ ] ESLint rulează fără probleme

---

## 🎯 Next Steps

După testare:

1. **Creează dashboard-uri în Grafana**
   - Dashboard pentru Application Metrics
   - Dashboard pentru System Resources
   - Dashboard pentru Logs

2. **Configurează alerte**
   - Error rate > 5%
   - Latency > 1s
   - Memory usage > 90%

3. **Review Sentry**
   - Fix erori critice
   - Setup alert rules

4. **Security Review**
   - Review Wazuh events zilnic
   - Run Trivy scan săptămânal
   - Check Falco alerts

5. **Code Quality**
   - Fix ESLint warnings
   - Setup pre-commit hooks
   - CI/CD integration

---

## 🆘 Troubleshooting

### Serviciul X nu pornește

```bash
# Vezi logs detaliate
docker-compose logs <service-name>

# Exemple:
docker-compose logs grafana
docker-compose logs wazuh-manager

# Restart specific service
docker-compose restart <service-name>
```

### Wazuh foarte lent / nu pornește

Wazuh necesită multe resurse:
```bash
# Verifică resources
docker stats

# Mărește memory în Docker Desktop:
# Settings → Resources → Memory: minim 8GB
```

### Prometheus nu vede metrici

```bash
# Test direct endpoint
curl http://localhost:5000/metrics

# Verifică network
docker exec geniuserp-prometheus ping -c 3 app

# Restart Prometheus
docker-compose restart prometheus
```

### Toate serviciile sunt pornite dar ceva nu merge

```bash
# Nuclear option: restart tot
docker-compose down
docker-compose up -d

# Verifică logs
docker-compose logs -f --tail=100
```

---

## 📞 Suport

Pentru probleme sau întrebări:
- Email: neacsu.alex@gmail.com
- Documentație: [MONITORING-SECURITY-GUIDE.md](./MONITORING-SECURITY-GUIDE.md)

---

**🎉 Succes cu testarea!** 

Odată ce toate serviciile funcționează, ai un stack complet enterprise-grade de monitoring, securitate și calitate!

