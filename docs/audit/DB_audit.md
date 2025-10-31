# Audit Bază de Date GeniusERP

## Lista completă a tabelelor (190 tabele)

Această listă conține toate tabelele existente în baza de date `geniuserp` după factorizarea majoră:

# 1. AC_account_balances

## 📋 Detalii detaliate tabel: `AC_account_balances`

### 🏷️ PREFIX: AC_ (Accounting Configuration)
📁 **Locație migrație**: `/migrations/modules/accounting/create_AC_account_balances.ts`

### 🎯 Scop și Rol în Sistem

Tabelul `AC_account_balances` reprezintă **soldurile curente și istorice** pentru fiecare cont contabil dintr-o companie. Acest tabel este **fundamental** în sistemul contabil pentru:

- **Urmărirea soldurilor lunare** pentru fiecare cont contabil
- **Calcularea soldurilor de închidere** pe baza tranzacțiilor lunare
- **Generarea balanțelor contabile** conform standardelor românești (RAS)
- **Validarea consistenței contabile** (debit = credit)
- **Raportare financiară** și audit

### 🏗️ Structură Tehnică

**Schema DB (PostgreSQL):**
```sql
CREATE TABLE public."AC_account_balances" (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    account_id uuid NOT NULL,
    company_id uuid NOT NULL,
    fiscal_year integer NOT NULL,
    fiscal_month integer NOT NULL,
    opening_debit numeric(15,2) NOT NULL DEFAULT '0'::numeric,
    opening_credit numeric(15,2) NOT NULL DEFAULT '0'::numeric,
    period_debit numeric(15,2) NOT NULL DEFAULT '0'::numeric,
    period_credit numeric(15,2) NOT NULL DEFAULT '0'::numeric,
    closing_debit numeric(15,2) NOT NULL DEFAULT '0'::numeric,
    closing_credit numeric(15,2) NOT NULL DEFAULT '0'::numeric,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    updated_at timestamp without time zone NOT NULL DEFAULT now(),
    CONSTRAINT "AC_account_balances_pkey" PRIMARY KEY (id),
    CONSTRAINT "AC_account_balances_account_id_fkey" FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    CONSTRAINT "AC_account_balances_company_id_fkey" FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT "AC_account_balances_unique_key" UNIQUE (account_id, company_id, fiscal_year, fiscal_month)
);
```

**Indexes:**
- PRIMARY KEY: `AC_account_balances_pkey` pe `id`
- FOREIGN KEY: `AC_account_balances_account_id_fkey` către `accounts(id)` ON DELETE CASCADE
- FOREIGN KEY: `AC_account_balances_company_id_fkey` către `companies(id)` ON DELETE CASCADE
- INDEX: `idx_AC_account_balances_account` pe `account_id`
- INDEX: `idx_AC_account_balances_company` pe `company_id`
- INDEX: `idx_AC_account_balances_period` pe `(company_id, fiscal_year, fiscal_month)`
- INDEX: `idx_AC_account_balances_lookup` pe `(account_id, fiscal_year, fiscal_month)`

### 📊 Coloane și Logică Business

#### 1. `id` - UUID Primar
- **Tip**: `uuid`
- **Constrângeri**: `PRIMARY KEY`, `NOT NULL`, `DEFAULT gen_random_uuid()`
- **Logică Business**: Identificator unic global pentru fiecare înregistrare de sold
- **Logică Algoritmică**: Generat automat folosind `gen_random_uuid()` pentru evitare coliziuni
- **Utilizare**: Cheie primară, referințe în alte tabele

#### 2. `account_id` - Referință Cont Contabil
- **Tip**: `uuid`
- **Constrângeri**: `NOT NULL`, `FOREIGN KEY` către `accounts(id)`
- **Logică Business**: Leagă soldul de contul contabil specific (din tabela `accounts`)
- **Logică Algoritmică**: Trebuie să existe contul în tabela `accounts` înainte de inserare
- **Utilizare**: Filtrare solduri per cont, join-uri cu tabela `accounts`

#### 3. `company_id` - Compania Proprietară
- **Tip**: `uuid`
- **Constrângeri**: `NOT NULL`, `FOREIGN KEY` către `companies(id)`
- **Logică Business**: Asociază soldul cu compania căreia îi aparține
- **Logică Algoritmică**: Multi-tenancy - izolează datele per companie
- **Utilizare**: Filtrare date per companie, securitate la nivel de companie

#### 4. `fiscal_year` - An Fiscal
- **Tip**: `integer`
- **Constrângeri**: `NOT NULL`
- **Logică Business**: Anul fiscal pentru care se calculează soldurile (ex: 2024, 2025)
- **Logică Algoritmică**: Validare că este între 2000-2100, parte din cheie compusă pentru unicitate
- **Utilizare**: Grupare rapoarte pe ani fiscali, calculuri anuale

#### 5. `fiscal_month` - Lună Fiscală
- **Tip**: `integer`
- **Constrângeri**: `NOT NULL`
- **Logică Business**: Luna din anul fiscal (1-12)
- **Logică Algoritmică**: Validare că este între 1-12, împreună cu fiscal_year formează perioadă contabilă unică
- **Utilizare**: Raportare lunară, calculuri periodice

#### 6. `opening_debit` - Sold Deschidere Debit
- **Tip**: `numeric(15,2)`
- **Constrângeri**: `NOT NULL`, `DEFAULT '0'::numeric`
- **Logică Business**: Soldul debitor la începutul perioadei (moștenit din luna precedentă)
- **Logică Algoritmică**: `opening_debit = closing_debit luna_precedentă` sau 0 pentru prima perioadă
- **Utilizare**: Bază pentru calcularea soldurilor lunare

#### 7. `opening_credit` - Sold Deschidere Credit
- **Tip**: `numeric(15,2)`
- **Constrângeri**: `NOT NULL`, `DEFAULT '0'::numeric`
- **Logică Business**: Soldul creditor la începutul perioadei (moștenit din luna precedentă)
- **Logică Algoritmică**: `opening_credit = closing_credit luna_precedentă` sau 0 pentru prima perioadă
- **Utilizare**: Bază pentru calcularea soldurilor lunare

#### 8. `period_debit` - Mișcări Debit Perioadă
- **Tip**: `numeric(15,2)`
- **Constrângeri**: `NOT NULL`, `DEFAULT '0'::numeric`
- **Logică Business**: Totalul tuturor înregistrărilor debitoare în perioada curentă
- **Logică Algoritmică**: Sumă tuturor `debit_amount` din `accounting_ledger_lines` pentru contul și perioada respectivă
- **Utilizare**: Calcularea soldurilor de închidere

#### 9. `period_credit` - Mișcări Credit Perioadă
- **Tip**: `numeric(15,2)`
- **Constrângeri**: `NOT NULL`, `DEFAULT '0'::numeric`
- **Logică Business**: Totalul tuturor înregistrărilor creditoare în perioada curentă
- **Logică Algoritmică**: Sumă tuturor `credit_amount` din `accounting_ledger_lines` pentru contul și perioada respectivă
- **Utilizare**: Calcularea soldurilor de închidere

#### 10. `closing_debit` - Sold Închidere Debit
- **Tip**: `numeric(15,2)`
- **Constrângeri**: `NOT NULL`, `DEFAULT '0'::numeric`
- **Logică Business**: Soldul debitor la sfârșitul perioadei (folosit ca opening pentru luna următoare)
- **Logică Algoritmică**: `closing_debit = opening_debit + period_debit - period_credit` (dacă rezultatul > 0)
- **Utilizare**: Transfer către luna următoare, rapoarte bilanț

#### 11. `closing_credit` - Sold Închidere Credit
- **Tip**: `numeric(15,2)`
- **Constrângeri**: `NOT NULL`, `DEFAULT '0'::numeric`
- **Logică Business**: Soldul creditor la sfârșitul perioadei (folosit ca opening pentru luna următoare)
- **Logică Algoritmică**: `closing_credit = opening_credit + period_credit - period_debit` (dacă rezultatul > 0)
- **Utilizare**: Transfer către luna următoare, rapoarte bilanț

#### 12. `created_at` - Timestamp Creare
- **Tip**: `timestamp without time zone`
- **Constrângeri**: `NOT NULL`, `DEFAULT now()`
- **Logică Business**: Data și ora când a fost creată înregistrarea
- **Logică Algoritmică**: Setat automat la inserare cu `now()`
- **Utilizare**: Audit trail, sortare cronologică

#### 13. `updated_at` - Timestamp Actualizare
- **Tip**: `timestamp without time zone`
- **Constrângeri**: `NOT NULL`, `DEFAULT now()`
- **Logică Business**: Data și ora ultimei modificări
- **Logică Algoritmică**: Actualizat automat la fiecare modificare cu `now()`
- **Utilizare**: Audit trail, detectare modificări recente

### 🔗 Relații cu Alte Tabele

- **`accounts`**: Relație 1:N (un cont are mai multe înregistrări de solduri în timp)
- **`companies`**: Relație 1:N (o companie are solduri pentru toate conturile sale)

### 📈 Algoritmi Importanți

#### Algoritm Calcul Solduri de Închidere:
```
closing_debit = max(0, opening_debit + period_debit - period_credit)
closing_credit = max(0, opening_credit + period_credit - period_debit)
```

#### Algoritm Transfer Solduri între Perioade:
```
next_opening_debit = current_closing_debit
next_opening_credit = current_closing_credit
```

#### Validare Echilibru Contabil:
```
opening_debit - opening_credit + period_debit - period_credit = closing_debit - closing_credit
```

### 🎯 Scheme Drizzle Identificate

#### ✅ **Schema Standardizată** (în `/var/www/GeniusERP/libs/shared/src/schema/accounting.schema.ts`):
**NOTĂ:** Schema Drizzle pentru `AC_account_balances` este definită în `accounting.schema.ts` și este creată prin migrarea din `/var/www/GeniusERP/migrations/modules/accounting/create_AC_account_balances.ts`.
```typescript
export const AC_account_balances = pgTable('AC_account_balances', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  companyId: uuid('company_id').notNull(),
  accountId: uuid('account_id').notNull(),
  fiscalYear: integer('fiscal_year').notNull(),
  fiscalMonth: integer('fiscal_month').notNull(),
  openingDebit: decimal('opening_debit', { precision: 15, scale: 2 }).notNull().default('0'),
  openingCredit: decimal('opening_credit', { precision: 15, scale: 2 }).notNull().default('0'),
  periodDebit: decimal('period_debit', { precision: 15, scale: 2 }).notNull().default('0'),
  periodCredit: decimal('period_credit', { precision: 15, scale: 2 }).notNull().default('0'),
  closingDebit: decimal('closing_debit', { precision: 15, scale: 2 }).notNull().default('0'),
  closingCredit: decimal('closing_credit', { precision: 15, scale: 2 }).notNull().default('0'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`)
});

// Backward compatibility alias
export const account_balances = AC_account_balances;
```

#### ✅ **Schema Principală** (în `/var/www/GeniusERP/libs/shared/src/schema.ts`):
**ELIMINATĂ** - Schema duplicată eliminată pentru a evita conflictele. Schema canonică este cea din `accounting.schema.ts`.

### 🎨 Scheme Zod (Implementate)

```typescript
// Schema pentru inserare
export const insertAccountBalanceSchema = createInsertSchema(account_balances, {
  fiscalYear: z.number().int().min(2000).max(2100),
  fiscalMonth: z.number().int().min(1).max(12),
  openingDebit: z.string().regex(/^\d+(\.\d{1,2})?$/),
  openingCredit: z.string().regex(/^\d+(\.\d{1,2})?$/),
  periodDebit: z.string().regex(/^\d+(\.\d{1,2})?$/),
  periodCredit: z.string().regex(/^\d+(\.\d{1,2})?$/),
  closingDebit: z.string().regex(/^\d+(\.\d{1,2})?$/),
  closingCredit: z.string().regex(/^\d+(\.\d{1,2})?$/),
});

// Schema pentru selectare
export const selectAccountBalanceSchema = createSelectSchema(account_balances);

// Schema pentru actualizare
export const updateAccountBalanceSchema = insertAccountBalanceSchema.partial().omit({
  id: true,
  companyId: true,
  accountId: true,
  createdAt: true,
  updatedAt: true,
});

