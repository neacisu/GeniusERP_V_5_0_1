# 📊 Integrarea Sentry în Grafana - Tutorial Complet

## ✅ Ce am configurat deja:

1. **Plugin Sentry** instalat în Grafana (`grafana-sentry-datasource`)
2. **Data source** Sentry configurat în Grafana provisioning
3. **Dashboard** pentru vizualizarea issues-urilor Sentry
4. **Docker Compose** actualizat cu variabila `SENTRY_AUTH_TOKEN`

---

## 🔑 PASUL 1: Obține Auth Token din Sentry

### 1.1. Accesează Sentry Settings

1. Intră în **Sentry Cloud**: https://sentry.io
2. Click pe **Settings** (iconița roată în stânga jos)
3. Navighează la: **Settings → Account → API → Auth Tokens**

### 1.2. Creează un nou Auth Token

1. Click pe **Create New Token**
2. Completează:
   - **Name**: `Grafana Integration`
   - **Scopes** (bifează următoarele):
     - ✅ `project:read` - Pentru a citi proiectele
     - ✅ `event:read` - Pentru a citi events
     - ✅ `org:read` - Pentru a citi organizația
     - ✅ `member:read` - Pentru a citi membri
3. Click pe **Create Token**
4. **IMPORTANT**: Copiază token-ul imediat! Nu îl vei mai putea vedea!

Token-ul arată astfel:
```
sntrys_eyJpYXQiOjE3MDkwNTk1NTguMDQ3MjM3LCJ1cmwiOiJodHRwczovL3NlbnRyeS5pbyIsInJlZ2lvbl91cmwiOiJodHRwczovL3VzLnNlbnRyeS5pbyIsIm9yZyI6InRlc3Qtb3JnIn0=_...
```

---

## 🔧 PASUL 2: Configurează Token-ul

### 2.1. Adaugă token-ul în `.env`

Deschide fișierul `.env` din root-ul proiectului și adaugă:

```bash
# Sentry Integration pentru Grafana
SENTRY_AUTH_TOKEN=sntrys_YOUR_ACTUAL_TOKEN_HERE
```

**Exemplu complet:**
```bash
# Sentry Error Tracking
SENTRY_DSN=https://fe5f285b776db82ae62e5e212697a0cd@o4510176750665728.ingest.de.sentry.io/4510178882486352
VITE_SENTRY_DSN=https://b3b51fa4a0f869e1c7d7e87654f21682@o4510176750665728.ingest.de.sentry.io/4510178883993648

# Sentry Integration pentru Grafana
SENTRY_AUTH_TOKEN=sntrys_eyJpYXQiOjE3MDkwNTk1NTguMDQ3MjM3...
```

### 2.2. Restart Docker Compose

Pentru a aplica noile configurații:

```bash
cd /Users/alexneacsu/Projects/GeniusERP/GeniusERP_V_5

# Oprește containers
docker-compose down

# Pornește din nou (va instala pluginul Sentry)
docker-compose up -d

# Verifică logurile Grafana
docker logs geniuserp-grafana -f
```

**Așteaptă** până vezi în logs:
```
✓ Plugin grafana-sentry-datasource installed successfully
```

---

## 📊 PASUL 3: Accesează Dashboard-ul Sentry în Grafana

### 3.1. Deschide Grafana

URL: **http://localhost:4000**

**Credențiale:**
- Username: `admin`
- Password: `admin123`

### 3.2. Verifică Data Source-ul Sentry

1. Navigează la: **Configuration → Data Sources**
2. Ar trebui să vezi:
   - ✅ **Prometheus** (default)
   - ✅ **Loki**
   - ✅ **Sentry** (nou!)

3. Click pe **Sentry** și verifică:
   - URL: `https://sentry.io`
   - Organization: `o4510176750665728`
   - Auth Token: configurat ✅

4. Click pe **Save & Test** → ar trebui să vezi: `✓ Data source is working`

### 3.3. Deschide Dashboard-ul Sentry

1. Navigează la: **Dashboards → Browse**
2. Găsește: **🔴 GeniusERP - Sentry Error Tracking**
3. Click pe el pentru a-l deschide

---

## 📈 CE VEDE DASHBOARD-UL SENTRY:

### **Panouri disponibile:**

#### **1. 🔴 Total Issues (24h)**
- Numărul total de erori din ultimele 24h
- Gauge cu threshold-uri (verde/roșu)

#### **2. 📊 Issues by Project**
- Distribuția erorilor pe proiecte
- Pie chart: Frontend vs Backend

#### **3. 👥 Affected Users**
- Câți utilizatori au fost afectați de erori
- Gauge cu threshold-uri

#### **4. ⚠️ Unresolved Issues**
- Issues-uri nerezolvate
- Alert automat dacă depășește 10

#### **5. 📈 Error Trend Over Time**
- Grafic cu evoluția erorilor în timp
- Compară Frontend vs Backend
- Afișează mean, max, last values

