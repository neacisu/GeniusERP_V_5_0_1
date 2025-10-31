# Migrații Modul Accounting

Acest director conține migrațiile pentru modulul de contabilitate (Accounting).

## 📁 Tabele CREATE

### AC_ (Accounting Configuration) - Tabele de Configurare Contabilă

#### 1. AC_account_balances
**Fișier**: `create_AC_account_balances.ts`  
**Scop**: Solduri contabile pe cont, lună, an fiscal  
**Prefix**: AC_ (Accounting Configuration)  
**Documentație**: `/docs/audit/DB_audit.md` - Secțiunea AC_account_balances

**Coloane principale:**
- `company_id`, `account_id` - Identificare cont per companie
- `fiscal_year`, `fiscal_month` - Perioadă fiscală
- `opening_debit/credit` - Solduri de deschidere
- `period_debit/credit` - Mișcări în perioadă
- `closing_debit/credit` - Solduri de închidere

#### 2. AC_account_relationships
**Fișier**: `create_AC_account_relationships.ts`  
**Scop**: Relații între conturi (corespondențe, transformări)  
**Prefix**: AC_ (Accounting Configuration)  
**Documentație**: `/docs/audit/DB_audit.md` - Secțiunea AC_account_relationships

**Coloane principale:**
- `source_account_id`, `target_account_id` - Conturile în relație
- `relationship_type` - Tip relație (corespondență, transformare, etc.)
- `is_bidirectional` - Relație bidirecțională sau nu
- `applies_to_period` - Perioada în care se aplică

#### 3. AC_journal_types ✅ NOU
**Fișier**: `create_AC_journal_types.ts`  
**Scop**: Tipuri de jurnale contabile (General, Vânzări, Achiziții, Bancă, Casă)  
**Prefix**: AC_ (Accounting Configuration)  
**Documentație**: `/docs/audit/DB_audit.md` - Secțiunea #8 AC_journal_types

**Coloane principale:**
- `company_id` - Compania proprietară
- `code` - Cod jurnal (GENJ, SALE, PURCH, BANK, CASH)
- `name` - Nume descriptiv jurnal
- `default_debit_account`, `default_credit_account` - Conturi implicite
- `is_system_journal` - Jurnal sistem (protejat împotriva ștergerii)
- `is_active` - Status activ (soft delete)
- `auto_number_prefix` - Prefix numerotare automată (GJ, SA, PU)
- `last_used_number` - Counter pentru numerotare secvențială

**Tipuri standard de jurnale:**
```
GENJ  - General Journal (Jurnal General)
SALE  - Sales Journal (Jurnal Vânzări)
PURCH - Purchase Journal (Jurnal Achiziții)
BANK  - Bank Journal (Jurnal Bancă)
CASH  - Cash Journal (Jurnal Casă)
```

**Indexuri:**
- `AC_journal_types_pkey` - Primary key pe `id`
- `AC_journal_types_code_unique` - UNIQUE pe `(company_id, code)`
- `AC_journal_types_active_idx` - Index pe `(company_id, is_active)`

**Schema Drizzle:**
- Locație: `/libs/shared/src/schema/accounting.schema.ts`
- Export principal: `AC_journal_types`
- Backward compatibility: `accounting_journal_types` (alias deprecated)
- Zod schemas: `insertACJournalTypeSchema`, `selectACJournalTypeSchema`, `updateACJournalTypeSchema`

## 🔧 Convenții de Nume

### Prefix-uri pentru tabele:
- **AC_** (Accounting Configuration) - Tabele de configurare contabilă
- **PC_** (Plan de Conturi) - Tabele plan de conturi

### Convenții snake_case:
- Toate coloanele folosesc `snake_case` (ex: `company_id`, `default_debit_account`)
- Toate variabilele în TypeScript folosesc `snake_case` pentru consistență cu DB
- Zod schemas validează formatul corect

## 📚 Documentație Completă

Pentru fiecare tabel, documentația completă se găsește în:
- `/docs/audit/DB_audit.md` - Audit complet al bazei de date
- Secțiunile specifice pentru fiecare tabel cu:
  - 🎯 Scop și rol în sistem
  - 🏗️ Structură tehnică (SQL + Drizzle)
  - 📊 Coloane și logică business
  - 🔗 Relații cu alte tabele
  - 🎯 Algoritmi importanți
  - 📋 Rezumat audit și recomandări

## ⚠️ Important

- NU modificați direct tabelele în producție
- Folosiți întotdeauna migrații pentru modificări
- Testați pe development înainte de production
- Respectați convenția de nume cu prefix-uri (AC_, PC_)
- Folosiți snake_case pentru toate coloanele noi

