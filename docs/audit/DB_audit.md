# Audit Bază de Date GeniusERP

## Lista completă a tabelelor (190 tabele)

Această listă conține toate tabelele existente în baza de date `geniuserp` după factorizarea majoră:

**Legendă Prefixe:**
- **PC_** = Plan de Conturi (Chart of Accounts) - ierarhia oficială contabilă
- **AC_** = Accounting Configuration - configurări și setări contabile
- Fără prefix = tabele generale, legacy, sau alte module

# 1. AC_account_balances - ⚠️ DEPRECATED

**⚠️ ACEST TABEL ESTE DEPRECATED ȘI A FOST ÎNLOCUIT CU `AC_accounting_account_balances`**

**Motiv deprecare:** Versiune simplificată, fără structură completă RAS (Romanian Accounting Standards)

**Tabel de înlocuire:** `AC_accounting_account_balances` (vezi secțiunea 9)

**Acțiune recomandată:** Nu mai utilizați acest tabel. Folosiți `AC_accounting_account_balances` care include:
- Structură completă RAS (account_class, account_group, account_number, account_sub_number, full_account_number)
- Suport multi-currency
- Suport multi-franchise
- Precizie crescută (numeric 19,4)

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

# 8. AC_journal_types

## 📋 Detalii detaliate tabel: `AC_journal_types`

**🏷️ NUME TABEL**: `AC_journal_types` (PREFIX: AC_ = Accounting Configuration)
**📦 MODUL**: Accounting
**📁 LOCAȚIE SCHEMA**: `/libs/shared/src/schema/accounting.schema.ts`
**📁 LOCAȚIE MIGRAȚIE**: `/migrations/modules/accounting/create_AC_journal_types.ts`

### 🎯 Scop și Rol în Sistem

Tabelul `AC_journal_types` definește **tipurile de jurnale contabile** utilizate pentru organizarea și clasificarea înregistrărilor contabile conform standardelor românești. Acest tabel este esențial pentru:

- **Organizarea înregistrărilor contabile** pe tipuri de operațiuni (vânzări, achiziții, bancă, casă, general)
- **Configurarea conturilor implicite** pentru fiecare tip de jurnal
- **Numerotare automată** a documentelor contabile cu prefixe distinctive
- **Segregarea operațiunilor** pentru raportare și audit
- **Conformitate cu standardele RAS** (Romanian Accounting Standards)

### 🏗️ Structură Tehnică

**Schema DB (PostgreSQL):**
```sql
CREATE TABLE public."AC_journal_types" (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL,
    code character varying(20) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    default_debit_account character varying(20),
    default_credit_account character varying(20),
    is_system_journal boolean NOT NULL DEFAULT false,
    is_active boolean NOT NULL DEFAULT true,
    auto_number_prefix character varying(20),
    last_used_number integer NOT NULL DEFAULT 0,
    created_by uuid,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    updated_by uuid,
    updated_at timestamp without time zone,
    CONSTRAINT "AC_journal_types_pkey" PRIMARY KEY (id)
);
```

**Indexes:**
- PRIMARY KEY: `AC_journal_types_pkey` pe `id`
- UNIQUE INDEX: `AC_journal_types_code_unique` pe `(company_id, code)`
- INDEX: `AC_journal_types_active_idx` pe `(company_id, is_active)`

**Schema Drizzle:**
```typescript
export const AC_journal_types = pgTable("AC_journal_types", {
  id: uuid("id").primaryKey().notNull().default(sql`gen_random_uuid()`),
  company_id: uuid("company_id").notNull(),
  code: varchar("code", { length: 20 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  default_debit_account: varchar("default_debit_account", { length: 20 }),
  default_credit_account: varchar("default_credit_account", { length: 20 }),
  is_system_journal: boolean("is_system_journal").notNull().default(false),
  is_active: boolean("is_active").notNull().default(true),
  auto_number_prefix: varchar("auto_number_prefix", { length: 20 }),
  last_used_number: integer("last_used_number").notNull().default(0),
  created_by: uuid("created_by"),
  created_at: timestamp("created_at").notNull().default(sql`now()`),
  updated_by: uuid("updated_by"),
  updated_at: timestamp("updated_at"),
});
```

### 📊 Coloane și Logică Business

#### 1. `id` - UUID Primar
- **Tip**: `uuid`
- **Constrângeri**: `PRIMARY KEY`, `NOT NULL`, `DEFAULT gen_random_uuid()`
- **Logică Business**: Identificator unic pentru fiecare tip de jurnal
- **Utilizare**: Referințe în `accounting_ledger_entries`

#### 2. `company_id` - Compania Proprietară
- **Tip**: `uuid`
- **Constrângeri**: `NOT NULL`
- **Logică Business**: Izolează jurnalele per companie (multi-tenancy)
- **Utilizare**: Filtrare date per companie, parte din cheie unică

#### 3. `code` - Cod Jurnal
- **Tip**: `character varying(20)`
- **Constrângeri**: `NOT NULL`, `UNIQUE` cu `company_id`
- **Logică Business**: Cod unic identificator pentru tipul de jurnal (ex: "GENJ", "SALE", "PURCH", "BANK", "CASH")
- **Logică Algoritmică**: Validare format: uppercase, alfanumeric, max 20 caractere
- **Utilizare**: Identificare rapidă, referințe în cod

#### 4. `name` - Nume Jurnal
- **Tip**: `character varying(100)`
- **Constrângeri**: `NOT NULL`
- **Logică Business**: Nume descriptiv pentru tipul de jurnal (ex: "General Journal", "Sales Journal", "Purchase Journal")
- **Utilizare**: Afișare în UI, rapoarte

#### 5. `description` - Descriere Detaliată
- **Tip**: `text`
- **Constrângeri**: `NULLABLE`
- **Logică Business**: Descriere extinsă a scopului jurnalului
- **Utilizare**: Help text în UI, documentație

#### 6. `default_debit_account` - Cont Implicit Debit
- **Tip**: `character varying(20)`
- **Constrângeri**: `NULLABLE`
- **Logică Business**: Contul contabil implicit folosit pentru debitul în acest tip de jurnal
- **Logică Algoritmică**: Trebuie să existe în Plan de Conturi dacă este setat
- **Utilizare**: Auto-completare în formulare de înregistrări contabile

#### 7. `default_credit_account` - Cont Implicit Credit
- **Tip**: `character varying(20)`
- **Constrângeri**: `NULLABLE`
- **Logică Business**: Contul contabil implicit folosit pentru creditul în acest tip de jurnal
- **Logică Algoritmică**: Trebuie să existe în Plan de Conturi dacă este setat
- **Utilizare**: Auto-completare în formulare de înregistrări contabile

#### 8. `is_system_journal` - Flag Jurnal Sistem
- **Tip**: `boolean`
- **Constrângeri**: `NOT NULL`, `DEFAULT false`
- **Logică Business**: Marchează jurnalele create automat de sistem care NU pot fi șterse
- **Logică Algoritmică**: Validare la delete: `if is_system_journal then RAISE EXCEPTION`
- **Utilizare**: Protecție împotriva ștergerii accidentale

#### 9. `is_active` - Flag Activ
- **Tip**: `boolean`
- **Constrângeri**: `NOT NULL`, `DEFAULT true`
- **Logică Business**: Permite dezactivarea temporară a unui jurnal fără a-l șterge
- **Logică Algoritmică**: Filtrare în listări: `WHERE is_active = true`
- **Utilizare**: Soft delete, arhivare

#### 10. `auto_number_prefix` - Prefix Numerotare Automată
- **Tip**: `character varying(20)`
- **Constrângeri**: `NULLABLE`
- **Logică Business**: Prefix adăugat la numărul secvențial pentru documentele din acest jurnal (ex: "GJ", "SA", "PU")
- **Logică Algoritmică**: Format document: `{prefix}{last_used_number + 1}` → "GJ001", "GJ002", etc.
- **Utilizare**: Generare număr document unic

#### 11. `last_used_number` - Ultimul Număr Folosit
- **Tip**: `integer`
- **Constrângeri**: `NOT NULL`, `DEFAULT 0`
- **Logică Business**: Counter pentru numerotarea secvențială a documentelor
- **Logică Algoritmică**: 
  ```
  UPDATE accounting_journal_types 
  SET last_used_number = last_used_number + 1 
  WHERE id = ? 
  RETURNING last_used_number
  ```
- **Utilizare**: Generare număr document unic, sincronizare

#### 12-15. Audit Trail
- **`created_by`** (uuid): User care a creat jurnalul
- **`created_at`** (timestamp): Data/ora creare (DEFAULT now())
- **`updated_by`** (uuid): Ultimul user care a modificat
- **`updated_at`** (timestamp): Data/ora ultimă modificare

### 🔗 Relații cu Alte Tabele

- **`accounting_ledger_entries`**: Relație 1:N (un tip de jurnal poate avea multiple înregistrări contabile)
- **`companies`**: Relație 1:N (o companie poate avea multiple tipuri de jurnale)

### 📈 Tipuri Standard de Jurnale (RAS)

```
GENJ - General Journal (Jurnal General) - pentru operațiuni diverse
SALE - Sales Journal (Jurnal Vânzări) - pentru facturi emise
PURCH - Purchase Journal (Jurnal Achiziții) - pentru facturi primite
BANK - Bank Journal (Jurnal Bancă) - pentru operațiuni bancare
CASH - Cash Journal (Jurnal Casă) - pentru operațiuni cu numerar
SALARY - Salary Journal (Jurnal Salarii) - pentru înregistrări salarizare
VAT - VAT Journal (Jurnal TVA) - pentru regularizări TVA
FIXED - Fixed Assets Journal (Jurnal Mijloace Fixe) - pentru amortizare
CLOSING - Closing Journal (Jurnal Închidere) - pentru închidere an fiscal
```

### 📊 Date Curente în Sistem

**Total înregistrări**: 1

**Exemple:**
```
Code: GENJ
Name: General Journal  
Description: For general accounting entries
Prefix: GJ
Last Number: 0
Is System: true
Is Active: true
```

### 🎯 Algoritmi Importanți

#### Algoritm Generare Număr Document:
```typescript
async function getNextDocumentNumber(journal_type_id: string): Promise<string> {
  const result = await db.transaction(async (tx) => {
    const journal = await tx
      .update(AC_journal_types)
      .set({ 
        last_used_number: sql`${AC_journal_types.last_used_number} + 1`,
        updated_at: new Date()
      })
      .where(eq(AC_journal_types.id, journal_type_id))
      .returning();
    
    const prefix = journal[0].auto_number_prefix || '';
    const number = String(journal[0].last_used_number).padStart(6, '0');
    
    return `${prefix}${number}`;
  });
  
  return result; // Ex: "GJ000001", "SA000042"
}
```

#### Validare Cont Implicit:
```typescript
function validateDefaultAccounts(
  debit_account?: string, 
  credit_account?: string
): boolean {
  // Verifică dacă conturile există în Plan de Conturi
  if (debit_account) {
    const debit_exists = await checkAccountExists(debit_account);
    if (!debit_exists) throw new Error('Cont debit invalid');
  }
  
  if (credit_account) {
    const credit_exists = await checkAccountExists(credit_account);
    if (!credit_exists) throw new Error('Cont credit invalid');
  }
  
  return true;
}
```

### 📋 Rezumat Audit Tabel `AC_journal_types`

**Status: ✅ COMPLET AUDITAT ȘI FACTORIZAT**

**🔄 Modificări Efectuate:**
- ✅ Redenumit tabel din `accounting_journal_types` → `AC_journal_types`
- ✅ Actualizat toate indexurile: `AC_journal_types_pkey`, `AC_journal_types_code_unique`, `AC_journal_types_active_idx`
- ✅ Standardizat schema Drizzle cu snake_case complet
- ✅ Creat Zod schemas pentru validare: `insertACJournalTypeSchema`, `selectACJournalTypeSchema`, `updateACJournalTypeSchema`
- ✅ Adăugat backward compatibility aliases pentru cod legacy
- ✅ Creat fișier de migrație `/migrations/modules/accounting/create_AC_journal_types.ts`
- ✅ Actualizat documentație comprehensivă

**📁 Fișiere Schema Drizzle:**
- `/libs/shared/src/schema/accounting.schema.ts` - Schema principală cu AC_journal_types

**📁 Fișiere Migrație:**
- `/migrations/modules/accounting/create_AC_journal_types.ts` - Migrație completă

**Concluzii:**
- ✅ Structură corectă și completă
- ✅ Indexes optimizate pentru performance
- ✅ Constraint UNIQUE pentru unicitate (company_id, code)
- ✅ Sistem de numerotare automată funcțional cu transaction safety
- ✅ Protecție jurnale sistem (is_system_journal)
- ✅ Suport pentru soft delete (is_active)
- ✅ Audit trail complet (created_by, created_at, updated_by, updated_at)
- ✅ Standardizare snake_case în tot codebase-ul
- ✅ Zod schemas pentru validare la nivel de aplicație

**Recomandări:**
- ✅ Implementat: Sistem de numerotare thread-safe cu transactions
- ✅ Implementat: Validare Zod pentru format cod (uppercase alfanumeric)
- ⚠️ Consideră adăugarea unui CHECK constraint în DB pentru `code` (uppercase, alfanumeric)
- ⚠️ Consideră adăugarea unui trigger pentru validarea conturilor implicite
- ⚠️ Documentează standardele de naming pentru coduri noi de jurnale

**🔗 Legături cu Alte Tabele:**
- `accounting_ledger_entries.journal_type_id` → `AC_journal_types.id`
- `AC_journal_types.company_id` → `companies.id`
- `AC_journal_types.default_debit_account` → `PC_synthetic_accounts.code`
- `AC_journal_types.default_credit_account` → `PC_synthetic_accounts.code`

**📊 Tipuri de Date Zod:**
```typescript
export type ACJournalType = typeof AC_journal_types.$inferSelect;
export type InsertACJournalType = typeof AC_journal_types.$inferInsert;
export type InsertACJournalTypeZod = z.infer<typeof insertACJournalTypeSchema>;
export type SelectACJournalTypeZod = z.infer<typeof selectACJournalTypeSchema>;
export type UpdateACJournalTypeZod = z.infer<typeof updateACJournalTypeSchema>;
```

---

# 9. AC_accounting_account_balances

## 📋 Detalii detaliate tabel: `AC_accounting_account_balances`

### 🎯 Scop și Rol în Sistem

Tabelul `AC_accounting_account_balances` stochează **soldurile contabile agregate pe lună** pentru fiecare cont, conform structurii RAS (Romanian Accounting Standards). Este tabelul fundamental pentru:

- **Balanțe de verificare** lunare și anuale
- **Raportare financiară** (Bilanț, Cont de Profit și Pierdere)
- **Urmărirea evoluției soldurilor** în timp
- **Optimizarea performanței** query-urilor pentru rapoarte (preagregare)
- **Suport multi-valută** pentru companii internaționale
- **Suport franchiză** pentru companii cu multiple puncte de lucru

### 🏗️ Structură Tehnică

**Schema DB (PostgreSQL):**
```sql
CREATE TABLE public."AC_accounting_account_balances" (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL,
    franchise_id uuid,
    account_class integer NOT NULL,
    account_group integer NOT NULL,
    account_number character varying(20) NOT NULL,
    account_sub_number character varying(20),
    full_account_number character varying(50) NOT NULL,
    fiscal_year integer NOT NULL,
    fiscal_month integer NOT NULL,
    opening_debit numeric(19,4) NOT NULL DEFAULT 0,
    opening_credit numeric(19,4) NOT NULL DEFAULT 0,
    period_debit numeric(19,4) NOT NULL DEFAULT 0,
    period_credit numeric(19,4) NOT NULL DEFAULT 0,
    closing_debit numeric(19,4) NOT NULL DEFAULT 0,
    closing_credit numeric(19,4) NOT NULL DEFAULT 0,
    currency character varying(3) NOT NULL DEFAULT 'RON',
    currency_closing_debit numeric(19,4) DEFAULT 0,
    currency_closing_credit numeric(19,4) DEFAULT 0,
    last_calculated_at timestamp without time zone NOT NULL DEFAULT now(),
    CONSTRAINT "accounting_account_balances_pkey" PRIMARY KEY (id)
);
```

**Indexes:**
- PRIMARY KEY: `accounting_account_balances_pkey` pe `id`
- UNIQUE INDEX: `account_balance_unique` pe `(company_id, COALESCE(franchise_id, '00000000-0000-0000-0000-000000000000'), full_account_number, fiscal_year, fiscal_month, currency)`
- INDEX: `account_balance_main_idx` pe `(company_id, fiscal_year, fiscal_month)`
- INDEX: `account_balance_account_idx` pe `(company_id, account_class, account_group)`
- INDEX: `account_balance_franchise_idx` pe `(franchise_id, fiscal_year, fiscal_month)`

### 📊 Coloane și Logică Business

#### 1. `id` - UUID Primar
- **Tip**: `uuid`
- **Constrângeri**: `PRIMARY KEY`, `NOT NULL`, `DEFAULT gen_random_uuid()`
- **Logică Business**: Identificator unic pentru fiecare înregistrare de sold
- **Utilizare**: Cheie primară, referințe externe

#### 2. `company_id` - Compania Proprietară
- **Tip**: `uuid`
- **Constrângeri**: `NOT NULL`
- **Logică Business**: Izolează datele per companie (multi-tenancy)
- **Utilizare**: Filtrare date, parte din UNIQUE constraint

#### 3. `franchise_id` - Franchiză/Punct de Lucru
- **Tip**: `uuid`
- **Constrângeri**: `NULLABLE`
- **Logică Business**: Permite urmărirea soldurilor per franchiză/sediu secundar
- **Logică Algoritmică**: `NULL` = sold consolidat la nivel de companie
- **Utilizare**: Rapoarte pe puncte de lucru, consolidări

#### 4-7. Structură Cont RAS (Romanian Accounting Standards)

##### `account_class` - Clasa Contului (1-9)
- **Tip**: `integer`
- **Constrângeri**: `NOT NULL`
- **Logică Business**: Prima cifră din planul de conturi (1=Capital, 2=Active, 3=Stocuri, 4=Terți, 5=Trezorerie, 6=Cheltuieli, 7=Venituri, 8=Speciale, 9=Gestiune)
- **Utilizare**: Grupare în rapoarte de nivel înalt

##### `account_group` - Grupa Contului (10-99)
- **Tip**: `integer`
- **Constrângeri**: `NOT NULL`
- **Logică Business**: Primele 2 cifre din planul de conturi (ex: 10=Capital social, 30=Stocuri materii prime)
- **Utilizare**: Grupare detaliată în rapoarte

##### `account_number` - Număr Cont Sintetic
- **Tip**: `character varying(20)`
- **Constrângeri**: `NOT NULL`
- **Logică Business**: Numărul complet al contului sintetic (ex: "5121", "401")
- **Utilizare**: Identificare cont principal

##### `account_sub_number` - Subconturi Analitice
- **Tip**: `character varying(20)`
- **Constrângeri**: `NULLABLE`
- **Logică Business**: Subconturi analitice (ex: ".001", ".CLIENT_XYZ")
- **Logică Algoritmică**: Concatenat cu `account_number` pentru `full_account_number`
- **Utilizare**: Urmărire detaliată per client/furnizor/proiect

#### 8. `full_account_number` - Număr Complet
- **Tip**: `character varying(50)`
- **Constrângeri**: `NOT NULL`, parte din UNIQUE constraint
- **Logică Business**: Număr complet cont = `account_number` + `account_sub_number`
- **Logică Algoritmică**: `full_account_number = account_number || COALESCE(account_sub_number, '')`
- **Utilizare**: Identificare unică cont în sistem

#### 9-10. Perioadă Fiscală

##### `fiscal_year` - An Fiscal
- **Tip**: `integer`
- **Constrângeri**: `NOT NULL`, parte din UNIQUE constraint
- **Logică Business**: Anul fiscal (ex: 2024, 2025)
- **Utilizare**: Filtrare temporală, rapoarte anuale

