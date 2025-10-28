# GeniusERP v5.2.0 🚀 - Dual-Server Architecture

**Enterprise Resource Planning System** - Sistem integrat de management pentru afaceri moderne

[![Version](https://img.shields.io/badge/version-5.2.0-blue.svg)](https://github.com/neacisu/GeniusERP_V_5_0_1)
[![Architecture](https://img.shields.io/badge/Architecture-Dual--Server-green.svg)]()
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-Cloud-red.svg)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)
[![Security](https://img.shields.io/badge/Security-Hardened-red.svg)]()
[![Tests](https://img.shields.io/badge/Tests-60%2F60%20PASS-brightgreen.svg)]()

## 🎯 Despre Proiect

GeniusERP este un sistem ERP modern și complet, dezvoltat pentru afaceri din România, cu suport nativ pentru:
- 📊 Contabilitate (ANAF integration)
- 👥 Resurse Umane (COR integration)
- 📦 Inventar & Logistică
- 💰 Facturare & Vânzări
- 🤝 CRM & Colaborare
- 📧 Marketing & Comunicare
- 🛍️ E-commerce
- 📄 Management Documente

## 🏗️ Arhitectură Dual-Server (v5.2.0)

### Ce este Dual-Server?

GeniusERP rulează acum pe **două servere separate** pentru securitate și scalabilitate maximă:

```
┌─────────────────────────────────────────────────────────┐
│                    Internet / Nginx                      │
└──────────────────┬──────────────────┬───────────────────┘
                   │                  │
         Frontend Routes        API Routes
              (/)                 (/api/*)
                   │                  │
         ┌─────────▼────────┐  ┌──────▼─────────┐
         │   FRONTEND       │  │    BACKEND     │
         │  Vite Server     │  │  Express API   │
         │   Port 5000      │  │   Port 5001    │
         └──────────────────┘  └────────┬───────┘
                                        │
                               ┌────────▼────────┐
                               │   PostgreSQL    │
                               │   Port 5432     │
                               │   (ISOLATED)    │
                               └─────────────────┘
```

### Beneficii Dual-Server

✅ **Securitate Sporită**: Frontend IZOLAT de database (defense in depth)  
✅ **Scalabilitate**: Ușor de separat pe servere diferite / datacentere  
✅ **Performance**: Specializare per server (static serving vs API logic)  
✅ **Monitoring**: Metrici separate pentru frontend și backend  
✅ **Development**: HMR independent pentru frontend  

### Cum Funcționează

**Development**:
```bash
./docker-dual-server.sh
# Frontend: http://localhost:5000
# Backend:  http://localhost:5001/api
```

**Production** (geniuserp.app):
```
https://geniuserp.app/          → Frontend (Vite)
https://geniuserp.app/api/*     → Backend (Express API)
```

### Multi-Network Security

Aplicația folosește **4 networks Docker izolate**:

- **app-network**: Frontend ↔ Backend communication
- **data-network**: Backend ↔ Postgres (ISOLATED - frontend blocked)
- **monitoring-network**: Prometheus, Grafana, Loki
- **security-network**: Falco, Wazuh

🔒 **CRITICAL**: Frontend NU poate accesa direct Postgres!

---

## ✨ Noutăți v5.2.0 (Dual-Server)

### 🏗️ Arhitectură Nouă
- ✅ **Frontend standalone** (Vite dev server pe port 5000)
- ✅ **Backend API separat** (Express pe port 5001)
- ✅ **Multi-network security** (4 networks izolate)
- ✅ **Volume separate** pentru node_modules (frontend + backend)
- ✅ **Nginx reverse proxy** configurat pentru geniuserp.app

### 🔒 Securitate Îmbunătățită
- ✅ **Network isolation**: Frontend blocat de database (CRITICAL)
- ✅ **OWASP Top 10**: Full compliance (10/10)
- ✅ **60/60 teste pass**: Comprehensive security testing
- ✅ **SSL/TLS 1.3**: Grade A/A+ (strong encryption)
- ✅ **HSTS preload**: Active pentru geniuserp.app

### 📦 Dependințe Actualizate
- ✅ **NX monorepo**: v21 → v22
- ✅ **Node.js**: 24.9.0 LTS
- ✅ **pnpm**: 10.19.0 (exclusiv)
- ✅ **Pachete deprecated**: Eliminate
- ✅ **Peer dependencies**: Toate rezolvate

### 🧪 Testing Comprehensive
- ✅ **Teste locale**: 30/30 pass
- ✅ **Teste externe**: 30/30 pass (geniuserp.app)
- ✅ **Penetration tests**: 0 vulnerabilități
- ✅ **Load testing**: 100 requests handled perfect
- ✅ **Performance**: 60ms avg extern, 13ms local

---

## ✨ Noutăți v5.1.0

### 🗄️ Migrare Completă PostgreSQL 17 Local
- ✅ Upgrade de la PostgreSQL 15 la **PostgreSQL 17 LTS**
- ✅ Migrare completă de la Neon Cloud la **PostgreSQL local în Docker**
- ✅ Backup & restore complet al bazei de date
- ✅ Zero downtime migration

### 🔐 Securitate Îmbunătățită
- ✅ **Centralizare completă** a credențialelor în `.env`
- ✅ Eliminare **100% a secretelor hardcoded**
- ✅ `.env.template` pentru setup rapid
- ✅ Git protection pentru fișiere sensibile

### 🐛 Fix-uri Critice
- ✅ Autentificare frontend corectată (`/api/auth/user`)
- ✅ Rezolvare erori TypeScript & compilare
- ✅ Fix conexiuni SSL duplicate
- ✅ Update TanStack Query la v5 (`gcTime`)

### 🐳 Docker & Deployment
- ✅ PostgreSQL 17 containerizat
- ✅ Redis Cloud integration (database-MG6WX0TN)
- ✅ Docker Compose optimizat
- ✅ Port conflict resolution (5433:5432)

## 🛡️ Monitoring, Securitate și Calitate

GeniusERP v5.1.0 integrează un stack complet de instrumente enterprise-grade:

### 🔍 Monitoring Stack
- **Prometheus** - Colectare metrici în timp real (CPU, memorie, request rate, latency)
- **Grafana** - Dashboards interactive și alerting (http://localhost:4000)
- **Loki & Promtail** - Agregare centralizată de logs de la toate serviciile

### 🛡️ Security Stack
- **Falco** - Runtime security monitoring și detectare intruziuni în containere
- **Wazuh** - SIEM complet (Security Information and Event Management)
- **Trivy** - Scanare automată vulnerabilități în imagini Docker și dependențe

### ✨ Quality Stack
- **Sentry** - Error tracking și performance monitoring pentru frontend și backend
- **ESLint** - Static code analysis pentru TypeScript și React

**📖 Documentație detaliată:** Vezi [MONITORING-SECURITY-GUIDE.md](./MONITORING-SECURITY-GUIDE.md)

**🚀 Quick Start Monitoring:**
```bash
# Start toate serviciile
docker-compose up -d

# Acces dashboards
- Grafana: http://localhost:4000 (admin/admin123)
- Prometheus: http://localhost:9090
- Wazuh: https://localhost:9443 (admin/SecretPassword)

# Scanare vulnerabilități
pnpm run scan:vulnerabilities

# Linting
pnpm run lint
```

---

## 🛠️ Stack Tehnologic

### 🏗️ Architecture: NX Monorepo
GeniusERP folosește **Nx Monorepo** pentru modularitate, cache inteligent și scalabilitate:
```
GeniusERP_V_5/
├── apps/
│   ├── api/              # Backend Express
│   └── web/              # Frontend React + Vite
├── libs/
│   ├── shared/           # Tipuri, schema, utilități comune
│   ├── auth/             # Modul autentificare
│   ├── accounting/       # Modul contabilitate
│   ├── inventory/        # Modul inventar
│   ├── hr/               # Modul HR
│   ├── crm/              # Modul CRM
│   └── ... (alte module)
```

### Backend (Port 5001)
- **Node.js 24.9.0** + **Express 5.1.0**
- **PostgreSQL 17** (Drizzle ORM)
- **Redis Cloud** (BullMQ queues)
- **Passport.js** + **JWT** (Authentication)
- **TypeScript** + **NX Build System v22**
- **esbuild** (Fast compilation)
- **pnpm 10.19.0** (Package manager exclusiv)

### Frontend (Port 5000)
- **React 19.2** + **Vite 7.1**
- **TanStack Query v5** (Data fetching)
- **Wouter** (Routing)
- **Tailwind CSS v4** (Styling)
- **Vitest v3** (Unit testing)
- **React Hook Form** (Forms)

### Infrastructure
- **Docker** + **Docker Compose** (Multi-container)
- **Nginx** (Reverse proxy pentru geniuserp.app)
- **Multi-Network** (4 networks izolate)
- **PM2** (Process management - opțional)

## 🚀 Quick Start

### Prerequisite
- **Docker & Docker Compose** (required pentru dual-server)
- **Git** (pentru clonare repo)
- Node.js 22+ & pnpm 10+ (opțional, pentru development local fără Docker)

### 1. Clone Repository
```bash
git clone https://github.com/neacisu/GeniusERP_V_5_0_1.git geniuserp
cd geniuserp
```

### 2. Switch la Branch DualServer
```bash
git checkout DualServer
```

### 3. Configurare Environment
```bash
# Copiază template-ul (dacă nu există .env)
cp .env.template .env

# Editează .env cu credențialele tale:
nano .env

# Variabile CRITICE pentru dual-server:
# APP_PORT_FRONTEND=5000
# APP_PORT_BACKEND=5001
# VITE_API_URL=http://backend:5001
# ALLOWED_ORIGINS=https://geniuserp.app,http://localhost:5000,http://frontend:5000
```

### 4. Pornire Dual-Server (RECOMANDAT)

**Opțiunea 1: Pornire Completă (Frontend + Backend + Monitoring)**
```bash
./docker-dual-server.sh

# Acces:
# - Frontend: http://localhost:5000
# - Backend API: http://localhost:5001/api/health
# - Grafana: http://localhost:4000
# - Prometheus: http://localhost:9090
```

**Opțiunea 2: Pornire Selectivă**
```bash
# Doar Frontend
./docker-frontend.sh

# Doar Backend + Database
./docker-backend.sh

# Custom (alege serviciile)
docker-compose up frontend backend postgres
```

### 5. Development Local (fără Docker)

**Instalare Dependențe**:
```bash
pnpm install
```

**Pornire Development**:
```bash
# Terminal 1: Backend API (port 5001)
pnpm nx serve api

# Terminal 2: Frontend (port 5000)
pnpm nx serve web
# sau: pnpm nx serve web
```

**Build pentru producție:**
```bash
# Build tot
pnpm run build

# Build specific
pnpm run build:api
pnpm run build:web
```

**Testing:**
```bash
# Rulare teste
pnpm test

# Teste specific
pnpm run test:api    # Jest pentru backend
pnpm run test:web    # Vitest pentru frontend
```

**Linting:**
```bash
pnpm run lint
pnpm run lint:fix
```

**Vizualizare graf dependențe:**
```bash
pnpm run graph
```

### 6. Accesare Aplicație
- **Frontend:** http://localhost:5000
- **API:** http://localhost:5001
- **PostgreSQL:** localhost:5433
- **Credentials default:** admin / admin

## 📚 Documentație

- [📖 Migrare PostgreSQL](./MIGRATION_TO_LOCAL_DB.md) - Ghid complet migrare bază de date
- [🔍 Audit Arhitectură](./CLEANUP_AUDIT_REPORT.md) - Analiză detaliată sistem
- [🔐 Securitate](./.env.template) - Template variabile de mediu

## 🗂️ Structură Proiect (NX Monorepo)

```
GeniusERP_V_5/
├── apps/
│   ├── api/             # Express Backend
│   │   └── src/
│   │       ├── main.ts        # Entry point
│   │       ├── config/        # Configurări
│   │       ├── middlewares/   # Express middlewares
│   │       └── routes/        # API routes
│   └── web/             # React Frontend
│       └── src/
│           ├── modules/       # Module business
│           ├── components/    # Componente reutilizabile
│           └── hooks/         # Custom hooks
├── libs/                # Librării partajate (NX)
│   ├── shared/          # Tipuri și utilități comune
│   ├── auth/            # Modul autentificare
│   ├── accounting/      # Modul contabilitate
│   ├── inventory/       # Modul inventar
│   ├── hr/              # Modul resurse umane
│   ├── crm/             # Modul CRM
│   └── ...              # Alte module de business
├── shared/              # Schema & types comune
├── docker-compose.yml   # Docker configuration
├── .env.template       # Template environment
└── README.md           # Acest fișier
```

## 🔧 Comenzi Utile

### Docker
```bash
./docker-dev.sh start    # Pornește aplicația
./docker-dev.sh stop     # Oprește aplicația
./docker-dev.sh restart  # Repornește aplicația
./docker-dev.sh logs     # Afișează logs
./docker-dev.sh clean    # Curăță volumele
```

### Development Local
```bash
pnpm install            # Instalează dependențe
pnpm run dev            # Start dev server
pnpm run build          # Build production
pnpm run db:push        # Apply schema changes
```

## 🔐 Variabile de Mediu

Toate variabilele sensibile sunt centralizate în `.env`:

- **Database:** PostgreSQL 17 local
- **Cache:** Redis Cloud
- **Auth:** JWT secrets
- **Integrations:** ANAF, OpenAI, Stripe
- **SMTP:** Email configuration

Vezi [`.env.template`](./.env.template) pentru lista completă.

## 📊 Module Disponibile

| Modul | Status | Descriere |
|-------|--------|-----------|
| 📊 Accounting | ✅ Active | Contabilitate & ANAF |
| 👥 HR | ✅ Active | Resurse Umane & COR |
| 📦 Inventory | ✅ Active | Gestiune stocuri |
| 💰 Invoicing | ✅ Active | Facturare & vânzări |
| 🤝 CRM | ✅ Active | Relații clienți |
| 📧 Marketing | ✅ Active | Campanii marketing |
| 🛍️ E-commerce | ✅ Active | Magazin online |
| 📄 Documents | ✅ Active | Management documente |
| ⚙️ BPM | ✅ Active | Procese business |
| 🔔 Notifications | ✅ Active | Notificări & alerte |

## 🤝 Contribuții

Contribuțiile sunt binevenite! Te rugăm:
1. Fork repository-ul
2. Creează un branch pentru feature (`git checkout -b feature/AmazingFeature`)
3. Commit modificările (`git commit -m 'Add AmazingFeature'`)
4. Push la branch (`git push origin feature/AmazingFeature`)
5. Deschide un Pull Request

## 📝 Changelog

### [v5.1.0] - 2025-09-30

#### Added
- PostgreSQL 17 LTS support
- Centralizare completă credențiale (.env)
- Docker Compose configuration
- Comprehensive documentation

#### Changed
- Migrare de la Neon Cloud la PostgreSQL local
- Update TanStack Query la v5
- Modernizare TypeScript types

#### Fixed
- Frontend authentication endpoints
- SSL connection issues
- TypeScript compilation errors
- Port conflicts (5432 → 5433)

#### Security
- Eliminare 100% secrete hardcoded
- .env protection în .gitignore
- Security audit complet

---

## 🔧 Troubleshooting Dual-Server

### Probleme Comune

#### 1. Frontend nu se conectează la Backend

**Simptom**: Erori de network în consolă browser

**Soluție**:
```bash
# Verifică variabila de mediu
docker exec geniuserp-frontend sh -c 'echo $VITE_API_URL'
# Trebuie: http://backend:5001

# Verifică că backend rulează
docker ps | grep backend

# Verifică logs frontend
docker logs geniuserp-frontend
```

---

#### 2. Backend nu se conectează la Postgres

**Simptom**: "Cannot connect to database"

**Soluție**:
```bash
# Verifică că Postgres rulează
docker ps | grep postgres

# Testează conexiune din backend
docker exec geniuserp-backend sh -c 'nc -zv postgres 5432'

# Verifică variabila DATABASE_URL
docker exec geniuserp-backend sh -c 'echo $DATABASE_URL'
```

---

#### 3. Port deja folosit

**Simptom**: "Port 5000 or 5001 already in use"

**Soluție**:
```bash
# Vezi ce folosește portul
lsof -i :5000
lsof -i :5001

# Oprește containerele vechi
docker-compose down

# Pornește din nou
./docker-dual-server.sh
```

---

#### 4. HMR nu funcționează

**Simptom**: Frontend nu se reîncarcă la modificări

**Soluție**:
```bash
# Verifică variabilele HMR în .env:
# CHOKIDAR_USEPOLLING=true
# CHOKIDAR_INTERVAL=100

# Restart frontend
docker-compose restart frontend
```

---

### Comenzi Utile Debugging

**Vezi logs în timp real**:
```bash
# Ambele servere
docker-compose logs -f frontend backend

# Doar frontend
docker logs -f geniuserp-frontend

# Doar backend
docker logs -f geniuserp-backend
```

**Verificare networks**:
```bash
# Vezi toate networks
docker network ls | grep geniuserp

# Inspectează network specific
docker network inspect geniuserp_app-network
docker network inspect geniuserp_data-network
```

**Verificare volumes**:
```bash
# Vezi volumes
docker volume ls | grep geniuserp

# Inspectează volume Postgres
docker volume inspect geniuserp_postgres_data
```

**Test conectivitate**:
```bash
# Test frontend → backend
docker exec geniuserp-frontend wget -O- http://backend:5001/api/health

# Test backend → postgres
docker exec geniuserp-backend nc -zv postgres 5432
```

**Restart specific services**:
```bash
docker-compose restart frontend
docker-compose restart backend
docker-compose restart postgres
```

---

## 📚 Documentație Dual-Server

### Rapoarte Disponibile

1. **DUAL-SERVER-MIGRATION-COMPLETE.md** - Ghid complet migrare
2. **SECURITY-AUDIT-REPORT-DUAL-SERVER.md** - Audit securitate (30 teste locale)
3. **EXTERNAL-TESTS-GENIUSERP-APP.md** - Teste externe (30 teste geniuserp.app)

### Arhitectură Detaliată

Vezi documentația completă despre:
- Multi-network security topology
- Volume strategy și data persistence
- Scalare multi-datacenter
- Load balancing setup
- HTTPS/SSL configuration

---

## 📄 Licență

**Proprietary** - © 2025 GeniusERP. All rights reserved.

## 👥 Autori

- **Alex Neacsu** - [@neacisu](https://github.com/neacisu)

## 🔗 Link-uri Utile

- [Repository](https://github.com/neacisu/GeniusERP_V_5_0_1)
- [Issues](https://github.com/neacisu/GeniusERP_V_5_0_1/issues)
- [Releases](https://github.com/neacisu/GeniusERP_V_5_0_1/releases)

---

**Made with ❤️ in Romania** 🇷🇴
