# AnalyticAccountsService

Service centralizat pentru gestionarea conturilor analitice (`PC_analytic_accounts`) în aplicația GeniusERP.

## 📋 Cuprins

- [Scop](#scop)
- [Instalare & Import](#instalare--import)
- [API Reference](#api-reference)
- [Exemple de Utilizare](#exemple-de-utilizare)
- [Validări Business Logic](#validări-business-logic)
- [Integrare în Aplicație](#integrare-în-aplicație)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Scop

`AnalyticAccountsService` elimină duplicarea codului și standardizează toate operațiunile pe tabelul `PC_analytic_accounts`. 

### Problemele Rezolvate

✅ **Eliminare Cod Duplicat** - 270+ linii de cod duplicat între `manage-warehouse.service.ts` și `company.controller.ts`  
✅ **SQL Raw → Drizzle ORM** - Toate query-urile sunt acum type-safe  
✅ **Validări Centralizate** - Business logic într-un singur loc  
✅ **Type Safety** - TypeScript + Drizzle + Zod  
✅ **Performance** - Cache Redis pentru queries frecvente  

## Instalare & Import

```typescript
import { AnalyticAccountsService } from '@geniuserp/accounting';
import { storage } from '@api/storage';
import { DrizzleService } from '@common/drizzle';

// Inițializare service
const drizzle = new DrizzleService();
const analyticAccountsService = new AnalyticAccountsService(storage, drizzle);
```

## API Reference

### Metode CRUD

#### `createAnalyticAccount(data)`

Creează un cont analitic nou cu validări complete.

**Parametri:**
```typescript
{
  code: string;              // Format: "371.1", "4426.40"
  name: string;              // Denumire cont
  description?: string;      // Descriere opțională
  synthetic_id: string;      // UUID cont sintetic
  account_function: 'A' | 'P' | 'B' | 'E' | 'V';  // Funcție contabilă
}
```

**Returnează:** `Promise<PC_AnalyticAccount>`

**Validări:**
- ✅ Unicitate cod
- ✅ Ierarhie: cod analitic începe cu cod sintetic
- ✅ Existență cont sintetic în DB
- ✅ Format cod valid

**Exemplu:**
```typescript
const analyticAccount = await analyticAccountsService.createAnalyticAccount({
  code: '371.1',
  name: 'Depozit Central',
  description: 'Marfă în depozitul central',
  synthetic_id: '123e4567-e89b-12d3-a456-426614174000',
  account_function: 'A'
});
```

**Erori:**
- `Error: Contul analitic cu codul 371.1 există deja în sistem.`
- `Error: Ierarhie invalidă: codul analitic 371.1 începe cu 371, dar contul sintetic cu ID ... are codul 401.`
- `Error: Contul sintetic cu ID ... nu există în sistem.`

---

#### `getAnalyticByCode(code)`

Obține un cont analitic după cod.

**Parametri:**
- `code: string` - Codul contului analitic (ex: "371.1")

**Returnează:** `Promise<PC_AnalyticAccount | null>`

**Exemplu:**
```typescript
const account = await analyticAccountsService.getAnalyticByCode('371.1');
if (account) {
  console.log(`Găsit: ${account.name}`);
} else {
  console.log('Cont inexistent');
}
```

---

#### `getAnalyticAccountsBySynthetic(syntheticId)`

Obține toate conturile analitice pentru un cont sintetic.

**Parametri:**
- `syntheticId: string` - UUID cont sintetic

**Returnează:** `Promise<PC_AnalyticAccount[]>`

**Exemplu:**
```typescript
const accounts = await analyticAccountsService.getAnalyticAccountsBySynthetic(
  '123e4567-e89b-12d3-a456-426614174000'
);
console.log(`Găsite ${accounts.length} conturi analitice`);
```

---

#### `getAnalyticAccountsBySyntheticCode(syntheticCode)`

Obține toate conturile analitice pentru un cod sintetic.

**Parametri:**
- `syntheticCode: string` - Codul contului sintetic (ex: "371", "4426")

**Returnează:** `Promise<PC_AnalyticAccount[]>`

**Exemplu:**
```typescript
// Toate conturile analitice pentru sintetic 371 (Mărfuri)
const accounts = await analyticAccountsService.getAnalyticAccountsBySyntheticCode('371');
// Returnează: ["371.1", "371.2", "371.3", ...]
```

---

#### `updateAnalyticAccount(id, data)`

Actualizează un cont analitic.

**Parametri:**
- `id: string` - UUID cont
- `data: Partial<{ name: string; description: string; is_active: boolean }>` - Câmpuri de actualizat

**Returnează:** `Promise<PC_AnalyticAccount>`

**Exemplu:**
```typescript
const updated = await analyticAccountsService.updateAnalyticAccount(
  '123e4567-e89b-12d3-a456-426614174001',
  { 
    name: 'Depozit Central - Actualizat',
    description: 'Descriere nouă'
  }
);
```

---

#### `deactivateAnalyticAccount(id)` / `activateAnalyticAccount(id)`

Dezactivează sau activează un cont analitic (soft delete).

**Parametri:**
- `id: string` - UUID cont

**Returnează:** `Promise<PC_AnalyticAccount>`

**Exemplu:**
```typescript
// Dezactivare
await analyticAccountsService.deactivateAnalyticAccount('123e...');

// Reactivare
await analyticAccountsService.activateAnalyticAccount('123e...');
```

---

### Metode Utilitare

#### `getNextAvailableCode(syntheticCode)`

Generează următorul cod analitic disponibil pentru un cont sintetic.

**Parametri:**
- `syntheticCode: string` - Codul contului sintetic (ex: "371", "4426")

**Returnează:** `Promise<string>` - Următorul cod disponibil

**Algoritm:**
1. Caută toate conturile analitice care încep cu `syntheticCode.`
2. Extrage subcodurile numerice (partea după punct)
3. Găsește maximul și incrementează cu 1
4. Returnează `syntheticCode.{max+1}`

**Exemplu:**
```typescript
// Dacă există: 371.1, 371.2, 371.5
const nextCode = await analyticAccountsService.getNextAvailableCode('371');
console.log(nextCode); // → "371.6"

// Dacă nu există nimic:
const firstCode = await analyticAccountsService.getNextAvailableCode('401');
console.log(firstCode); // → "401.1"
```

---

#### `getSyntheticIdByCode(syntheticCode)`

Obține UUID-ul unui cont sintetic după cod.

**Parametri:**
- `syntheticCode: string` - Codul contului sintetic (3-4 cifre)

**Returnează:** `Promise<string>` - UUID cont sintetic

**Erori:**
- `Error: Cod sintetic invalid: AB. Trebuie să fie 3-4 cifre.`
- `Error: Contul sintetic cu codul 999 nu există în sistem.`

**Exemplu:**
```typescript
const syntheticId = await analyticAccountsService.getSyntheticIdByCode('371');
// → "123e4567-e89b-12d3-a456-426614174000"
```

---

#### `getSyntheticByCode(syntheticCode)`

Obține contul sintetic complet după cod.

**Parametri:**
- `syntheticCode: string` - Codul contului sintetic

**Returnează:** `Promise<PC_SyntheticAccount | null>`

**Exemplu:**
```typescript
const synthetic = await analyticAccountsService.getSyntheticByCode('371');
if (synthetic) {
  console.log(`371 - ${synthetic.name}: ${synthetic.account_function}`);
  // → "371 - Mărfuri: A"
}
```

---

#### `codeExists(code)`

Verifică dacă un cod analitic există.

**Parametri:**
- `code: string` - Codul de verificat

**Returnează:** `Promise<boolean>`

**Exemplu:**
```typescript
if (await analyticAccountsService.codeExists('371.1')) {
  console.log('Codul 371.1 este deja folosit');
}
```

---

#### `validateHierarchy(analyticCode, syntheticId)`

Validează ierarhia între cont analitic și cont sintetic.

**Parametri:**
- `analyticCode: string` - Codul contului analitic
- `syntheticId: string` - UUID cont sintetic

**Returnează:** `Promise<void>` - Aruncă eroare dacă validarea eșuează

**Validări:**
1. Extrage prefix sintetic din cod analitic
2. Verifică că prefix-ul are 3-4 cifre
3. Verifică că `syntheticId` există în DB
4. Verifică că codul sintetic din DB corespunde cu prefix-ul

**Exemplu:**
```typescript
try {
  await analyticAccountsService.validateHierarchy('371.1', syntheticId);
  console.log('✅ Ierarhie validă');
} catch (error) {
  console.error('❌ Ierarhie invalidă:', error.message);
}
```

---

## Exemple de Utilizare

### Exemplu 1: Creare Cont Analitic pentru Gestiune (Warehouse)

```typescript
import { AnalyticAccountsService } from '@geniuserp/accounting';

class WarehouseService {
  constructor(
    private analyticAccountsService: AnalyticAccountsService
  ) {}
  
  async createWarehouse(name: string) {
    // 1. Generează cod analitic disponibil pentru sintetic 371 (Mărfuri)
    const analyticCode = await this.analyticAccountsService.getNextAvailableCode('371');
    
    // 2. Obține ID-ul contului sintetic
    const syntheticId = await this.analyticAccountsService.getSyntheticIdByCode('371');
    
    // 3. Creează contul analitic
    const analyticAccount = await this.analyticAccountsService.createAnalyticAccount({
      code: analyticCode,
      name: `${name} - Mărfuri`,
      description: `Cont analitic pentru gestiunea ${name}`,
      synthetic_id: syntheticId,
      account_function: 'A' // Activ
    });
    
    console.log(`✅ Cont analitic ${analyticAccount.code} creat pentru ${name}`);
    return analyticAccount;
  }
}
```

---

### Exemplu 2: Creare Cont Analitic pentru Partener CRM

```typescript
import { AnalyticAccountsService } from '@geniuserp/accounting';

class CompanyController {
  constructor(
    private analyticAccountsService: AnalyticAccountsService
  ) {}
  
  async createSupplierAnalyticAccount(companyName: string) {
    // Cont analitic pentru furnizori (401 - Furnizori)
    const nextCode = await this.analyticAccountsService.getNextAvailableCode('401');
    const syntheticId = await this.analyticAccountsService.getSyntheticIdByCode('401');
    
    const analyticAccount = await this.analyticAccountsService.createAnalyticAccount({
      code: nextCode,
      name: companyName,
      description: `Cont analitic pentru furnizorul ${companyName}`,
      synthetic_id: syntheticId,
      account_function: 'P' // Pasiv
    });
    
    return analyticAccount;
  }
  
  async createClientAnalyticAccount(companyName: string) {
    // Cont analitic pentru clienți (4111 - Clienți)
    const nextCode = await this.analyticAccountsService.getNextAvailableCode('4111');
    const syntheticId = await this.analyticAccountsService.getSyntheticIdByCode('4111');
    
    const analyticAccount = await this.analyticAccountsService.createAnalyticAccount({
      code: nextCode,
      name: companyName,
      description: `Cont analitic pentru clientul ${companyName}`,
      synthetic_id: syntheticId,
      account_function: 'A' // Activ
    });
    
    return analyticAccount;
  }
}
```

---

### Exemplu 3: Listare Conturi Analitice pe Sintetic

```typescript
async function listAnalyticAccountsBySynthetic(syntheticCode: string) {
  const accounts = await analyticAccountsService
    .getAnalyticAccountsBySyntheticCode(syntheticCode);
  
  console.log(`\n📊 Conturi analitice pentru sintetic ${syntheticCode}:\n`);
  
  accounts.forEach(acc => {
    const status = acc.is_active ? '✅' : '❌';
    console.log(`  ${status} ${acc.code} - ${acc.name}`);
  });
  
  console.log(`\nTotal: ${accounts.length} conturi\n`);
}

// Exemplu utilizare
await listAnalyticAccountsBySynthetic('371'); // Mărfuri
await listAnalyticAccountsBySynthetic('401'); // Furnizori
await listAnalyticAccountsBySynthetic('4111'); // Clienți
```

---

## Validări Business Logic

### 1. Validare Format Cod

**Regex:** `^[0-9]{3,4}(\.[0-9]+)+$`

**Valid:**
- ✅ `371.1` - sintetic 3 cifre + identificator 1 cifră
- ✅ `4426.40` - sintetic 4 cifre + identificator 2 cifre
- ✅ `511.01.001` - ierarhie mai complexă (grad 3+)

**Invalid:**
- ❌ `371` - lipsește partea analitică
- ❌ `AB.1` - sintetic nu este numeric
- ❌ `371.X` - identificator nu este numeric

### 2. Validare Unicitate Cod

Înainte de insert, service-ul verifică dacă codul există deja în DB:

```sql
SELECT * FROM PC_analytic_accounts WHERE code = '371.1'
```

**Eroare:** `Contul analitic cu codul 371.1 există deja în sistem.`

### 3. Validare Ierarhie

Service-ul extrage prefix-ul sintetic din codul analitic și verifică:

1. Prefix-ul are 3-4 cifre
2. `synthetic_id` există în `PC_synthetic_accounts`
3. Codul sintetic din DB match-uiește cu prefix-ul

**Exemplu Valid:**
```
Cod analitic: "371.1"
Prefix sintetic: "371"
synthetic_id: "abc123..." → SELECT * FROM PC_synthetic_accounts WHERE id = 'abc123...'
Rezultat: { id: 'abc123...', code: '371', name: 'Mărfuri' }
✅ Match: "371" === "371"
```

**Exemplu Invalid:**
```
Cod analitic: "371.1"
synthetic_id: "def456..." → SELECT * FROM PC_synthetic_accounts WHERE id = 'def456...'
Rezultat: { id: 'def456...', code: '401', name: 'Furnizori' }
❌ Eroare: "371" !== "401"
```

### 4. Validare Account Function

Enum strict: `'A' | 'P' | 'B' | 'E' | 'V'`

- **A** = Activ
- **P** = Pasiv
- **B** = Bifuncțional
- **E** = Expenses (Cheltuieli)
- **V** = Revenues (Venituri)

---

## Integrare în Aplicație

### 1. Warehouse Service

**Fișier:** `libs/inventory/src/services/manage-warehouse.service.ts`

**Utilizare:**
```typescript
// Înainte: 150+ linii SQL raw
// După: 3 linii cu service

const nextCode = await this.analyticAccountsService.getNextAvailableCode('371');
const syntheticId = await this.analyticAccountsService.getSyntheticIdByCode('371');
await this.analyticAccountsService.createAnalyticAccount({
  code: nextCode,
  name: `${warehouseName} - Mărfuri`,
  synthetic_id: syntheticId,
  account_function: 'A'
});
```

### 2. Company Controller

**Fișier:** `libs/crm/src/controllers/company.controller.ts`

**Utilizare:**
```typescript
// Înainte: 120+ linii SQL raw
// După: 2 metode cu service

private async syncAnalyticAccount(code: string, name: string) {
  const existing = await this.analyticAccountsService.getAnalyticByCode(code);
  if (existing) return true;
  
  const prefix = code.split('.')[0];
  const syntheticId = await this.analyticAccountsService.getSyntheticIdByCode(prefix);
  
  await this.analyticAccountsService.createAnalyticAccount({
    code, name,
    synthetic_id: syntheticId,
    account_function: 'A'
  });
}
```

### 3. Accounting Service + REST API

**Endpoints disponibile:**

```
GET  /api/accounting/analytic-accounts
GET  /api/accounting/analytic-accounts/by-synthetic/:syntheticId
POST /api/accounting/analytic-accounts
```

**Cache Redis:** TTL 12 ore pentru performance

---

## Best Practices

### ✅ DO

1. **Folosește service-ul pentru TOATE operațiunile** pe `PC_analytic_accounts`
2. **Generează coduri cu `getNextAvailableCode()`** în loc să le creezi manual
3. **Verifică existența cu `codeExists()`** înainte de operațiuni critice
4. **Folosește `validateHierarchy()`** pentru validări suplimentare custom
5. **Handle errors** corect - toate metodele pot arunca erori

```typescript
try {
  const account = await analyticAccountsService.createAnalyticAccount(data);
  console.log('✅ Success');
} catch (error) {
  console.error('❌ Error:', error.message);
  // Handle error appropriately
}
```

### ❌ DON'T

1. **NU scrie SQL raw** pentru `PC_analytic_accounts`
2. **NU genera coduri manual** fără `getNextAvailableCode()`
3. **NU duplica logica de validare** - folosește service-ul
4. **NU ignora erorile** - toate validările sunt importante
5. **NU accesa direct DB** pentru conturi analitice

---

## Troubleshooting

### Eroare: "Contul analitic [...] există deja"

**Cauză:** Încerci să creezi un cont cu un cod care există deja.

**Soluție:**
```typescript
// Verifică existența înainte
if (await analyticAccountsService.codeExists(code)) {
  // Generează alt cod
  code = await analyticAccountsService.getNextAvailableCode(syntheticCode);
}
```

---

### Eroare: "Ierarhie invalidă: codul analitic [...] începe cu [...], dar contul sintetic cu ID [...] are codul [...]"

**Cauză:** `synthetic_id` nu corespunde cu prefix-ul codului analitic.

**Soluție:**
```typescript
// Obține synthetic_id corect din cod
const prefix = code.split('.')[0]; // ex: "371"
const syntheticId = await analyticAccountsService.getSyntheticIdByCode(prefix);

// Acum creează cu ID-ul corect
await analyticAccountsService.createAnalyticAccount({
  code,
  synthetic_id: syntheticId,
  ...
});
```

---

### Eroare: "Contul sintetic cu codul [...] nu există în sistem"

**Cauză:** Încer să folosești un cod sintetic care nu există în `PC_synthetic_accounts`.

**Soluție:**
1. Verifică că ai migrat corect planul de conturi
2. Verifică că ai seedat conturile sintetice
3. Verifică spelling-ul codului sintetic

```bash
# Rulează migration + seeding
npm run migrate:core
```

---

### Performance Issues

**Problemă:** Query-uri lente la `getAnalyticAccountsBySynthetic()`

**Soluție:**
1. Verifică că indexes sunt create corect:
   - `PC_analytic_accounts_synthetic_idx` pe `synthetic_id`
   - `PC_analytic_accounts_code_idx` pe `code`

2. Cache Redis este activ în `AccountingService` (TTL 12h)

3. Limitează numărul de query-uri în loop-uri:
```typescript
// ❌ BAD - N+1 queries
for (const warehouse of warehouses) {
  await analyticAccountsService.getAnalyticByCode(warehouse.code);
}

// ✅ GOOD - 1 query
const allAccounts = await analyticAccountsService.getAnalyticAccountsBySyntheticCode('371');
const accountsMap = new Map(allAccounts.map(acc => [acc.code, acc]));
for (const warehouse of warehouses) {
  const account = accountsMap.get(warehouse.code);
}
```

---

## Contribuții

Pentru îmbunătățiri sau bug-uri, deschide un issue în repository-ul GeniusERP.

**Autor:** GeniusERP Team  
**Data:** 31 octombrie 2024  
**Versiune:** 2.0