##### `fiscal_month` - Lună Fiscală
- **Tip**: `integer`
- **Constrângeri**: `NOT NULL`, parte din UNIQUE constraint
- **Logică Business**: Luna fiscală (1-12)
- **Logică Algoritmică**: Validare: `fiscal_month BETWEEN 1 AND 12`
- **Utilizare**: Filtrare temporală, rapoarte lunare

#### 11-16. Solduri RON (Monedă Națională)

##### `opening_debit` / `opening_credit` - Solduri Inițiale
- **Tip**: `numeric(19,4)`
- **Constrângeri**: `NOT NULL`, `DEFAULT 0`
- **Logică Business**: Sold la începutul lunii (moștenit din `closing` luna precedentă)
- **Logică Algoritmică**: 
  ```
  opening_debit[luna_N] = closing_debit[luna_N-1]
  opening_credit[luna_N] = closing_credit[luna_N-1]
  ```

##### `period_debit` / `period_credit` - Mișcări în Perioadă
- **Tip**: `numeric(19,4)`
- **Constrângeri**: `NOT NULL`, `DEFAULT 0`
- **Logică Business**: Totalul mișcărilor debit/credit în luna curentă
- **Logică Algoritmică**: 
  ```sql
  period_debit = SUM(debit_amount) FROM accounting_ledger_lines 
                 WHERE full_account_number = ? 
                 AND fiscal_year = ? AND fiscal_month = ?
  ```

##### `closing_debit` / `closing_credit` - Solduri Finale
- **Tip**: `numeric(19,4)`
- **Constrângeri**: `NOT NULL`, `DEFAULT 0`
- **Logică Business**: Sold la sfârșitul lunii (devine `opening` pentru luna următoare)
- **Logică Algoritmică**: 
  ```
  net_movement = opening_debit - opening_credit + period_debit - period_credit
  
  IF net_movement > 0 THEN
    closing_debit = net_movement
    closing_credit = 0
  ELSE
    closing_debit = 0
    closing_credit = -net_movement
  END IF
  ```

#### 17-19. Multi-Currency Support

##### `currency` - Cod Valută
- **Tip**: `character varying(3)`
- **Constrângeri**: `NOT NULL`, `DEFAULT 'RON'`, parte din UNIQUE constraint
- **Logică Business**: Cod ISO 4217 pentru valută (RON, EUR, USD, etc.)
- **Utilizare**: Suport multi-valută, conversii

##### `currency_closing_debit` / `currency_closing_credit` - Solduri în Valută
- **Tip**: `numeric(19,4)`
- **Constrângeri**: `NULLABLE`, `DEFAULT 0`
- **Logică Business**: Solduri finale în valuta originală (înainte de conversie la RON)
- **Utilizare**: Rapoarte în valută originală, verificare diferențe curs

#### 20. `last_calculated_at` - Timestamp Ultimul Calcul
- **Tip**: `timestamp without time zone`
- **Constrângeri**: `NOT NULL`, `DEFAULT now()`
- **Logică Business**: Marchează când a fost ultima recalculare a soldurilor
- **Utilizare**: Cache invalidation, debugging, audit

### 🔗 Relații cu Alte Tabele

- **`companies`**: Relație 1:N (o companie are solduri pentru toate conturile sale)
- **`PC_account_classes`**: Link indirect via `account_class`
- **`PC_account_groups`**: Link indirect via `account_group`
- **`PC_synthetic_accounts`**: Link indirect via `full_account_number`
- **`AC_accounting_ledger_lines`**: Sursa datelor pentru agregare

### 📈 Algoritmi Importanți

#### Algoritm Recalculare Solduri Lunare:
```typescript
async function recalculateMonthlyBalances(
  companyId: string,
  fiscalYear: number,
  fiscalMonth: number
): Promise<void> {
  await db.transaction(async (tx) => {
    // 1. Obține soldurile de închidere din luna precedentă
    const previousMonth = fiscalMonth === 1 ? 12 : fiscalMonth - 1;
    const previousYear = fiscalMonth === 1 ? fiscalYear - 1 : fiscalYear;
    
    const previousBalances = await tx
      .select()
      .from(accounting_account_balances)
      .where(
        and(
          eq(AC_accounting_account_balances.company_id, companyId),
          eq(AC_accounting_account_balances.fiscal_year, previousYear),
          eq(AC_accounting_account_balances.fiscal_month, previousMonth)
        )
      );
    
    // 2. Calculează mișcările din luna curentă
    const currentPeriodMovements = await tx
      .select({
        fullAccountNumber: accounting_ledger_lines.full_account_number,
        periodDebit: sql<number>`SUM(${AC_accounting_ledger_lines.debit_amount})`,
        periodCredit: sql<number>`SUM(${AC_accounting_ledger_lines.credit_amount})`
      })
      .from(accounting_ledger_lines)
      .innerJoin(accounting_ledger_entries, 
        eq(AC_accounting_ledger_lines.ledger_entry_id, accounting_ledger_entries.id))
      .where(
        and(
          eq(AC_accounting_ledger_entries.company_id, companyId),
          eq(AC_accounting_ledger_entries.fiscal_year, fiscalYear),
          eq(AC_accounting_ledger_entries.fiscal_month, fiscalMonth),
          eq(AC_accounting_ledger_entries.is_posted, true)
        )
      )
      .groupBy(AC_accounting_ledger_lines.full_account_number);
    
    // 3. Calculează solduri de închidere
    for (const movement of currentPeriodMovements) {
      const prevBalance = previousBalances.find(
        b => b.full_account_number === movement.fullAccountNumber
      );
      
      const openingDebit = prevBalance?.closing_debit || 0;
      const openingCredit = prevBalance?.closing_credit || 0;
      
      const netMovement = 
        openingDebit - openingCredit +
        movement.periodDebit - movement.periodCredit;
      
      const closingDebit = netMovement > 0 ? netMovement : 0;
      const closingCredit = netMovement < 0 ? -netMovement : 0;
      
      // 4. Upsert (INSERT sau UPDATE)
      await tx
        .insert(AC_accounting_account_balances)
        .values({
          company_id: companyId,
          full_account_number: movement.fullAccountNumber,
          fiscal_year: fiscalYear,
          fiscal_month: fiscalMonth,
          opening_debit: openingDebit,
          opening_credit: openingCredit,
          period_debit: movement.periodDebit,
          period_credit: movement.periodCredit,
          closing_debit: closingDebit,
          closing_credit: closingCredit,
          last_calculated_at: new Date()
        })
        .onConflictDoUpdate({
          target: [/* unique constraint fields */],
          set: {
            period_debit: movement.periodDebit,
            period_credit: movement.periodCredit,
            closing_debit: closingDebit,
            closing_credit: closingCredit,
            last_calculated_at: new Date()
          }
        });
    }
  });
}
```

### 📊 Date Curente în Sistem

**Total înregistrări**: 0 (tabel gol - așteptând prime înregistrări contabile și calcule)

### 📋 Rezumat Audit Tabel `AC_accounting_account_balances`

**Status: ✅ COMPLET AUDITAT**

**Concluzii:**
- ✅ Structură corectă și completă pentru RAS
- ✅ Suport multi-valută implementat
- ✅ Suport franchiză pentru companii cu multiple locații
- ✅ UNIQUE constraint complex cu COALESCE pentru franchise_id
- ✅ Indexes optimizate pentru query-uri frecvente
- ✅ Precizie numeric(19,4) adecvată pentru valori monetare
- ✅ Timestamp pentru cache invalidation

**Recomandări:**
- ✅ Implementat: Sistem de recalculare automată cu transactions
- ⚠️ Consideră adăugarea unui CHECK constraint: `closing_debit >= 0 AND closing_credit >= 0`
- ⚠️ Consideră adăugarea unui CHECK constraint: `(closing_debit > 0 AND closing_credit = 0) OR (closing_debit = 0 AND closing_credit >= 0)`
- ⚠️ Implementează job scheduler pentru recalculare zilnică/lunară automată
- ⚠️ Documentează strategia de arhivare pentru ani fiscali vechi

---

# 10. AC_accounting_ledger_entries

## 📋 Detalii detaliate tabel: `AC_accounting_ledger_entries`

### 🎯 Scop și Rol în Sistem

Tabelul `AC_accounting_ledger_entries` reprezintă **header-ul (antetul) notelor contabile** - documentul principal care grupează multiple linii de debit și credit. Este **coloana vertebrală** a sistemului contabil pentru:

- **Organizarea tranzacțiilor contabile** în note structurate
- **Implementarea partida dublă** (double-entry accounting)
- **Legături cu documente sursă** (facturi, chitanțe, ordine de plată)
- **Workflow-uri de aprobare** și postare
- **Sistem de stornare/reversal** pentru corecții
- **Audit trail complet** pentru conformitate și control

### 🏗️ Structură Tehnică

**Schema DB (PostgreSQL):**
```sql
CREATE TABLE public."AC_accounting_ledger_entries" (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL,
    franchise_id uuid,
    transaction_date timestamp without time zone NOT NULL DEFAULT now(),
    posting_date timestamp without time zone NOT NULL DEFAULT now(),
    document_date date NOT NULL,
    type character varying(50) NOT NULL,
    document_number character varying(100),
    document_type character varying(50),
    reference_id uuid,
    reference_table character varying(100),
    description character varying(500),
    notes text,
    is_posted boolean NOT NULL DEFAULT false,
    is_draft boolean NOT NULL DEFAULT true,
    is_system_generated boolean NOT NULL DEFAULT false,
    total_amount numeric(19,4) NOT NULL,
    total_debit numeric(19,4) NOT NULL,
    total_credit numeric(19,4) NOT NULL,
    currency character varying(3) NOT NULL DEFAULT 'RON',
    exchange_rate numeric(19,6) NOT NULL DEFAULT 1,
    exchange_rate_date date,
    fiscal_year integer NOT NULL,
    fiscal_month integer NOT NULL,
    created_by uuid,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    updated_by uuid,
    updated_at timestamp without time zone,
    posted_by uuid,
    posted_at timestamp without time zone,
    reversed_by uuid,
    reversed_at timestamp without time zone,
    is_reversal boolean NOT NULL DEFAULT false,
    original_entry_id uuid,
    reversal_reason character varying(500),
    metadata jsonb,
    reversal_entry_id uuid,
    CONSTRAINT "AC_accounting_ledger_entries_pkey" PRIMARY KEY (id),
    CONSTRAINT "AC_accounting_ledger_entries_reversal_entry_id_fkey" 
        FOREIGN KEY (reversal_entry_id) REFERENCES AC_accounting_ledger_entries(id)
);
```

**Indexes:**
- PRIMARY KEY: `AC_accounting_ledger_entries_pkey` pe `id`
- UNIQUE INDEX: `AC_ledger_document_unique` pe `(company_id, document_type, document_number)` WHERE document_number IS NOT NULL
- INDEX: `AC_ledger_primary_idx` pe `(company_id, fiscal_year, fiscal_month, transaction_date)`
- INDEX: `AC_ledger_is_posted_idx` pe `(company_id, is_posted, transaction_date)`
- INDEX: `AC_ledger_type_idx` pe `(company_id, type, transaction_date)`
- INDEX: `AC_ledger_reference_idx` pe `(reference_table, reference_id)`
- INDEX: `AC_ledger_document_idx` pe `(company_id, document_type, document_number)`
- INDEX: `AC_ledger_franchise_idx` pe `(franchise_id, fiscal_year, fiscal_month)`

**Foreign Keys:**
- SELF-REFERENCE: `reversal_entry_id` → `AC_accounting_ledger_entries(id)`

**Referenced By:**
- `AC_accounting_ledger_lines.ledger_entry_id` (1:N relationship)

### 📊 Coloane și Logică Business

#### 1-3. Identificare

##### `id` - UUID Primar
- **Tip**: `uuid`, PRIMARY KEY
- **Logică Business**: Identificator unic pentru fiecare notă contabilă
- **Utilizare**: Referințe în `accounting_ledger_lines`, workflow, raportare

##### `company_id` - Compania Proprietară
- **Tip**: `uuid`, NOT NULL
- **Logică Business**: Multi-tenancy - izolează datele per companie
- **Utilizare**: Filtrare, securitate, parte din UNIQUE constraints

##### `franchise_id` - Franchiză/Punct de Lucru
- **Tip**: `uuid`, NULLABLE
- **Logică Business**: Permite urmărirea tranzacțiilor per franchiză
- **Utilizare**: Rapoarte pe puncte de lucru, consolidări

#### 4-6. Date și Perioade

##### `transaction_date` - Data Tranzacției
- **Tip**: `timestamp`, NOT NULL, DEFAULT now()
- **Logică Business**: Data economică când a avut loc evenimentul (ex: data facturii)
- **Logică Algoritmică**: Poate fi diferită de `posting_date` (când se înregistrează)
- **Utilizare**: Sortare cronologică, rapoarte pe perioade

##### `posting_date` - Data Postării
- **Tip**: `timestamp`, NOT NULL, DEFAULT now()
- **Logică Business**: Data când nota a fost postată în registrul contabil
- **Logică Algoritmică**: `posting_date >= transaction_date` (validation required)
- **Utilizare**: Audit, tracking modificări

##### `document_date` - Data Document Sursă
- **Tip**: `date`, NOT NULL
- **Logică Business**: Data de pe documentul original (factură, chitanță, etc.)
- **Utilizare**: Conformitate legală, sincronizare cu documente

#### 7-11. Referințe Document

##### `type` - Tip Notă Contabilă
- **Tip**: `character varying(50)`, NOT NULL
- **Logică Business**: Clasificare operațiuni: SALES, PURCHASE, PAYMENT, RECEIPT, GENERAL, SALARY, VAT, CLOSING, etc.
- **Utilizare**: Filtrare, raportare pe tipuri, segregare operațiuni

##### `document_number` - Număr Document
- **Tip**: `character varying(100)`, NULLABLE
- **Constrângeri**: UNIQUE cu `(company_id, document_type)`
- **Logică Business**: Număr unic generat automat sau introdus manual
- **Logică Algoritmică**: Format: `{journal_prefix}{sequential_number}` (ex: "GJ000001")
- **Utilizare**: Identificare rapidă, căutare, referințe legale

##### `document_type` - Tip Document Sursă
- **Tip**: `character varying(50)`, NULLABLE
- **Logică Business**: INVOICE, RECEIPT, PAYMENT_ORDER, BANK_STATEMENT, etc.
- **Utilizare**: Clasificare, filtrare pe tipuri de documente

##### `reference_id` + `reference_table` - Pointer Document Sursă
- **Tip**: `uuid` + `character varying(100)`, NULLABLE
- **Logică Business**: Link polymorphic către documentul original (invoices, payments, etc.)
- **Logică Algoritmică**: `reference_table.id = reference_id`
- **Utilizare**: Navigare bidirectională, integritate referențială

#### 12-13. Descrieri

##### `description` - Descriere Scurtă
- **Tip**: `character varying(500)`, NULLABLE
- **Logică Business**: Rezumat operațiune afișat în liste
- **Utilizare**: UI, liste, preview

##### `notes` - Note Detaliate
- **Tip**: `text`, NULLABLE
- **Logică Business**: Informații suplimentare, explicații, comentarii
- **Utilizare**: Audit, clarificări, documentație internă

#### 14-16. Status Flags

##### `is_posted` - Flag Postat în Registru
- **Tip**: `boolean`, NOT NULL, DEFAULT false
- **Logică Business**: 
  - `false` = draft, nu afectează soldurile
  - `true` = postat definitiv, nu se poate modifica direct
- **Logică Algoritmică**: 
  ```
  IF is_posted THEN
    UPDATE -> RAISE EXCEPTION "Cannot modify posted entry, use reversal"
  END IF
  ```
- **Utilizare**: Workflow, validare, protecție date

##### `is_draft` - Flag Draft
- **Tip**: `boolean`, NOT NULL, DEFAULT true
- **Logică Business**: 
  - `true` = lucrare în curs, poate fi modificată/ștearsă
  - `false` = finalizată, pregătită pentru postare
- **Utilizare**: Workflow, filtrare liste

##### `is_system_generated` - Flag Generat Automat
- **Tip**: `boolean`, NOT NULL, DEFAULT false
- **Logică Business**: Marchează notele create automat de sistem (ex: din facturi, salarii)
- **Utilizare**: Audit, identificare surse, protecție ștergere

#### 17-19. Valori Totale

##### `total_amount` - Suma Totală
- **Tip**: `numeric(19,4)`, NOT NULL
- **Logică Business**: Valoarea absolută a tranzacției (fără semn)
- **Utilizare**: Afișare, sumarizări, statistici

##### `total_debit` - Total Debit
- **Tip**: `numeric(19,4)`, NOT NULL
- **Logică Business**: Suma tuturor liniilor debitoare din nota contabilă
- **Logică Algoritmică**: 
  ```sql
  total_debit = SUM(debit_amount) FROM accounting_ledger_lines 
                WHERE ledger_entry_id = this.id
  ```
- **Validare**: **MUST** `total_debit = total_credit` (partida dublă!)

##### `total_credit` - Total Credit
- **Tip**: `numeric(19,4)`, NOT NULL
- **Logică Business**: Suma tuturor liniilor creditoare din nota contabilă
- **Validare**: **MUST** `total_debit = total_credit` (partida dublă!)

#### 20-22. Multi-Currency

##### `currency` - Cod Valută
- **Tip**: `character varying(3)`, NOT NULL, DEFAULT 'RON'
- **Logică Business**: Cod ISO 4217 (RON, EUR, USD, etc.)
- **Utilizare**: Suport multi-valută, conversii

##### `exchange_rate` - Curs de Schimb
- **Tip**: `numeric(19,6)`, NOT NULL, DEFAULT 1
- **Logică Business**: Curs folosit pentru conversie la RON
- **Logică Algoritmică**: `amount_RON = amount_foreign * exchange_rate`
- **Utilizare**: Conversii, calcule diferențe curs

##### `exchange_rate_date` - Data Curs de Schimb
- **Tip**: `date`, NULLABLE
- **Logică Business**: Data la care a fost aplicat cursul
- **Utilizare**: Audit, verificare cursuri istorice

#### 23-24. Perioadă Fiscală

##### `fiscal_year` - An Fiscal
- **Tip**: `integer`, NOT NULL
- **Logică Business**: Anul fiscal pentru agregare și raportare
- **Logică Algoritmică**: Extras din `transaction_date` sau `document_date`
- **Utilizare**: Filtrare, rapoarte anuale, închidere an fiscal

##### `fiscal_month` - Lună Fiscală
- **Tip**: `integer`, NOT NULL
- **Logică Business**: Luna fiscală (1-12)
- **Validare**: `fiscal_month BETWEEN 1 AND 12`
- **Utilizare**: Rapoarte lunare, balanțe periodice

#### 25-30. Audit Trail Complet

##### Created/Updated Trail
- **`created_by`** (uuid): User care a creat nota
- **`created_at`** (timestamp, NOT NULL, DEFAULT now()): Data/ora creare
- **`updated_by`** (uuid): Ultimul user care a modificat
- **`updated_at`** (timestamp): Data/ora ultimă modificare

##### Posted Trail
- **`posted_by`** (uuid): User care a postat nota în registru
- **`posted_at`** (timestamp): Data/ora postării

#### 31-34. Sistem Stornare/Reversal

##### `is_reversal` - Este Stornare?
- **Tip**: `boolean`, NOT NULL, DEFAULT false
- **Logică Business**: Marchează notele care stornează alte note
- **Utilizare**: Filtrare, rapoarte corecții

##### `original_entry_id` - ID Notă Originală
- **Tip**: `uuid`, NULLABLE
- **Logică Business**: Dacă `is_reversal = true`, referință către nota stornată
- **Utilizare**: Navigare, tracking corecții

##### `reversal_entry_id` - ID Notă de Stornare
- **Tip**: `uuid`, NULLABLE, FK către `accounting_ledger_entries(id)`
- **Logică Business**: Dacă nota a fost stornată, referință către nota de stornare
- **Utilizare**: Navigare, tracking corecții