// Tipuri TypeScript generate
export type InsertAccountBalanceZod = z.infer<typeof insertAccountBalanceSchema>;
export type SelectAccountBalanceZod = z.infer<typeof selectAccountBalanceSchema>;
export type UpdateAccountBalanceZod = z.infer<typeof updateAccountBalanceSchema>;
```

### 🔄 Standardizare Snake_case (Finalizată)

**Fișiere standardizate:**
- ✅ `/var/www/GeniusERP/libs/shared/src/schema/accounting.schema.ts` - păstrează `account_balances` (snake_case) - **SCHEMA CANONICĂ**
- ✅ `/var/www/GeniusERP/libs/shared/src/schema.ts` - **ELIMINATĂ** schema duplicată `accountBalances` pentru evitare conflicte
- ✅ `/var/www/GeniusERP/libs/accounting/src/schema/accounting.schema.ts` - importă din shared, adaugă alias-uri
- ✅ Eliminare scheme duplicate incorecte
- ✅ Actualizare import-uri în toate fișierele de test
- ✅ Adăugare backward compatibility cu alias-uri camelCase

### 📋 Rezumat Audit Tabel `account_balances`

**Status: ✅ COMPLET** - Audit exhaustiv finalizat

**Modificări Implementate:**
- Schema Drizzle standardizată și validată (schema canonică în accounting.schema.ts)
- Scheme Zod complete pentru validare
- Standardizare snake_case în tot codebase-ul
- Relații și constraints implementate
- Documentație tehnică și business completă

**Schema Finală:** Fully compliant cu standardele RAS românești
**Testing:** ✅ Validat în fișierele de test
**Production Ready:** ✅ Gata pentru producție
---

# 2. PC_account_classes

## 📋 Detalii detaliate tabel: `PC_account_classes`

### 🎯 Scop și Rol în Sistem

Tabelul `PC_account_classes` reprezintă **clasificarea de nivel superior** a planului de conturi conform standardelor românești de contabilitate (RAS/OMFP 1802/2014). Acest tabel este **fundamental** pentru:

- **Ierarhia contabilă**: Definirea celor 9 clase principale (1-9)
- **Clasificare funcțională**: Distingerea între conturi de bilanț (1-7) și conturi de profit/pierdere (8-9)
- **Structura RAS**: Implementarea standardelor românești de contabilitate
- **Funcții contabile**: Determinarea comportamentului implicit al conturilor din fiecare clasă
- **Raportare financiară**: Bază pentru generarea bilanțului și contului de profit/pierdere

### 🏗️ Structură Tehnică

**Schema DB (PostgreSQL):**
```sql
CREATE TABLE public.PC_account_classes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    code character varying(1) NOT NULL,
    name text NOT NULL,
    description text,
    default_account_function text NOT NULL,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    updated_at timestamp without time zone NOT NULL DEFAULT now(),
    CONSTRAINT PC_account_classes_pkey PRIMARY KEY (id),
    CONSTRAINT PC_account_classes_code_unique UNIQUE (code)
);
```

**Indexes:**
- PRIMARY KEY: `PC_account_classes_pkey` pe `id`
- UNIQUE: `PC_account_classes_code_unique` pe `code`

**Referințe:**
- Referenced by: `PC_account_groups.class_id` → `PC_account_classes.id`
- Referenced by: `accounts.class_id` → `PC_account_classes.id`

### 📊 Coloane și Logică Business

#### 1. `id` - UUID Primar
- **Tip**: `uuid`
- **Constrângeri**: `PRIMARY KEY`, `NOT NULL`, `DEFAULT gen_random_uuid()`
- **Logică Business**: Identificator unic global pentru fiecare clasă de conturi
- **Logică Algoritmică**: Generat automat pentru fiecare nouă clasă adăugată
- **Utilizare**: Cheie primară, referințe către account_groups și accounts

#### 2. `code` - Codul Clasei
- **Tip**: `character varying(1)`
- **Constrângeri**: `NOT NULL`, `UNIQUE`
- **Logică Business**: Cod numeric unic al clasei (1-9 conform RAS)
- **Logică Algoritmică**: Validare că este cifră între 1-9, unic în sistem
- **Utilizare**: Identificare vizuală, sortare ierarhică, grupare rapoarte

#### 3. `name` - Denumirea Clasei
- **Tip**: `text`
- **Constrângeri**: `NOT NULL`
- **Logică Business**: Denumire descriptivă a clasei (ex: "Conturi de capital", "Conturi de venituri")
- **Logică Algoritmică**: Text liber, dar standardizat conform RAS
- **Utilizare**: Afișare în UI, rapoarte, documentație

#### 4. `description` - Descriere Detaliată
- **Tip**: `text`
- **Constrângeri**: Nullable
- **Logică Business**: Explicație detaliată a conținutului clasei și a tipurilor de conturi incluse
- **Logică Algoritmică**: Text liber pentru documentare și clarificare
- **Utilizare**: Tooltip-uri, help text, documentație tehnică

#### 5. `default_account_function` - Funcția Contabilă Implicită
- **Tip**: `text`
- **Constrângeri**: `NOT NULL`
- **Logică Business**: Definește funcția contabilă implicită pentru conturile din această clasă:
  - `'A'` (Asset/Activ/Debit): Conturi cu sold debitor normal (clase 1-2)
  - `'P'` (Passive/Liability/Credit): Conturi cu sold creditor normal (clase 3-4)
  - `'B'` (Bifunctional/Mixed): Conturi mixte fără funcție clar definită (clase 5-9)
- **Logică Algoritmică**: Enum implicit: 'A', 'P', sau 'B'
- **Utilizare**: Validare solduri, determinare funcție implicită în rapoarte

#### 6. `created_at` - Timestamp Creare
- **Tip**: `timestamp without time zone`
- **Constrângeri**: `NOT NULL`, `DEFAULT now()`
- **Logică Business**: Data și ora când a fost creată clasa
- **Logică Algoritmică**: Setat automat la inserare cu `now()`
- **Utilizare**: Audit trail, istoric modificări

#### 7. `updated_at` - Timestamp Actualizare
- **Tip**: `timestamp without time zone`
- **Constrângeri**: `NOT NULL`, `DEFAULT now()`
- **Logică Business**: Data și ora ultimei modificări
- **Logică Algoritmică**: Actualizat automat la fiecare modificare cu `now()`
- **Utilizare**: Audit trail, detectare modificări recente

### 🔗 Relații cu Alte Tabele

- **`account_groups`**: Relație 1:N (o clasă are mai multe grupe)
- **`accounts`**: Relație 1:N (o clasă conține mai multe conturi)

### 📈 Algoritmi Importanți

#### Algoritm Determinarea Funcției Contabile:
```
function getAccountFunction(accountClassCode):
  switch(accountClassCode):
    case 1, 2: return 'A'  // Assets
    case 3, 4: return 'P'  // Liabilities/Equity
    case 5-9: return 'B'   // Mixed/Income/Expenses
```

#### Algoritm Validare Sold Cont:
```
function validateAccountBalance(account, balance):
  expectedFunction = getAccountFunction(account.class.code)
  if (expectedFunction == 'A' && balance < 0) warning("Sold creditor pe cont activ")
  if (expectedFunction == 'P' && balance > 0) warning("Sold debitor pe cont pasiv")
```

### 🎯 Scheme Drizzle Identificate

#### ✅ **Schema Canonică** (în `/var/www/GeniusERP/libs/shared/src/schema/core.schema.ts`):
```typescript
export const PC_account_classes = pgTable('PC_account_classes', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  code: varchar('code', { length: 1 }).notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  default_account_function: text('default_account_function').notNull(), // 'A', 'P', 'B'
  created_at: timestamp('created_at').notNull().default(sql`now()`),
  updated_at: timestamp('updated_at').notNull().default(sql`now()`)
}, (table) => ({
  code_unique: unique('PC_account_classes_code_unique').on(table.code),
  code_idx: index('idx_PC_account_classes_code').on(table.code),
}));
```

### 🎨 Scheme Zod (Implementate)

```typescript
// Schema pentru inserare
export const insertAccountClassSchema = createInsertSchema(PC_account_classes, {
  code: z.string().length(1).regex(/^[1-9]$/, "Codul clasei trebuie să fie cifră 1-9"),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  default_account_function: z.enum(['A', 'P', 'B'], {
    errorMap: () => ({ message: "Funcția trebuie să fie A (Activ), P (Pasiv), sau B (Mixt)" })
  })
});

// Schema pentru selectare
export const selectAccountClassSchema = createSelectSchema(PC_account_classes);

// Schema pentru actualizare
export const updateAccountClassSchema = insertAccountClassSchema.partial().omit({
  id: true,
  created_at: true,
  updated_at: true
});

// Tipuri TypeScript
export type InsertAccountClassZod = z.infer<typeof insertAccountClassSchema>;
export type SelectAccountClassZod = z.infer<typeof selectAccountClassSchema>;
export type UpdateAccountClassZod = z.infer<typeof updateAccountClassSchema>;
```

### 🔄 Standardizare Snake_case (Finalizată)

**Fișiere standardizate:**
- ✅ Eliminare definiție duplicată din `schema.ts`
- ✅ Păstrare definiție canonică din `core.schema.ts`
- ✅ Actualizare relații în `schema.ts` să folosească `PC_account_classes`
- ✅ Adăugare scheme Zod complete în `core.schema.ts`
- ✅ Standardizare variabile și proprietăți în tot codebase-ul

### 📋 Rezumat Audit Tabel `PC_account_classes`

**Status: ✅ COMPLET** - Audit exhaustiv finalizat, toate probleme rezolvate

**Modificări Implementate:**
- ✅ Eliminare schema duplicată din schema.ts
- ✅ Implementare scheme Zod complete pentru validare
- ✅ Standardizare snake_case în tot codebase-ul
- ✅ Actualizare relații și import-uri
- ✅ Documentație tehnică și business completă

**Importanță în Sistem:** ⭐⭐⭐⭐⭐ (Critică pentru ierarhia contabilă)

### 🚀 Sistem Nou de Migrații - Implementat

**Status: ✅ COMPLET** - Migrare canonică implementată în sistemul modular

**Locație:** `/var/www/GeniusERP/migrations/modules/core/create_account_classes.ts` (creează tabel `PC_account_classes`)

**Caracteristici:**
- ✅ Funcții `up`/`down` pentru create/drop tabel
- ✅ Constrângeri și indexuri implementate
- ✅ Check constraint pentru valori valide `default_account_function`
- ✅ Comentarii detaliate și documentare completă
- ✅ Gata pentru deployment în medii noi/clean

**Scop:** Migrarea servește pentru:
- 📋 **Documentare** completă a structurii tabelului
- 🧪 **Testare** pe medii de development noi
- 🔄 **Rollback** în caz de necesitate
- 📚 **Referință** pentru dezvoltare viitoare

**Notă:** Tabelul există deja în producție - migrarea NU trebuie rulată acum!

---

# 3. PC_account_groups

## 📋 Descriere Generală

**Tabel:** `PC_account_groups` - **Grupuri de Conturi**

**Scop:** Al doilea nivel al ierarhiei Planului de Conturi Românesc, grupând conturile sintetice în categorii logice în cadrul fiecărei clase.

**Importanță în Sistem:** ⭐⭐⭐⭐⭐ (Critică - Fundament ierarhiei contabile)

**Context Business:**
- Reprezintă **grupurile de conturi** din cadrul fiecărei clase (1-9)
- Codurile sunt formate din **2 cifre** (ex: 10, 11, 20, 30, etc.)
- Prima cifră = clasa, a doua cifră = grupul în cadrul clasei
- Exemple: 10=Capital și rezerve, 20=Imobilizări necorporale, 30=Stocuri, etc.

## 🏗️ Structură Tehnică

### DDL PostgreSQL
```sql
CREATE TABLE public.PC_account_groups (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    code character varying(2) NOT NULL,
    name text NOT NULL,
    description text,
    class_id uuid NOT NULL,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    updated_at timestamp without time zone NOT NULL DEFAULT now(),
    CONSTRAINT PC_account_groups_pkey PRIMARY KEY (id),
    CONSTRAINT PC_account_groups_code_unique UNIQUE (code),
    CONSTRAINT PC_account_groups_class_id_PC_account_classes_id_fk
        FOREIGN KEY (class_id) REFERENCES PC_account_classes(id)
);

