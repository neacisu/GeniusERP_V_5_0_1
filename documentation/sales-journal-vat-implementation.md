# Implementare Jurnal de Vânzări - Actualizări Conform OMFP 2634/2015

## Data: 2 Octombrie 2025

## Rezumat

Am implementat actualizările necesare pentru conformitatea completă cu legislația contabilă și fiscală română privind Jurnalul de Vânzări, conform planului de dezvoltare furnizat.

## Modificări Implementate

### 1. Actualizări Schema Bază de Date

#### 1.1. Tabela `companies`
- **Câmp nou**: `use_cash_vat` (BOOLEAN, default: FALSE)
  - Indicator dacă firma aplică sistemul TVA la încasare conform art. 282 Cod Fiscal
  - Aplicabil pentru firme înscrise în Registrul special TVA la încasare

#### 1.2. Tabela `invoices`
- **Câmp nou**: `is_cash_vat` (BOOLEAN, default: FALSE)
  - Indicator la nivel de factură pentru aplicarea TVA la încasare
  - Permite flexibilitate: nu toate facturile unei firme cu TVA la încasare trebuie să fie astfel

#### 1.3. Enum nou: `vat_category`
Categorii fiscale pentru jurnalul de vânzări:
- `STANDARD_19` - Livrări taxabile cota standard 19%
- `REDUCED_9` - Livrări taxabile cota redusă 9%
- `REDUCED_5` - Livrări taxabile cota redusă 5%
- `EXEMPT_WITH_CREDIT` - Scutit cu drept de deducere (export, IC)
- `EXEMPT_NO_CREDIT` - Scutit fără drept de deducere (art.292)
- `REVERSE_CHARGE` - Taxare inversă
- `NOT_SUBJECT` - Neimpozabil
- `ZERO_RATE` - Cota zero (cazuri speciale)

#### 1.4. Tabela `invoice_lines`
- **Câmp nou**: `vat_category` (vat_category enum, default: 'STANDARD_19')
  - Categoria fiscală a fiecărei linii pentru raportare corectă
- **Câmp nou**: `vat_code` (TEXT, opțional)
  - Cod TVA specific pentru mapare detaliată

### 2. Corectări Service Layer (`sales-journal.service.ts`)

#### 2.1. Corectare Status-uri Facturi
**Problema**: Se foloseau valori neacceptate 'VALIDATED' și 'CREDIT_NOTE' pentru câmpul `status`

**Soluție**:
- Înlocuit `status: 'VALIDATED'` cu `status: 'issued'` + `isValidated: true`
- Pentru note de credit: `status: 'issued'` + `type: 'CREDIT_NOTE'`
- Se folosește câmpul `type` pentru diferențiere, nu `status`

```typescript
// Înainte (INCORECT):
status: 'VALIDATED'  // ❌ Nu există în enum

// După (CORECT):
status: 'issued',    // ✅ Există în enum
isValidated: true,   // ✅ Folosim flag-ul dedicat
validatedAt: new Date()
```

#### 2.2. Populare Completă `invoice_details`
**Problema**: Datele clientului nu erau salvate în `invoice_details`

**Soluție**: Adăugată logică completă de inserare în ambele metode:
- `createSalesInvoice` - pentru facturi normale
- `createCreditNote` - pentru note de credit

Câmpuri populate:
- `partnerName` - Denumirea clientului
- `partnerFiscalCode` - CUI/CIF client (obligatoriu pentru jurnal)
- `partnerRegistrationNumber` - Număr înregistrare Registru Comerțului
- `partnerAddress`, `partnerCity`, `partnerCounty`, `partnerCountry`
- `paymentMethod`, `paymentDueDays`, `paymentDueDate`

#### 2.3. Implementare TVA la Încasare

**Conturi contabile adăugate**:
```typescript
export const SALES_ACCOUNTS = {
  VAT_COLLECTED: '4427',  // TVA colectată (exigibilă)
  VAT_DEFERRED: '4428',   // TVA neexigibilă (pentru TVA la încasare)
  // ...
};
```

**Logică implementată**:

1. **La emiterea facturii** cu TVA la încasare:
   - Se creditează contul 4428 (TVA neexigibilă) în loc de 4427
   - Se marchează factura cu `isCashVAT: true`
   - TVA nu este datorat statului încă

2. **La încasarea facturii**:
   - Se apelează metoda `transferDeferredVAT()`
   - Se transferă proporțional din 4428 -> 4427
   - Se generează notă contabilă de transfer
   - TVA devine exigibil pentru suma încasată

**Metodă nouă**: `transferDeferredVAT()`
```typescript
public async transferDeferredVAT(
  invoiceId: string,
  paymentAmount: number,
  paymentDate: Date,
  userId?: string
): Promise<LedgerEntryData | null>
```

Calcul proporțional pentru plăți parțiale:
```typescript
const paymentRatio = paymentAmount / totalAmount;
const vatToTransfer = vatAmount * paymentRatio;
```

### 3. Utilitare și Tipuri TypeScript

#### 3.1. Fișier nou: `vat-categories.ts`
Conține:
- Enum `VATCategory` cu toate categoriile fiscale
- Interface `VATCategoryInfo` cu detalii despre fiecare categorie
- Mapare completă `VAT_CATEGORY_INFO`
- Funcții utile:
  - `determineVATCategory()` - determină automat categoria pe bază de date
  - `getVATCategoryInfo()` - returnează info despre o categorie
  - `isVATDeductible()` - verifică dacă permite deducere
  - `getVATRate()` - returnează cota de TVA
  - `getAllVATCategories()` - listă toate categoriile

#### 3.2. Determinare Automată Categorie Fiscală