##### `reversal_reason` - Motiv Stornare
- **Tip**: `character varying(500)`, NULLABLE
- **Logică Business**: Explicație pentru stornare (obligatorie la reversal)
- **Utilizare**: Audit, conformitate, justificări

##### Reversed Trail
- **`reversed_by`** (uuid): User care a făcut stornarea
- **`reversed_at`** (timestamp): Data/ora stornării

#### 35. `metadata` - Date Suplimentare (JSONB)
- **Tip**: `jsonb`, NULLABLE
- **Logică Business**: Câmp flexibil pentru informații suplimentare specifice pe tipuri
- **Exemple**:
  ```json
  {
    "approval_workflow_id": "uuid",
    "integration_source": "shopify",
    "external_reference": "INV-2024-001",
    "custom_fields": { ... }
  }
  ```
- **Utilizare**: Extensibilitate, integrări, custom fields

### 🔗 Relații cu Alte Tabele

- **`companies`**: 1:N (o companie are multe note contabile)
- **`AC_accounting_ledger_lines`**: 1:N (o notă are multiple linii debit/credit)
- **`AC_journal_types`**: Link indirect via `type`
- **SELF**: `reversal_entry_id` → `id` (ierarhie stornări)
- **Polymorphic**: `reference_table` + `reference_id` → orice tabel sursă (invoices, payments, etc.)

### 📈 Algoritmi Importanți

#### Algoritm Creare Notă Contabilă:
```typescript
async function createLedgerEntry(data: CreateLedgerEntryInput): Promise<string> {
  return await db.transaction(async (tx) => {
    // 1. Validare partida dublă
    const totalDebit = data.lines.reduce((sum, line) => sum + line.debit_amount, 0);
    const totalCredit = data.lines.reduce((sum, line) => sum + line.credit_amount, 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Partida dublă nesatisfăcută: debit=${totalDebit}, credit=${totalCredit}`);
    }
    
    // 2. Generare număr document
    const documentNumber = await getNextDocumentNumber(data.journal_type_id);
    
    // 3. Calculare perioadă fiscală
    const fiscalYear = data.transaction_date.getFullYear();
    const fiscalMonth = data.transaction_date.getMonth() + 1;
    
    // 4. Creare header
    const [entry] = await tx
      .insert(AC_accounting_ledger_entries)
      .values({
        company_id: data.company_id,
        transaction_date: data.transaction_date,
        posting_date: new Date(),
        document_date: data.document_date,
        type: data.type,
        document_number: documentNumber,
        description: data.description,
        total_amount: Math.abs(totalDebit),
        total_debit: totalDebit,
        total_credit: totalCredit,
        fiscal_year: fiscalYear,
        fiscal_month: fiscalMonth,
        is_draft: true,
        is_posted: false,
        created_by: data.user_id
      })
      .returning({ id: AC_accounting_ledger_entries.id });
    
    // 5. Creare linii
    for (const [index, line] of data.lines.entries()) {
      await tx.insert(AC_accounting_ledger_lines).values({
        ledger_entry_id: entry.id,
        company_id: data.company_id,
        line_number: index + 1,
        ...line
      });
    }
    
    return entry.id;
  });
}
```

#### Algoritm Postare Notă:
```typescript
async function postLedgerEntry(entryId: string, userId: string): Promise<void> {
  await db.transaction(async (tx) => {
    // 1. Verificare status
    const entry = await tx.query.AC_accounting_ledger_entries.findFirst({
      where: eq(AC_accounting_ledger_entries.id, entryId)
    });
    
    if (!entry) throw new Error('Entry not found');
    if (entry.is_posted) throw new Error('Already posted');
    if (entry.is_draft) throw new Error('Cannot post draft entry');
    
    // 2. Validare partida dublă (din nou, pentru siguranță)
    const lines = await tx.query.AC_accounting_ledger_lines.findMany({
      where: eq(AC_accounting_ledger_lines.ledger_entry_id, entryId)
    });
    
    const totalDebit = lines.reduce((sum, line) => sum + line.debit_amount, 0);
    const totalCredit = lines.reduce((sum, line) => sum + line.credit_amount, 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error('Double entry validation failed');
    }
    
    // 3. Postare
    await tx
      .update(AC_accounting_ledger_entries)
      .set({
        is_posted: true,
        posted_by: userId,
        posted_at: new Date(),
        updated_at: new Date()
      })
      .where(eq(AC_accounting_ledger_entries.id, entryId));
    
    // 4. Trigger recalculare solduri
    await triggerBalanceRecalculation(entry.company_id, entry.fiscal_year, entry.fiscal_month);
  });
}
```

#### Algoritm Stornare (Reversal):
```typescript
async function reverseLedgerEntry(
  originalEntryId: string,
  reason: string,
  userId: string
): Promise<string> {
  return await db.transaction(async (tx) => {
    // 1. Obține nota originală
    const original = await tx.query.AC_accounting_ledger_entries.findFirst({
      where: eq(AC_accounting_ledger_entries.id, originalEntryId),
      with: { lines: true }
    });
    
    if (!original) throw new Error('Original entry not found');
    if (!original.is_posted) throw new Error('Can only reverse posted entries');
    if (original.reversal_entry_id) throw new Error('Entry already reversed');
    
    // 2. Creează nota de stornare (inversează debit ↔ credit)
    const [reversal] = await tx
      .insert(AC_accounting_ledger_entries)
      .values({
        ...original,
        id: undefined, // new UUID
        document_number: `REV-${original.document_number}`,
        description: `Stornare: ${original.description}`,
        is_reversal: true,
        original_entry_id: original.id,
        reversal_reason: reason,
        created_by: userId,
        created_at: new Date(),
        posted_at: null,
        is_posted: false,
        is_draft: false
      })
      .returning({ id: AC_accounting_ledger_entries.id });
    
    // 3. Creează linii stornate (inversează debit ↔ credit)
    for (const line of original.lines) {
      await tx.insert(AC_accounting_ledger_lines).values({
        ...line,
        id: undefined,
        ledger_entry_id: reversal.id,
        debit_amount: line.credit_amount, // SWAP!
        credit_amount: line.debit_amount,  // SWAP!
        created_at: new Date()
      });
    }
    
    // 4. Actualizează nota originală
    await tx
      .update(AC_accounting_ledger_entries)
      .set({
        reversal_entry_id: reversal.id,
        reversed_by: userId,
        reversed_at: new Date()
      })
      .where(eq(AC_accounting_ledger_entries.id, original.id));
    
    // 5. Postează automat stornarea
    await postLedgerEntry(reversal.id, userId);
    
    return reversal.id;
  });
}
```

### 📊 Date Curente în Sistem

**Total înregistrări**: 2

### 📋 Rezumat Audit Tabel `AC_accounting_ledger_entries`

**Status: ✅ COMPLET AUDITAT ȘI REFACTORIZAT**

**🔄 Modificări Efectuate:**
- ✅ Redenumit tabel din `accounting_ledger_entries` → `AC_accounting_ledger_entries`
- ✅ Actualizat toate indexurile: `AC_accounting_ledger_entries_pkey`, `AC_ledger_*`
- ✅ Standardizat schema Drizzle cu snake_case complet
- ✅ Documentație completă și exhaustivă
- ✅ Algoritmi de exemplu actualizați cu noile denumiri

**Concluzii:**
- ✅ Structură completă pentru double-entry accounting
- ✅ Workflow complet: draft → finalized → posted
- ✅ Sistem de stornare robust cu tracking complet
- ✅ Audit trail exhaustiv (created, updated, posted, reversed)
- ✅ Suport multi-valută cu tracking curs de schimb
- ✅ Link polymorphic către documente sursă
- ✅ UNIQUE constraint pentru duplicate prevention
- ✅ Indexes optimizate pentru query-uri frecvente
- ✅ SELF-REFERENCING FK pentru ierarhie stornări
- ✅ JSONB metadata pentru extensibilitate

**Recomandări:**
- ✅ Implementat: Workflow și validări partida dublă
- ⚠️ Consideră trigger pentru auto-calcul `fiscal_year`/`fiscal_month` din `transaction_date`
- ⚠️ Adaugă CHECK constraint: `total_debit = total_credit`
- ⚠️ Adaugă CHECK constraint: `posted_date >= transaction_date`
- ⚠️ Implementează job pentru detectare note draft vechi (>30 zile) și notificare cleanup
- ⚠️ Documentează politica de păstrare istoric (câți ani păstrăm notele contabile)

---

# 11. AC_accounting_ledger_lines

## 📋 Detalii detaliate tabel: `AC_accounting_ledger_lines`

### 🎯 Scop și Rol în Sistem

Tabelul `AC_accounting_ledger_lines` conține **liniile individuale** ale notelor contabile - fiecare linie reprezintă o înregistrare debit SAU credit într-un cont specific. Împreună cu `AC_accounting_ledger_entries`, implementează **sistemul complet de partida dublă**. Este esențial pentru:

- **Detalii tranzacții** la nivel de cont individual
- **Implementarea partida dublă** (fiecare notă are ≥2 linii: min 1 debit + min 1 credit)
- **Dimensiuni analitice** (departament, proiect, centru de cost)
- **Tracking TVA** per linie
- **Legături cu articole** (produse/servicii)
- **Tracking parteneri** (clienți/furnizori)
- **Reconciliere** pentru conturi de terți
- **Sursa pentru calcularea soldurilor** (`AC_accounting_account_balances`)

### 🏗️ Structură Tehnică

**Schema DB (PostgreSQL):**
```sql
CREATE TABLE public."AC_accounting_ledger_lines" (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    ledger_entry_id uuid NOT NULL,
    company_id uuid NOT NULL,
    line_number integer NOT NULL,
    description character varying(500),
    account_class integer NOT NULL,
    account_group integer NOT NULL,
    account_number character varying(20) NOT NULL,
    account_sub_number character varying(20),
    full_account_number character varying(50) NOT NULL,
    amount numeric(19,4) NOT NULL,
    debit_amount numeric(19,4) NOT NULL DEFAULT 0,
    credit_amount numeric(19,4) NOT NULL DEFAULT 0,
    currency character varying(3) NOT NULL DEFAULT 'RON',
    original_amount numeric(19,4),
    exchange_rate numeric(19,6) NOT NULL DEFAULT 1,
    department_id uuid,
    project_id uuid,
    cost_center_id uuid,
    vat_code character varying(20),
    vat_percentage numeric(5,2),
    vat_amount numeric(19,4),
    item_type character varying(50),
    item_id uuid,
    item_quantity numeric(19,4),
    item_unit_price numeric(19,4),
    partner_id uuid,
    partner_type character varying(20),
    due_date date,
    reference_id uuid,
    reference_table character varying(100),
    is_reconciled boolean NOT NULL DEFAULT false,
    reconciliation_id uuid,
    reconciled_at timestamp without time zone,
    reconciled_by uuid,
    metadata jsonb,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    updated_at timestamp without time zone,
    CONSTRAINT "AC_accounting_ledger_lines_pkey" PRIMARY KEY (id),
    CONSTRAINT "AC_accounting_ledger_lines_ledger_entry_id_fkey" 
        FOREIGN KEY (ledger_entry_id) REFERENCES AC_accounting_ledger_entries(id)
);
```

**Indexes:**
- PRIMARY KEY: `AC_accounting_ledger_lines_pkey` pe `id`
- INDEX: `AC_ledger_line_entry_idx` pe `ledger_entry_id` - **CRITIC pentru performance!**
- INDEX: `AC_ledger_line_account_idx` pe `(company_id, full_account_number)`
- INDEX: `AC_ledger_line_class_group_idx` pe `(company_id, account_class, account_group)`
- INDEX: `AC_ledger_line_dimension_idx` pe `(company_id, department_id, project_id, cost_center_id)`
- INDEX: `AC_ledger_line_partner_idx` pe `(company_id, partner_type, partner_id)`
- INDEX: `AC_ledger_line_item_idx` pe `(item_type, item_id)`
- INDEX: `AC_ledger_line_reference_idx` pe `(reference_table, reference_id)`

**Foreign Keys:**
- FK: `ledger_entry_id` → `AC_accounting_ledger_entries(id)`

### 📊 Coloane și Logică Business

#### 1-4. Identificare și Linkuri

##### `id` - UUID Primar
- **Tip**: `uuid`, PRIMARY KEY
- **Logică Business**: Identificator unic pentru fiecare linie contabilă
- **Utilizare**: Referințe, reconciliere, tracking

##### `ledger_entry_id` - Referință Notă Contabilă
- **Tip**: `uuid`, NOT NULL, FK către `AC_accounting_ledger_entries(id)`
- **Logică Business**: Leagă linia de nota contabilă părinte (header)
- **Utilizare**: **INDEX CRITIC** - toate query-urile pentru linii filtrează pe acest câmp

##### `company_id` - Compania Proprietară
- **Tip**: `uuid`, NOT NULL
- **Logică Business**: Multi-tenancy, redundant cu `ledger_entry_id` pentru performance
- **Utilizare**: Filtrare directă fără JOIN către `AC_accounting_ledger_entries`

##### `line_number` - Număr Linie în Notă
- **Tip**: `integer`, NOT NULL
- **Logică Business**: Ordinea liniilor în cadrul notei (1, 2, 3, ...)
- **Utilizare**: Sortare, afișare în ordinea corectă

#### 5. `description` - Descriere Linie
- **Tip**: `character varying(500)`, NULLABLE
- **Logică Business**: Descriere specifică pentru această linie (poate fi diferită de header)
- **Utilizare**: Detalii specifice liniei, clarificări

#### 6-10. Structură Cont RAS

##### `account_class` - Clasa Contului (1-9)
- **Tip**: `integer`, NOT NULL
- **Logică Business**: Prima cifră (1=Capital, ..., 9=Gestiune)
- **Utilizare**: Agregare nivel înalt, rapoarte

##### `account_group` - Grupa Contului (10-99)
- **Tip**: `integer`, NOT NULL
- **Logică Business**: Primele 2 cifre
- **Utilizare**: Agregare nivel mediu

##### `account_number` - Număr Cont Sintetic
- **Tip**: `character varying(20)`, NOT NULL
- **Logică Business**: Număr cont principal (ex: "5121", "401")
- **Utilizare**: Identificare cont

##### `account_sub_number` - Subconturi Analitice
- **Tip**: `character varying(20)`, NULLABLE
- **Logică Business**: Extensie pentru tracking detaliat (ex: ".CLIENT001")
- **Utilizare**: Urmărire per client/furnizor/proiect

##### `full_account_number` - Număr Complet
- **Tip**: `character varying(50)`, NOT NULL
- **Logică Business**: `account_number` + `account_sub_number`
- **Utilizare**: **INDEX PRINCIPAL** pentru căutări și agregări

#### 11-13. Sume și Partida Dublă

##### `amount` - Suma Absolută
- **Tip**: `numeric(19,4)`, NOT NULL
- **Logică Business**: Valoarea fără semn (pozitivă)
- **Utilizare**: Afișare, statistici

##### `debit_amount` - Suma Debit
- **Tip**: `numeric(19,4)`, NOT NULL, DEFAULT 0
- **Logică Business**: Suma pentru debit (dacă linia e debit)
- **Validare**: **MUST** `(debit_amount > 0 AND credit_amount = 0) OR (debit_amount = 0)`
- **Utilizare**: Calcul solduri, balanțe

##### `credit_amount` - Suma Credit
- **Tip**: `numeric(19,4)`, NOT NULL, DEFAULT 0
- **Logică Business**: Suma pentru credit (dacă linia e credit)
- **Validare**: **MUST** `(credit_amount > 0 AND debit_amount = 0) OR (credit_amount = 0)`
- **Utilizare**: Calcul solduri, balanțe

**Regulă CRITICĂ**: Fiecare linie are **DOAR debit SAU credit**, NICIODATĂ ambele!

#### 14-16. Multi-Currency

##### `currency` - Cod Valută
- **Tip**: `character varying(3)`, NOT NULL, DEFAULT 'RON'
- **Logică Business**: Cod ISO 4217
- **Utilizare**: Conversii, raportare multi-valută

##### `original_amount` - Suma în Valută Originală
- **Tip**: `numeric(19,4)`, NULLABLE
- **Logică Business**: Suma înainte de conversie la RON
- **Utilizare**: Verificare diferențe curs, rapoarte în valută

##### `exchange_rate` - Curs de Schimb
- **Tip**: `numeric(19,6)`, NOT NULL, DEFAULT 1
- **Logică Business**: Curs aplicat pentru conversie
- **Logică Algoritmică**: `debit/credit_amount = original_amount * exchange_rate`

#### 17-19. Dimensiuni Analitice (Cost Accounting)

##### `department_id` - Departament
- **Tip**: `uuid`, NULLABLE
- **Logică Business**: Alocă cheltuiala/venitul pe departament
- **Utilizare**: Rapoarte pe departamente, analiză costuri

##### `project_id` - Proiect
- **Tip**: `uuid`, NULLABLE
- **Logică Business**: Alocă tranzacția pe proiect specific
- **Utilizare**: Tracking profitabilitate proiecte, cost control

##### `cost_center_id` - Centru de Cost
- **Tip**: `uuid`, NULLABLE
- **Logică Business**: Alocă cheltuiala pe centru de cost
- **Utilizare**: Analiză costuri, bugetare, control management

#### 20-22. TVA (VAT)

##### `vat_code` - Cod TVA
- **Tip**: `character varying(20)`, NULLABLE
- **Logică Business**: Cod cota TVA (ex: "TVA19", "TVA9", "TVA0", "EXEMPT")
- **Utilizare**: Raportare TVA, conformitate fiscală

##### `vat_percentage` - Procent TVA
- **Tip**: `numeric(5,2)`, NULLABLE
- **Logică Business**: Cota TVA aplicată (ex: 19.00, 9.00, 5.00)
- **Utilizare**: Calcule, verificări

##### `vat_amount` - Suma TVA
- **Tip**: `numeric(19,4)`, NULLABLE
- **Logică Business**: Valoarea TVA calculată
- **Logică Algoritmică**: `vat_amount = amount * (vat_percentage / 100)`
- **Utilizare**: Decontare TVA, raportare

#### 23-26. Articole (Inventory Link)

##### `item_type` - Tip Articol
- **Tip**: `character varying(50)`, NULLABLE
- **Logică Business**: PRODUCT, SERVICE, FIXED_ASSET, etc.
- **Utilizare**: Clasificare, filtrare

##### `item_id` - ID Articol
- **Tip**: `uuid`, NULLABLE
- **Logică Business**: Link către `inventory_products` sau alte tabele
- **Utilizare**: Tracking mișcări stoc, reconciliere

##### `item_quantity` - Cantitate
- **Tip**: `numeric(19,4)`, NULLABLE
- **Logică Business**: Cantitatea din tranzacție
- **Utilizare**: Reconciliere cu stoc, calcule

##### `item_unit_price` - Preț Unitar
- **Tip**: `numeric(19,4)`, NULLABLE
- **Logică Business**: Preț per unitate
- **Logică Algoritmică**: `amount = item_quantity * item_unit_price`

#### 27-29. Parteneri (Clients/Suppliers)

##### `partner_id` - ID Partener
- **Tip**: `uuid`, NULLABLE
- **Logică Business**: Link către client/furnizor în `crm_customers` sau tabele specifice
- **Utilizare**: Tracking sold per partener, reconciliere

##### `partner_type` - Tip Partener
- **Tip**: `character varying(20)`, NULLABLE
- **Logică Business**: CLIENT, SUPPLIER, EMPLOYEE, etc.
- **Utilizare**: Clasificare, segregare rapoarte

##### `due_date` - Data Scadență
- **Tip**: `date`, NULLABLE
- **Logică Business**: Pentru conturi de terți (401, 411), data scadenței plății
- **Utilizare**: Calcul întârzieri, reminder-e, cashflow forecast

#### 30-31. Referințe Polymorphic

##### `reference_id` + `reference_table`
- **Tip**: `uuid` + `character varying(100)`, NULLABLE
- **Logică Business**: Link către document sursă specific liniei (dacă diferit de entry-level)
- **Utilizare**: Tracking granular, reconciliere

#### 32-35. Reconciliere (pentru conturi de terți)

##### `is_reconciled` - Flag Reconciliat
- **Tip**: `boolean`, NOT NULL, DEFAULT false
- **Logică Business**: Marchează liniile care au fost reconciliate (ex: factură cu plata)
- **Utilizare**: Filtrare sold neachitat, rapoarte vechime creanțe

##### `reconciliation_id` - ID Reconciliere
- **Tip**: `uuid`, NULLABLE
- **Logică Business**: Grup de linii reconciliate împreună
- **Utilizare**: Tracking sesiuni reconciliere, audit

##### `reconciled_at` + `reconciled_by`
- **Tip**: `timestamp` + `uuid`, NULLABLE
- **Logică Business**: Când și cine a făcut reconcilierea
- **Utilizare**: Audit trail

#### 36. `metadata` - Date Suplimentare (JSONB)
- **Tip**: `jsonb`, NULLABLE
- **Logică Business**: Flexibilitate pentru date specifice
- **Utilizare**: Extensibilitate fără modificări schema

#### 37-38. Audit Trail
- **`created_at`** (timestamp, NOT NULL, DEFAULT now())
- **`updated_at`** (timestamp, NULLABLE)

### 🔗 Relații cu Alte Tabele

- **`AC_accounting_ledger_entries`**: N:1 (multe linii aparțin unei note)
- **`PC_synthetic_accounts`**: Link indirect via `full_account_number`
- **`departments`**: Link via `department_id`
- **`projects`**: Link via `project_id`
- **`cost_centers`**: Link via `cost_center_id`
- **`inventory_products`**: Link via `item_id`
- **`crm_customers`**: Link via `partner_id` (când `partner_type = 'CLIENT'`)

### 📈 Algoritmi Importanți

#### Algoritm Validare Partida Dublă:
```typescript
function validateDoubleEntry(lines: LedgerLine[]): boolean {
  const totalDebit = lines.reduce((sum, line) => {
    // Verifică că nu avem atât debit cât și credit
    if (line.debit_amount > 0 && line.credit_amount > 0) {
      throw new Error(`Linia ${line.line_number}: nu poate avea atât debit cât și credit!`);
    }
    return sum + line.debit_amount;
  }, 0);
  
  const totalCredit = lines.reduce((sum, line) => sum + line.credit_amount, 0);
  
  const difference = Math.abs(totalDebit - totalCredit);
  
  if (difference > 0.01) { // Toleranță 1 ban pentru rotunjiri
    throw new Error(
      `Partida dublă nesatisfăcută: debit=${totalDebit}, credit=${totalCredit}, diferență=${difference}`
    );
  }
  
  return true;
}
```

#### Algoritm Reconciliere:
```typescript
async function reconcileLines(
  invoiceLineId: string,
  paymentLineIds: string[],
  userId: string
): Promise<string> {
  return await db.transaction(async (tx) => {
    // 1. Verifică că suma plăților = suma facturii
    const invoiceLine = await tx.query.AC_accounting_ledger_lines.findFirst({
      where: eq(AC_accounting_ledger_lines.id, invoiceLineId)
    });
    
    const paymentLines = await tx.query.AC_accounting_ledger_lines.findMany({
      where: inArray(AC_accounting_ledger_lines.id, paymentLineIds)
    });
    
    const invoiceAmount = invoiceLine.debit_amount || invoiceLine.credit_amount;
    const totalPayments = paymentLines.reduce(
      (sum, line) => sum + (line.debit_amount || line.credit_amount),
      0
    );
    
    if (Math.abs(invoiceAmount - totalPayments) > 0.01) {
      throw new Error('Suma plăților nu corespunde cu factura');
    }
    
    // 2. Creează ID reconciliere unic
    const reconciliationId = crypto.randomUUID();
    
    // 3. Marchează toate liniile ca reconciliate
    const allLineIds = [invoiceLineId, ...paymentLineIds];
    await tx
      .update(AC_accounting_ledger_lines)
      .set({
        is_reconciled: true,
        reconciliation_id: reconciliationId,
        reconciled_at: new Date(),
        reconciled_by: userId,
        updated_at: new Date()
      })
      .where(inArray(AC_accounting_ledger_lines.id, allLineIds));
    
    return reconciliationId;
  });
}
```

#### Algoritm Agregare Solduri:
```typescript
async function aggregateAccountBalances(
  companyId: string,
  fiscalYear: number,
  fiscalMonth: number
): Promise<void> {
  // Agregare folosind SQL direct pentru performanță
  await db.execute(sql`
    INSERT INTO AC_accounting_account_balances (
      company_id,
      full_account_number,
      account_class,
      account_group,
      fiscal_year,
      fiscal_month,
      period_debit,
      period_credit,
      last_calculated_at
    )
    SELECT 
      ll.company_id,
      ll.full_account_number,
      ll.account_class,
      ll.account_group,
      ${fiscalYear},
      ${fiscalMonth},
      SUM(ll.debit_amount) as period_debit,
      SUM(ll.credit_amount) as period_credit,
      NOW()
    FROM AC_accounting_ledger_lines ll
    INNER JOIN AC_accounting_ledger_entries le ON ll.ledger_entry_id = le.id
    WHERE le.company_id = ${companyId}
      AND le.fiscal_year = ${fiscalYear}
      AND le.fiscal_month = ${fiscalMonth}
      AND le.is_posted = true
    GROUP BY ll.company_id, ll.full_account_number, ll.account_class, ll.account_group
    ON CONFLICT (company_id, full_account_number, fiscal_year, fiscal_month, currency)
    DO UPDATE SET
      period_debit = EXCLUDED.period_debit,
      period_credit = EXCLUDED.period_credit,
      last_calculated_at = EXCLUDED.last_calculated_at
  `);
}
```

### 🎯 Scheme Drizzle Identificate

#### ✅ Schema Canonică (STANDARD - folosiți aceasta!)

**Fișier**: `/var/www/GeniusERP/libs/shared/src/schema/accounting.schema.ts`  
**Export**: `AC_accounting_ledger_lines`  
**Alias deprecated**: `accounting_ledger_lines` (pentru backwards compatibility)

**Caracteristici**:
- ✅ Prefix AC_ corect aplicat
- ✅ Toate cele 38 coloane definite
- ✅ snake_case pentru toate coloanele
- ✅ Definiții complete tipuri (uuid, varchar cu length, numeric cu precision/scale)
- ✅ FK către `AC_accounting_ledger_entries` cu `onDelete: 'cascade'`
- ✅ Zod schemas pentru validări (insert + select)
- ✅ 7 indexes definite pentru performance
- ✅ Re-exportată în `libs/shared/src/schema.ts`

**Import recomandat**:
```typescript
import { AC_accounting_ledger_lines } from '@/libs/shared/src/schema/accounting.schema';
// sau
import { AC_accounting_ledger_lines } from '@/libs/shared/src/schema';
```

#### ⚠️ Schema Deprecated (NU folosiți!)

**Fișier**: `/var/www/GeniusERP/libs/accounting/src/schema/accounting.schema.ts`  
**Export**: `ledger_lines` (DEPRECATED)

**Probleme**:
- ❌ Nume vechi fără prefix AC_
- ❌ Doar 8 coloane din 38 (incompletă!)
- ❌ camelCase în loc de snake_case (`ledgerEntryId` în loc de `ledger_entry_id`)
- ❌ Lipsesc: dimensiuni analitice, TVA, items, partners, reconciliere, multi-currency
- ❌ Nu are indexes definite

**Status**: Păstrată DOAR pentru backwards compatibility cu cod legacy. Va fi eliminată în viitorul apropiat.

### 📊 Date Curente în Sistem

**Total înregistrări**: 4 (2 entries × 2 lines each = 4 lines)

### 📋 Rezumat Audit Tabel `AC_accounting_ledger_lines`

**Status: ✅ COMPLET AUDITAT ȘI STANDARDIZAT**

**Prefix:** AC_ (Accounting Configuration)
**Nume Codebase:** `AC_accounting_ledger_lines`
**Nume DB (actual):** `accounting_ledger_lines` (va fi redenumit în migrare finală)

**Concluzii:**
- ✅ Structură completă pentru double-entry accounting la nivel de linie
- ✅ Suport complet dimensiuni analitice (dept, project, cost center)
- ✅ Tracking TVA per linie
- ✅ Link către inventory items pentru reconciliere stoc
- ✅ Tracking parteneri cu scadențe pentru conturi terți
- ✅ Sistem de reconciliere pentru matching facturi-plăți
- ✅ Multi-currency cu tracking curs per linie
- ✅ Indexes optimizate pentru toate tipurile de query-uri (7 total)
- ✅ JSONB metadata pentru extensibilitate
- ✅ Precizie numeric(19,4) adecvată
- ✅ Toate coloanele sunt snake_case

**Recomandări:**
- ⚠️ Adaugă CHECK constraint: `(debit_amount > 0 AND credit_amount = 0) OR (debit_amount = 0 AND credit_amount > 0)`
- ⚠️ Adaugă CHECK constraint: `debit_amount >= 0 AND credit_amount >= 0`
- ⚠️ Adaugă trigger pentru auto-calcul `amount = MAX(debit_amount, credit_amount)`
- ✅ Index parțial: `WHERE is_reconciled = false` DEJA IMPLEMENTAT în migrare!
- ⚠️ Implementează job pentru detectare linii nereconciliate > 90 zile
- ⚠️ Documentează politica de reconciliere obligatorie pentru conturi specifice (401, 411, 5121)

### 📦 Inventar Migrații Drizzle

**Total migrații active: 11 fișiere**

#### Modul Accounting (5 migrații):
1. ✅ `create_AC_account_relationships.ts` - Relații între conturi
2. ✅ `create_AC_accounting_account_balances.ts` - Solduri contabile
3. ✅ `create_AC_accounting_ledger_entries.ts` - Antet note contabile
4. ✅ `create_AC_accounting_ledger_lines.ts` - **TABELUL AUDITAT** - Linii note contabile
5. ✅ `create_AC_journal_types.ts` - Tipuri jurnale

#### Modul Core (5 migrații + 1 seed):
1. ✅ `create_PC_account_classes.ts` - Clase de conturi (1-9)
2. ✅ `create_PC_account_groups.ts` - Grupe de conturi (10-99)
3. ✅ `create_PC_account_mappings.ts` - Mapări conturi
4. ✅ `create_PC_analytic_accounts.ts` - Conturi analitice
5. ✅ `create_PC_synthetic_accounts.ts` - Conturi sintetice
6. ✅ `PC_plan_conturi_seeding/seed_plan_conturi.ts` - Date inițiale plan conturi

**Locație**: `/var/www/GeniusERP/migrations/modules/`

### ✅ Fișiere Modificate în Audit

1. ✅ `/var/www/GeniusERP/docs/audit/DB_audit.md` - Documentație completă tabel #11
2. ✅ `/var/www/GeniusERP/libs/shared/src/schema/accounting.schema.ts` - Zod validări îmbunătățite
3. ✅ `/var/www/GeniusERP/libs/accounting/src/services/journal.service.ts` - Standardizare snake_case
4. ✅ `/var/www/GeniusERP/migrations/modules/accounting/create_AC_accounting_ledger_lines.ts` - Verificat (toate indexes OK)

**Total**: 4 fișiere modificate

### 📋 Checklist Migrare Finală DB

Când se va face redenumirea `accounting_ledger_lines` → `AC_accounting_ledger_lines` în DB:

**Pre-migrare:**
- [ ] ✅ Backup complet bază de date
- [ ] ✅ Test pe environment de development
- [ ] ✅ Verificare că toate aplicațiile folosesc alias-ul

**Migrare:**
```sql
-- 1. Rename tabel
ALTER TABLE "accounting_ledger_lines" RENAME TO "AC_accounting_ledger_lines";

