# Migrații Modul Accounting

Acest director conține migrațiile pentru modulul de contabilitate (Accounting).

## 📁 Tabele CREATE

### AC_ (Accounting Configuration) - Tabele de Configurare Contabilă

#### 1. AC_accounting_account_balances
**Fișier**: `create_AC_accounting_account_balances.ts`  
**Scop**: Solduri contabile pe cont, lună, an fiscal (structură completă RAS)  
**Prefix**: AC_ (Accounting Configuration)  
**Documentație**: `/docs/audit/DB_audit.md` - Secțiunea AC_accounting_account_balances

**Coloane principale:**
- `company_id`, `franchise_id` - Identificare companie și franchiză
- `account_class`, `account_group`, `account_number`, `account_sub_number`, `full_account_number` - Structură RAS completă
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

#### 3. AC_journal_types ✅
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

**Tipuri standard de jurnale:**
```
GENJ  - General Journal (Jurnal General)
SALE  - Sales Journal (Jurnal Vânzări)
PURCH - Purchase Journal (Jurnal Achiziții)
BANK  - Bank Journal (Jurnal Bancă)
CASH  - Cash Journal (Jurnal Casă)
```

#### 4. AC_accounting_ledger_entries ✅ NOU
**Fișier**: `create_AC_accounting_ledger_entries.ts`  
**Scop**: Antet note contabile (header pentru double-entry accounting)  
**Prefix**: AC_ (Accounting Configuration)  
**Documentație**: `/docs/audit/DB_audit.md` - Secțiunea #10 AC_accounting_ledger_entries

**Coloane principale:**
- `company_id`, `franchise_id` - Identificare companie și franchiză
- `journal_type_id` - Link către AC_journal_types
- `transaction_date`, `posting_date`, `document_date` - Date tranzacție
- `document_number`, `document_type` - Identificare document
- `total_debit`, `total_credit` - Totaluri (trebuie egale - partida dublă!)
- `fiscal_year`, `fiscal_month` - Perioadă fiscală
- `is_posted`, `is_draft` - Status workflow
- `is_reversal`, `original_entry_id`, `reversal_entry_id` - Sistem stornare

**Caracteristici:**
- Double-entry accounting cu validare partida dublă
- Multi-currency cu exchange rates
- Complete audit trail (created, updated, posted, reversed)
- Self-referencing FK pentru ierarhie stornări
- Polymorphic references către documente sursă

**Indexuri:**
- `AC_ledger_primary_idx` - (company_id, fiscal_year, fiscal_month, transaction_date)
- `AC_ledger_is_posted_idx` - (company_id, is_posted, transaction_date)
- `AC_ledger_document_unique` - UNIQUE pe (company_id, document_type, document_number)

#### 5. AC_accounting_ledger_lines ✅ NOU
**Fișier**: `create_AC_accounting_ledger_lines.ts`  
**Scop**: Linii detaliate note contabile (detail lines pentru partida dublă)  
**Prefix**: AC_ (Accounting Configuration)  
**Documentație**: `/docs/audit/DB_audit.md` - Secțiunea #11 AC_accounting_ledger_lines

**Coloane principale:**
- `ledger_entry_id` - FK către AC_accounting_ledger_entries (CASCADE)
- `line_number` - Număr ordine linie în notă
- `account_class`, `account_group`, `account_number`, `full_account_number` - Structură RAS
- `debit_amount`, `credit_amount` - Sume (doar UNA poate fi > 0!)
- `department_id`, `project_id`, `cost_center_id` - Dimensiuni analitice
- `vat_code`, `vat_percentage`, `vat_amount` - Tracking TVA
- `item_id`, `partner_id` - Linkuri către produse/parteneri
- `is_reconciled`, `reconciliation_id` - Sistem reconciliere

**Caracteristici:**
- Suport complet pentru dimensiuni analitice (cost accounting)
- Tracking TVA per linie
- Link către inventory items
- Partner tracking cu scadențe (due_date)
- Sistem de reconciliere pentru conturi de terți

**Indexuri:**
- `AC_ledger_line_entry_idx` - (ledger_entry_id) **CRITIC pentru performance!**
- `AC_ledger_line_account_idx` - (company_id, full_account_number)
- `AC_ledger_line_dimension_idx` - (company_id, department_id, project_id, cost_center_id)

**Schema Drizzle:**
- Locație: `/libs/shared/src/schema/accounting.schema.ts`
- Export principal: `AC_accounting_ledger_entries`, `AC_accounting_ledger_lines`
- Backward compatibility: `accounting_ledger_entries`, `accounting_ledger_lines` (aliases deprecated)
- Zod schemas: `insertACAccountingLedgerEntrySchema`, `insertACAccountingLedgerLineSchema` cu validări business logic

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

