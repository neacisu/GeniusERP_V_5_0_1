# GeniusERP Database Seeds

Acest director conține seed-uri pentru popularea bazei de date cu date fundamentale și de test.

## Structură

```
seeds/
├── README.md                           # Acest fișier
├── initial-admin-users.ts              # Useri administrativi (admin, superadmin)
├── core-permissions.ts                 # Permisiuni fundamentale și asignări roluri
├── essential-configurations.ts         # Configurări esențiale sistem
├── onboarding.ts                       # Script orchestration pentru toate seeds
└── hr/                                 # Seeds HR
    ├── seed-cor.ts                    # Script seed COR
    ├── cor-major-groups.json          # Grupe Majore COR
    ├── cor-submajor-groups.json       # Grupe Sub-Majore COR
    ├── cor-minor-groups.json          # Grupe Minore COR
    ├── cor-subminor-groups.json       # Grupe Sub-Minore COR
    └── cor-occupations.json           # 4247 Ocupații COR

⚠️  NOTĂ: Plan de Conturi MUTAT în sistemul centralizat de migrații:
📁 Locație nouă: /migrations/modules/core/PC_plan_conturi_seeding/
   ├── PC_account_classes.json         # 9 Clase de conturi
   ├── PC_account_groups.json          # 71 Grupe de conturi
   ├── PC_synthetic_accounts.json      # 781 Conturi sintetice
   └── seed_plan_conturi.ts            # Script seed Plan de Conturi
🚀 Rulare: npm run migrate:all sau npm run migrate:module core
```

## Seed-uri Disponibile

### 1. Initial Admin Users (`initial-admin-users.ts`)
Creează userii administrativi inițiali:
- **Admin Generic**: `admin@geniuserp.ro` / `admin1234`
- **SuperAdmin Developer**: `superadmin@geniuserp.ro` / `%up3r@dm1n`

Include și crearea rolurilor de sistem (admin, superadmin, user, manager).

### 2. Core Permissions (`core-permissions.ts`)
Creează 55+ permisiuni fundamentale pentru toate modulele:
- Admin, Users, Roles, Permissions
- Companies, Accounting, CRM, HR
- Inventory, Documents, Analytics
- Settings, License, API Keys

Asignează automat permisiunile rolurilor:
- **SuperAdmin**: TOATE permisiunile
- **Admin**: Permisiuni extinse (management și operații)
- **Manager**: Permisiuni operaționale
- **User**: Doar vizualizare

### 3. Essential Configurations (`essential-configurations.ts`)
Creează 35+ configurări esențiale:
- System: name, version, maintenance mode
- Security: session timeout, password policies, login attempts
- Email: SMTP settings
- Accounting: fiscal year, VAT rate, currency
- HR: work hours, vacation days
- Documents: auto-numbering, signatures, file size limits
- Notifications, Backup, API, Logging

### 4. Chart of Accounts (`accounting/seed-chart-of-accounts.ts`)
Populează Planul de Conturi Românesc (OMFP 1802/2014):
- **9 Clase de conturi** (1-9)
- **71 Grupe de conturi**
- **781 Conturi sintetice** cu grade 1 și 2

### 5. COR - Clasificarea Ocupațiilor (`hr/seed-cor.ts`)
Populează COR (Clasificarea Ocupațiilor din România):
- **9 Grupe Majore** (1 cifră)
- **Grupe Sub-Majore** (2 cifre)
- **Grupe Minore** (3 cifre)
- **Grupe Sub-Minore** (4 cifre)
- **4247 Ocupații** (6 cifre)

## Cum să Folosești

### ⭐ 1. ONBOARDING COMPLET (Recomandat pentru setup inițial)

Cel mai simplu mod - rulează toate seed-urile automat în ordinea corectă:

```bash
# Onboarding complet cu toate seed-urile
npm run onboarding

# Onboarding fără Plan de Conturi
npm run onboarding -- --skip-accounting

# Onboarding fără COR
npm run onboarding -- --skip-hr

# Onboarding cu output verbose
npm run onboarding -- --verbose

# Ajutor
npm run onboarding -- --help
```

**Ce face onboarding-ul:**
- ✅ Verifică prerequisite (DB, tabele, conexiune)
- ✅ Creează useri admin și superadmin
- ✅ Setează permisiuni și roluri
- ✅ Configurează setări esențiale
- ✅ Populează Plan de Conturi (opțional)
- ✅ Populează COR (opțional)
- ✅ Verifică rezultatul final
- ✅ Afișează raport detaliat cu progres

### 2. Prin API Setup

Folosește endpoint-ul `/api/admin/setup/seed`:

```bash
POST /api/admin/setup/seed
{
  "datasets": [
    "initial-admin-users",
    "core-permissions", 
    "essential-configurations",
    "accounting/seed-chart-of-accounts",
    "hr/seed-cor"
  ]
}
```

### 3. Prin Cod

```typescript
import { SetupService } from './modules/admin/services/setup.service';

const setupService = new SetupService(db);

await setupService.seedDatabase([
  'initial-admin-users',
  'core-permissions',
  'essential-configurations',
  'accounting/seed-chart-of-accounts',
  'hr/seed-cor'
]);
```

### 4. Direct din Terminal (seed-uri individuale)

```bash
# Rulează seed-uri specifice
npm run seed initial-admin-users core-permissions
```

## Ordinea Recomandată de Seed

Pentru o instalare fresh, rulează în această ordine:

1. `initial-admin-users` - Creează userii și rolurile de bază
2. `core-permissions` - Asignează permisiunile rolurilor
3. `essential-configurations` - Setează configurările sistem
4. `accounting/seed-chart-of-accounts` - Planul de Conturi (dacă e necesar)
5. `hr/seed-cor` - COR (dacă e necesar)

## Regenerare JSON-uri din DB

Dacă dorești să re-extragi datele din DB în JSON:

```bash
# Plan de Conturi
docker exec geniuserp-postgres psql -U postgres -d geniuserp -t -A -c \
  "SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM account_classes ORDER BY id) t" \
  > server/seeds/accounting/account-classes.json

# COR Occupations
docker exec geniuserp-postgres psql -U postgres -d geniuserp -t -A -c \
  "SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM cor_occupations ORDER BY code) t" \
  > server/seeds/hr/cor-occupations.json
```

## Note Importante

- Seed-urile folosesc `ON CONFLICT DO UPDATE` pentru a permite re-rulare fără erori
- Datele JSON sunt extractions directe din DB-ul de producție
- Pentru performanță, seed-urile mari (COR, Plan Conturi) afișează progress
- Toate seed-urile sunt idempotente - pot fi rulate de mai multe ori

## Dezvoltare

### Adaugă un Seed Nou

1. Creează fișierul TypeScript în directorul corespunzător
2. Exportă funcția `seed(db)` sau `export default`
3. Opțional: creează JSON-uri cu datele
4. Testează cu `setupService.seedDatabase(['nume-seed'])`

### Format Seed File

```typescript
export async function seed(db: any) {
  console.log('🌱 Seeding...');
  
  // Insert logic here
  await db.execute(`INSERT INTO ...`);
  
  console.log('✅ Done');
}

export default seed;
```

### Format JSON Data

Alternativ, poți exporta doar date în format JSON:

```typescript
export const data = {
  users: [
    { email: 'test@example.com', name: 'Test User' }
  ],
  companies: [
    { name: 'Test Company' }
  ]
};
```

Service-ul va insera automat datele în tabelele corespunzătoare.