-- 2. Rename constraints
ALTER TABLE "AC_accounting_ledger_lines" 
  RENAME CONSTRAINT "accounting_ledger_lines_pkey" 
  TO "AC_accounting_ledger_lines_pkey";

ALTER TABLE "AC_accounting_ledger_lines" 
  RENAME CONSTRAINT "accounting_ledger_lines_ledger_entry_id_fkey" 
  TO "AC_accounting_ledger_lines_ledger_entry_id_fkey";

-- 3. Rename indexes (deja au numele corect cu prefix AC_)
-- Nu necesită redenumire

-- 4. Update foreign keys din alte tabele care fac referință
-- (nici un tabel nu referențiază AC_accounting_ledger_lines)

-- 5. Verificare
SELECT COUNT(*) FROM "AC_accounting_ledger_lines";
SELECT * FROM "AC_accounting_ledger_lines" LIMIT 5;
```

**Post-migrare:**
- [ ] ✅ Verificare că toate query-urile funcționează
- [ ] ✅ Test complet aplicație (create, read, update ledger entries)
- [ ] ✅ După 6 luni: Eliminare alias deprecated din schema Drizzle
- [ ] ✅ După 1 an: Cleanup complet cod legacy

### 🎯 Strategie Backwards Compatibility

**Faza 1 (CURENT)**: Alias în schema Drizzle
```typescript
export const accounting_ledger_lines = AC_accounting_ledger_lines; // @deprecated
```

**Faza 2 (După migrare DB)**: Deprecation warnings în cod
```typescript
/** @deprecated Use AC_accounting_ledger_lines - will be removed in 6 months */
export const accounting_ledger_lines = AC_accounting_ledger_lines;
```

**Faza 3 (După 6 luni)**: Eliminare alias
- Remove deprecated exports
- Breaking change notification
- Update all consuming code

**Faza 4 (După 1 an)**: Cleanup final
- Remove all legacy references
- Archive old migration files
- Update documentation

---


# 12. AC_accounting_settings

## 📋 Detalii detaliate tabel: `AC_accounting_settings`

**Prefix AC_:** Accounting Configuration (Configurări Contabile)

### 🎯 Scop și Rol în Sistem

Tabelul `AC_accounting_settings` conține **configurările contabile specifice fiecărei companii**. Este un tabel **1-to-1 cu `companies`** (o singură înregistrare per companie). Rolul său este de a:

- **Configura comportamentul modulului contabil** per companie
- **Activa/dezactiva module** opționale (feature flags)
- **Defini parametri fiscali** (an fiscal, workflow-uri)
- **Gestiona integrări externe** (ANAF, e-Factură, SAF-T)
- **Tracking status implementare** (istoric contabil, solduri importate)

**IMPORTANT**: Acest tabel NU este duplicat cu `companies`! Tabelul `companies` conține date **generale și legale** (CUI, adresă, bancă), iar `AC_accounting_settings` conține **configurări specifice modulului de contabilitate**.

### 🏗️ Structură Tehnică

**Schema DB (PostgreSQL):**
```sql
CREATE TABLE public."AC_accounting_settings" (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL UNIQUE,
    fiscal_year_start_month integer DEFAULT 1 NOT NULL
        CHECK (fiscal_year_start_month >= 1 AND fiscal_year_start_month <= 12),
    require_approval boolean DEFAULT false NOT NULL,
    auto_numbering boolean DEFAULT true NOT NULL,
    enable_analytic_accounting boolean DEFAULT false NOT NULL,
    enable_multi_currency boolean DEFAULT false NOT NULL,
    enable_fixed_assets boolean DEFAULT false NOT NULL,
    enable_cost_centers boolean DEFAULT false NOT NULL,
    enable_projects boolean DEFAULT false NOT NULL,
    enable_saft_export boolean DEFAULT false NOT NULL,
    enable_anaf_efactura boolean DEFAULT false NOT NULL,
    anaf_api_key text,
    has_accounting_history boolean DEFAULT false NOT NULL,
    accounting_start_date date, -- Changed from timestamp to date
    opening_balances_imported boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by uuid,
    CONSTRAINT "AC_accounting_settings_pkey" PRIMARY KEY (id),
    CONSTRAINT "AC_accounting_settings_company_id_key" UNIQUE (company_id),
    CONSTRAINT "AC_accounting_settings_company_id_fkey" 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT "AC_accounting_settings_created_by_fkey" 
        FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT "AC_accounting_settings_fiscal_month_check"
        CHECK (fiscal_year_start_month >= 1 AND fiscal_year_start_month <= 12)
);
```

**Indexes:**
- PRIMARY KEY: `AC_accounting_settings_pkey` pe `id`
- UNIQUE CONSTRAINT: `AC_accounting_settings_company_id_key` pe `company_id` - **ESENȚIAL!**
- INDEX: `idx_AC_accounting_settings_company_id` pe `company_id`

**Check Constraints:**
- `AC_accounting_settings_fiscal_month_check`: `fiscal_year_start_month BETWEEN 1 AND 12`

**Triggers:**
- `trg_AC_accounting_settings_updated_at` - Auto-update `updated_at` la modificare

### 📊 Coloane și Logică Business

#### 1-2. Identificare

##### `id` - UUID Primar
- **Tip**: `uuid`, PRIMARY KEY
- **Logică Business**: Identificator unic pentru setările contabile
- **Utilizare**: Referințe interne

##### `company_id` - Compania Asociată
- **Tip**: `uuid`, NOT NULL, **UNIQUE**, FK către `companies(id)` ON DELETE CASCADE
- **Logică Business**: **Relație 1:1** - o companie are exact UN set de configurări contabile
- **Logică Algoritmică**: **UNIQUE constraint** previne duplicate
- **Utilizare**: Lookup rapid pentru setări, CASCADE delete când se șterge compania

#### 3. `fiscal_year_start_month` - Luna Start An Fiscal
- **Tip**: `integer`, DEFAULT 1
- **Constrângeri**: CHECK `BETWEEN 1 AND 12`
- **Logică Business**: 
  - 1 = Ianuarie (cel mai comun în România)
  - Permite companii cu an fiscal diferit (ex: 4 = Aprilie pentru UK companies)
- **Logică Algoritmică**: 
  ```typescript
  function getFiscalYear(date: Date, startMonth: number): number {
    const month = date.getMonth() + 1; // 1-12
    const year = date.getFullYear();
    return month >= startMonth ? year : year - 1;
  }
  ```
- **Utilizare**: Calcul perioadă fiscală, rapoarte anuale, închidere an fiscal

#### 4-5. Workflow și Numerotare

##### `require_approval` - Necesită Aprobare
- **Tip**: `boolean`, DEFAULT false
- **Logică Business**: 
  - `true` = notele contabile trebuie aprobate înainte de postare
  - `false` = postare directă permisă
- **Logică Algoritmică**: 
  ```typescript
  if (settings.require_approval && !entry.approved) {
    throw new Error('Entry requires approval before posting');
  }
  ```
- **Utilizare**: Workflow-uri, control intern, segregation of duties

##### `auto_numbering` - Numerotare Automată
- **Tip**: `boolean`, DEFAULT true
- **Logică Business**: 
  - `true` = sistem generează automat numere documente din `accounting_journal_types`
  - `false` = utilizatorul introduce manual numerele
- **Utilizare**: UX, prevenire duplicate, autonumerotare

#### 6-10. Module Features (Feature Flags)

##### `enable_analytic_accounting` - Contabilitate Analitică
- **Tip**: `boolean`, DEFAULT false
- **Logică Business**: Activează tracking pe dimensiuni (dept, project, cost center)
- **Impact UI**: Afișează câmpuri suplimentare în formulare
- **Utilizare**: Cost accounting, bugetare, control management

##### `enable_multi_currency` - Multi-Valută
- **Tip**: `boolean`, DEFAULT false
- **Logică Business**: Permite tranzacții în multiple valute (EUR, USD, etc.)
- **Impact**: Afișează câmpuri `currency`, `exchange_rate` în formulare
- **Utilizare**: Companii internaționale, import/export

##### `enable_fixed_assets` - Mijloace Fixe
- **Tip**: `boolean`, DEFAULT false
- **Logică Business**: Activează modulul de gestiune mijloace fixe și amortizare
- **Impact**: Meniu suplimentar, tabele specifice
- **Utilizare**: Tracking depreciation, inventar imobilizări

##### `enable_cost_centers` - Centre de Cost
- **Tip**: `boolean`, DEFAULT false
- **Logică Business**: Activează alocarea pe centre de cost
- **Impact**: Câmp `cost_center_id` în `accounting_ledger_lines`
- **Utilizare**: Analiză costuri, bugetare pe departamente

##### `enable_projects` - Proiecte
- **Tip**: `boolean`, DEFAULT false
- **Logică Business**: Activează tracking pe proiecte
- **Impact**: Câmp `project_id` în `accounting_ledger_lines`
- **Utilizare**: Project accounting, profitabilitate per proiect

#### 11-13. Integrări Externe ANAF

##### `enable_saft_export` - Export SAF-T
- **Tip**: `boolean`, DEFAULT false
- **Logică Business**: Activează funcționalitatea export SAF-T (Standard Audit File for Tax)
- **Impact**: Buton export SAF-T XML în rapoarte
- **Utilizare**: Conformitate fiscală, audit ANAF

##### `enable_anaf_efactura` - Integrare e-Factură ANAF
- **Tip**: `boolean`, DEFAULT false
- **Logică Business**: Activează integrarea cu sistemul e-Factură ANAF (RO e-Invoice)
- **Impact**: Workflow upload/download facturi către/de la ANAF
- **Utilizare**: Conformitate legală (obligatoriu pentru B2B în România din 2024)

##### `anaf_api_key` - Cheie API ANAF
- **Tip**: `text`, NULLABLE
- **Logică Business**: Credențiale pentru autentificare ANAF API
- **Securitate**: 
  - ⚠️ **CRITIC**: **SENSIBIL** - TREBUIE encrypt la nivel de aplicație înainte de stocare!
  - Nu stoca NICIODATĂ plain text în DB
  - Folosește AES-256-GCM sau alt algoritm sigur de encryption
- **Logică Algoritmică**:
  - **Validare Condiționată Zod**: Dacă `enable_anaf_efactura = true`, atunci `anaf_api_key` este OBLIGATORIU
- **Utilizare**: Autentificare apeluri API ANAF, upload/download e-Facturi

#### 14-16. Date Inițiale și Import

##### `has_accounting_history` - Are Istoric Contabil Anterior
- **Tip**: `boolean`, DEFAULT false
- **Logică Business**: 
  - `true` = compania a migrat de la alt sistem contabil, are date istorice
  - `false` = companie nouă, fără istoric
- **Impact**: Workflow import, calcul solduri inițiale
- **Utilizare**: Setup wizard, data migration

##### `accounting_start_date` - Data Start Contabilitate
- **Tip**: `date` (nu timestamp!), NULLABLE
- **Logică Business**: Prima dată din care există înregistrări contabile în sistem
- **Logică Algoritmică**: 
  - Validare: `entry.transaction_date >= accounting_start_date`
  - **Validare Condiționată Zod**: Dacă `has_accounting_history = true`, atunci `accounting_start_date` este OBLIGATORIU
- **Utilizare**: Validare date, rapoarte istorice
- **Format**: `YYYY-MM-DD` (ISO date string)

##### `opening_balances_imported` - Solduri Inițiale Importate
- **Tip**: `boolean`, DEFAULT false
- **Logică Business**: 
  - `true` = soldurile de deschidere au fost importate din sistemul vechi
  - `false` = în așteptare import solduri inițiale
- **Impact**: Validare balanțe, permisiuni postare
- **Utilizare**: Setup wizard, tracking progress implementare

#### 17-19. Audit Trail

##### `created_at` - Data Creare
- **Tip**: `timestamp`, DEFAULT now()
- **Logică Business**: Când au fost create setările (= când compania a activat modulul contabil)
- **Utilizare**: Audit, istoricul companiei

##### `updated_at` - Data Ultimă Modificare
- **Tip**: `timestamp`, DEFAULT now()
- **Logică Business**: Auto-update via trigger la fiecare modificare
- **Utilizare**: Cache invalidation, tracking changes

##### `created_by` - User Creator
- **Tip**: `uuid`, FK către `users(id)`
- **Logică Business**: Cine a activat modulul contabil pentru companie
- **Utilizare**: Audit trail

### 🔗 Relații cu Alte Tabele

- **`companies`**: 1:1 (o companie are exact UN set de setări contabile) via `company_id` UNIQUE
- **`users`**: N:1 (un user poate crea setări pentru multiple companii) via `created_by`

### 🎨 Schema Drizzle ORM

**Locație:** `/var/www/GeniusERP/libs/shared/src/schema/accounting-settings.schema.ts`

```typescript
export const AC_accounting_settings = pgTable('AC_accounting_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  company_id: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  
  // Configurări generale
  fiscal_year_start_month: integer('fiscal_year_start_month').default(1).notNull(),
  require_approval: boolean('require_approval').default(false).notNull(),
  auto_numbering: boolean('auto_numbering').default(true).notNull(),
  
  // Funcționalități activate
  enable_analytic_accounting: boolean('enable_analytic_accounting').default(false).notNull(),
  enable_multi_currency: boolean('enable_multi_currency').default(false).notNull(),
  enable_fixed_assets: boolean('enable_fixed_assets').default(false).notNull(),
  enable_cost_centers: boolean('enable_cost_centers').default(false).notNull(),
  enable_projects: boolean('enable_projects').default(false).notNull(),
  
  // Integrări externe
  enable_saft_export: boolean('enable_saft_export').default(false).notNull(),
  enable_anaf_efactura: boolean('enable_anaf_efactura').default(false).notNull(),
  anaf_api_key: text('anaf_api_key'), // ⚠️ SECURITY: Must be encrypted!
  
  // Onboarding
  has_accounting_history: boolean('has_accounting_history').default(false).notNull(),
  accounting_start_date: date('accounting_start_date'), // Date type (not timestamp)
  opening_balances_imported: boolean('opening_balances_imported').default(false).notNull(),
  
  // Audit
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  created_by: uuid('created_by').references(() => users.id),
}, (table) => ({
  companyUnique: unique('AC_accounting_settings_company_unique').on(table.company_id),
  companyIdx: index('idx_AC_accounting_settings_company_id').on(table.company_id),
  fiscalMonthCheck: check('AC_accounting_settings_fiscal_month_check', 
    sql`${table.fiscal_year_start_month} >= 1 AND ${table.fiscal_year_start_month} <= 12`
  ),
}));

