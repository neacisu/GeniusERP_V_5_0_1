# GeniusERP v5.1.0 🚀

**Enterprise Resource Planning System** - Sistem integrat de management pentru afaceri moderne

[![Version](https://img.shields.io/badge/version-5.1.0-blue.svg)](https://github.com/neacisu/GeniusERP_V_5_0_1)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-blue.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-Cloud-red.svg)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com/)

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

### Backend
- **Node.js** + **Express.js**
- **PostgreSQL 17** (Drizzle ORM)
- **Redis Cloud** (BullMQ queues)
- **Passport.js** + **JWT** (Authentication)
- **TypeScript** + **NX Build System**
- **esbuild** (Fast compilation)

### Frontend
- **React 18** + **Vite**
- **TanStack Query v5** (Data fetching)
- **Wouter** (Routing)
- **Tailwind CSS** (Styling)
- **Vitest** (Unit testing)
- **React Hook Form** (Forms)

### Infrastructure
- **Docker** + **Docker Compose**
- **Nginx** (Production proxy)
- **PM2** (Process management)

## 🚀 Quick Start

### Prerequisite
- Docker & Docker Compose
- Node.js 18+ (pentru development local)
- pnpm (package manager)
- Git

### 1. Clone Repository
```bash
git clone https://github.com/neacisu/GeniusERP_V_5_0_1.git
cd GeniusERP_V_5_0_1
```

### 2. Instalare pnpm (dacă nu este deja instalat)
```bash
npm install -g pnpm@latest
```

### 3. Configurare Environment
```bash
# Copiază template-ul
cp .env.template .env

# Editează .env cu credențialele tale:
nano .env
```

### 4. Instalare Dependențe
```bash
pnpm install
```

### 5. Dezvoltare cu NX

**Pornire ambele aplicații (recomandat):**
```bash
pnpm run dev
# Sau explicit cu NX:
pnpm nx run-many --target=serve --projects=api,web --parallel
```

**Pornire separată:**
```bash
# Doar API (backend)
pnpm run dev:api
# sau: pnpm nx serve api

# Doar Frontend
pnpm run dev:web
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