#### **6. 🚨 Top Issues (Unresolved)**
- Tabel cu cele mai frecvente erori
- Coloane: Title, Project, Location, Events, Users, Priority
- Color-coded după priority (red/orange/green)
- Sortare după frecvență

### **Features avansate:**

- ✅ **Auto-refresh** la 30 secunde
- ✅ **Time range picker**: poți selecta ultimele 1h, 6h, 24h, 7d
- ✅ **Project filter**: filtrează doar Frontend sau Backend
- ✅ **Click pe error**: te duce direct în Sentry la acel issue
- ✅ **Dark theme** pentru UI consistent

---

## 🎯 CAZURI DE UTILIZARE:

### **Monitoring în timp real:**

1. **Daily Standup:**
   - Verifică "Total Issues (24h)" - vezi dacă ai avut incidente
   - Uită-te la "Top Issues" - vezi ce trebuie prioritizat

2. **Post-deployment:**
   - Monitorizează "Error Trend Over Time" după deploy
   - Dacă vezi spike în erori → rollback!

3. **Performance Review:**
   - Compară Frontend vs Backend errors
   - Identifică punctele slabe

### **Alerting (configurabil):**

Poți crea **Grafana Alerts** pe baza datelor Sentry:

```
Alert: High Error Rate
Condition: Total Issues > 50 în ultima oră
Action: Send email/Slack notification
```

---

## 🔗 INTEGRARE ALTERNATIVĂ: Sentry Webhooks → Loki

Dacă vrei să trimiți issues-urile Sentry direct în **Loki** (pentru search avansată):

### 1. Creează un endpoint webhook în aplicație:

```typescript
// server/routes/sentry-webhook.route.ts
import { Router } from 'express';
import { createModuleLogger } from '../common/logger/loki-logger';

const router = Router();
const logger = createModuleLogger('sentry-webhook');

router.post('/webhook', (req, res) => {
  const sentryEvent = req.body;
  
  // Log în Loki
  logger.error('Sentry Issue', {
    issue_id: sentryEvent.id,
    title: sentryEvent.event?.title,
    project: sentryEvent.project?.name,
    level: sentryEvent.event?.level,
    url: sentryEvent.url,
  });
  
  res.status(200).json({ received: true });
});

export default router;
```

### 2. Configurează webhook în Sentry:

1. Sentry → **Settings → Integrations → Webhooks**
2. Add webhook: `https://your-domain.com/api/sentry/webhook`
3. Events: bifează `issue.created`, `issue.resolved`

### 3. Acum vezi issues-urile Sentry în Loki!

Query în Grafana:
```logql
{module="sentry-webhook"} | json | level="error"
```

---

## 🎓 BEST PRACTICES:

### **Securitate:**

✅ **Nu expune** `SENTRY_AUTH_TOKEN` în git
✅ Folosește **read-only** token (nu `admin` sau `write`)
✅ **Rotează** token-ul periodic (la 6 luni)

### **Performance:**

✅ Setează **refresh rate** la 30s (nu mai mic)
✅ Folosește **time range filters** pentru queries rapide
✅ **Limitează** numărul de panouri active (max 10)

### **Organizare:**

✅ **Tag-uiește** issues-urile în Sentry (ex: `module:accounting`)
✅ **Filtrează** în Grafana după tags
✅ **Creează** dashboard-uri separate pentru fiecare modul

---

## 📚 RESURSE UTILE:

- **Sentry Docs**: https://docs.sentry.io/product/integrations/data-visualization/grafana/
- **Grafana Sentry Plugin**: https://grafana.com/grafana/plugins/grafana-sentry-datasource/
- **Sentry API**: https://docs.sentry.io/api/

---

## 🐛 TROUBLESHOOTING:

### **Problema: Data source is not working**

**Soluție:**
1. Verifică că token-ul este valid în Sentry
2. Verifică că token-ul are scope-urile corecte
3. Restart Grafana: `docker-compose restart grafana`

### **Problema: No data în dashboard**

**Soluție:**
1. Verifică că ai issues în Sentry (rulează test-urile!)
2. Ajustează time range (ex: last 7 days)
3. Verifică filtrul de project

### **Problema: Plugin not found**

**Soluție:**
1. Verifică că `GF_INSTALL_PLUGINS` conține `grafana-sentry-datasource`
2. Rebuild Grafana: `docker-compose up -d --build grafana`
3. Verifică logs: `docker logs geniuserp-grafana`

---

## 🎉 NEXT STEPS:

După ce configurezi integrarea:

1. ✅ **Configurează alerte** în Grafana pentru erori critice
2. ✅ **Creează dashboard-uri** separate pentru fiecare modul
3. ✅ **Integrează** cu Slack/Email pentru notificări
4. ✅ **Monitorizează** performance metrics din Sentry

---

**Integrarea Sentry + Grafana îți oferă o viziune completă asupra sănătății aplicației tale!** 🚀