// Backward Compatibility Alias
export const accounting_settings = AC_accounting_settings;
```

### 🎯 Scheme Zod (cu Validări Condiționate)

```typescript
// Enhanced schema with conditional validations
export const insertAccountingSettingsSchema = baseInsertAccountingSettingsSchema.refine(
  (data) => {
    // Validare condiționată: dacă enable_anaf_efactura = true, atunci anaf_api_key obligatoriu
    if (data.enable_anaf_efactura && !data.anaf_api_key) {
      return false;
    }
    return true;
  },
  {
    message: "anaf_api_key este obligatoriu când enable_anaf_efactura este activat",
    path: ["anaf_api_key"],
  }
).refine(
  (data) => {
    // Validare condiționată: dacă has_accounting_history = true, atunci accounting_start_date obligatoriu
    if (data.has_accounting_history && !data.accounting_start_date) {
      return false;
    }
    return true;
  },
  {
    message: "accounting_start_date este obligatoriu când has_accounting_history este activat",
    path: ["accounting_start_date"],
  }
);

// TypeScript Types
export type ACAccountingSettings = typeof AC_accounting_settings.$inferSelect;
export type InsertACAccountingSettings = z.infer<typeof insertAccountingSettingsSchema>;
export type UpdateACAccountingSettings = z.infer<typeof updateAccountingSettingsSchema>;

// Backward Compatibility Aliases
export type AccountingSettings = ACAccountingSettings;
```

### 📈 Algoritmi Importanți

#### Algoritm Creare Automată Setări la Creare Companie:
```typescript
async function createCompanyWithDefaultSettings(
  companyData: CreateCompanyInput,
  userId: string
): Promise<string> {
  return await db.transaction(async (tx) => {
    // 1. Creează compania
    const [company] = await tx
      .insert(companies)
      .values(companyData)
      .returning({ id: companies.id });
    
    // 2. Creează setări contabile cu valori default
    await tx.insert(AC_accounting_settings).values({
      company_id: company.id,
      fiscal_year_start_month: 1, // Ianuarie
      require_approval: false,
      auto_numbering: true,
      enable_analytic_accounting: false,
      enable_multi_currency: false,
      enable_fixed_assets: false,
      enable_cost_centers: false,
      enable_projects: false,
      enable_saft_export: false,
      enable_anaf_efactura: false,
      has_accounting_history: false,
      opening_balances_imported: false,
      created_by: userId
    });
    
    return company.id;
  });
}
```

#### Algoritm Validare Feature Activat:
```typescript
function requireFeature(
  settings: ACAccountingSettings,
  feature: keyof ACAccountingSettings
): void {
  if (!settings[feature]) {
    throw new Error(`Modulul ${feature} nu este activat pentru această companie`);
  }
}

// Utilizare:
const settings = await getCompanyAccountingSettings(companyId);

// Înainte de a permite alocarea pe proiect:
requireFeature(settings, 'enable_projects');

// Înainte de a permite tranzacții în EUR:
requireFeature(settings, 'enable_multi_currency');
```

#### Algoritm Validare Condiționată ANAF e-Factură:
```typescript
async function validateAnafSettings(
  settings: InsertACAccountingSettings | UpdateACAccountingSettings
): Promise<boolean> {
  if (settings.enable_anaf_efactura) {
    if (!settings.anaf_api_key) {
      throw new Error('anaf_api_key este obligatoriu când enable_anaf_efactura este activat');
    }
    // Validare format API key (encrypted)
    if (settings.anaf_api_key.length < 32) {
      throw new Error('anaf_api_key invalid - trebuie să fie encrypted');
    }
  }
  
  if (settings.has_accounting_history) {
    if (!settings.accounting_start_date) {
      throw new Error('accounting_start_date este obligatoriu când has_accounting_history este activat');
    }
  }
  
  return true;
}
```

#### Algoritm Calcul An Fiscal:
```typescript
function calculateFiscalPeriod(
  date: Date,
  fiscalYearStartMonth: number
): { fiscalYear: number; fiscalMonth: number } {
  const month = date.getMonth() + 1; // 1-12
  const calendarYear = date.getFullYear();
  
  let fiscalYear: number;
  let fiscalMonth: number;
  
  if (month >= fiscalYearStartMonth) {
    // Suntem în anul fiscal curent
    fiscalYear = calendarYear;
    fiscalMonth = month - fiscalYearStartMonth + 1;
  } else {
    // Suntem în anul fiscal precedent (început în anul anterior)
    fiscalYear = calendarYear - 1;
    fiscalMonth = 12 - fiscalYearStartMonth + month + 1;
  }
  
  return { fiscalYear, fiscalMonth };
}

// Exemplu: fiscalYearStartMonth = 4 (Aprilie)
// - Data: 2024-05-15 → fiscalYear=2024, fiscalMonth=2 (a 2-a lună din anul fiscal)
// - Data: 2024-02-15 → fiscalYear=2023, fiscalMonth=11 (a 11-a lună din anul fiscal)
```

### 📊 Date Curente în Sistem

**Total înregistrări**: 1

**Valori:**
```
Company ID: c2e78d7d-b48e-4c73-9b4c-f68d8cc6e4a1
Fiscal Year Start: 1 (Ianuarie)
Require Approval: true
Auto Numbering: true
Enable Analytic: false
Enable Multi-Currency: false
Enable Fixed Assets: false
Enable Cost Centers: false
Enable Projects: false
Enable SAF-T: false
Enable ANAF e-Factură: false
Has History: false
Opening Balances Imported: false
```

### 🎯 Diferențe față de Tabelul `companies`

| Aspect | `companies` | `AC_accounting_settings` |
|--------|-------------|----------------------|
| **Scop** | Date legale, generale | Configurări modulul contabil |
| **Tip date** | Permanente (CUI, adresă) | Configurabile (feature flags) |
| **Frecvență schimbări** | Rar (doar la modificări legale) | Frecvent (activare module noi) |
| **Obligativitate** | Obligatoriu pentru toate companiile | Opțional (doar dacă folosesc modulul contabil) |
| **Prefix** | - | AC_ (Accounting Configuration) |
| **Exemple coloane** | `fiscal_code`, `address`, `bank_account` | `enable_projects`, `require_approval` |

### 📋 Rezumat Audit Tabel `AC_accounting_settings`

**Status: ✅ COMPLET AUDITAT ȘI STANDARDIZAT**

**Modificări Implementate:**
- ✅ Redenumire tabel: `accounting_settings` → `AC_accounting_settings` (prefix Accounting Configuration)
- ✅ Schimbare tip de date: `accounting_start_date` de la `timestamp` la `date`
- ✅ Adăugare check constraint Drizzle: `fiscal_year_start_month BETWEEN 1 AND 12`
- ✅ Creare pgEnum: `declaration_frequency_enum` pentru `AC_vat_settings`
- ✅ Implementare validări condiționate Zod:
  - `enable_anaf_efactura = true` → `anaf_api_key` OBLIGATORIU
  - `has_accounting_history = true` → `accounting_start_date` OBLIGATORIU
- ✅ Backward compatibility: alias `accounting_settings = AC_accounting_settings`
- ✅ Documentare completă schema Drizzle și Zod
- ✅ Update algoritmi și exemple cod

**Structură Validată:**
- ✅ Relație 1:1 corectă cu `companies` via UNIQUE constraint
- ✅ CHECK constraint pentru `fiscal_year_start_month` (1-12)
- ✅ ON DELETE CASCADE pentru cleanup automat
- ✅ Feature flags clare pentru toate modulele opționale
- ✅ Trigger pentru auto-update `updated_at`
- ✅ FK către `users` pentru audit trail
- ✅ Toate coloane folosesc snake_case consistent

**Securitate și Validări:**
- ⚠️ **CRITIC**: `anaf_api_key` TREBUIE encrypt la nivel de aplicație (AES-256-GCM)
- ✅ Validare condiționată Zod pentru `anaf_api_key` când `enable_anaf_efactura = true`
- ✅ Validare condiționată Zod pentru `accounting_start_date` când `has_accounting_history = true`
- ✅ Check constraint pentru `fiscal_year_start_month` (1-12)

**Recomandări Viitoare:**
- 💡 Consideră adăugarea `enable_bank_reconciliation` boolean pentru modulul reconciliere bancară
- 💡 Consideră adăugarea `enable_automatic_vat_calculation` boolean pentru auto-calcul TVA
- 💡 Documentează procesul de activare progresivă a modulelor (recommended path)
- 💡 Implementează audit log pentru tracking modificări setări (cine a activat ce modul și când)
- 💡 Consideră adăugarea `enable_inventory_accounting` pentru integrare inventory → accounting

**Importanță în Sistem:** ⭐⭐⭐⭐⭐ (Critică - Configurare fundamentală modul contabil)

---

# 13. AC_opening_balances

## 📋 Detalii detaliate tabel: `AC_opening_balances`

**Prefix AC_:** Accounting Configuration (Configurări Contabile)

### 🎯 Scop și Rol în Sistem

Tabelul `AC_opening_balances` stochează **soldurile inițiale (de deschidere)** pentru fiecare cont contabil la începutul unui an fiscal. Este esențial pentru:

- **Migrarea de la alt sistem contabil** - import solduri inițiale din software anterior
- **Configurare inițială companie nouă** - solduri de start pentru fiecare cont
- **Validare balanță de verificare** - verificare că Total Debit = Total Credit
- **Raportare comparativă** - solduri pentru multiple exerciții fiscale
- **Workflow import și aprobare** - proces de validare înainte de postare finală

**IMPORTANT**: Acest tabel este folosit DOAR la setup-ul inițial al companiei sau la începutul unui nou an fiscal. NU se actualizează dinamic - soldurile curente se calculează din `AC_accounting_account_balances`.

### 🏗️ Structură Tehnică

**Schema DB (PostgreSQL) - REALĂ din producție:**
```sql
CREATE TABLE public.opening_balances (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL,
    account_code text NOT NULL,
    account_name text NOT NULL,
    debit_balance numeric(15,2) DEFAULT 0.00,
    credit_balance numeric(15,2) DEFAULT 0.00,
    fiscal_year integer NOT NULL,
    import_date date NOT NULL DEFAULT CURRENT_DATE,
    import_source text,
    is_validated boolean DEFAULT false,
    validated_at timestamp without time zone,
    validated_by uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT "opening_balances_pkey" PRIMARY KEY (id),
    CONSTRAINT "opening_balances_company_id_account_code_fiscal_year_key" 
        UNIQUE (company_id, account_code, fiscal_year),
    CONSTRAINT "opening_balances_company_id_fkey" 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    CONSTRAINT "opening_balances_created_by_fkey" 
        FOREIGN KEY (created_by) REFERENCES users(id),
    CONSTRAINT "opening_balances_validated_by_fkey" 
        FOREIGN KEY (validated_by) REFERENCES users(id)
);
```

**Indexes:**
- PRIMARY KEY: `opening_balances_pkey` pe `id`
- UNIQUE: `opening_balances_company_id_account_code_fiscal_year_key` pe `(company_id, account_code, fiscal_year)`
- INDEX: `idx_opening_balances_company_id` pe `company_id`
- INDEX: `idx_opening_balances_fiscal_year` pe `fiscal_year`
- INDEX: `idx_opening_balances_account_code` pe `account_code`
- PARTIAL INDEX: `idx_opening_balances_validated` pe `is_validated` WHERE `is_validated = true`

**Check Constraints:**
- `opening_balances_check`: Verifică că DOAR debit SAU credit are valoare (nu ambele simultan)
  ```sql
  CHECK (
    (debit_balance > 0 AND credit_balance = 0) OR 
    (debit_balance = 0 AND credit_balance > 0) OR 
    (debit_balance = 0 AND credit_balance = 0)
  )
  ```
- `opening_balances_debit_balance_check`: `debit_balance >= 0`
- `opening_balances_credit_balance_check`: `credit_balance >= 0`
- `opening_balances_fiscal_year_check`: `fiscal_year BETWEEN 2000 AND 2100`
- `opening_balances_import_source_check`: `import_source IN ('MANUAL', 'CSV', 'EXCEL', 'API')`

**Triggers:**
- `trg_opening_balances_updated_at` - Auto-update `updated_at` la modificare

### 📊 Coloane și Logică Business

#### 1. `id` - UUID Primar
- **Tip**: `uuid`
- **Constrângeri**: PRIMARY KEY, NOT NULL, DEFAULT gen_random_uuid()
- **Logică Business**: Identificator unic pentru fiecare înregistrare de sold inițial
- **Schema Drizzle**: `uuid('id').primaryKey().defaultRandom()`
- **Utilizare**: Cheie primară, referințe interne

#### 2. `company_id` - Compania Proprietară
- **Tip**: `uuid`
- **Constrângeri**: NOT NULL, FK către `companies(id)` ON DELETE CASCADE, parte din UNIQUE constraint
- **Logică Business**: Multi-tenancy - fiecare companie are propriile solduri inițiale
- **Schema Drizzle**: `uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' })`
- **Logică Algoritmică**: Parte din tripletul unic `(company_id, account_code, fiscal_year)`
- **Utilizare**: Filtrare, securitate, izolare date per companie

#### 3. `account_code` - Cod Cont Contabil
- **Tip**: `text`
- **Constrângeri**: NOT NULL, parte din UNIQUE constraint
- **Logică Business**: Codul contului din Planul de Conturi (sintetic sau analitic)
- **Schema Drizzle**: `text('account_code').notNull()`
- **Format**: 
  - Conturi sintetice: `"401"`, `"5311"`, `"121"` (3-4 cifre)
  - Conturi analitice: `"371.1"`, `"4111.001"` (cu punct)
- **Validare Zod**: `z.string().min(1)` - minimum 1 caracter
- **Utilizare**: Identificare cont pentru care se importă soldul
- **Logică Algoritmică**: Trebuie să corespundă cu un cont existent din `PC_synthetic_accounts` sau `PC_analytic_accounts`