-- Indexes
CREATE UNIQUE INDEX PC_account_groups_code_unique ON PC_account_groups(code);
CREATE INDEX idx_PC_account_groups_code ON PC_account_groups(code);
CREATE INDEX idx_PC_account_groups_class_id ON PC_account_groups(class_id);
```

### Schema Drizzle ORM
```typescript
export const PC_account_groups = pgTable('PC_account_groups', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  code: varchar('code', { length: 2 }).notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  class_id: uuid('class_id').notNull(),
  created_at: timestamp('created_at').notNull().default(sql`now()`),
  updated_at: timestamp('updated_at').notNull().default(sql`now()`)
}, (table) => ({
  code_unique: unique('PC_account_groups_code_unique').on(table.code),
  code_idx: index('idx_PC_account_groups_code').on(table.code),
  class_idx: index('idx_PC_account_groups_class_id').on(table.class_id),
}));
```

## 📊 Detalierea Coloanelor

### 1. `id` - Identificator Unic
- **Tip:** `uuid` (PostgreSQL), `uuid('id')` (Drizzle)
- **Constrângeri:** `PRIMARY KEY`, `NOT NULL`, `DEFAULT gen_random_uuid()`
- **Business Logic:** Identificator global unic pentru fiecare grup de conturi
- **Algoritmic:** Generat automat la inserare folosind `gen_random_uuid()`
- **Validare:** Format UUID valid (36 caractere, inclusiv dash-uri)

### 2. `code` - Codul Grupului
- **Tip:** `character varying(2)` (PostgreSQL), `varchar('code', { length: 2 })` (Drizzle)
- **Constrângeri:** `NOT NULL`, `UNIQUE`
- **Business Logic:** Cod format din 2 cifre reprezentând clasa+grup (ex: "10", "20", "30")
- **Algoritmic:**
  - Prima cifră = codul clasei (1-9)
  - A doua cifră = numărul grupului în cadrul clasei (0-9)
  - Unic în cadrul întregului plan de conturi
- **Validare:** Exact 2 cifre, prima cifră 1-9, format: `/^[0-9]{2}$/`
- **Exemple:** "10"=Capital și rezerve, "20"=Imobilizări necorporale, "30"=Stocuri

### 3. `name` - Denumirea Grupului
- **Tip:** `text` (PostgreSQL), `text('name')` (Drizzle)
- **Constrângeri:** `NOT NULL`
- **Business Logic:** Denumire descriptivă a grupului de conturi conform legislației române
- **Algoritmic:** Text liber, dar trebuie să fie unic și să respecte nomenclatorul oficial
- **Validare:** Minimum 1 caracter, maximum 255 caractere
- **Exemple:** "Capital și rezerve", "Imobilizări necorporale", "Stocuri de materii prime"

### 4. `description` - Descriere Detaliată
- **Tip:** `text` (PostgreSQL), `text('description')` (Drizzle)
- **Constrângeri:** `NULL` permis (opțional)
- **Business Logic:** Descriere extinsă a conținutului și scopului grupului
- **Algoritmic:** Text liber pentru clarificări suplimentare
- **Validare:** Opțional, fără limită de lungime practică

### 5. `class_id` - Referință către Clasă
- **Tip:** `uuid` (PostgreSQL), `uuid('class_id')` (Drizzle)
- **Constrângeri:** `NOT NULL`, `FOREIGN KEY` către `PC_account_classes(id)`
- **Business Logic:** Leagă grupul de clasa contabilă căreia îi aparține
- **Algoritmic:** Prima cifră a codului grupului trebuie să corespundă cu codul clasei
- **Validare:** UUID valid care există în tabelul `PC_account_classes`

### 6. `created_at` - Timestamp Creare
- **Tip:** `timestamp without time zone` (PostgreSQL), `timestamp('created_at')` (Drizzle)
- **Constrângeri:** `NOT NULL`, `DEFAULT now()`
- **Business Logic:** Momentul creării înregistrării în sistem
- **Algoritmic:** Setat automat la inserare cu `now()`

### 7. `updated_at` - Timestamp Ultima Modificare
- **Tip:** `timestamp without time zone` (PostgreSQL), `timestamp('updated_at')` (Drizzle)
- **Constrângeri:** `NOT NULL`, `DEFAULT now()`
- **Business Logic:** Momentul ultimei modificări a înregistrării
- **Algoritmic:** Actualizat automat la fiecare modificare

## 🔗 Relații cu Alte Tabele

### Relație Parent: `PC_account_classes` (1:N)
- **Tip:** `One-to-Many` (o clasă are mai multe grupe)
- **Foreign Key:** `class_id` → `PC_account_classes.id`
- **Business Logic:** Ierarhie clasică contabilă (Clasă → Grupă → Cont Sintetic → Cont Analitic)

### Relație Child: `synthetic_accounts` (1:N)
- **Tip:** `One-to-Many` (o grupă are mai multe conturi sintetice)
- **Foreign Key:** `synthetic_accounts.group_id` → `PC_account_groups.id`
- **Business Logic:** Continuarea ierarhiei contabile

## 📝 Scheme Zod pentru Validare

```typescript
// Schema pentru inserare
export const insertAccountGroupSchema = createInsertSchema(PC_account_groups, {
  code: z.string().length(2).regex(/^[0-9]{2}$/, "Codul grupei trebuie să fie 2 cifre"),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  class_id: z.string().uuid()
});

// Schema pentru selectare
export const selectAccountGroupSchema = createSelectSchema(PC_account_groups);

// Schema pentru actualizare
export const updateAccountGroupSchema = insertAccountGroupSchema.partial().omit({
  id: true,
  created_at: true,
  updated_at: true
});

// Tipuri TypeScript
export type InsertAccountGroupZod = z.infer<typeof insertAccountGroupSchema>;
export type SelectAccountGroupZod = z.infer<typeof selectAccountGroupSchema>;
export type UpdateAccountGroupZod = z.infer<typeof updateAccountGroupSchema>;
```

## 🔄 Standardizare Snake_case (Finalizată)

**Fișiere standardizate:**
- ✅ Eliminare definiție duplicată din `schema.ts`
- ✅ Păstrare definiție canonică din `core.schema.ts`
- ✅ Actualizare relații în `core.schema.ts` să folosească `PC_account_groups`
- ✅ Scheme Zod complete implementate
- ✅ Standardizare variabile și proprietăți în tot codebase-ul

## 📋 Rezumat Audit Tabel `PC_account_groups`

**Status: ✅ COMPLET** - Audit exhaustiv finalizat, toate probleme rezolvate

**Modificări Implementate:**
- ✅ Eliminare schema duplicată din schema.ts
- ✅ Implementare scheme Zod complete pentru validare
- ✅ Standardizare snake_case în tot codebase-ul
- ✅ Actualizare relații și import-uri
- ✅ Documentație tehnică și business completă

**Importanță în Sistem:** ⭐⭐⭐⭐⭐ (Critică pentru ierarhia contabilă)

**Logică Business Validată:**
- ✅ Coduri 2 cifre: prima = clasă, a doua = grup
- ✅ Unicitate cod în întreg planul de conturi
- ✅ Relație strictă cu clasele contabile
- ✅ Nomenclator oficial român respectat

---

# 4. PC_synthetic_accounts

## 📋 Descriere Generală

**Tabel:** `PC_synthetic_accounts` - **Conturi Sintetice (Plan de Conturi)**

**Prefix PC_:** Plan de Conturi - pentru identificare ușoară și consistență

**Backward Compatibility:** Pentru compatibilitate cu codul existent, există alias-uri:
```typescript
export const synthetic_accounts = PC_synthetic_accounts;
export type SyntheticAccount = PC_SyntheticAccount;
```

**Scop:** Al treilea nivel al ierarhiei Planului de Conturi Românesc, reprezentând conturile sintetice de gradul I (3 cifre, ex: 401) și gradul II (4 cifre, ex: 4011).

**Importanță în Sistem:** ⭐⭐⭐⭐⭐ (Critică - Nivelul principal de lucru în contabilitate)

**Caracteristici distinctive:**
- Structură ierarhică cu 2 niveluri de detaliere (grad 1 și grad 2)
- Codificare: gradul 1 = 3 cifre (ex: 401, 121), gradul 2 = 4 cifre (ex: 4011, 1211)
- Prima cifră = clasa, primele 2 cifre = grupa, 3-4 cifre = cont sintetic
- Auto-referință pentru conturi grad 2 (parent_id → conturi grad 1)
- **781 înregistrări** în baza de date de producție

## 🏗️ Structură Tehnică

### DDL PostgreSQL
```sql
CREATE TABLE public.PC_synthetic_accounts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    code character varying(4) NOT NULL,
    name text NOT NULL,
    description text,
    account_function text NOT NULL,
    grade integer NOT NULL,
    group_id uuid NOT NULL,
    parent_id uuid,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    updated_at timestamp without time zone NOT NULL DEFAULT now(),
    CONSTRAINT PC_synthetic_accounts_pkey PRIMARY KEY (id),
    CONSTRAINT PC_synthetic_accounts_code_unique UNIQUE (code),
    CONSTRAINT PC_synthetic_accounts_group_id_PC_account_groups_id_fk 
        FOREIGN KEY (group_id) REFERENCES PC_account_groups(id),
    CONSTRAINT PC_synthetic_accounts_parent_id_PC_synthetic_accounts_id_fk 
        FOREIGN KEY (parent_id) REFERENCES PC_synthetic_accounts(id)
);

