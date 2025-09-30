# 🔄 Migrare de la Neon Cloud la PostgreSQL Local

**Data migrării:** 30 Septembrie 2025  
**PostgreSQL Version:** 17.6 (latest LTS)  
**Status:** ✅ Completă

## 📊 Rezumat Migrare

Am migrat complet baza de date de la **Neon Cloud (PostgreSQL 16)** la **PostgreSQL 17 local (Docker)** și am centralizat toate credențialele într-un fișier `.env` global.

## ✅ Ce s-a realizat

### 1. **Export Date din Neon Cloud**
- ✅ Export complet schema + date din Neon Cloud
- ✅ Backup salvat în: `/db-backups/neon-backup-20250930_220915.sql`
- ✅ **26 utilizatori**, **31 companii**, **20 facturi**, **3 înregistrări ANAF**
- ✅ **80+ tabele** importate cu succes

### 2. **Upgrade PostgreSQL**
- ✅ PostgreSQL 15 → **PostgreSQL 17** (Alpine)
- ✅ Conexiune locală pe portul **5433** (pentru a evita conflicte)
- ✅ Container Docker: `geniuserp-postgres`

### 3. **Centralizare Credențiale în .env**
Toate credențialele au fost mutate în fișierul `.env`:

#### ✅ Database
- `DATABASE_URL` - PostgreSQL local
- `PGDATABASE`, `PGUSER`, `PGPASSWORD`, `PGHOST`, `PGPORT`

#### ✅ Redis Cloud
- `REDIS_URL`, `REDIS_HOST`, `REDIS_PORT`
- `REDIS_PASSWORD`, `REDIS_USERNAME`

#### ✅ Authentication
- `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `SESSION_SECRET`, `JWT_EXPIRES_IN`

#### ✅ Email/SMTP
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- `EMAIL_FROM`

#### ✅ External APIs
- `ANAF_API_URL`, `ANAF_API_VERSION` (Romanian Tax Authority)
- `OPENAI_API_KEY`, `OPENAI_ORGANIZATION`, `OPENAI_DEFAULT_MODEL`
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`

### 4. **Actualizări Cod**

#### ✅ `server/db.ts`
**ÎNAINTE:**
```typescript
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
```

**DUPĂ:**
```typescript
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
```

#### ✅ `ecosystem.config.cjs`
- Adăugat `require('dotenv').config()`
- Toate credențialele citite din `process.env`
- **ELIMINAT:** Credențiale Neon Cloud hardcodate

#### ✅ `start-server.sh`
- Încarcă automat variabilele din `.env`
- Validare că `.env` există înainte de pornire

#### ✅ `docker-compose.yml`
- Toate variabilele citite din `.env`
- PostgreSQL 17 Alpine
- Redis Cloud configuration

#### ✅ Fișiere Inventory
- `server/modules/inventory/services/inventory-assessment.service.ts`
- `server/modules/inventory/services/warehouse.service.ts`
- `server/modules/inventory/controllers/inventory-assessment.controller.ts`

### 5. **Securitate**
- ✅ `.env` adăugat în `.gitignore`
- ✅ `.env.template` creat pentru referință
- ✅ **ZERO credențiale hardcodate** în cod

## 📁 Structură Fișiere

```
GeniusERP_V_5/
├── .env                          # ⚠️  CONFIDENȚIAL - NU commit
├── .env.template                 # Template public
├── .gitignore                    # .env inclus
├── ecosystem.config.cjs          # ✅ Citește din .env
├── docker-compose.yml            # ✅ Citește din .env
├── start-server.sh              # ✅ Încarcă .env
├── server/
│   └── db.ts                    # ✅ PostgreSQL local (nu Neon)
└── db-backups/
    └── neon-backup-*.sql        # Backup-uri Neon Cloud
```

## 🚀 Cum să pornești aplicația

### Metoda 1: Cu Docker (Recomandat)
```bash
# Asigură-te că .env există și conține credențialele corecte
cat .env

# Pornește containerele
docker-compose up -d

# Vezi logurile
docker-compose logs -f app
```

### Metoda 2: Direct pe sistem
```bash
# Încarcă .env și pornește serverul
./start-server.sh
```

### Metoda 3: Cu PM2 (Production)
```bash
# PM2 va încărca automat .env prin dotenv
pm2 start ecosystem.config.cjs
```