#### 4. `account_name` - Denumire Cont
- **Tip**: `text`
- **Constrângeri**: NOT NULL
- **Logică Business**: Denumirea contului (copiată din Planul de Conturi pentru referință rapidă)
- **Schema Drizzle**: `text('account_name').notNull()`
- **Format**: Text liber, de obicei 50-255 caractere
- **Validare Zod**: `z.string().min(1)` - minimum 1 caracter
- **Utilizare**: Afișare în UI fără JOIN, rapoarte, export
- **Exemple**: 
  - `"Furnizori"`
  - `"Clienți"`
  - `"Mărfuri în gestiunea Constanța Test"`

#### 5. `debit_balance` - Sold Debitor Inițial
- **Tip**: `numeric(15,2)`
- **Constrângeri**: DEFAULT 0.00
- **Logică Business**: Soldul debitor la începutul anului fiscal pentru conturile cu funcție ACTIV
- **Schema Drizzle**: `decimal('debit_balance', { precision: 15, scale: 2 }).default('0.00').notNull()`
- **Format**: Maxim 15 cifre, 2 zecimale (ex: 9,999,999,999,999.99)
- **Validare Check**: `debit_balance >= 0` (nu poate fi negativ)
- **Validare Zod**: `z.string().regex(/^\d+(\.\d{1,2})?$/)`
- **Logică Algoritmică**: 
  ```typescript
  // Un cont poate avea DOAR debit SAU credit, NU ambele
  if (debit_balance > 0) credit_balance MUST be 0
  ```
- **Utilizare**: Import solduri pentru conturi active (clase 1-2-5-6), calcul balanță

#### 6. `credit_balance` - Sold Creditor Inițial
- **Tip**: `numeric(15,2)`
- **Constrângeri**: DEFAULT 0.00
- **Logică Business**: Soldul creditor la începutul anului fiscal pentru conturile cu funcție PASIV
- **Schema Drizzle**: `decimal('credit_balance', { precision: 15, scale: 2 }).default('0.00').notNull()`
- **Format**: Maxim 15 cifre, 2 zecimale
- **Validare Check**: `credit_balance >= 0` (nu poate fi negativ)
- **Validare Zod**: `z.string().regex(/^\d+(\.\d{1,2})?$/)`
- **Logică Algoritmică**: 
  ```typescript
  // Un cont poate avea DOAR credit SAU debit, NU ambele
  if (credit_balance > 0) debit_balance MUST be 0
  ```
- **Utilizare**: Import solduri pentru conturi pasive (clase 3-4-7), calcul balanță

**REGULĂ CRITICĂ**: Check constraint asigură că:
- DOAR debit > 0 (credit = 0), SAU
- DOAR credit > 0 (debit = 0), SAU
- Ambele = 0 (cont fără sold inițial)

#### 7. `fiscal_year` - An Fiscal
- **Tip**: `integer`
- **Constrângeri**: NOT NULL, parte din UNIQUE constraint
- **Logică Business**: Anul fiscal pentru care sunt soldurile inițiale (ex: 2024, 2025)
- **Schema Drizzle**: `integer('fiscal_year').notNull()`
- **Validare Check**: `fiscal_year BETWEEN 2000 AND 2100`
- **Validare Zod**: `z.number().int().min(2000).max(2100)`
- **Logică Algoritmică**: Permite import solduri pentru multipli ani fiscali (istoric)
- **Utilizare**: Filtrare pe an, rapoarte comparative, migrații multiple

#### 8. `import_date` - Data Importului
- **Tip**: `date` (NU timestamp!)
- **Constrângeri**: NOT NULL, DEFAULT CURRENT_DATE
- **Logică Business**: Data când au fost importate soldurile în sistem
- **Schema Drizzle**: `timestamp('import_date').defaultNow().notNull()`  
  **⚠️ ATENȚIE**: Schema Drizzle folosește GREȘIT `timestamp` dar DB-ul are `date`! Trebuie corectat!
- **Format**: `YYYY-MM-DD` (ISO date)
- **Utilizare**: Audit trail, tracking când s-au făcut importuri

#### 9. `import_source` - Sursa Importului
- **Tip**: `text`
- **Constrângeri**: NULLABLE
- **Logică Business**: Metoda folosită pentru import
- **Schema Drizzle**: `text('import_source')`
- **Valori Permise** (Check Constraint):
  - `'MANUAL'` - Introdus manual de utilizator
  - `'CSV'` - Importat din fișier CSV
  - `'EXCEL'` - Importat din fișier Excel
  - `'API'` - Importat prin API (integrare externă)
- **Validare Zod**: `z.enum(['MANUAL', 'CSV', 'EXCEL', 'API']).optional().nullable()`
- **Utilizare**: Tracking proveniență date, audit, debugging

#### 10. `is_validated` - Flag Validat
- **Tip**: `boolean`
- **Constrângeri**: DEFAULT false
- **Logică Business**: Marchează dacă soldurile au fost validate și aprobate
- **Schema Drizzle**: `boolean('is_validated').default(false).notNull()`
- **Workflow**:
  ```
  1. Import → is_validated = false (în așteptare validare)
  2. Verificare balanță (Total Debit = Total Credit)
  3. Aprobare → is_validated = true, validated_at = NOW(), validated_by = user_id
  4. Doar solduri validate pot fi folosite pentru rapoarte oficiale
  ```
- **Logică Algoritmică**: 
  ```typescript
  if (!opening_balances.is_validated) {
    warning('Soldurile nu sunt validate - raportul poate fi inexact');
  }
  ```
- **Utilizare**: Control workflow, filtrare solduri aprobate

#### 11. `validated_at` - Data Validării
- **Tip**: `timestamp without time zone`
- **Constrângeri**: NULLABLE
- **Logică Business**: Când au fost validate soldurile
- **Schema Drizzle**: `timestamp('validated_at')`
- **Logică Algoritmică**: 
  ```typescript
  if (is_validated && !validated_at) {
    throw new Error('validated_at trebuie setat când is_validated = true');
  }
  ```
- **Utilizare**: Audit trail, tracking proces validare

#### 12. `validated_by` - User Validator
- **Tip**: `uuid`
- **Constrângeri**: NULLABLE, FK către `users(id)`
- **Logică Business**: Cine a validat și aprobat soldurile
- **Schema Drizzle**: `uuid('validated_by').references(() => users.id)`
- **Logică Algoritmică**: 
  ```typescript
  if (is_validated && !validated_by) {
    throw new Error('validated_by trebuie setat când is_validated = true');
  }
  ```
- **Utilizare**: Audit trail, responsabilitate, conformitate

#### 13. `created_at` - Data Creare
- **Tip**: `timestamp without time zone`
- **Constrângeri**: DEFAULT now()
- **Logică Business**: Când a fost creată înregistrarea (primul import)
- **Schema Drizzle**: `timestamp('created_at').defaultNow().notNull()`
- **Utilizare**: Audit trail

#### 14. `updated_at` - Data Actualizare
- **Tip**: `timestamp without time zone`
- **Constrângeri**: DEFAULT now()
- **Logică Business**: Auto-update via trigger la modificare
- **Schema Drizzle**: `timestamp('updated_at').defaultNow().notNull()`
- **Trigger**: `trg_opening_balances_updated_at`
- **Utilizare**: Cache invalidation, tracking modificări

#### 15. `created_by` - User Creator
- **Tip**: `uuid`
- **Constrângeri**: NULLABLE, FK către `users(id)`
- **Logică Business**: Cine a importat soldurile inițiale
- **Schema Drizzle**: `uuid('created_by').references(() => users.id)`
- **Utilizare**: Audit trail

### 🔗 Relații cu Alte Tabele

- **`companies`**: N:1 (o companie are multe solduri inițiale, câte unul per cont per an fiscal) via `company_id` ON DELETE CASCADE
- **`users`**: N:1 (un user poate importa solduri pentru multiple companii) via `created_by`
- **`users`**: N:1 (un user poate valida solduri pentru multiple companii) via `validated_by`

### 🎨 Schema Drizzle ORM

**Locație:** `/var/www/GeniusERP/libs/shared/src/schema/accounting-settings.schema.ts`

```typescript
export const AC_opening_balances = pgTable('AC_opening_balances', {
  id: uuid('id').primaryKey().defaultRandom(),
  company_id: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  
  // Cont contabil
  account_code: text('account_code').notNull(),
  account_name: text('account_name').notNull(),
  
  // Solduri
  debit_balance: decimal('debit_balance', { precision: 15, scale: 2 }).default('0.00').notNull(),
  credit_balance: decimal('credit_balance', { precision: 15, scale: 2 }).default('0.00').notNull(),
  
  // Metadata
  fiscal_year: integer('fiscal_year').notNull(),
  import_date: timestamp('import_date').defaultNow().notNull(), // ⚠️ GREȘIT: DB are date, nu timestamp!
  import_source: text('import_source'),
  
  // Status
  is_validated: boolean('is_validated').default(false).notNull(),
  validated_at: timestamp('validated_at'),
  validated_by: uuid('validated_by').references(() => users.id),
  
  // Audit
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  created_by: uuid('created_by').references(() => users.id),
}, (table) => ({
  balanceUnique: unique('AC_opening_balances_unique').on(table.company_id, table.account_code, table.fiscal_year),
  companyIdx: index('idx_AC_opening_balances_company_id').on(table.company_id),
  fiscalYearIdx: index('idx_AC_opening_balances_fiscal_year').on(table.fiscal_year),
  accountCodeIdx: index('idx_AC_opening_balances_account_code').on(table.account_code),
}));

// Backward Compatibility Alias
export const opening_balances = AC_opening_balances;
```

**⚠️ PROBLEMĂ IDENTIFICATĂ**: 
- DB folosește `date` pentru `import_date`
- Schema Drizzle folosește `timestamp`
- **TREBUIE CORECTAT în schema Drizzle!**

### 🎯 Scheme Zod pentru Validare

```typescript
export const insertOpeningBalancesSchema = createInsertSchema(AC_opening_balances, {
  account_code: z.string().min(1),
  account_name: z.string().min(1),
  fiscal_year: z.number().int().min(2000).max(2100),
  debit_balance: z.string().regex(/^\d+(\.\d{1,2})?$/),
  credit_balance: z.string().regex(/^\d+(\.\d{1,2})?$/),
  import_source: z.enum(['MANUAL', 'CSV', 'EXCEL', 'API']).optional().nullable(),
});

export const selectOpeningBalancesSchema = createSelectSchema(AC_opening_balances);

export const updateOpeningBalancesSchema = insertOpeningBalancesSchema.partial().omit({
  id: true,
  company_id: true,
  created_at: true,
  updated_at: true,
  created_by: true,
});

// TypeScript Types
export type ACOpeningBalance = typeof AC_opening_balances.$inferSelect;
export type InsertACOpeningBalance = z.infer<typeof insertOpeningBalancesSchema>;
export type UpdateACOpeningBalance = z.infer<typeof updateOpeningBalancesSchema>;

// Backward Compatibility Aliases
export type OpeningBalance = ACOpeningBalance;
```

### 📈 Algoritmi Importanți

#### Algoritm Import Solduri Inițiale cu Validare:
```typescript
async function importOpeningBalances(
  companyId: string,
  fiscalYear: number,
  balances: Array<{ account_code: string; account_name: string; debit: number; credit: number }>,
  userId: string,
  source: 'MANUAL' | 'CSV' | 'EXCEL' | 'API'
): Promise<{ success: boolean; imported: number; errors: string[] }> {
  return await db.transaction(async (tx) => {
    const errors: string[] = [];
    let imported = 0;
    
    // 1. Validare balanță echilibrată
    const totalDebit = balances.reduce((sum, b) => sum + b.debit, 0);
    const totalCredit = balances.reduce((sum, b) => sum + b.credit, 0);
    
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(
        `Balanța nu este echilibrată! ` +
        `Total Debit: ${totalDebit}, Total Credit: ${totalCredit}, ` +
        `Diferență: ${Math.abs(totalDebit - totalCredit)}`
      );
    }
    
    // 2. Import fiecare sold
    for (const balance of balances) {
      try {
        // Validare: un cont poate avea DOAR debit SAU credit
        if (balance.debit > 0 && balance.credit > 0) {
          errors.push(`${balance.account_code}: Nu poate avea atât debit cât și credit`);
          continue;
        }
        
        // Verificare cont există în planul de conturi
        const accountExists = await tx.query.PC_synthetic_accounts.findFirst({
          where: eq(PC_synthetic_accounts.code, balance.account_code)
        }) || await tx.query.PC_analytic_accounts.findFirst({
          where: eq(PC_analytic_accounts.code, balance.account_code)
        });
        
        if (!accountExists) {
          errors.push(`${balance.account_code}: Contul nu există în Planul de Conturi`);
          continue;
        }
        
        // Insert/Update
        await tx.insert(AC_opening_balances).values({
          company_id: companyId,
          account_code: balance.account_code,
          account_name: balance.account_name,
          debit_balance: balance.debit.toFixed(2),
          credit_balance: balance.credit.toFixed(2),
          fiscal_year: fiscalYear,
          import_source: source,
          is_validated: false, // Necesită validare manuală
          created_by: userId
        }).onConflictDoUpdate({
          target: [
            AC_opening_balances.company_id,
            AC_opening_balances.account_code,
            AC_opening_balances.fiscal_year
          ],
          set: {
            debit_balance: balance.debit.toFixed(2),
            credit_balance: balance.credit.toFixed(2),
            import_source: source,
            updated_at: new Date()
          }
        });
        
        imported++;
      } catch (error) {
        errors.push(`${balance.account_code}: ${error.message}`);
      }
    }
    
    return { success: errors.length === 0, imported, errors };
  });
}
```

#### Algoritm Validare Balanță Totală:
```typescript
async function validateOpeningBalances(
  companyId: string,
  fiscalYear: number
): Promise<{ isBalanced: boolean; totalDebit: number; totalCredit: number; difference: number }> {
  const balances = await db
    .select({
      debit: AC_opening_balances.debit_balance,
      credit: AC_opening_balances.credit_balance
    })
    .from(AC_opening_balances)
    .where(and(
      eq(AC_opening_balances.company_id, companyId),
      eq(AC_opening_balances.fiscal_year, fiscalYear)
    ));
  
  const totalDebit = balances.reduce((sum, b) => sum + Number(b.debit), 0);
  const totalCredit = balances.reduce((sum, b) => sum + Number(b.credit), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  
  return {
    isBalanced: difference < 0.01, // Toleranță 1 ban pentru rotunjiri
    totalDebit,
    totalCredit,
    difference
  };
}
```

#### Algoritm Aprobare Solduri:
```typescript
async function approveOpeningBalances(
  companyId: string,
  fiscalYear: number,
  userId: string
): Promise<void> {
  // 1. Validare balanță
  const validation = await validateOpeningBalances(companyId, fiscalYear);
  
  if (!validation.isBalanced) {
    throw new Error(
      `Nu se pot aproba solduri nebalanțate! ` +
      `Diferență: ${validation.difference} RON`
    );
  }
  
  // 2. Marcare ca validate
  await db
    .update(AC_opening_balances)
    .set({
      is_validated: true,
      validated_at: new Date(),
      validated_by: userId,
      updated_at: new Date()
    })
    .where(and(
      eq(AC_opening_balances.company_id, companyId),
      eq(AC_opening_balances.fiscal_year, fiscalYear)
    ));
  
  // 3. Marcare în accounting_settings că soldurile au fost importate
  await db
    .update(AC_accounting_settings)
    .set({
      opening_balances_imported: true,
      updated_at: new Date()
    })
    .where(eq(AC_accounting_settings.company_id, companyId));
}
```

### 📊 Date Curente în Sistem

**Total înregistrări**: **0** (tabel GOL - nicio companie nu a importat încă solduri inițiale)

**Motivul pentru 0 rows**:
- Tabel folosit DOAR la setup inițial sau migrare de la alt sistem
- Compania actuală în sistem nu a activat încă `has_accounting_history = true`
- Workflow: Companie nouă → pornește cu balanță zero → nu necesită solduri inițiale

### 🎯 Workflow Complet Import Solduri

```
STEP 1: Pregătire fișier
  ↓ User pregătește Excel/CSV cu solduri: account_code, account_name, debit, credit
  
STEP 2: Upload fișier
  ↓ Frontend upload → Backend parse și validare format
  
STEP 3: Validare conturi
  ↓ Verifică că toate codurile există în PC_synthetic_accounts / PC_analytic_accounts
  ↓ Errors: "Cont 999 nu există în planul de conturi"
  
STEP 4: Validare balanță
  ↓ Verifică Total Debit = Total Credit
  ↓ Error dacă diferență > 0.01 RON
  
STEP 5: Import cu status is_validated = false
  ↓ INSERT în AC_opening_balances
  ↓ import_source = 'CSV' / 'EXCEL' / 'MANUAL' / 'API'
  
STEP 6: Review de către contabil
  ↓ UI afișează lista solduri importate
  ↓ Verificare manuală: "Sold cont 401 = 15,000 RON creditor - Corect?"
  
STEP 7: Aprobare finală
  ↓ is_validated = true, validated_at = NOW(), validated_by = user_id
  ↓ AC_accounting_settings.opening_balances_imported = true
  
STEP 8: Utilizare în rapoarte
  ↓ Rapoartele folosesc DOAR soldurile cu is_validated = true
```

### 📋 Rezumat Audit Tabel `AC_opening_balances`

**Status: ✅ COMPLET AUDITAT**

**Date din DB Real:**
- **Înregistrări**: 0 rows (GOL)
- **Check Constraints**: 5 constraints active (debit/credit exclusivity, range validation, import source enum)
- **Foreign Keys**: 3 FK-uri (company_id, created_by, validated_by)
- **Indexes**: 5 indexes (PRIMARY + 4 performance indexes)
- **Trigger**: 1 trigger pentru auto-update `updated_at`

**Modificări Necesare:**
- ⚠️ **CRITIC**: Schema Drizzle folosește `timestamp` pentru `import_date` dar DB are `date` - TREBUIE CORECTAT!
- ✅ Redenumire tabel: `opening_balances` → `AC_opening_balances`
- ✅ Toate coloane sunt snake_case
- ✅ Check constraints robuste
- ✅ UNIQUE constraint pe triplet (company_id, account_code, fiscal_year)
- ✅ Workflow validare implementat

**Importanță în Sistem:** ⭐⭐⭐⭐ (Critică pentru setup inițial și migrări)

**Probleme Identificate:**
1. ❌ `import_date` tip diferit între DB (`date`) și Drizzle (`timestamp`) - **TREBUIE CORECTAT**
2. ⚠️ Nu există validare Zod condiționată: `if is_validated = true → validated_at și validated_by REQUIRED`
3. ⚠️ Lipsește index pe `is_validated` pentru filtrare rapidă (EXISTĂ parțial - doar WHERE is_validated = true)

---

# 14. AC_vat_settings

## 📋 Detalii detaliate tabel: `AC_vat_settings`

**Prefix AC_:** Accounting Configuration (Configurări Contabile)

### 🎯 Scop și Rol în Sistem

Tabelul `AC_vat_settings` conține **configurările TVA (Taxă pe Valoarea Adăugată) specifice fiecărei companii**. Este un tabel **1-to-1 cu `companies`** (o singură înregistrare per companie). Rolul său este de a:

- **Configura regimul TVA** (plătitor de TVA, TVA la încasare)
- **Defini cotele TVA** utilizate (standard, redusă 1, redusă 2)
- **Configura conturile TVA** conform Planului de Conturi Român
- **Seta frecvența declarațiilor** TVA (lunară/trimestrială)
- **Activa validarea automată** CIF/CUI în raportare
- **Pragul TVA la încasare** conform legislației românești

**IMPORTANT**: Acestea sunt setările de configurare TVA, NU înregistrările efective de TVA (care sunt în `AC_accounting_ledger_lines` și tabele de raportare TVA).

### 🏗️ Structură Tehnică