-- Indexes
CREATE UNIQUE INDEX PC_synthetic_accounts_code_unique ON PC_synthetic_accounts(code);
CREATE INDEX PC_synthetic_accounts_code_idx ON PC_synthetic_accounts(code);
CREATE INDEX PC_synthetic_accounts_group_idx ON PC_synthetic_accounts(group_id);
CREATE INDEX PC_synthetic_accounts_parent_idx ON PC_synthetic_accounts(parent_id);
CREATE INDEX PC_synthetic_accounts_function_idx ON PC_synthetic_accounts(account_function);
```

### Schema Drizzle ORM
```typescript
export const PC_synthetic_accounts = pgTable('PC_synthetic_accounts', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  code: varchar('code', { length: 4 }).notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  account_function: text('account_function').notNull(), // 'A', 'P', 'B'
  grade: integer('grade').notNull(), // 1 or 2
  group_id: uuid('group_id').notNull(),
  parent_id: uuid('parent_id'), // Self-reference for grade 2 accounts
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').notNull().default(sql`now()`),
  updated_at: timestamp('updated_at').notNull().default(sql`now()`)
}, (table) => ({
  code_unique: unique('PC_synthetic_accounts_code_unique').on(table.code),
  code_idx: index('PC_synthetic_accounts_code_idx').on(table.code),
  group_idx: index('PC_synthetic_accounts_group_idx').on(table.group_id),
  parent_idx: index('PC_synthetic_accounts_parent_idx').on(table.parent_id),
  function_idx: index('PC_synthetic_accounts_function_idx').on(table.account_function),
}));
```

## 📊 Detalierea Coloanelor

### 1. `id` - Identificator Unic
- **Tip:** `uuid` (PostgreSQL), `uuid('id')` (Drizzle)
- **Constrângeri:** `PRIMARY KEY`, `NOT NULL`, `DEFAULT gen_random_uuid()`
- **Business Logic:** Identificator unic pentru fiecare cont sintetic
- **Algoritmic:** Generat automat de PostgreSQL la inserare
- **Validare:** UUID valid în format standard

### 2. `code` - Cod Cont Sintetic
- **Tip:** `character varying(4)` (PostgreSQL), `varchar('code', { length: 4 })` (Drizzle)
- **Constrângeri:** `NOT NULL`, `UNIQUE`
- **Business Logic:** Codificare standard contabilitate românească
  - **Grad 1:** 3 cifre (ex: 101, 401, 121)
  - **Grad 2:** 4 cifre (ex: 1011, 4011, 1211)
  - Prima cifră = cod clasă (1-9)
  - Primele 2 cifre = cod grupă (10-99)
  - 3-4 cifre = cod cont sintetic
- **Algoritmic:** 
  - Extracția clasei: `code.charAt(0)`
  - Extracția grupei: `code.substring(0, 2)`
  - Validare cod: trebuie să înceapă cu grupa parent
- **Validare:** Regex `^[0-9]{3,4}$`, trebuie să corespundă cu grupa referențiată

### 3. `name` - Denumire Cont
- **Tip:** `text` (PostgreSQL), `text('name')` (Drizzle)
- **Constrângeri:** `NOT NULL`
- **Business Logic:** Denumirea oficială a contului sintetic conform OMFP 1802/2014
- **Algoritmic:** Text liber, minim 1 caracter
- **Validare:** `string().min(1).max(255)` în Zod (deși DB nu are limită)

### 4. `description` - Descriere Detaliată
- **Tip:** `text` (PostgreSQL), `text('description')` (Drizzle)
- **Constrângeri:** `NULLABLE`
- **Business Logic:** Detalii suplimentare despre utilizarea contului
- **Algoritmic:** Text liber opțional
- **Validare:** Optional string în Zod

### 5. `account_function` - Funcția Contabilă
- **Tip:** `text` (PostgreSQL), `text('account_function')` (Drizzle)
- **Constrângeri:** `NOT NULL`
- **Business Logic:** Determină comportamentul implicit al contului în balanță
  - **'A' (Activ):** Sold normal debitor - active, cheltuieli
  - **'P' (Pasiv):** Sold normal creditor - pasive, capitaluri, venituri
  - **'B' (Bifuncțional):** Sold debitor sau creditor - conturi duble
- **Algoritmic:** 
  - Moștenit de la grupa parent sau clasa parent
  - Determinat la crearea contului
  - Folosit în calculul balanței și validarea înregistrărilor
- **Validare:** `z.enum(['A', 'P', 'B'])` în Zod

### 6. `grade` - Gradul Contului
- **Tip:** `integer` (PostgreSQL), `integer('grade')` (Drizzle)
- **Constrângeri:** `NOT NULL`
- **Business Logic:** Nivelul de detaliere al contului sintetic
  - **1:** Conturi de grad 1 (3 cifre) - nivel de bază
  - **2:** Conturi de grad 2 (4 cifre) - detaliere suplimentară
- **Algoritmic:** 
  - Determinat automat din lungimea codului
  - Grad 1 → `code.length === 3`
  - Grad 2 → `code.length === 4`
  - Conturile grad 2 trebuie să aibă parent_id către un cont grad 1
- **Validare:** `integer().min(1).max(2)` în Zod

### 7. `group_id` - Referință către Grupă
- **Tip:** `uuid` (PostgreSQL), `uuid('group_id')` (Drizzle)
- **Constrângeri:** `NOT NULL`, `FOREIGN KEY` către `account_groups(id)`
- **Business Logic:** Leagă contul sintetic de grupa contabilă căreia îi aparține
- **Algoritmic:** 
  - Primele 2 cifre ale codului contului trebuie să corespundă cu codul grupei
  - Validare: `chartOfAccountsUtils.extractGroupCode(code)` === `group.code`
- **Validare:** UUID valid care există în tabelul `account_groups`

### 8. `parent_id` - Referință către Cont Părinte
- **Tip:** `uuid` (PostgreSQL), `uuid('parent_id')` (Drizzle)
- **Constrângeri:** `NULLABLE`, `FOREIGN KEY` către `synthetic_accounts(id)` (self-reference)
- **Business Logic:** Ierarhie între conturi sintetice de grad 1 și 2
  - Conturile **grad 1** au `parent_id = NULL` (sunt rădăcină)
  - Conturile **grad 2** au `parent_id` către un cont grad 1
  - Prima cifră a contului grad 2 trebuie să corespundă cu codul contului grad 1 parent
- **Algoritmic:** 
  - Auto-referință circulară pentru construirea arborelui contabil
  - Validare parent: `if (grade === 2) parent_id IS NOT NULL`
  - Validare cod: `code.substring(0, 3)` === `parent.code`
- **Validare:** UUID valid opțional, trebuie să existe în `synthetic_accounts` dacă este setat

### 9. `is_active` - Status Activ
- **Tip:** `boolean` (PostgreSQL), `boolean('is_active')` (Drizzle)
- **Constrângeri:** `DEFAULT true`
- **Business Logic:** Indică dacă contul este activ și poate fi folosit
- **Algoritmic:** 
  - `true` → contul poate fi folosit în înregistrări noi
  - `false` → contul este dezactivat, doar pentru vizualizare istorică
- **Validare:** Boolean în Zod, default `true`

### 10. `created_at` - Timestamp Creare
- **Tip:** `timestamp without time zone` (PostgreSQL), `timestamp('created_at')` (Drizzle)
- **Constrângeri:** `NOT NULL`, `DEFAULT now()`
- **Business Logic:** Momentul creării înregistrării în sistem
- **Algoritmic:** Setat automat de PostgreSQL la INSERT
- **Validare:** Timestamp valid

### 11. `updated_at` - Timestamp Actualizare
- **Tip:** `timestamp without time zone` (PostgreSQL), `timestamp('updated_at')` (Drizzle)
- **Constrângeri:** `NOT NULL`, `DEFAULT now()`
- **Business Logic:** Momentul ultimei modificări a înregistrării
- **Algoritmic:** Actualizat automat la fiecare UPDATE
- **Validare:** Timestamp valid

## 🔗 Relații cu Alte Tabele

### Relație Parent: `account_groups` (N:1)
- **Tip:** `Many-to-One` (multe conturi sintetice aparțin unei grupe)
- **Foreign Key:** `group_id` → `account_groups.id`
- **Business Logic:** Ierarhie contabilă (Clasă → Grupă → Cont Sintetic)

### Relație Self-Reference: `synthetic_accounts` (N:1)
- **Tip:** `Many-to-One` (conturi grad 2 au un parent grad 1)
- **Foreign Key:** `parent_id` → `synthetic_accounts.id`
- **Business Logic:** Ierarhie între conturile sintetice de diferite grade

### Relație Child: `analytic_accounts` (1:N)
- **Tip:** `One-to-Many` (un cont sintetic poate avea mai multe conturi analitice)
- **Foreign Key:** `analytic_accounts.synthetic_id` → `synthetic_accounts.id`
- **Business Logic:** Următorul nivel de detaliere contabilă

### Relație Child: `accounts` (1:N) - Legacy
- **Tip:** `One-to-Many` (referință din tabelul vechi accounts)
- **Foreign Key:** `accounts.synthetic_id` → `synthetic_accounts.id`
- **Business Logic:** Compatibilitate cu sistemul vechi

## 📝 Scheme Zod pentru Validare

```typescript
// Schema pentru inserare
export const insertSyntheticAccountSchema = createInsertSchema(synthetic_accounts, {
  code: z.string().length(3).regex(/^[0-9]{3}$/, "Codul contului sintetic trebuie să fie 3 cifre"),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  account_function: z.enum(['A', 'P', 'B']),
  group_id: z.string().uuid(),
  parent_id: z.string().uuid().optional()
});

// Schema pentru selectare
export const selectSyntheticAccountSchema = createSelectSchema(synthetic_accounts);

// Schema pentru actualizare
export const updateSyntheticAccountSchema = insertSyntheticAccountSchema.partial().omit({
  id: true,
  created_at: true,
  updated_at: true
});

// Tipuri TypeScript
export type InsertSyntheticAccountZod = z.infer<typeof insertSyntheticAccountSchema>;
export type SelectSyntheticAccountZod = z.infer<typeof selectSyntheticAccountSchema>;
export type UpdateSyntheticAccountZod = z.infer<typeof updateSyntheticAccountSchema>;
```

**Validări Avansate Implementate:**
```typescript
// Validare 1: parent_id obligatoriu pentru grad 2, interzis pentru grad 1
.refine((data) => {
  if (data.grade === 1 && data.parent_id) return false;
  if (data.grade === 2 && !data.parent_id) return false;
  return true;
})

// Validare 2: Concordanță grad cu lungimea codului
.refine((data) => {
  const determinedGrade = chartOfAccountsUtils.determineGrade(data.code);
  return !determinedGrade || determinedGrade === data.grade;
})
```

## 🛠️ Funcții Utilitare `chartOfAccountsUtils`

**Locație:** `libs/shared/src/schema/core.schema.ts`

| **Funcție** | **Scop** | **Exemplu** |
|-------------|----------|-------------|
| `extractClassCode(code)` | Extrage codul clasei (prima cifră) | `"401"` → `"4"` |
| `extractGroupCode(code)` | Extrage codul grupei (primele 2 cifre) | `"401"` → `"40"` |
| `extractSyntheticPrefix(code)` | Extrage prefixul sintetic din cont analitic | `"401.1"` → `"401"` |
| `validateCodeClassMatch(code, classCode)` | Validează că codul aparține clasei | `("401", "4")` → `true` |
| `validateCodeGroupMatch(code, groupCode)` | Validează că codul aparține grupei | `("401", "40")` → `true` |
| `validateGrade2Hierarchy(code2, code1)` | Validează ierarhie grad 2 → grad 1 | `("4011", "401")` → `true` |
| `determineGrade(code)` | Determină gradul din lungimea codului | `"401"` → `1`, `"4011"` → `2` |

**Utilizare:**
```typescript
import { chartOfAccountsUtils } from '@geniuserp/shared';

// Exemplu: Validare ierarhie
const isValid = chartOfAccountsUtils.validateGrade2Hierarchy("4011", "401"); // true

