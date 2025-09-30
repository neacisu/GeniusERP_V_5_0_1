# GeniusERP Prototype — Implementation Guidelines

## ✅ Technologies (mandatory)
- Frontend: Next.js + React
- Backend: NestJS
- Monorepo: NX
- Database: PostgreSQL (Neon via Replit)
- ORM: Drizzle (TypeScript only)
- Auth: JWT (stateless)
- Identifiers: UUID v4
- Cache: Redis Cloud
- Queue system: BullMQ
- use TypeScript
- implement the frontpages theme from this TypeScript theme: https://github.com/themeselection/materio-mui-nextjs-admin-template-free.git

## 📦 Modules to scaffold
- `auth`: JWT login/register with session-based guards
- `accounting`: Romanian Chart of Accounts 2025 (see `Planul de conturi 2025.txt`)
- `inventory`: Product + stock CRUD with categories and units
- `settings`: System preferences (company info, roles)

## 📚 Accounting rules
- Romanian Acounting sistem compliance! DON'T USE AMERICAN STANDARDS!!!
- Research online for Romanian accounting rules and standards for "Contabilitate in partida dubla"
- IMPORTANT! Double-entry (debit = credit)
- Account hierarchy: class (1 digit) → group (2 digits) → synthetic grade 1 (3 digits) → synthetic grade 2 (4 digits) → analytic
- Support bidirectional accounting (e.g., debit = credit = debit = credit)
- All accounts use 4-digit codes from RAS 2025

## ⚙️ Redis/BullMQ usage
- Redis Cloud connection for caching and queues with credentials from Replit Secrets ( URL, port, password, user)
- Use BullMQ for background jobs (e.g., report generation, sync)

## ⚠️ Constraints
- Do not use Prisma, MikroORM, or TypeORM
- No MongoDB or SQLite
- Only use Drizzle with PostgreSQL (Neon)
- Modularize via NX apps/libs, not monolith

## 🎯 Deliverables (for this step)
- Working NX monorepo with frontend and backend apps
- Auth system using JWT (with refresh if possible)
- PostgreSQL schema for user and base modules
- Redis connection + BullMQ setup (example job)
- Placeholder pages with navigation

## 🔐 Security
- Use env vars for all secrets
- Sanitize inputs via NestJS DTOs + class-validator
- Store JWT secret and DB creds securely

## 📁 Supporting Files
- `planul_de_conturi.md` — Romanian Chart of Accounts 2025
