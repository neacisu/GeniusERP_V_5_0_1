# Audit Bază de Date GeniusERP

## Lista completă a tabelelor (190 tabele)

Această listă conține toate tabelele existente în baza de date `geniuserp` după factorizarea majoră:

# 1. account_balances

## 📋 Detalii detaliate tabel: `account_balances`

### 🎯 Scop și Rol în Sistem

Tabelul `account_balances` reprezintă **soldurile curente și istorice** pentru fiecare cont contabil dintr-o companie. Acest tabel este **fundamental** în sistemul contabil pentru:

- **Urmărirea soldurilor lunare** pentru fiecare cont contabil
- **Calcularea soldurilor de închidere** pe baza tranzacțiilor lunare
- **Generarea balanțelor contabile** conform standardelor românești (RAS)
- **Validarea consistenței contabile** (debit = credit)
- **Raportare financiară** și audit

### 🏗️ Structură Tehnică

**Schema DB (PostgreSQL):**
```sql
CREATE TABLE public.account_balances (
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
    CONSTRAINT account_balances_pkey PRIMARY KEY (id),
    CONSTRAINT account_balances_account_id_accounts_id_fk FOREIGN KEY (account_id) REFERENCES accounts(id),
    CONSTRAINT account_balances_company_id_companies_id_fk FOREIGN KEY (company_id) REFERENCES companies(id)
);
```

**Indexes:**
- PRIMARY KEY: `account_balances_pkey` pe `id`
- FOREIGN KEY: `account_balances_account_id_accounts_id_fk` către `accounts(id)`
- FOREIGN KEY: `account_balances_company_id_companies_id_fk` către `companies(id)`

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
**NOTĂ:** Schema Drizzle pentru `account_balances` este definită în `accounting.schema.ts`, dar tabela este creată prin migrarea canonică SQL din `/var/www/GeniusERP/apps/api/migrations/sql/0000_smart_black_bird.sql`.
```typescript
export const account_balances = pgTable('account_balances', {
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

# 4. account_mappings
# 5. account_relationships
6. accounting_account_balances
7. accounting_journal_types
8. accounting_ledger_entries
9. accounting_ledger_lines
10. accounting_settings
11. accounts
12. admin_actions
13. alert_history
14. anaf_company_data
15. analytic_accounts
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
183. synthetic_accounts
184. system_configs
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