// Exemplu: Extragere grup
const groupCode = chartOfAccountsUtils.extractGroupCode("401"); // "40"
```

## 🔄 Standardizare Snake_case (Finalizată)

**Fișiere standardizate:**
- ✅ Definiție canonică în `libs/shared/src/schema/core.schema.ts`
- ✅ Scheme Zod complete implementate cu validări avansate
- ✅ Relații bidirecționale configurate (group, parent, children, analytic)
- ✅ Standardizare variabile și proprietăți în tot codebase-ul
- ✅ Eliminare logică duplicată din `journal.service.ts`
- ✅ Centralizare funcții utilitare în `chartOfAccountsUtils`
- ✅ Verificări `is_active` în `storage.ts` și `accounting-settings.service.ts`

## 📋 Rezumat Audit Tabel `synthetic_accounts`

**Status: ✅ COMPLET** - Audit exhaustiv finalizat, toate probleme rezolvate

**Modificări Implementate:**
- ✅ Schema Drizzle standardizată cu snake_case
- ✅ Scheme Zod complete cu validări robuste (parent_id, grade, code)
- ✅ Relații bidirecționale configurate corect
- ✅ Indexes optimizate pentru performanță
- ✅ Foreign keys implementate pentru integritate
- ✅ **NOU:** Funcții utilitare centralizate în `chartOfAccountsUtils`
- ✅ **NOU:** Eliminare cod duplicat pentru extragere clasă/grupă
- ✅ **NOU:** Verificări `is_active` în toate query-urile
- ✅ **NOU:** Validare strictă frontend pentru conturi analitice

**Caracteristici Distinctive:**
- **Ierarhie pe 2 niveluri:** Grad 1 (3 cifre) și Grad 2 (4 cifre)
- **Auto-referință:** Conturi grad 2 referențiază conturi grad 1
- **Codificare strictă:** Primele cifre trebuie să corespundă cu grupa/parent-ul
- **Funcție contabilă:** A/P/B determină comportamentul în balanță
- **781 conturi:** Planul complet de conturi românesc
- **Validări avansate:** Parent_id, grade, și code consistency

**Date în Producție:**
- **Total înregistrări:** 781 conturi sintetice
- **Grad 1:** Conturi de bază (3 cifre)
- **Grad 2:** Detalieri suplimentare (4 cifre)
- **Sursa:** OMFP 1802/2014 - Planul de Conturi Român

**Probleme Rezolvate:**
- ❌ → ✅ Logică duplicată pentru extragere clasă/grupă (centralizată în utils)
- ❌ → ✅ Validări lipsă pentru parent_id și grade (implementate în Zod)
- ❌ → ✅ Validare prea permisivă frontend (corectată cu regex strict)
- ❌ → ✅ Lipsa verificări `is_active` (adăugată în toate query-urile)

---

# 5. PC_analytic_accounts

## 📋 Detalii detaliate tabel: `PC_analytic_accounts`

### 🎯 Scop și Rol în Sistem

Tabelul `PC_analytic_accounts` reprezintă **cel mai detaliat nivel din ierarhia Planului de Conturi Român**. Acesta este ultimul nivel de granularitate contabilă și este folosit pentru:

- **Detalieri analitice** ale conturilor sintetice (5+ cifre)
- **Urmărire pe gestiuni** (ex: 371.1, 371.40 pentru mărfuri pe diferite depozite)
- **Urmărire pe parteneri** (ex: conturi furnizori, clienți specific per partener)
- **Urmărire pe proiecte** sau centre de cost
- **Generare rapoarte detaliate** la cel mai fin nivel de analiză

**Prefix PC_** = **Plan de Conturi** pentru identificare ușoară, standardizare și consistență cu celelalte tabele din ierarhia contabilă.

### 🏗️ Structură Tehnică

**Schema DB (PostgreSQL):**
```sql
CREATE TABLE public.PC_analytic_accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code character varying(20) NOT NULL UNIQUE,
    name text NOT NULL,
    description text,
    synthetic_id uuid NOT NULL,
    account_function text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    updated_at timestamp without time zone NOT NULL DEFAULT now(),
    CONSTRAINT PC_analytic_accounts_code_unique UNIQUE (code),
    CONSTRAINT PC_analytic_accounts_synthetic_id_PC_synthetic_accounts_id_fk 
        FOREIGN KEY (synthetic_id) REFERENCES PC_synthetic_accounts(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE
);
```

**Indexes:**
- `PC_analytic_accounts_pkey` PRIMARY KEY pe `id`
- `PC_analytic_accounts_code_unique` UNIQUE pe `code`
- `PC_analytic_accounts_code_idx` pe `code` (performance)
- `PC_analytic_accounts_synthetic_idx` pe `synthetic_id` (joins)
- `PC_analytic_accounts_function_idx` pe `account_function` (filtering)

**Schema Drizzle (TypeScript):**
```typescript
export const PC_analytic_accounts = pgTable('PC_analytic_accounts', {
  id: uuid('id').primaryKey().notNull().default(sql`gen_random_uuid()`),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  synthetic_id: uuid('synthetic_id').notNull(),
  account_function: text('account_function').notNull(),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').notNull().default(sql`now()`),
  updated_at: timestamp('updated_at').notNull().default(sql`now()`)
}, (table) => ({
  code_unique: unique('PC_analytic_accounts_code_unique').on(table.code),
  code_idx: index('PC_analytic_accounts_code_idx').on(table.code),
  synthetic_idx: index('PC_analytic_accounts_synthetic_idx').on(table.synthetic_id),
  function_idx: index('PC_analytic_accounts_function_idx').on(table.account_function),
}));
```

**Locație Schema:** `/var/www/GeniusERP/libs/shared/src/schema/core.schema.ts`

### 📊 Coloane și Logică Business

#### 1. `id` (uuid, PRIMARY KEY, NOT NULL)
- **Tip:** UUID (Universally Unique Identifier)
- **Default:** `gen_random_uuid()`
- **Nullable:** ❌ NOT NULL
- **Scop:** Identificator unic și stabil pentru fiecare cont analitic
- **Logică Business:** 
  - Generat automat la inserare
  - Folosit pentru relații FK în tabele downstream (ex: `accounts`, `journal_lines`)
  - Nu se modifică niciodată după creare
- **Algoritm:** PostgreSQL `gen_random_uuid()` - UUID v4 random

#### 2. `code` (varchar(20), UNIQUE, NOT NULL)
- **Tip:** VARCHAR(20) - string de maxim 20 caractere
- **Constraint:** UNIQUE - fiecare cont analitic trebuie să aibă cod unic
- **Format:** **Minimum 5 caractere cifre**, poate include punct pentru sub-niveluri (ex: `371.1`, `4426.40`, `511.01.001`)
- **Pattern regex:** `^[0-9]{3,4}(\.[0-9]+)+$` (cod sintetic + cel puțin un nivel analitic)
- **Scop:** Identificator contabil uman-readable
- **Logică Business:**
  - Primele 3-4 cifre **TREBUIE** să corespundă cu codul contului sintetic părinte (ex: `371.1` → sintetic `371`)
  - După punct urmează identificatorul gestiunii/partenerului/proiectului
  - Structură ierarhică: `[sintetic].[nivel1].[nivel2].[nivelN]`
  - **Generare automată:** La crearea unei gestiuni/companii/proiect → sistem generează automat conturile analitice necesare
- **Validări:**
  - Minimum 5 caractere (3 cifre sintetic + punct + 1 cifră analitică)
  - Trebuie să înceapă cu un cod sintetic valid existent
  - Unicitate globală în sistem

#### 3. `name` (text, NOT NULL)
- **Tip:** TEXT - string nelimitat
- **Nullable:** ❌ NOT NULL
- **Format:** Text liber, recomandat maxim 255 caractere
- **Scop:** Denumirea contului analitic
- **Logică Business:**
  - Denumire descriptivă care include specificul analitic (gestiune, partener, etc.)
  - **Pattern:** `[Denumire Sintetic] pentru [Entitate]`
  - Exemplu: `"Mărfuri în gestiunea Constanta Test"`, `"Casa în lei pentru gestiunea Magazin Brăila"`
- **Generare:** 
  - Automată la crearea gestiunii: `{nume_sintetic} pentru gestiunea {nume_gestiune}`
  - Automată la crearea partenerului: `{nume_sintetic} - {nume_partener}`
- **Algoritm:**
  ```typescript
  const analyticName = `${syntheticAccount.name} pentru gestiunea ${warehouse.name}`;
  ```

#### 4. `description` (text, NULLABLE)
- **Tip:** TEXT - string nelimitat
- **Nullable:** ✅ NULL permis
- **Scop:** Descriere extinsă, detalii suplimentare despre cont
- **Logică Business:**
  - Opțional - folosit pentru clarificări suplimentare
  - Poate conține informații despre scop, restricții, modalitate de utilizare

#### 5. `synthetic_id` (uuid, NOT NULL, FOREIGN KEY)
- **Tip:** UUID
- **Nullable:** ❌ NOT NULL
- **Foreign Key:** → `PC_synthetic_accounts(id)` ON DELETE RESTRICT ON UPDATE CASCADE
- **Scop:** Relația ierarhică către contul sintetic părinte
- **Logică Business:**
  - **Obligatoriu:** Orice cont analitic TREBUIE să aibă un părinte sintetic
  - **Validare:** `synthetic_id` trebuie să corespundă cu primele 3-4 cifre din `code`
  - **Algoritm de validare:**
    ```typescript
    const syntheticCode = chartOfAccountsUtils.extractSyntheticPrefix(analyticCode);
    // Verifică că syntheticCode == synthetic.code
    ```
- **ON DELETE RESTRICT:** Nu poți șterge un cont sintetic dacă are conturi analitice dependente
- **ON UPDATE CASCADE:** Dacă se modifică ID-ul sintetic (rareori), se actualizează automat

#### 6. `account_function` (text, NOT NULL)
- **Tip:** TEXT cu CHECK constraint
- **Constraint:** `CHECK (account_function IN ('A', 'P', 'B', 'E', 'V'))`
- **Enum values:**
  - `'A'` = **Activ** (conturi de bilanț - active)
  - `'P'` = **Pasiv** (conturi de bilanț - pasive)
  - `'B'` = **Bifuncțional** (pot fi activ SAU pasiv în funcție de sold)
  - `'E'` = **Cheltuieli** (conturi de profit și pierdere - expenses)
  - `'V'` = **Venituri** (conturi de profit și pierdere - revenues)
- **Nullable:** ❌ NOT NULL
- **Scop:** Determină comportamentul contului în balanță și natura soldului
- **Logică Business:**
  - **MOȘTENIT** automat de la contul sintetic părinte
  - La creare: `analytic.account_function = synthetic.account_function`
  - **Impactează:**
    - Poziționare în balanță (Activ vs Pasiv)
    - Validarea soldurilor (debit vs credit)
    - Rapoarte financiare (Bilanț vs Profit & Pierdere)
- **Algoritm:**
  ```typescript
  // La creare cont analitic
  analyticAccountData.account_function = syntheticAccount.account_function;
  ```

#### 7. `is_active` (boolean, DEFAULT true)
- **Tip:** BOOLEAN
- **Default:** `true`
- **Nullable:** ✅ (dar practic întotdeauna are valoare datorită default-ului)
- **Scop:** Soft delete - marchează conturile inactive fără a le șterge fizic
- **Logică Business:**
  - `true` = cont activ, vizibil în sistem, poate fi folosit în tranzacții noi
  - `false` = cont dezactivat, păstrat pentru istoric, nu mai poate fi folosit în tranzacții noi
  - **Toate query-urile** trebuie să filtreze după `is_active = true` pentru a exclude conturile inactive
- **Algoritm standard:**
  ```typescript
  const activeAnalyticAccounts = await db.select()
    .from(PC_analytic_accounts)
    .where(eq(PC_analytic_accounts.is_active, true));
  ```

#### 8. `created_at` (timestamp, NOT NULL)
- **Tip:** TIMESTAMP WITHOUT TIME ZONE
- **Default:** `now()`
- **Nullable:** ❌ NOT NULL
- **Scop:** Timestamp creare înregistrare
- **Logică Business:**
  - Setat automat la inserare
  - Folosit pentru audit trail
  - Nu se modifică niciodată

#### 9. `updated_at` (timestamp, NOT NULL)
- **Tip:** TIMESTAMP WITHOUT TIME ZONE
- **Default:** `now()`
- **Nullable:** ❌ NOT NULL
- **Scop:** Timestamp ultima modificare
- **Logică Business:**
  - Setat automat la inserare
  - **Actualizat automat** la orice UPDATE (prin trigger sau ORM)
  - Folosit pentru sincronizare și audit

### 🔗 Relații și Foreign Keys

**Relații Upstream (Părinți):**
```typescript
export const PC_analytic_accountsRelations = relations(PC_analytic_accounts, ({ one }) => ({
  synthetic: one(PC_synthetic_accounts, {
    fields: [PC_analytic_accounts.synthetic_id],
    references: [PC_synthetic_accounts.id],
  }),
}));
```

**Relații Downstream (Copii):**
- `accounts.analytic_id` → `PC_analytic_accounts.id` (tabelul legacy)
- Potențial: `journal_lines.analytic_account_id` (pentru înregistrări contabile detaliate)

### 📝 Schema Zod (Validări Runtime)

```typescript
export const insertAnalyticAccountSchema = createInsertSchema(PC_analytic_accounts, {
  code: z.string()
    .min(5, "Codul contului analitic trebuie să aibă minimum 5 caractere")
    .max(20, "Codul contului analitic trebuie să aibă maximum 20 caractere")
    .regex(/^[0-9]{3,4}(\.[0-9]+)+$/, "Format invalid: trebuie să fie [cod_sintetic].[identificator]"),
  name: z.string().min(1, "Denumirea este obligatorie").max(255),
  description: z.string().optional(),
  account_function: z.enum(['A', 'P', 'B', 'E', 'V'], {
    errorMap: () => ({ message: "Funcția contabilă trebuie să fie A, P, B, E sau V" })
  }),
  synthetic_id: z.string().uuid("ID sintetic invalid")
}).refine(async (data) => {
  // Validare: codul analitic trebuie să înceapă cu codul sintetic
  const syntheticCode = chartOfAccountsUtils.extractSyntheticPrefix(data.code);
  const synthetic = await db.select().from(PC_synthetic_accounts)
    .where(and(
      eq(PC_synthetic_accounts.id, data.synthetic_id),
      eq(PC_synthetic_accounts.code, syntheticCode)
    ));
  return synthetic.length > 0;
}, {
  message: "Codul analitic trebuie să înceapă cu codul contului sintetic părinte"
});

export const selectAnalyticAccountSchema = createSelectSchema(PC_analytic_accounts);

export const updateAnalyticAccountSchema = insertAnalyticAccountSchema.partial().omit({
  id: true,
  created_at: true,
  updated_at: true
});
```

### 🔧 Utilitare Chart of Accounts (chartOfAccountsUtils)

```typescript
// Extragere cod sintetic din cod analitic
extractSyntheticPrefix: (analyticCode: string): string => {
  const match = analyticCode.match(/^(\d{3,4})/);
  return match ? match[1] : '';
}

// Validare ierarhie analitic → sintetic
validateAnalyticHierarchy: async (analyticCode: string, syntheticId: string): Promise<boolean> => {
  const syntheticCode = extractSyntheticPrefix(analyticCode);
  const synthetic = await db.select().from(PC_synthetic_accounts)
    .where(and(
      eq(PC_synthetic_accounts.id, syntheticId),
      eq(PC_synthetic_accounts.code, syntheticCode)
    ));
  return synthetic.length > 0;
}
```

### 🌐 Ierarhia Completă a Planului de Conturi

```
PC_account_classes (9 clase: 1-9)
    ↓
PC_account_groups (67 grupe: 10-98)
    ↓
PC_synthetic_accounts (781 conturi sintetice: 101-987)
    ↓ (grad 1: 3 cifre | grad 2: 4 cifre)
    ↓
PC_analytic_accounts (conturi analitice: 5+ caractere cu punct)
    └── Exemple: 371.1, 4426.40, 511.01.001
```

### 📌 Cazuri de Utilizare Tipice

#### 1. Creare Gestiune Nouă
```typescript
// La crearea unei gestiuni warehouse
const warehouse = { id: 'uuid-123', name: 'Magazin Brăila', code: '40' };

// Sistem generează automat conturi analitice pentru:
// - 371.40 (Mărfuri în gestiunea Magazin Brăila)
// - 378.40 (Diferențe de preț la mărfuri pentru gestiunea Magazin Brăila)
// - 4426.40 (TVA deductibilă pentru gestiunea Magazin Brăila)
// - 4427.40 (TVA colectată pentru gestiunea Magazin Brăila)
```

#### 2. Creare Partener Nou (Client/Furnizor)
```typescript
// La crearea unui partener
const partner = { id: 'uuid-456', name: 'SC ABC SRL', code: 'CLI001' };