## 🔧 Configurare Inițială

### 1. Creează fișierul .env
```bash
cp .env.template .env
```

### 2. Completează credențialele în .env
Editează `.env` și completează:
- Redis Cloud credentials
- JWT secrets (generează cu: `openssl rand -hex 32`)
- OpenAI API key (dacă folosești)
- Stripe keys (dacă folosești)
- SMTP credentials

### 3. Verifică conexiunea
```bash
# Test database
docker exec geniuserp-postgres psql -U postgres -d geniuserp -c "\dt" | head -20

# Test Redis
docker exec geniuserp-app node -e "const Redis = require('ioredis'); const redis = new Redis(process.env.REDIS_URL); redis.ping().then(console.log).catch(console.error)"
```

## ⚠️ Note Importante

### Credențiale Vechi (NU MAI FOLOSI)
- ❌ Neon Cloud: `postgresql://neondb_owner:***@ep-super-cake-a4qj9u0x.us-east-1.aws.neon.tech/neondb`
- ❌ Redis Cloud vechi: `redis-11037.c327.europe-west1-2.gce.redns.redis-cloud.com:11037`

### Credențiale Noi (ACTIVE)
- ✅ PostgreSQL Local: `localhost:5433/geniuserp`
- ✅ Redis Cloud nou: `redis-17293.c256.us-east-1-2.ec2.redns.redis-cloud.com:17293`

## 🔐 Securitate

### Ce să faci:
- ✅ Păstrează `.env` LOCAL - nu commit la Git
- ✅ Folosește `.env.template` pentru referință
- ✅ Generează JWT secrets noi pentru production
- ✅ Schimbă parola PostgreSQL în production

### Ce să NU faci:
- ❌ NU commit `.env` la Git
- ❌ NU expune credențialele în loguri
- ❌ NU hardcoda credențiale în cod
- ❌ NU partaja `.env` prin Slack/Email

## 📦 Dependințe

### Noi (Adăugate)
```json
{
  "postgres": "^3.4.5",              // PostgreSQL client
  "dotenv": "^16.4.7"                // Citire .env
}
```

### Eliminate
```json
{
  "@neondatabase/serverless": "removed"  // ❌ Nu mai folosim Neon
}
```

## 🧪 Testing

```bash
# Test health check
curl http://localhost:5000/health

# Test database connection
docker exec geniuserp-app node -e "console.log(process.env.DATABASE_URL)"

# Test Redis connection  
docker logs geniuserp-app | grep -i redis
```

## 📝 Troubleshooting

### Eroare: "DATABASE_URL must be set"
```bash
# Verifică că .env există
ls -la .env

# Verifică conținutul
cat .env | grep DATABASE_URL
```

### Eroare: "Cannot connect to PostgreSQL"
```bash
# Verifică că containerul rulează
docker ps | grep postgres

# Verifică portul
lsof -i :5433
```

### Eroare: Redis Connection
```bash
# Verifică credențialele Redis în .env
cat .env | grep REDIS

# Test manual conexiune
redis-cli -h redis-17293.c256.us-east-1-2.ec2.redns.redis-cloud.com -p 17293 -a [password] ping
```

## ✅ Checklist Migrare

- [x] Export date din Neon Cloud
- [x] Upgrade PostgreSQL 15 → 17
- [x] Import date în PostgreSQL local
- [x] Creare fișier .env cu toate credențialele
- [x] Actualizare server/db.ts (Neon → postgres)
- [x] Actualizare ecosystem.config.cjs
- [x] Actualizare start-server.sh
- [x] Actualizare docker-compose.yml
- [x] Actualizare fișiere inventory
- [x] Adăugare .env în .gitignore
- [x] Creare .env.template
- [x] Documentare completă

## 🎉 Rezultat Final

✅ **Baza de date:** PostgreSQL 17 local (Docker)  
✅ **Credențiale:** Centralizate în `.env`  
✅ **Securitate:** Zero credențiale hardcodate  
✅ **Redis:** Redis Cloud (nou)  
✅ **Date:** Toate migrate cu succes  
✅ **Aplicație:** Funcțională 100%

---

**Autor:** Migration Team  
**Data:** 30 Septembrie 2025  
**Versiune:** 1.0