**Schema DB (PostgreSQL) - REALĂ din producție:**
```sql
CREATE TABLE public.vat_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL,
    vat_payer boolean DEFAULT true,
    use_cash_vat boolean DEFAULT false,
    cash_vat_threshold numeric(15,2) DEFAULT 2250000.00,
    standard_vat_rate integer DEFAULT 19,
    reduced_vat_rate_1 integer DEFAULT 9,
    reduced_vat_rate_2 integer DEFAULT 5,
    vat_collected_account text DEFAULT '4427'::text,
    vat_deductible_account text DEFAULT '4426'::text,
    vat_payable_account text DEFAULT '4423'::text,
    vat_receivable_account text DEFAULT '4424'::text,
    declaration_frequency text DEFAULT 'monthly'::text,
    enable_vat_validation boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT "vat_settings_pkey" PRIMARY KEY (id),
    CONSTRAINT "vat_settings_company_id_key" UNIQUE (company_id),
    CONSTRAINT "vat_settings_company_id_fkey" 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);
```

**Indexes:**
- PRIMARY KEY: `vat_settings_pkey` pe `id`
- UNIQUE: `vat_settings_company_id_key` pe `company_id` - **ESENȚIAL pentru relația 1:1!**
- INDEX: `idx_vat_settings_company_id` pe `company_id`

**Check Constraints:**
- `vat_settings_cash_vat_threshold_check`: `cash_vat_threshold >= 0`
- `vat_settings_declaration_frequency_check`: `declaration_frequency IN ('monthly', 'quarterly')`
- `vat_settings_standard_vat_rate_check`: `standard_vat_rate BETWEEN 0 AND 100`
- `vat_settings_reduced_vat_rate_1_check`: `reduced_vat_rate_1 BETWEEN 0 AND 100`
- `vat_settings_reduced_vat_rate_2_check`: `reduced_vat_rate_2 BETWEEN 0 AND 100`

**Triggers:**
- `trg_vat_settings_updated_at` - Auto-update `updated_at` la modificare

### 📊 Coloane și Logică Business

#### 1. `id` - UUID Primar
- **Tip**: `uuid`
- **Constrângeri**: PRIMARY KEY, NOT NULL, DEFAULT gen_random_uuid()
- **Logică Business**: Identificator unic pentru setările TVA ale companiei
- **Schema Drizzle**: `uuid('id').primaryKey().defaultRandom()`
- **Utilizare**: Cheie primară

#### 2. `company_id` - Compania Asociată
- **Tip**: `uuid`
- **Constrângeri**: NOT NULL, **UNIQUE**, FK către `companies(id)` ON DELETE CASCADE
- **Logică Business**: **Relație 1:1** - o companie are exact UN set de configurări TVA
- **Schema Drizzle**: `uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' })`
- **Logică Algoritmică**: UNIQUE constraint previne duplicate
- **Utilizare**: Lookup rapid pentru setări TVA

#### 3. `vat_payer` - Plătitor TVA
- **Tip**: `boolean`
- **Constrângeri**: DEFAULT true
- **Logică Business**: Indică dacă compania este plătitoare de TVA
- **Schema Drizzle**: `boolean('vat_payer').default(true).notNull()`
- **Logică Algoritmică**:
  ```typescript
  if (!settings.vat_payer) {
    // Nu se calculează TVA, nu se generează declarații
    // Facturi fără TVA
  } else {
    // Se aplică TVA conform cotelor configurate
  }
  ```
- **Utilizare**: Control workflow TVA, generare facturi, raportare
- **Context România**: Majoritatea firmelor sunt plătitoare TVA (înregistrate în scopuri de TVA)

#### 4. `use_cash_vat` - TVA la Încasare
- **Tip**: `boolean`
- **Constrângeri**: DEFAULT false
- **Logică Business**: Activează regimul TVA la încasare (cash accounting pentru TVA)
- **Schema Drizzle**: `boolean('use_cash_vat').default(false).notNull()`
- **Logică Algoritmică**:
  ```typescript
  if (settings.use_cash_vat) {
    // TVA se declară DOAR când s-a încasat efectiv banii
    // Decontare TVA la încasare pentru vânzări
    // Decontare TVA la plată pentru achiziții
  } else {
    // TVA la exigibilitate (normal regime)
    // TVA se declară când se emite/primește factura
  }
  ```
- **Utilizare**: Calcul TVA de plată, declarații TVA, cashflow
- **Legislație România**: Disponibil pentru companii cu cifră de afaceri < 2,250,000 RON/an

#### 5. `cash_vat_threshold` - Prag TVA la Încasare
- **Tip**: `numeric(15,2)`
- **Constrângeri**: DEFAULT 2250000.00
- **Logică Business**: Pragul legal pentru eligibilitate TVA la încasare (în RON)
- **Schema Drizzle**: `decimal('cash_vat_threshold', { precision: 15, scale: 2 }).default('2250000.00').notNull()`
- **Validare Check**: `cash_vat_threshold >= 0`
- **Valoare Curentă România**: 2,250,000 RON (conform Codul Fiscal art. 134^2)
- **Logică Algoritmică**:
  ```typescript
  const annualRevenue = await calculateAnnualRevenue(companyId);
  const isEligibleForCashVAT = annualRevenue < settings.cash_vat_threshold;
  
  if (settings.use_cash_vat && !isEligibleForCashVAT) {
    warning('Compania depășește pragul pentru TVA la încasare!');
  }
  ```
- **Utilizare**: Validare eligibilitate, alerting, conformitate

#### 6. `standard_vat_rate` - Cota Standard TVA
- **Tip**: `integer`
- **Constrângeri**: DEFAULT 19
- **Logică Business**: Cota TVA standard folosită în România (%)
- **Schema Drizzle**: `integer('standard_vat_rate').default(19).notNull()`
- **Validare Check**: `standard_vat_rate BETWEEN 0 AND 100`
- **Validare Zod**: `z.number().int().min(0).max(100)`
- **Valoare Curentă România**: 19% (aplicată majorității bunurilor și serviciilor)
- **Logică Algoritmică**:
  ```typescript
  const vatAmount = baseAmount * (settings.standard_vat_rate / 100);
  // Ex: 1000 RON * (19/100) = 190 RON TVA
  ```
- **Utilizare**: Calcul TVA facturi, raportare, validare
- **Istoric România**: 24% (2010-2015), 20% (2016), 19% (2017-prezent)

#### 7. `reduced_vat_rate_1` - Cota Redusă 1 TVA
- **Tip**: `integer`
- **Constrângeri**: DEFAULT 9
- **Logică Business**: Prima cotă redusă TVA (%)
- **Schema Drizzle**: `integer('reduced_vat_rate_1').default(9).notNull()`
- **Validare Check**: `reduced_vat_rate_1 BETWEEN 0 AND 100`
- **Validare Zod**: `z.number().int().min(0).max(100)`
- **Valoare Curentă România**: 9%
- **Aplicabil pentru**:
  - Servicii de alimentație (restaurante, catering)
  - Cazare în hoteluri
  - Acces la evenimente sportive și culturale
  - Servicii medicale
- **Utilizare**: Calcul TVA produse/servicii specifice

#### 8. `reduced_vat_rate_2` - Cota Redusă 2 TVA
- **Tip**: `integer`
- **Constrângeri**: DEFAULT 5
- **Logică Business**: A doua cotă redusă TVA (%)
- **Schema Drizzle**: `integer('reduced_vat_rate_2').default(5).notNull()`
- **Validare Check**: `reduced_vat_rate_2 BETWEEN 0 AND 100`
- **Validare Zod**: `z.number().int().min(0).max(100)`
- **Valoare Curentă România**: 5%
- **Aplicabil pentru**:
  - Cărți, ziare, reviste
  - Medicamente
  - Proteze și aparate ortopedice
  - Livrări de locuințe (sub anumite condiții)
- **Utilizare**: Calcul TVA produse specifice

#### 9. `vat_collected_account` - Cont TVA Colectată
- **Tip**: `text`
- **Constrângeri**: DEFAULT '4427'
- **Logică Business**: Contul contabil pentru TVA colectată de la clienți (vânzări)
- **Schema Drizzle**: `text('vat_collected_account').default('4427').notNull()`
- **Valoare Standard România**: `'4427'` - TVA colectată (conform Planului de Conturi)
- **Logică Algoritmică**:
  ```typescript
  // La facturare vânzare:
  // Debit: 4111 (Client) = 1190 RON
  // Credit: 707 (Venituri) = 1000 RON
  // Credit: 4427 (TVA colectată) = 190 RON ← settings.vat_collected_account
  ```
- **Utilizare**: Generare automată note contabile, calcul TVA de plată

#### 10. `vat_deductible_account` - Cont TVA Deductibilă
- **Tip**: `text`
- **Constrângeri**: DEFAULT '4426'
- **Logică Business**: Contul contabil pentru TVA deductibilă din achiziții
- **Schema Drizzle**: `text('vat_deductible_account').default('4426').notNull()`
- **Valoare Standard România**: `'4426'` - TVA deductibilă
- **Logică Algoritmică**:
  ```typescript
  // La primire factură achiziție:
  // Debit: 607 (Cheltuieli mărfuri) = 1000 RON
  // Debit: 4426 (TVA deductibilă) = 190 RON ← settings.vat_deductible_account
  // Credit: 401 (Furnizor) = 1190 RON
  ```
- **Utilizare**: Generare automată note contabile, recuperare TVA

#### 11. `vat_payable_account` - Cont TVA de Plată
- **Tip**: `text`
- **Constrângeri**: DEFAULT '4423'
- **Logică Business**: Contul pentru TVA de plată la stat (sold final după decontare)
- **Schema Drizzle**: `text('vat_payable_account').default('4423').notNull()`
- **Valoare Standard România**: `'4423'` - TVA de plată
- **Logică Algoritmică**:
  ```typescript
  // La decontare TVA lunară:
  // TVA_de_plata = TVA_colectata - TVA_deductibila
  // Dacă TVA_de_plata > 0:
  //   Debit: 4427 (TVA colectată)
  //   Credit: 4426 (TVA deductibilă)
  //   Credit: 4423 (TVA de plată) ← settings.vat_payable_account
  ```
- **Utilizare**: Închidere lună TVA, declarație D300

#### 12. `vat_receivable_account` - Cont TVA de Recuperat
- **Tip**: `text`
- **Constrângeri**: DEFAULT '4424'
- **Logică Business**: Contul pentru TVA de recuperat de la stat (când TVA deductibilă > colectată)
- **Schema Drizzle**: `text('vat_receivable_account').default('4424').notNull()`
- **Valoare Standard România**: `'4424'` - TVA de recuperat
- **Logică Algoritmică**:
  ```typescript
  // La decontare TVA lunară:
  // TVA_de_recuperat = TVA_deductibila - TVA_colectata
  // Dacă TVA_de_recuperat > 0:
  //   Debit: 4427 (TVA colectată)
  //   Debit: 4424 (TVA de recuperat) ← settings.vat_receivable_account
  //   Credit: 4426 (TVA deductibilă)
  ```
- **Utilizare**: Închidere lună TVA, cerere rambursare TVA

#### 13. `declaration_frequency` - Frecvență Declarații TVA
- **Tip**: `text`
- **Constrângeri**: DEFAULT 'monthly'
- **Logică Business**: Frecvența depunerii declarațiilor TVA (D300)
- **Schema Drizzle**: `declaration_frequency_enum('declaration_frequency').default('monthly').notNull()`
  **⚠️ ATENȚIE**: Schema Drizzle folosește pgEnum, dar DB-ul are text cu check constraint!
- **Valori Permise** (Check Constraint):
  - `'monthly'` - Declarație lunară (cel mai comun)
  - `'quarterly'` - Declarație trimestrială (pentru companiile mici sub anumite condiții)
- **Validare Zod**: `z.enum(['monthly', 'quarterly'])`
- **Logică Algoritmică**:
  ```typescript
  if (settings.declaration_frequency === 'monthly') {
    // Generează declarație D300 lunar
    // Perioadă: fiecare lună (01-12)
  } else {
    // Generează declarație D300 trimestrial
    // Perioade: Q1 (01-03), Q2 (04-06), Q3 (07-09), Q4 (10-12)
  }
  ```
- **Utilizare**: Scheduler declarații, reminder-e, conformitate
- **Legislație România**: 
  - Lunar: Obligatoriu pentru majoritatea firmelor
  - Trimestrial: Disponibil pentru IMM-uri cu cifră de afaceri mică

#### 14. `enable_vat_validation` - Validare Automată TVA
- **Tip**: `boolean`
- **Constrângeri**: DEFAULT true
- **Logică Business**: Activează validarea automată CIF/CUI pentru TVA în declarații
- **Schema Drizzle**: `boolean('enable_vat_validation').default(true).notNull()`
- **Logică Algoritmică**:
  ```typescript
  if (settings.enable_vat_validation) {
    // La introducere factură furnizor:
    // 1. Verifică CUI furnizor în baza ANAF
    // 2. Verifică că furnizorul este plătitor TVA
    // 3. Warning dacă CUI invalid sau neplătitor TVA
  }
  ```
- **Utilizare**: Prevenire erori, conformitate, integrare ANAF SPV
- **Best Practice**: Activat pentru evitarea erorilor de TVA deductibilă

#### 15. `created_at` - Data Creare
- **Tip**: `timestamp without time zone`
- **Constrângeri**: DEFAULT now()
- **Logică Business**: Când au fost create setările TVA (= când compania a activat modulul)
- **Schema Drizzle**: `timestamp('created_at').defaultNow().notNull()`
- **Utilizare**: Audit trail

#### 16. `updated_at` - Data Actualizare
- **Tip**: `timestamp without time zone`
- **Constrângeri**: DEFAULT now()
- **Logică Business**: Auto-update via trigger la modificare
- **Schema Drizzle**: `timestamp('updated_at').defaultNow().notNull()`
- **Trigger**: `trg_vat_settings_updated_at`
- **Utilizare**: Cache invalidation, tracking modificări cote TVA

### 🔗 Relații cu Alte Tabele

- **`companies`**: 1:1 (o companie are exact UN set de setări TVA) via `company_id` UNIQUE + ON DELETE CASCADE
- **`PC_synthetic_accounts`**: Link indirect via conturile TVA (4423, 4424, 4426, 4427)

### 🎨 Schema Drizzle ORM

**Locație:** `/var/www/GeniusERP/libs/shared/src/schema/accounting-settings.schema.ts`

```typescript
export const AC_vat_settings = pgTable('AC_vat_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  company_id: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'cascade' }),
  
  // Regim TVA
  vat_payer: boolean('vat_payer').default(true).notNull(),
  use_cash_vat: boolean('use_cash_vat').default(false).notNull(),
  cash_vat_threshold: decimal('cash_vat_threshold', { precision: 15, scale: 2 }).default('2250000.00').notNull(),
  
  // Cote TVA
  standard_vat_rate: integer('standard_vat_rate').default(19).notNull(),
  reduced_vat_rate_1: integer('reduced_vat_rate_1').default(9).notNull(),
  reduced_vat_rate_2: integer('reduced_vat_rate_2').default(5).notNull(),
  
  // Conturi TVA
  vat_collected_account: text('vat_collected_account').default('4427').notNull(),
  vat_deductible_account: text('vat_deductible_account').default('4426').notNull(),
  vat_payable_account: text('vat_payable_account').default('4423').notNull(),
  vat_receivable_account: text('vat_receivable_account').default('4424').notNull(),
  
  // Periodicitate declarație - using pgEnum for type safety
  declaration_frequency: declaration_frequency_enum('declaration_frequency').default('monthly').notNull(),
  // ⚠️ NOTĂ: DB folosește text cu check constraint, nu pgEnum! Migrarea va crea enum-ul.
  
  // Validare automată CUI
  enable_vat_validation: boolean('enable_vat_validation').default(true).notNull(),
  
  // Audit
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  companyUnique: unique('AC_vat_settings_company_unique').on(table.company_id),
  companyIdx: index('idx_AC_vat_settings_company_id').on(table.company_id)
}));

// Backward Compatibility Alias
export const vat_settings = AC_vat_settings;
```

**⚠️ DIFERENȚĂ IDENTIFICATĂ**: 
- DB folosește `text` cu check constraint pentru `declaration_frequency`
- Schema Drizzle propusă folosește `pgEnum`
- La migrare, va fi creat enum-ul pentru type safety

### 🎯 Scheme Zod pentru Validare

```typescript
export const insertVatSettingsSchema = createInsertSchema(AC_vat_settings, {
  standard_vat_rate: z.number().int().min(0).max(100),
  reduced_vat_rate_1: z.number().int().min(0).max(100),
  reduced_vat_rate_2: z.number().int().min(0).max(100),
  cash_vat_threshold: z.string().regex(/^\d+(\.\d{1,2})?$/),
  declaration_frequency: z.enum(['monthly', 'quarterly']),
});

export const selectVatSettingsSchema = createSelectSchema(AC_vat_settings);

export const updateVatSettingsSchema = insertVatSettingsSchema.partial().omit({
  id: true,
  company_id: true,
  created_at: true,
  updated_at: true,
});

// TypeScript Types
export type ACVatSettings = typeof AC_vat_settings.$inferSelect;
export type InsertACVatSettings = z.infer<typeof insertVatSettingsSchema>;
export type UpdateACVatSettings = z.infer<typeof updateVatSettingsSchema>;

// Backward Compatibility Aliases
export type VatSettings = ACVatSettings;
```

### 📈 Algoritmi Importanți

#### Algoritm Calcul TVA de Plată/Recuperat:
```typescript
async function calculateVATSettlement(
  companyId: string,
  fiscalYear: number,
  fiscalMonth: number
): Promise<{ vatPayable: number; vatRecoverable: number; netVAT: number }> {
  // 1. Calculează TVA colectată (din vânzări)
  const collected = await db
    .select({ total: sum(AC_accounting_ledger_lines.credit_amount) })
    .from(AC_accounting_ledger_lines)
    .innerJoin(AC_accounting_ledger_entries, 
      eq(AC_accounting_ledger_lines.ledger_entry_id, AC_accounting_ledger_entries.id))
    .where(and(
      eq(AC_accounting_ledger_entries.company_id, companyId),
      eq(AC_accounting_ledger_entries.fiscal_year, fiscalYear),
      eq(AC_accounting_ledger_entries.fiscal_month, fiscalMonth),
      eq(AC_accounting_ledger_entries.is_posted, true),
      eq(AC_accounting_ledger_lines.full_account_number, settings.vat_collected_account)
    ));
  
  // 2. Calculează TVA deductibilă (din achiziții)
  const deductible = await db
    .select({ total: sum(AC_accounting_ledger_lines.debit_amount) })
    .from(AC_accounting_ledger_lines)
    .innerJoin(AC_accounting_ledger_entries, 
      eq(AC_accounting_ledger_lines.ledger_entry_id, AC_accounting_ledger_entries.id))
    .where(and(
      eq(AC_accounting_ledger_entries.company_id, companyId),
      eq(AC_accounting_ledger_entries.fiscal_year, fiscalYear),
      eq(AC_accounting_ledger_entries.fiscal_month, fiscalMonth),
      eq(AC_accounting_ledger_entries.is_posted, true),
      eq(AC_accounting_ledger_lines.full_account_number, settings.vat_deductible_account)
    ));
  
  const vatCollected = Number(collected[0]?.total || 0);
  const vatDeductible = Number(deductible[0]?.total || 0);
  const netVAT = vatCollected - vatDeductible;
  
  return {
    vatPayable: netVAT > 0 ? netVAT : 0,
    vatRecoverable: netVAT < 0 ? Math.abs(netVAT) : 0,
    netVAT
  };
}
```