// Sistem generează automat:
// - 411.CLI001 (Clienți - SC ABC SRL)
// - 401.CLI001 (Furnizori - SC ABC SRL) - dacă este și furnizor
```

#### 3. Înregistrare Contabilă cu Analitice
```typescript
// Vânzare mărfuri din gestiunea "Magazin Brăila" către "SC ABC SRL"
journal_entry = {
  lines: [
    { account: '411.CLI001', debit: 1190, credit: 0 },  // Client
    { account: '707.40', debit: 0, credit: 1000 },      // Venit vânzare gestiune
    { account: '4427.40', debit: 0, credit: 190 },      // TVA colectată gestiune
    { account: '607.40', debit: 850, credit: 0 },       // Cheltuieli mărfuri gestiune
    { account: '371.40', debit: 0, credit: 850 },       // Ieșire mărfuri gestiune
  ]
}
```

### 🎯 Reguli Importante

- **Cod unic global:** Nu pot exista două conturi analitice cu același cod
- **Ierarhie strictă:** Codul trebuie să înceapă cu codul sintetic valid
- **Funcție moștenită:** `account_function` este întotdeauna identică cu cea a părintelui sintetic
- **Filtrare is_active:** Toate query-urile trebuie să verifice `is_active = true`
- **Minimum 5 caractere:** Format `XXX.Y` sau `XXXX.Y` (sintetic + punct + analitic)
- **Format standard:** `[cod_sintetic].[identificator_entitate]`

### 📊 Statistici Curente

**Date în Producție:**
- **Total înregistrări:** 14 conturi analitice
- **Distribuție:** Majoritatea pentru gestiuni (warehouse management)
- **Tipuri:** Mărfuri (371), TVA (4426, 4427), Casa (5311), Cheltuieli/Venituri (607, 707)
- **Pattern comun:** `{cod_sintetic}.{cod_gestiune}`

**Backward Compatibility:**
```typescript
// Alias-uri pentru compatibilitate cu cod existent
export const analytic_accounts = PC_analytic_accounts;
export const analytic_accountsRelations = PC_analytic_accountsRelations;
export type AnalyticAccount = PC_AnalyticAccount;
export type InsertAnalyticAccount = InsertPC_AnalyticAccount;
```

**Migrare:**
- Fișier migrare: `/var/www/GeniusERP/migrations/modules/core/create_PC_analytic_accounts.ts`
- **Seeding:** ❌ NU se face seeding - conturile analitice sunt create dinamic de utilizatori la:
  * Crearea gestiunilor (warehouse) → conturi 371.X, 4426.X, 4427.X, etc.
  * Crearea partenerilor (clienți/furnizori) → conturi 401.X, 4111.X
  * Alte entități specifice aplicației

**Creare Automată:**
- `libs/inventory/src/services/manage-warehouse.service.ts` → creează conturi la gestiune nouă
- `libs/crm/src/controllers/company.controller.ts` → creează conturi la partener nou

---

## 🔧 Servicii Centralizate pentru PC_analytic_accounts

### AnalyticAccountsService

**Status: ✅ IMPLEMENTAT** - Service centralizat pentru gestionarea conturilor analitice

**Locație:** `/var/www/GeniusERP/libs/accounting/src/services/analytic-accounts.service.ts`

**Scop:** Elimină duplicarea codului și standardizează operațiunile pe tabelul `PC_analytic_accounts`

#### Caracteristici

✅ **Operații CRUD complete:**
- `createAnalyticAccount()` - Creează cont analitic cu validări complete
- `getAnalyticByCode()` - Obține cont după cod
- `getAnalyticAccountsBySynthetic()` - Filtrează după cont sintetic
- `getAnalyticAccountsBySyntheticCode()` - Filtrează după cod sintetic
- `updateAnalyticAccount()` - Actualizare
- `deactivateAnalyticAccount()` / `activateAnalyticAccount()` - Soft delete

✅ **Validări Business Logic:**
- `validateHierarchy()` - Verifică ierarhia analitic → sintetic
- `codeExists()` - Verificare unicitate cod
- `getSyntheticIdByCode()` - Rezolvare referințe

✅ **Generare Coduri:**
- `getNextAvailableCode()` - Generează următorul cod disponibil pentru un sintetic

✅ **Integrare:**
- Folosește Drizzle ORM (elimină SQL raw)
- Type-safe cu TypeScript
- Validări Zod la nivel de service

#### Utilizare în Aplicație

**1. manage-warehouse.service.ts**
- Creare conturi analitice pentru gestiuni (371.x, 378.x, etc.)
- Eliminat codul duplicat (100+ linii → 3 linii)

**2. company.controller.ts**
- Sincronizare conturi analitice pentru parteneri CRM (401.x, 4111.x)
- Eliminat 150+ linii SQL raw

**3. accounting.service.ts**
- Cache Redis pentru performance (TTL 12h)
- Endpoints REST API complete

#### Endpoints API

```typescript
// GET - Toate conturile analitice
GET /api/accounting/analytic-accounts
Response: AnalyticAccount[]

// GET - Conturi analitice pentru un cont sintetic
GET /api/accounting/analytic-accounts/by-synthetic/:syntheticId
Response: AnalyticAccount[]

// POST - Creare cont analitic nou
POST /api/accounting/analytic-accounts
Body: {
  code: string,           // ex: "371.1", "4426.40"
  name: string,
  description?: string,
  synthetic_id: string,   // UUID cont sintetic
  account_function: 'A' | 'P' | 'B' | 'E' | 'V'
}
Response: AnalyticAccount
```

#### Beneficii

✅ **Zero Cod Duplicat** - O singură sursă de adevăr  
✅ **Type Safety** - TypeScript + Drizzle ORM  
✅ **Performanță** - Cache Redis + Indexes DB  
✅ **Mentenabilitate** - Logică centralizată  
✅ **Testabilitate** - Service izolat, ușor de testat  

#### Validări Implementate

1. **Unicitate Cod:** Verifică înainte de insert
2. **Ierarhie:** Codul analitic trebuie să înceapă cu codul sintetic
3. **Existență Sintetic:** Verifică că synthetic_id există în DB
4. **Format Cod:** Regex validare `^[0-9]{3,4}(\.[0-9]+)+$`
5. **Account Function:** Enum strict `A/P/B/E/V`

#### Exemplu Creare Cont Analitic

```typescript
import { AnalyticAccountsService } from '@geniuserp/accounting';

const service = new AnalyticAccountsService(storage, drizzle);

// Generează următorul cod disponibil
const nextCode = await service.getNextAvailableCode('371'); // → "371.3"

// Obține ID-ul contului sintetic
const syntheticId = await service.getSyntheticIdByCode('371');

// Creează contul
const analyticAccount = await service.createAnalyticAccount({
  code: nextCode,
  name: 'Depozit Central',
  description: 'Marfă în depozitul central',
  synthetic_id: syntheticId,
  account_function: 'A' // Activ
});

console.log(`Cont analitic ${analyticAccount.code} creat cu succes!`);
```

#### Metrici Success

| Metric | Înainte | După | Îmbunătățire |
|--------|---------|------|--------------|
| Linii cod duplicat | 270+ | 0 | 🔴 → ✅ |
| SQL raw queries | 8 | 0 | ❌ → ✅ |
| Type safety | Parțial | 100% | ⚠️ → ✅ |
| Validări business | Incomplete | Complete | ⚠️ → ✅ |
| Cache Redis | Absent | Present | ❌ → ✅ |
| Testabilitate | Scăzută | Înaltă | 🔴 → ✅ |

---

# 6. PC_account_mappings

**Status:** ✅ **ACTIV** - Folosit în producție

**Înregistrări curente:** 12 mapări configurate

**Scop:** Mapare conturi contabile standard pentru operațiuni frecvente în aplicație. Permite configurarea rapidă și centralizată a conturilor folosite de modulele aplicației (casierie, bancă, TVA, clienți, furnizori, etc.) **per companie**.

**Caracteristică Unică:** Fiecare companie poate configura propriul plan de conturi, iar aplicația va folosi automat conturile mapate pentru generarea automată a înregistrărilor contabile.

---

## 📋 Structură Tabel

### DDL (Data Definition Language)

```sql
CREATE TABLE PC_account_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    mapping_type account_mapping_type NOT NULL,
    account_code TEXT NOT NULL,
    account_name TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    
    CONSTRAINT account_mappings_company_id_mapping_type_is_active_key 
        UNIQUE (company_id, mapping_type, is_active)
);

CREATE INDEX account_mappings_company_idx ON PC_account_mappings(company_id);
CREATE INDEX account_mappings_type_idx ON PC_account_mappings(mapping_type);
CREATE INDEX account_mappings_active_idx ON PC_account_mappings(is_active);

CREATE TYPE account_mapping_type AS ENUM (
    'CASH_RON', 'CASH_CURRENCY', 'PETTY_CASH',
    'BANK_PRIMARY', 'BANK_CURRENCY',
    'CUSTOMERS', 'SUPPLIERS', 'EMPLOYEE_ADVANCES', 'EMPLOYEE_PAYROLL',
    'VAT_COLLECTED', 'VAT_DEDUCTIBLE', 'VAT_PAYABLE', 'VAT_RECOVERABLE',
    'UTILITIES', 'SUPPLIES', 'TRANSPORT', 'OTHER_SERVICES', 
    'BANK_FEES', 'INTEREST_EXPENSE',
    'MERCHANDISE_SALES', 'SERVICE_REVENUE', 'INTEREST_INCOME',
    'INTERNAL_TRANSFERS', 'CASH_SHORTAGES', 'CASH_OVERAGES',
    'EXCHANGE_DIFF_INCOME', 'EXCHANGE_DIFF_EXPENSE',
    'SHORT_TERM_LOANS', 'LONG_TERM_LOANS'
);
```

---

## 📊 Coloane Tabel

### 1. **id** (UUID, PRIMARY KEY)
**Tip:** `UUID` | **Nullable:** NO | **Default:** `gen_random_uuid()`

Identificator unic pentru fiecare mapare. Generat automat de PostgreSQL.

### 2. **company_id** (UUID, FOREIGN KEY → companies)
**Tip:** `UUID` | **Nullable:** NO | **ON DELETE:** CASCADE

**Business Logic:** Mapările sunt **per companie**. Fiecare companie își configurează propriile conturi. Companii diferite pot folosi conturi diferite pentru același `mapping_type`.

**Exemplu:** Compania A folosește 5311 pentru CASH_RON, Compania B folosește 5312.

### 3. **mapping_type** (ENUM account_mapping_type)
**Tip:** `ENUM` (29 valori) | **Nullable:** NO

Definește **scopul mapării** - pentru ce operațiune este folosit contul.

**Categorizare:**
- **💰 Trezorerie:** CASH_RON, CASH_CURRENCY, PETTY_CASH
- **🏦 Bancă:** BANK_PRIMARY, BANK_CURRENCY
- **👥 Terți:** CUSTOMERS, SUPPLIERS, EMPLOYEE_ADVANCES, EMPLOYEE_PAYROLL
- **📈 TVA:** VAT_COLLECTED, VAT_DEDUCTIBLE, VAT_PAYABLE, VAT_RECOVERABLE
- **💼 Cheltuieli:** UTILITIES, SUPPLIES, TRANSPORT, OTHER_SERVICES, BANK_FEES, INTEREST_EXPENSE
- **💵 Venituri:** MERCHANDISE_SALES, SERVICE_REVENUE, INTEREST_INCOME
- **🔄 Speciale:** INTERNAL_TRANSFERS, CASH_SHORTAGES, CASH_OVERAGES, EXCHANGE_DIFF_INCOME/EXPENSE
- **🏦 Finanțare:** SHORT_TERM_LOANS, LONG_TERM_LOANS

**UNIQUE Constraint:** (company_id, mapping_type, is_active) - **UN SINGUR** cont activ per tip per companie.

### 4. **account_code** (TEXT)
**Tip:** `TEXT` | **Nullable:** NO

Codul contului sintetic sau analitic folosit. Poate fi:
- **Cont sintetic** (3-4 cifre): `401`, `4111`, `5311`
- **Cont analitic** (cu punct): `371.1`, `401.5`

**Format:** Respectă standardul conturilor românești.

**Exemple:** `'5311'` (Casa), `'4111'` (Clienți), `'401'` (Furnizori), `'4427'` (TVA colectată)

### 5. **account_name** (TEXT)
**Tip:** `TEXT` | **Nullable:** NO

Denumirea contului pentru afișare în UI. Copiat din planul de conturi.

**Exemple:** `'Casa în lei'`, `'Clienţi'`, `'TVA colectată'`

### 6. **is_default** (BOOLEAN)
**Tip:** `BOOLEAN` | **Nullable:** NO | **Default:** `false`

Flag pentru mapări sugerate de sistem la crearea companiei.

### 7. **is_active** (BOOLEAN)
**Tip:** `BOOLEAN` | **Nullable:** NO | **Default:** `true`

**Soft delete / Enable-Disable** pentru mapări.

**Business Logic:** 
- UNIQUE constraint permite **UN SINGUR** cont activ per (company_id, mapping_type)
- Poate avea mapări inactive (istorice) pentru audit

**Flux schimbare cont:**
```sql
-- 1. Dezactivează maparea veche
UPDATE PC_account_mappings SET is_active = false 
WHERE company_id = ? AND mapping_type = 'CASH_RON';