```typescript
determineVATCategory(
  vatRate: number,
  customerCountry: string,
  customerVATNumber?: string,
  isReverseCharge: boolean = false
): VATCategory
```

Logica:
- **Taxare inversă** (explicit) → `REVERSE_CHARGE`
- **Client UE cu VAT** → `EXEMPT_WITH_CREDIT` (livrare intracomunitară)
- **Client non-UE** → `EXEMPT_WITH_CREDIT` (export)
- **Client RO, VAT 19%** → `STANDARD_19`
- **Client RO, VAT 9%** → `REDUCED_9`
- **Client RO, VAT 5%** → `REDUCED_5`
- **Client RO, VAT 0%** → `EXEMPT_NO_CREDIT` (scutit art.292)

### 4. Migrație Bază de Date

**Fișier**: `migrations/add_vat_categories_and_cash_vat.sql`

Operații efectuate:
1. Adaugă `use_cash_vat` în `companies`
2. Adaugă `is_cash_vat` în `invoices`
3. Creează enum `vat_category`
4. Adaugă `vat_category` și `vat_code` în `invoice_lines`
5. Creează indexuri pentru performanță
6. Actualizează datele existente cu categorii implicite

**Rulare migrație**:
```bash
psql -U postgres -d geniuserp < migrations/add_vat_categories_and_cash_vat.sql
```

## Conformitate Legislativă

### OMFP 2634/2015
✅ Jurnalul de vânzări include toate câmpurile obligatorii:
- Număr și dată document
- Denumire și CUI client
- Totaluri pe categorii de TVA
- Baze impozabile și TVA pe cote

### Codul Fiscal (Legea 227/2015)
✅ Art. 282 - TVA la încasare:
- Mecanism complet implementat
- TVA neexigibilă (4428) la emitere
- Transfer automat la încasare (4428 → 4427)
- Calcul proporțional pentru plăți parțiale

✅ Categorii fiscale conforme:
- Livrări taxabile (19%, 9%, 5%)
- Scutiri cu/fără drept de deducere
- Livrări intracomunitare
- Exporturi
- Taxare inversă

## Utilizare

### 1. Activare TVA la Încasare pentru Firmă

```typescript
// Setare în tabela companies
await db.update(companies)
  .set({ useCashVAT: true })
  .where(eq(companies.id, companyId));
```

### 2. Emitere Factură cu TVA la Încasare

```typescript
const entryData: SalesInvoiceData = {
  // ... alte câmpuri
  isCashVAT: true,  // Marchează ca TVA la încasare
  vatAmount: 190,   // Va fi în cont 4428 (neexigibil)
};

await salesJournalService.createSalesInvoice(
  invoiceData,
  customer,
  items,
  taxRates,
  paymentTerms,
  notes
);
```

### 3. Înregistrare Plată și Transfer TVA

```typescript
// După înregistrarea plății în cont curent
await salesJournalService.transferDeferredVAT(
  invoiceId,
  paymentAmount,  // Ex: 500 RON
  paymentDate,
  userId
);

// Se generează automat nota contabilă:
// 4428 (TVA neexigibilă) = 79.83  (debit)
//   4427 (TVA colectată) = 79.83  (credit)
// Proporțional cu suma încasată
```

### 4. Determinare Automată Categorie Fiscală

```typescript
import { determineVATCategory } from './types/vat-categories';

const category = determineVATCategory(
  19,              // VAT rate
  'Romania',       // Customer country
  'RO12345678',    // Customer VAT number
  false            // Not reverse charge
);
// Result: VATCategory.STANDARD_19
```

## Teste și Validare

### Scenarii de Test

1. **Factură normală (fără TVA la încasare)**:
   - ✅ TVA creditată în 4427
   - ✅ Status 'issued' + isValidated
   - ✅ Invoice_details completate

2. **Factură cu TVA la încasare**:
   - ✅ TVA creditată în 4428
   - ✅ isCashVAT = true
   - ✅ TVA rămâne în 4428 până la încasare

3. **Încasare parțială (50%)**:
   - ✅ Transfer proporțional 50% din TVA
   - ✅ Notă contabilă corectă 4428 -> 4427

4. **Notă de credit (storno)**:
   - ✅ Type = 'CREDIT_NOTE'
   - ✅ Status = 'issued'
   - ✅ Valori negative
   - ✅ relatedInvoiceId setat

5. **Categorii fiscale automate**:
   - ✅ Client RO, 19% → STANDARD_19
   - ✅ Client UE, 0% → EXEMPT_WITH_CREDIT
   - ✅ Client non-UE → EXEMPT_WITH_CREDIT

## Pași Următori

### Etapa 2: Generare Raport Jurnal de Vânzări
1. Creare service pentru generare jurnal formatat
2. Grupare pe categorii fiscale
3. Totaluri pe coloane (bază + TVA per categorie)
4. Export Excel/PDF conform model ANAF

### Etapa 3: Interfață Utilizator
1. Ecran pentru configurare TVA la încasare
2. Selector categorie fiscală la adăugare linie factură
3. Indicator vizual pentru facturi cu TVA neexigibil
4. Raport jurnal de vânzări cu filtre

### Etapa 4: Integrare SAF-T
1. Mapare categorii la coduri SAF-T
2. Export D406 cu jurnalul de vânzări
3. Validare conform XSD ANAF

## Referințe

- **OMFP 2634/2015** - Documentele financiar-contabile
- **Codul Fiscal (Legea 227/2015)** - Art. 282 (TVA la încasare)
- **Plan de dezvoltare** - `attached_assets/accounting-docs/Plan de dezvoltare pentru modulul __Jurnal de Vânzări__ (Sales Journal).txt`

## Autor

Implementare realizată conform cerințelor din planul de dezvoltare furnizat.
Data: 2 Octombrie 2025