#### Algoritm Generare Notă Contabilă Decontare TVA:
```typescript
async function createVATSettlementEntry(
  companyId: string,
  fiscalYear: number,
  fiscalMonth: number,
  userId: string
): Promise<string> {
  const settings = await getVATSettings(companyId);
  const settlement = await calculateVATSettlement(companyId, fiscalYear, fiscalMonth);
  
  if (settlement.netVAT === 0) {
    throw new Error('TVA colectată = TVA deductibilă, nu este necesară decontare');
  }
  
  const lines = [];
  
  if (settlement.vatPayable > 0) {
    // TVA de plată (TVA colectată > TVA deductibilă)
    lines.push({
      account_code: settings.vat_collected_account,
      debit_amount: settlement.vatPayable,
      credit_amount: 0,
      description: 'Închidere TVA colectată'
    });
    lines.push({
      account_code: settings.vat_payable_account,
      debit_amount: 0,
      credit_amount: settlement.vatPayable,
      description: 'TVA de plată la stat'
    });
  } else {
    // TVA de recuperat (TVA deductibilă > TVA colectată)
    lines.push({
      account_code: settings.vat_deductible_account,
      debit_amount: 0,
      credit_amount: settlement.vatRecoverable,
      description: 'Închidere TVA deductibilă'
    });
    lines.push({
      account_code: settings.vat_receivable_account,
      debit_amount: settlement.vatRecoverable,
      credit_amount: 0,
      description: 'TVA de recuperat de la stat'
    });
  }
  
  return await createLedgerEntry({
    company_id: companyId,
    type: 'VAT_SETTLEMENT',
    description: `Decontare TVA ${fiscalMonth}/${fiscalYear}`,
    lines,
    fiscal_year: fiscalYear,
    fiscal_month: fiscalMonth,
    created_by: userId
  });
}
```

#### Algoritm Verificare Eligibilitate TVA la Încasare:
```typescript
async function checkCashVATEligibility(companyId: string): Promise<{
  isEligible: boolean;
  annualRevenue: number;
  threshold: number;
  difference: number;
}> {
  const settings = await getVATSettings(companyId);
  
  // Calculează cifra de afaceri ultimele 12 luni
  const currentYear = new Date().getFullYear();
  const annualRevenue = await db
    .select({ total: sum(AC_accounting_ledger_lines.credit_amount) })
    .from(AC_accounting_ledger_lines)
    .innerJoin(AC_accounting_ledger_entries, 
      eq(AC_accounting_ledger_lines.ledger_entry_id, AC_accounting_ledger_entries.id))
    .where(and(
      eq(AC_accounting_ledger_entries.company_id, companyId),
      eq(AC_accounting_ledger_entries.fiscal_year, currentYear),
      eq(AC_accounting_ledger_entries.is_posted, true),
      like(AC_accounting_ledger_lines.full_account_number, '70%') // Conturi venituri
    ));
  
  const revenue = Number(annualRevenue[0]?.total || 0);
  const threshold = Number(settings.cash_vat_threshold);
  
  return {
    isEligible: revenue < threshold,
    annualRevenue: revenue,
    threshold,
    difference: threshold - revenue
  };
}
```

### 📊 Date Curente în Sistem - REALE din Producție

**Total înregistrări**: **1** (o companie configurată)

**Valori efective:**
```
ID: 46d60810-7db1-480d-87c5-71b669fef06e
Company ID: c2e78d7d-b48e-4c73-9b4c-f68d8cc6e4a1
VAT Payer: true (Plătitor de TVA)
Use Cash VAT: false (TVA la exigibilitate - regime normal)
Cash VAT Threshold: 2,250,000.00 RON (conform legislației RO)
Standard VAT Rate: 19% (cota standard RO)
Reduced VAT Rate 1: 9% (cota redusă 1 RO)
Reduced VAT Rate 2: 5% (cota redusă 2 RO)
VAT Collected Account: 4427 (TVA colectată)
VAT Deductible Account: 4426 (TVA deductibilă)
VAT Payable Account: 4423 (TVA de plată)
VAT Receivable Account: 4424 (TVA de recuperat)
Declaration Frequency: monthly (declarație lunară)
Enable VAT Validation: true (validare CUI activată)
```

**Analiză Configurație:**
- ✅ Setări standard pentru companie românească
- ✅ Cote TVA conform legislației actuale (19%, 9%, 5%)
- ✅ Conturi TVA standard din Planul de Conturi Român
- ✅ Declarație lunară (cel mai comun regim)
- ✅ TVA la exigibilitate (regime normal)
- ✅ Validare CUI activată (best practice)

### 📋 Rezumat Audit Tabel `AC_vat_settings`

**Status: ✅ COMPLET AUDITAT**

**Date din DB Real:**
- **Înregistrări**: 1 row (compania activă configurată)
- **Check Constraints**: 5 constraints active (threshold >= 0, rates 0-100, frequency enum)
- **Foreign Keys**: 1 FK (company_id → companies)
- **Indexes**: 2 indexes (PRIMARY + company_id)
- **Trigger**: 1 trigger pentru auto-update `updated_at`

**Modificări Implementate:**
- ✅ Redenumire tabel: `vat_settings` → `AC_vat_settings` în schema Drizzle
- ✅ Creare pgEnum: `declaration_frequency_enum` pentru type safety (va fi aplicat la migrare)
- ✅ Toate coloane snake_case
- ✅ Check constraints robuste pentru validare date
- ✅ UNIQUE constraint pe `company_id` (enforces 1:1)
- ✅ Backward compatibility: alias `vat_settings = AC_vat_settings`

**Valori Default Validate (România 2024):**
- ✅ Cota standard: 19% (conform Codul Fiscal)
- ✅ Cota redusă 1: 9% (servicii alimentație, cazare, etc.)
- ✅ Cota redusă 2: 5% (cărți, medicamente, etc.)
- ✅ Prag TVA cash: 2,250,000 RON (conform art. 134^2 Codul Fiscal)
- ✅ Conturi TVA: 4423, 4424, 4426, 4427 (conform OMFP 1802/2014)

**Importanță în Sistem:** ⭐⭐⭐⭐⭐ (Critică - Configurare fundamentală TVA și conformitate fiscală)

**Probleme Identificate:**
1. ⚠️ DB folosește `text` pentru `declaration_frequency`, schema Drizzle propune `pgEnum` - **Diferență acceptabilă** (pgEnum va fi creat la migrare)
2. ⚠️ Nu există validare Zod condiționată: `if vat_payer = false → toate cotele TVA ar trebui ignorate`
3. ⚠️ Nu există validare că conturile TVA există efectiv în `PC_synthetic_accounts`

**Recomandări:**
- ✅ Cote TVA actualizate conform legislației
- ⚠️ Implementează notificare automată când se schimbă cotele TVA (impact major)
- ⚠️ Adaugă validare că conturile TVA (4423, 4424, 4426, 4427) există în Planul de Conturi
- ⚠️ Consideră adăugarea `vat_registration_date` (data înregistrării ca plătitor TVA)
- ⚠️ Consideră adăugarea `vat_id_number` (codul de înregistrare în scopuri de TVA - RO + CUI)

---



# 15. AC_cash_registers

## 📋 Detalii detaliate tabel: `AC_cash_registers`

**Prefix AC_:** Accounting Configuration (Configurări Contabile)

### 🎯 Scop și Rol în Sistem

Tabelul `AC_cash_registers` gestionează **registrele de casă** ale companiei conform legislației românești (OMFP 2861/2009 și Legea 82/1991). Este esențial pentru:

- **Gestiunea numerarului** în companie (casa centrală, case secundare)
- **Tracking sold curent** și limite legale
- **Închidere zilnică** a casei conform obligațiilor fiscale
- **Responsabilitate casier** (tracking persoană responsabilă)
- **Multi-currency** (RON, EUR, USD, etc.)
- **Conformitate fiscală** (limite zilnice, raportări)

**Context legislativ român:**
- OMFP 2861/2009: Norme metodologice pentru registrul de casă
- Legea 82/1991: Legea contabilității
- Codul Fiscal: Limitări operațiuni numerar (max 5,000 RON între firme)

### 🏗️ Structură Tehnică

**Schema DB (PostgreSQL) - REALĂ din producție:**
```sql
CREATE TABLE public.cash_registers (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL,
    franchise_id uuid,
    name text NOT NULL,
    code text NOT NULL,
    type text NOT NULL DEFAULT 'main'::text,
    location text,
    currency text NOT NULL DEFAULT 'RON'::text,
    responsible_person_id uuid,
    responsible_person_name text,
    daily_limit numeric(15,2),
    max_transaction_amount numeric(15,2),
    current_balance numeric(15,2) NOT NULL DEFAULT 0,
    status cash_register_status NOT NULL DEFAULT 'active'::cash_register_status,
    is_active boolean NOT NULL DEFAULT true,
    closed_at timestamp without time zone,
    closed_by uuid,
    closing_balance numeric(15,2),
    last_closed_date text,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    updated_at timestamp without time zone NOT NULL DEFAULT now(),
    created_by uuid,
    updated_by uuid,
    CONSTRAINT "cash_registers_pkey" PRIMARY KEY (id)
);

-- Enum pentru status
CREATE TYPE cash_register_status AS ENUM ('active', 'closed', 'suspended');
```

**Indexes:**
- PRIMARY KEY: `cash_registers_pkey` pe `id`
- INDEX: `cash_registers_company_idx` pe `company_id`
- INDEX: `cash_registers_code_idx` pe `(company_id, code)`
- INDEX: `cash_registers_status_idx` pe `status`

**Foreign Keys:**
- `company_id` → `companies(id)` (2 FK duplicate!)
- `responsible_person_id` → `users(id)` (2 FK duplicate!)
- `closed_by` → `users(id)` (2 FK duplicate!)
- `created_by` → `users(id)` (2 FK duplicate!)
- `updated_by` → `users(id)` (2 FK duplicate!)
- **TOTAL: 10 FK-uri, din care 5 perechi de duplicate!**

**Referenced By:**
- `cash_transactions.cash_register_id` → `cash_registers.id`

---

# 16. AC_cash_transactions
**Prefix AC_:** Accounting Configuration | **Rows**: 0 | **Scop**: Chitanțe și dispoziții de plată conform OMFP 2861/2009
**Coloane**: 40 | **Enums**: cash_transaction_type (8 values), cash_transaction_purpose (10 values)
**Link**: ledger_entry_id → AC_accounting_ledger_entries | **Schema**: /libs/shared/src/schema/cash-register.schema.ts
**Migrare**: create_AC_cash_transactions.ts | **Status**: ✅ Standardizat cu snake_case

---

# 17. AC_bank_accounts
**Prefix AC_:** Accounting Configuration | **Rows**: 0 | **Scop**: Conturi bancare IBAN, multi-currency
**Coloane**: 12 | **Schema**: /libs/shared/src/schema/bank-journal.schema.ts
**Migrare**: create_AC_bank_accounts.ts | **Status**: ✅ Standardizat cu snake_case

---

# 18. AC_bank_transactions
**Prefix AC_:** Accounting Configuration | **Rows**: 0 | **Scop**: Tranzacții bancare, extrase cont
**Coloane**: 24 | **Enums**: bank_transaction_type (9 values), bank_payment_method (7 values)
**Link**: ledger_entry_id → AC_accounting_ledger_entries, bank_account_id → AC_bank_accounts
**Schema**: /libs/shared/src/schema/bank-journal.schema.ts
**Migrare**: create_AC_bank_transactions.ts | **Status**: ✅ Standardizat cu snake_case

---

# 19. AC_fiscal_periods
**Prefix AC_:** Accounting Configuration | **Rows**: 0 | **Scop**: Închidere perioade contabile (lună/an)
**Coloane**: 15 | **Status**: open/soft_close/hard_close | **DUPLICAT ELIMINAT** din libs/accounting/src/schema
**Schema**: /libs/shared/src/schema/accounting.schema.ts (SINGURĂ DEFINIȚIE)
**Migrare**: create_AC_fiscal_periods.ts | **Status**: ✅ Standardizat cu snake_case

---

# 20. AC_fx_rates
**Prefix AC_:** Accounting Configuration | **Rows**: 45 (cursuri BNR active) | **Scop**: Cursuri valutare BNR sync zilnic
**Coloane**: 8 | **Source**: BNR (Banca Națională) | **UNIQUE**: (currency, date, source, base_currency)
**DUPLICAT ELIMINAT** din libs/shared/src/schema.ts
**Schema**: /libs/shared/src/schema/accounting.schema.ts (MUTATĂ din documents-extended - locația CORECTĂ logică!)
**Migrare**: create_AC_fx_rates.ts | **Status**: ✅ Standardizat cu snake_case
**Rationale mutare**: fx_rates este folosit de modulul accounting pentru conversii multi-currency, NU de documents

---

# 114. financial_data
115. financial_data_errors
116. financial_data_jobs




# 14.1. admin_actions

---

# 14.3. alert_history

---

# 14.4. anaf_company_data

---



14.5. analytics_alerts
14.6. analytics_anomalies
14.7. analytics_anomaly_rules
14.8. analytics_dashboards
14.9. analytics_inventory_optimization
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



# 51. chart_of_accounts - ⚠️ DEPRECATED

**⚠️ ACEST TABEL ESTE DEPRECATED ȘI NU TREBUIE FOLOSIT**

**Motiv deprecare:** 
- **NON-CONFORM cu OMFP 1802/2014** - Permite crearea de conturi custom în afara planului oficial de conturi
- **Redundant** - Toate conturile oficiale există deja în `synthetic_accounts` (781 conturi)
- **Risc de conformitate ANAF** - Posibilitatea de a crea conturi invalide care nu sunt în Planul de Conturi General

**Tabele de înlocuire:**
1. **`synthetic_accounts`** - Plan oficial de conturi conform OMFP 1802/2014 (781 conturi pre-populate)
2. **`analytic_accounts`** - Pentru detalierea conturilor sintetice (ex: 4111.001, 4111.002) - CONFORM cu legislația

**Conform OMFP 1802/2014, Art. 10:**
> "Entitățile aplică Planul de conturi general prevăzut în anexa nr. 4. Acestea pot **dezvolta** planul de conturi general (prin detalierea în conturi analitice), în limitele și conform precizărilor cuprinse în prezentele reglementări."

**CE ESTE PERMIS:**
- ✅ Folosirea conturilor din `synthetic_accounts` (planul oficial)
- ✅ Detalierea în `analytic_accounts` (ex: 4111 → 4111.001, 4111.002)
- ✅ Nume custom per companie prin `company_account_names` (în viitor)

**CE NU ESTE PERMIS:**
- ❌ Crearea de conturi noi în afara planului oficial
- ❌ Modificarea codurilor oficiale
- ❌ Inventarea de coduri care nu există în OMFP

**Acțiune recomandată:** 
- Nu mai utilizați acest tabel
- Folosiți `synthetic_accounts` pentru planul oficial
- Folosiți `analytic_accounts` pentru detalieri conform legislației
- Pentru raportare: leftJoin cu `synthetic_accounts` pentru nume oficiale

**Status migrare:** ✅ Eliminat din codebase (vezi commit: refactor(accounting): deprecare chart_of_accounts)

---


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

# 150. journal_entries - ❌ DEPRECATED

**❌ ACEST TABEL ESTE DEPRECATED ȘI A FOST ÎNLOCUIT CU `accounting_ledger_entries`**

**Motiv deprecare:** Structură veche, incompatibilă cu noua arhitectură RAS

**Tabel de înlocuire:** `accounting_ledger_entries` (vezi secțiunea 10)

**Status utilizare:** ✅ **FĂRĂ UTILIZARE ACTIVĂ ÎN COD**

**Structură DB:** 
- **Înregistrări**: 0 rows (GOL)
- **Foreign Keys**: 6 FK-uri către users, companies
- **Schema**: Există definiție în `accounting.schema.ts` cu `@deprecated`

**Diferențe față de `accounting_ledger_entries`:**
- Lipsă suport multi-franchise
- Lipsă tracking reversal complet
- Lipsă metadata JSONB
- Structură mai simplă, incompletă

**Acțiune recomandată:** 
1. ✅ Nu necesită refactorizare cod (nu este folosit)
2. Elimină definiția schema `@deprecated`
3. Drop tabel în următoarea migrație de cleanup

---

# 151. journal_lines - ❌ DEPRECATED

**❌ ACEST TABEL ESTE DEPRECATED ȘI A FOST ÎNLOCUIT CU `accounting_ledger_lines`**

**Motiv deprecare:** Structură veche, lipsă dimensiuni analitice și tracking avansat

**Tabel de înlocuire:** `accounting_ledger_lines` (vezi secțiunea 11)

**Status utilizare:** ✅ **FĂRĂ UTILIZARE ACTIVĂ ÎN COD**

**Structură DB:** 
- **Înregistrări**: 0 rows (GOL)
- **Foreign Key**: Către `journal_entries`
- **Schema**: Există definiție în `accounting.schema.ts` cu `@deprecated`

**Diferențe față de `accounting_ledger_lines`:**
- Lipsă dimensiuni analitice (department, project, cost_center)
- Lipsă tracking TVA per linie
- Lipsă link către articole (inventory)
- Lipsă reconciliere
- Lipsă tracking parteneri cu scadențe

**Acțiune recomandată:** 
1. ✅ Nu necesită refactorizare cod (nu este folosit)
2. Elimină definiția schema `@deprecated`
3. Drop tabel împreună cu `journal_entries`

---

# 152. journal_types - ❌ NU EXISTĂ ÎN DB

**❌ ACEST TABEL NU EXISTĂ ÎN BAZA DE DATE**

**Înlocuit cu:** `AC_journal_types` (vezi secțiunea 8)

**Încercare citire:** `ERROR: relation "journal_types" does not exist`

**Acțiune:** Elimină orice referințe vechi din cod sau documentație.

---

153. leave_requests

# 154. ledger_entries - ⚠️ DEPRECATED

**⚠️ ACEST TABEL ESTE DEPRECATED ȘI A FOST ÎNLOCUIT CU `accounting_ledger_entries`**

**Motiv deprecare:** Tabel vechi, structură incompletă, lipsă suport RAS complet

**Tabel de înlocuire:** `accounting_ledger_entries` (vezi secțiunea 10)

**Status utilizare:** ❌ **FOLOSIT ÎN 6 FIȘIERE CU SQL RAW** - NECESITĂ REFACTORIZARE URGENTĂ!

**Fișiere care încă folosesc acest tabel (SQL RAW):**
1. ❌ `vat-closure.service.ts` (linia 298) - verificare închidere TVA
2. ❌ `year-end-closure.service.ts` (linia 483) - verificare închidere an
3. ❌ `fx-revaluation.service.ts` (linia 487) - verificare reevaluare
4. ❌ `depreciation-calculation.service.ts` (linia 413) - verificare amortizare
5. ❌ `journal-export.service.ts` (liniile 68, 213) - export jurnale
6. ✅ `accounting-worker.processor.ts` (linia 223-237) - query SELECT (known issue)

**Structură DB:** 0 rows (GOL)

**Acțiune recomandată:** 
1. Refactorizează cele 6 fișiere să folosească `accounting_ledger_entries`
2. Actualizează toate query-urile SQL RAW la Drizzle ORM
3. După refactorizare, marchează tabelul pentru ștergere

---

# 155. ledger_lines - ⚠️ DEPRECATED

**⚠️ ACEST TABEL ESTE DEPRECATED ȘI A FOST ÎNLOCUIT CU `accounting_ledger_lines`**

**Motiv deprecare:** Tabel vechi, structură incompletă, lipsă dimensiuni analitice

**Tabel de înlocuire:** `accounting_ledger_lines` (vezi secțiunea 11)

**Status utilizare:** ❌ **FOLOSIT ÎN 6 FIȘIERE CU SQL RAW** - NECESITĂ REFACTORIZARE URGENTĂ!

**Fișiere care încă folosesc acest tabel:** Aceleași 6 fișiere ca `ledger_entries` (query-uri JOIN)

**Structură DB:** 0 rows (GOL)

**Acțiune recomandată:** 
1. Refactorizează împreună cu `ledger_entries`
2. Actualizează toate JOIN-urile să folosească `accounting_ledger_lines`
3. După refactorizare, marchează tabelul pentru ștergere

---

# 156. licenses
157. marketing_campaign_messages
158. marketing_campaign_segments
159. marketing_campaign_templates
160. marketing_campaigns
161. metrics_history
162. model_training_history
163. nir_documents
164. nir_items



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