-- 2. Creează mapare nouă
INSERT INTO PC_account_mappings (company_id, mapping_type, account_code, is_active)
VALUES (?, 'CASH_RON', '5312', true);
```

### 8. **created_at** (TIMESTAMP)
**Tip:** `TIMESTAMP WITHOUT TIME ZONE` | **Nullable:** NO | **Default:** `NOW()`

Audit trail - când a fost creată maparea. Imutabil.

### 9. **updated_at** (TIMESTAMP)
**Tip:** `TIMESTAMP WITHOUT TIME ZONE` | **Nullable:** NO | **Default:** `NOW()`

Actualizat automat prin **TRIGGER** la fiecare UPDATE.

**🔧 Trigger Details:**
```sql
-- Funcția trigger
CREATE OR REPLACE FUNCTION update_account_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger-ul
CREATE TRIGGER account_mappings_updated_at_trigger
BEFORE UPDATE ON account_mappings  -- sau pc_account_mappings după migrare
FOR EACH ROW
EXECUTE FUNCTION update_account_mappings_updated_at();
```

**Comportament după redenumire tabel:**
- ✅ Trigger-ul RĂMÂNE atașat automat la tabelul `pc_account_mappings`
- ✅ Trigger-ul funcționează fără modificări suplimentare
- ✅ PostgreSQL actualizează automat relația trigger → tabel

### 10. **created_by** (UUID, NULLABLE, FK → users)
**Tip:** `UUID` | **Nullable:** YES

Audit user - cine a creat maparea.
- NULL = mapare creată de sistem (seeding, migrare)
- Non-NULL = mapare creată manual de utilizator

---

## 🔗 Relații & Constraints

### Foreign Keys
```sql
-- FK către companies (CASCADE DELETE)
company_id → companies(id) ON DELETE CASCADE

-- FK către users (OPTIONAL)
created_by → users(id)
```

### Unique Constraints
```sql
UNIQUE (company_id, mapping_type, is_active)
```

**Implicații:**
- ✅ Permite: Multiple mapări inactive (istoric)
- ❌ Interzice: Două mapări active pentru același mapping_type

### Indexes
- `pc_account_mappings_company_idx` pe company_id
- `pc_account_mappings_type_idx` pe mapping_type  
- `pc_account_mappings_active_idx` pe is_active

**Notă:** Index-urile sunt redenumite automat în migrație de la `account_mappings_*` la `pc_account_mappings_*`.

---

## 📊 Date Actuale (12 înregistrări)

```
CASH_RON          → 5311  "Casa în lei"
PETTY_CASH        → 5311  "Casa în lei"
BANK_PRIMARY      → 5121  "Conturi la bănci în lei"
BANK_CURRENCY     → 5124  "Conturi la bănci în valută"
CUSTOMERS         → 4111  "Clienţi"
SUPPLIERS         → 401   "Furnizori"
EMPLOYEE_ADVANCES → 425   "Avansuri acordate personalului"
EMPLOYEE_PAYROLL  → 421   "Personal - salarii datorate"
VAT_COLLECTED     → 4427  "TVA colectată"
VAT_DEDUCTIBLE    → 4426  "TVA deductibilă"
VAT_PAYABLE       → 4423  "TVA de plată"
VAT_RECOVERABLE   → 4424  "TVA de recuperat"
```

**Observații:**
- Toate pentru aceeași companie
- Toate active (is_active = true)
- Toate fără creator (created_by = NULL)

---

## 🎯 Utilizare în Aplicație

### Modul Casierie
```typescript
const cashMapping = await getMapping(companyId, 'CASH_RON');
// → { account_code: '5311', account_name: 'Casa în lei' }

// Generează automat înregistrarea:
Debit: 5311 (Casa)      | 1000 RON
Credit: 4111.X (Client) | 1000 RON
```

### Modul Facturare
```typescript
const customerMapping = await getMapping(companyId, 'CUSTOMERS');
const vatMapping = await getMapping(companyId, 'VAT_COLLECTED');
const salesMapping = await getMapping(companyId, 'MERCHANDISE_SALES');

// Auto-generare note contabile:
// Debit: 4111 (Client)
// Credit: 707 (Vânzări)
// Credit: 4427 (TVA colectată)
```

---

## 📍 Fișiere Drizzle Schema

**Schema principală:** `/var/www/GeniusERP/libs/shared/src/schema/account-mappings.schema.ts`

**Declarație Drizzle:**
```typescript
export const account_mappings = pgTable('account_mappings', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  mappingType: accountMappingTypeEnum('mapping_type').notNull(),
  accountCode: text('account_code').notNull(),
  accountName: text('account_name').notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: uuid('created_by'),
});
```

**⚠️ NOTĂ:** Schema actuală folosește camelCase (companyId, mappingType, etc.). **Trebuie refactorizat la snake_case** conform standardizării (company_id, mapping_type, etc.).

---

## 🔄 TODO: Refactorizare la PC_account_mappings

**Modificări necesare:**
1. ✅ Redenumire tabel: `account_mappings` → `PC_account_mappings`
2. ⏳ Actualizare Drizzle schema: camelCase → snake_case
3. ⏳ Creare migrație pentru redenumire
4. ⏳ Actualizare toate referințele în codebase

**Status:** În curs de implementare (task TODO #3-11)

---

# 7. AC_account_relationships

**Tip:** Tabel de configurare contabilă (Accounting Module)  
**Prefix:** `AC_` (Accounting) - NU face parte din Planul de Conturi  
**Status:** ✅ ACTIV - Folosit pentru automatizare înregistrări contabile

---

## 📋 Descriere Generală

Tabelul `AC_account_relationships` definește **reguli automate de înregistrare contabilă** (debit-credit) pentru diferite tipuri de operațiuni. Permite fiecărei companii să configureze corespondențe contabile personalizate pentru automatizarea înregistrărilor.

**DIFERENȚĂ CRITICĂ:**
- **PC_* (Plan de Conturi)**: Definește STRUCTURA conturilor (clase, grupe, sintetice, analitice)
- **AC_* (Accounting)**: Definește REGULI de utilizare a conturilor (cum se fac înregistrările)

### 🎯 Scop Principal

1. **Automatizare Înregistrări**: Definește automat care cont se debitează și care se creditează pentru fiecare tip de operațiune
2. **Configurare per Companie**: Fiecare companie poate avea propriile reguli contabile
3. **Sistem de Prioritizare**: Suportă multiple reguli cu prioritate pentru aceeași operațiune
4. **Reguli Condiționale**: Folosește JSONB pentru condiții complexe de aplicare

### 📊 Date Actuale

**Înregistrări în DB:** 0 (tabel gol - se populează la configurare)

---

## 🗂️ Structură Coloane

### **DDL PostgreSQL** (Structură Actuală)

```sql
CREATE TABLE IF NOT EXISTS "AC_account_relationships" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  relationship_type text NOT NULL,
  description text,
  debit_account_code text NOT NULL,
  debit_account_name text,
  credit_account_code text NOT NULL,
  credit_account_name text,
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0,
  conditions jsonb,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  
  -- Constraints
  CONSTRAINT "AC_account_relationships_pkey" PRIMARY KEY (id),
  CONSTRAINT "AC_account_relationships_company_id_fkey"
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  CONSTRAINT "AC_account_relationships_priority_check" CHECK (priority >= 0),
  CONSTRAINT "AC_account_relationships_unique_rule"
    UNIQUE (company_id, relationship_type, debit_account_code, credit_account_code)
);
```

---

## 📝 Descriere Coloane

### 1. **id** (UUID)
**Tip:** `UUID` | **Nullable:** NO | **Default:** `gen_random_uuid()`

Primary key, identificator unic pentru fiecare regulă contabilă.

### 2. **company_id** (UUID, FK → companies)
**Tip:** `UUID` | **Nullable:** NO

**Referință:** `companies(id)` ON DELETE CASCADE

Compania pentru care se aplică regula contabilă. Permite configurări diferite per companie.

**Logică Business:**
- Fiecare companie poate avea propriile reguli de înregistrare
- La ștergerea companiei, se șterg automat toate regulile (CASCADE)

### 3. **relationship_type** (TEXT)
**Tip:** `TEXT` | **Nullable:** NO

Tipul de operațiune contabilă pentru care se aplică regula.

**Valori Posibile (Exemple):**
- `'SALE_INVOICE'` - Factură vânzare
- `'PURCHASE_INVOICE'` - Factură achiziție
- `'CASH_RECEIPT'` - Încasare numerar
- `'BANK_PAYMENT'` - Plată bancară
- `'SALARY_PAYMENT'` - Plată salarii
- `'VAT_SETTLEMENT'` - Decontare TVA
- `'DEPRECIATION'` - Amortizare
- `'INVENTORY_ADJUSTMENT'` - Ajustare stoc
- Etc.

**Logică Algoritmică:**
```typescript
// Sistem găsește regula potrivită:
const rule = await findRule({
  company_id: currentCompany,
  relationship_type: 'SALE_INVOICE',
  conditions: { amount: '>= 1000', vat_rate: 19 }
});

// Aplică automat:
// Debit: rule.debit_account_code
// Credit: rule.credit_account_code
```

### 4. **description** (TEXT, NULLABLE)
**Tip:** `TEXT` | **Nullable:** YES

Descriere human-readable a regulii contabile.

**Exemple:**
- `'Factură vânzare mărfuri cu TVA 19%'`
- `'Plată furnizor peste 10.000 RON'`
- `'Încasare clienți prin cont bancar principal'`

### 5. **debit_account_code** (TEXT)
**Tip:** `TEXT` | **Nullable:** NO

Codul contului care va fi **DEBITAT** automat când se aplică regula.

**Format:** Respectă codurile din Planul de Conturi (PC_*)
- Conturi sintetice: `'411'`, `'5311'`, `'607'`
- Conturi analitice: `'411.001'`, `'5311.01'`

**Logică Business:**
```typescript
// Pentru SALE_INVOICE:
debit_account_code: '4111' // Clienți (crește creanța)
credit_account_code: '707'  // Venituri din vânzări
```

### 6. **debit_account_name** (TEXT, NULLABLE)
**Tip:** `TEXT` | **Nullable:** YES

Denumirea contului debitat (cached pentru performanță UI).

**Exemple:** `'Clienţi'`, `'Casa în lei'`, `'Cheltuieli cu salariile'`

**Notă:** Poate fi sincronizat cu `PC_synthetic_accounts.name` sau `PC_analytic_accounts.name`

### 7. **credit_account_code** (TEXT)
**Tip:** `TEXT` | **Nullable:** NO

Codul contului care va fi **CREDITAT** automat când se aplică regula.

**Format:** Identic cu `debit_account_code`

**Logică Business:**
```typescript
// Pentru PURCHASE_INVOICE:
debit_account_code: '607'  // Cheltuieli cu mărfuri
credit_account_code: '401' // Furnizori (crește datoria)
```

### 8. **credit_account_name** (TEXT, NULLABLE)
**Tip:** `TEXT` | **Nullable:** YES

Denumirea contului creditat (cached pentru performanță UI).

### 9. **is_active** (BOOLEAN)
**Tip:** `BOOLEAN` | **Nullable:** YES | **Default:** `true`

Soft delete / Enable-Disable pentru reguli.

**Logică Business:**
- `true`: Regula este activă și va fi aplicată
- `false`: Regula este dezactivată (păstrată pentru istoric/audit)

**Use Case:**
```typescript
// Dezactivează temporar o regulă fără a o șterge
UPDATE AC_account_relationships 
SET is_active = false 
WHERE relationship_type = 'OLD_RULE';
```

### 10. **priority** (INTEGER)
**Tip:** `INTEGER` | **Nullable:** YES | **Default:** `0`

**Constraint:** CHECK (priority >= 0)

Ordinea de evaluare când există multiple reguli pentru același `relationship_type`.

**Logică Algoritmică:**
```typescript
// Găsește regula cu prioritatea cea mai mare care match-uiește condițiile
const rules = await db
  .select()
  .from(AC_account_relationships)
  .where(and(
    eq(AC_account_relationships.company_id, companyId),
    eq(AC_account_relationships.relationship_type, type),
    eq(AC_account_relationships.is_active, true)
  ))
  .orderBy(desc(AC_account_relationships.priority)); // Mai mare = mai prioritar

// Prima regulă care match-uiește condițiile va fi aplicată
for (const rule of rules) {
  if (evaluateConditions(rule.conditions, context)) {
    return rule; // Aplică această regulă
  }
}
```

**Exemplu:**
- Priority 10: Facturi > 10.000 RON → cont special
- Priority 5: Facturi > 1.000 RON → cont standard
- Priority 0: Toate facturile → cont default

### 11. **conditions** (JSONB, NULLABLE)
**Tip:** `JSONB` | **Nullable:** YES

Condiții complexe pentru aplicarea regulii (evaluare dinamică).

**Index:** GIN index pentru query-uri rapide pe JSON

**Structură JSON (Exemple):**

```json
{
  "amount": {
    "operator": ">=",
    "value": 10000
  },
  "vat_rate": {
    "operator": "==",
    "value": 19
  },
  "customer_type": {
    "operator": "in",
    "value": ["corporate", "vip"]
  },
  "payment_method": {
    "operator": "==",
    "value": "bank_transfer"
  }
}
```

**Logică Algoritmică:**
```typescript
function evaluateConditions(conditions: any, context: any): boolean {
  if (!conditions) return true; // No conditions = always match
  
  for (const [field, rule] of Object.entries(conditions)) {
    const contextValue = context[field];
    const { operator, value } = rule;
    
    switch (operator) {
      case '>=': if (!(contextValue >= value)) return false; break;
      case '==': if (contextValue !== value) return false; break;
      case 'in': if (!value.includes(contextValue)) return false; break;
      // ... other operators
    }
  }
  
  return true; // All conditions matched
}
```

### 12. **created_at** (TIMESTAMP)
**Tip:** `TIMESTAMP WITHOUT TIME ZONE` | **Nullable:** YES | **Default:** `now()`

Data și ora creării regulii (audit trail).

### 13. **updated_at** (TIMESTAMP)
**Tip:** `TIMESTAMP WITHOUT TIME ZONE` | **Nullable:** YES | **Default:** `now()`

Data și ora ultimei modificări (actualizat automat prin TRIGGER).

**Trigger:** `trg_account_relationships_updated_at`

---

## 🔗 Relații & Constraints

### Foreign Keys

```sql
-- FK către companies (CASCADE DELETE)
company_id → companies(id) ON DELETE CASCADE
```

**Implicații:**
- La ștergerea companiei, se șterg automat toate regulile sale contabile

### Unique Constraints

```sql
UNIQUE (company_id, relationship_type, debit_account_code, credit_account_code)
```

**Implicații:**
- ✅ Permite: Aceeași regulă activă/inactivă (is_active diferit)
- ✅ Permite: Aceeași regulă cu condiții diferite (conditions diferit)
- ❌ Interzice: Duplicate exacte pentru aceeași companie

### Check Constraints

```sql
CHECK (priority >= 0)
```

**Asigură:** Prioritatea nu poate fi negativă

### Indexes

```sql
-- Index principal
"AC_account_relationships_pkey" PRIMARY KEY (id)

-- Index UNIQUE compus
"AC_account_relationships_unique_rule" UNIQUE (company_id, relationship_type, debit_account_code, credit_account_code)

-- Performance indexes
"idx_account_relationships_company_id" btree (company_id)
"idx_account_relationships_type" btree (relationship_type)
"idx_account_relationships_priority" btree (priority DESC)
"idx_account_relationships_active" btree (is_active) WHERE is_active = true

-- JSON index
"idx_account_relationships_conditions" GIN (conditions)
```

---

## 🎯 Utilizare în Aplicație

### Exemplu 1: Factură Vânzare

```typescript
// Configurare regulă
const saleRule = {
  company_id: 'uuid-company',
  relationship_type: 'SALE_INVOICE',
  description: 'Factură vânzare mărfuri',
  debit_account_code: '4111', // Clienți
  debit_account_name: 'Clienţi',
  credit_account_code: '707',  // Venituri
  credit_account_name: 'Venituri din vânzarea mărfurilor',
  is_active: true,
  priority: 10,
  conditions: {
    vat_rate: { operator: '==', value: 19 }
  }
};

// Aplicare automată
const invoice = { amount: 1000, vat_rate: 19 };
const rule = await findMatchingRule('SALE_INVOICE', invoice);

// Creare înregistrare contabilă
await createJournalEntry({
  debit: { account: rule.debit_account_code, amount: 1190 },
  credit: { account: rule.credit_account_code, amount: 1000 }
});
```

### Exemplu 2: Plată Furnizor

```typescript
const paymentRule = {
  company_id: 'uuid-company',
  relationship_type: 'SUPPLIER_PAYMENT',
  description: 'Plată furnizor prin bancă',
  debit_account_code: '401',  // Furnizori (reduce datoria)
  credit_account_code: '5121', // Banca (reduce disponibil)
  is_active: true,
  priority: 5,
  conditions: {
    payment_method: { operator: '==', value: 'bank_transfer' }
  }
};
```

---

## 🔄 Trigger Details

```sql
CREATE OR REPLACE FUNCTION update_account_relationships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_account_relationships_updated_at
BEFORE UPDATE ON account_relationships
FOR EACH ROW
EXECUTE FUNCTION update_account_relationships_updated_at();
```

**Notă:** După redenumire la `AC_account_relationships`, trigger-ul va rămâne atașat automat.

---

## 📊 Drizzle Schema (Actuală - NECESITĂ REFACTORIZARE)

**Locație:** `/libs/shared/src/schema/accounting-settings.schema.ts`

**Problemă:** Folosește `camelCase` în loc de `snake_case`

```typescript
// ❌ ÎNAINTE (camelCase)
export const account_relationships = pgTable('account_relationships', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull(), // ❌ camelCase în TypeScript
  relationshipType: text('relationship_type').notNull(), // ❌
  debitAccountCode: text('debit_account_code').notNull(), // ❌
  // ...
});

// ✅ DUPĂ (snake_case + AC_ prefix)
export const AC_account_relationships = pgTable('AC_account_relationships', {
  id: uuid('id').primaryKey().defaultRandom(),
  company_id: uuid('company_id').notNull(), // ✅ snake_case
  relationship_type: text('relationship_type').notNull(), // ✅
  debit_account_code: text('debit_account_code').notNull(), // ✅
  // ...
});
```

---

## 🚀 Next Steps - Refactorizare Necesară

1. ✅ Documentație completă (ACEST DOCUMENT)
2. ⏳ Redenumire `account_relationships` → `AC_account_relationships`
3. ⏳ Actualizare Drizzle schema la `snake_case`
4. ⏳ Creare migrație `create_AC_account_relationships.ts`
5. ⏳ Refactorizare services și controllers
6. ⏳ Actualizare tests

---








# 8. accounting_journal_types

---


8.3. accounting_account_balances

8. accounting_ledger_entries
9. accounting_ledger_lines
10. accounting_settings
11. 
12. admin_actions
13. alert_history
14. anaf_company_data

---



16. analytics_alerts
17. analytics_anomalies
18. analytics_anomaly_rules
19. analytics_dashboards
20. analytics_inventory_optimization
21. analytics_inventory_optimizations
22. analytics_metrics
23. analytics_model_executions
24. analytics_prediction_results
25. analytics_predictive_models
26. analytics_purchasing_recommendations
27. analytics_reports
28. analytics_scenario_executions
29. analytics_scenario_results
30. analytics_scenarios
31. analytics_seasonal_patterns
32. analytics_time_series_data
33. api_keys
34. attendance_records
35. audit_logs
36. bank_accounts
37. bank_transactions
38. bi_business_units
39. bi_cost_allocations
40. bi_cost_centers
41. bpm_api_connections
42. bpm_approvals
43. bpm_process_instances
44. bpm_processes
45. bpm_scheduled_jobs
46. bpm_step_executions
47. bpm_step_templates
48. bpm_triggers
49. cash_registers
50. cash_transactions
51. chart_of_accounts
52. collaboration_activities
53. collaboration_messages
54. collaboration_notes
55. collaboration_notifications
56. collaboration_task_assignments
57. collaboration_task_status_history
58. collaboration_task_watchers
59. collaboration_tasks
60. collaboration_threads
61. communications_channel_configs
62. communications_contacts
63. communications_message_access
64. communications_messages
65. communications_thread_access
66. communications_threads
67. companies
68. company_licenses
69. configurations
70. cor_major_groups
71. cor_minor_groups
72. cor_occupations
73. cor_submajor_groups
74. cor_subminor_groups
75. cost_allocation_history
76. crm_activities
77. crm_companies
78. crm_contacts
79. crm_custom_fields
80. crm_customer_tags
81. crm_customers
82. crm_deal_products
83. crm_deal_tags
84. crm_deals
85. crm_email_templates
86. crm_forecasts
87. crm_notes
88. crm_pipelines
89. crm_revenue_forecasts
90. crm_sales_quotas
91. crm_scoring_rules
92. crm_segments
93. crm_stage_history
94. crm_stages
95. crm_taggables
96. crm_tags
97. crm_tasks
98. dashboard_views
99. document_counters
100. document_versions
101. documents
102. ecommerce_cart_items
103. ecommerce_carts
104. ecommerce_integrations
105. ecommerce_order_items
106. ecommerce_orders
107. ecommerce_shopify_collections
108. ecommerce_shopify_products
109. ecommerce_shopify_variants
110. ecommerce_transactions
111. employee_contracts
112. employee_documents
113. employees
114. financial_data
115. financial_data_errors
116. financial_data_jobs
117. fiscal_periods
118. fx_rates
119. health_checks
120. hr_absences
121. hr_anaf_export_logs
122. hr_commission_structures
123. hr_departments
124. hr_documents
125. hr_employee_commissions
126. hr_employee_drafts
127. hr_employees
128. hr_employment_contracts
129. hr_job_positions
130. hr_payroll_logs
131. hr_revisal_export_logs
132. hr_settings
133. hr_work_schedules
134. integrations
135. inventory_assessment_items
136. inventory_assessments
137. inventory_batches
138. inventory_categories
139. inventory_products
140. inventory_stock
141. inventory_stock_movements
142. inventory_units
143. inventory_valuations
144. inventory_warehouses
145. invoice_details
146. invoice_items
147. invoice_numbering_settings
148. invoice_payments
149. invoices
150. journal_entries
151. journal_lines
152. journal_types
153. leave_requests
154. ledger_entries
155. ledger_lines
156. licenses
157. marketing_campaign_messages
158. marketing_campaign_segments
159. marketing_campaign_templates
160. marketing_campaigns
161. metrics_history
162. model_training_history
163. nir_documents
164. nir_items
165. opening_balances
166. payroll_records
167. permissions
168. predictive_models
169. predictive_scenarios
170. purchase_order_items
171. purchase_orders
172. report_execution_history
173. role_permissions
174. roles
175. scenario_results
176. settings_feature_toggles
177. settings_global
178. settings_ui_themes
179. settings_user_preferences
180. setup_steps
181. stock_reservations
182. stocks

---

# 183. accounts ⚠️ **LEGACY / DEPRECATED**

**Status:** ⚠️ **TABEL LEGACY - NU SE VA CREA ÎN PRODUCȚIE**

**Motiv:** Înlocuit de structura ierarhică nouă:
- `PC_account_classes` (9 clase)
- `PC_account_groups` (90 grupe)  
- `PC_synthetic_accounts` (781 conturi sintetice)
- `PC_analytic_accounts` (conturi analitice dinamice)

**Păstrat doar pentru:** Backward compatibility cu date vechi migrabile.

**La migrarea în producție:** Acest tabel **NU va fi creat**. Toate datele vor fi migrate în structura nouă ierarhică.

---

# 184. system_configs
185. transfer_documents
186. transfer_items
187. user_roles
188. users
189. vat_settings
190. warehouses

---





### 🚀 Sistem Nou de Migrații Implementat

**Status: ✅ COMPLET** - Sistem modular implementat

**Arhitectură:**
- **Controller Central:** `/var/www/GeniusERP/migrations/index.ts`
- **Migrații Modulare:** `/var/www/GeniusERP/migrations/modules/<module>/`
- **Migrare Account Balances:** `create_account_balances.ts`

**Caracteristici:**
- Sistem complet modular pe fiecare modul
- CLI integrat cu npm scripts
- Rollback support pentru fiecare migrare
- Indexes optimizate pentru performanță
- Constraints și foreign keys implementate
- Unique constraints pentru integritate date

**Backup Migrații Vechi:** `/var/www/GeniusERP/static/archived/archived_old_migrations/`

---

## Statistici

- **Total tabele**: 190
- **Schema**: public
- **Bază de date**: geniuserp

## Categorii principale de tabele

- **Contabilitate**: 17 tabele (accounting_*, accounts, journal_*, ledger_*)
- **HR**: 13 tabele (hr_*, employee_*, payroll_*)
- **CRM**: 17 tabele (crm_*)
- **Analytics**: 15 tabele (analytics_*)
- **Inventory**: 10 tabele (inventory_*)
- **E-commerce**: 8 tabele (ecommerce_*)
- **BPM**: 7 tabele (bpm_*)
- **Collaboration**: 8 tabele (collaboration_*)
- **Communications**: 6 tabele (communications_*)
- **BI**: 3 tabele (bi_*)
- **Marketing**: 4 tabele (marketing_*)
- **Altele**: Restul (users, roles, permissions, settings, etc.)

Acest audit a fost generat automat pe data: Thursday, October 30, 2025



**Data actualizare: 31 octombrie 2024**  
**Implementat în: GeniusERP v2.0**
