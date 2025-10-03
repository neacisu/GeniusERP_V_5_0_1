# 🔍 AUDIT COMPLET - JURNAL DE CUMPĂRĂRI (Purchase Journal)

**Data**: 2 Octombrie 2025  
**Scop**: Analiză implementare curentă și plan de acțiune pentru conformitate OMFP 2634/2015

---

## 📊 STARE CURENTĂ - CE EXISTĂ DEJA

### ✅ CE FUNCȚIONEAZĂ:

#### 1. Schema DB (Parțială)
- ✅ Tabelă `invoices` unificată (type='PURCHASE' pentru cumpărări)
- ✅ Tabelă `invoice_lines` pentru linii factură
- ✅ Tabelă `invoice_details` (există dar NU e populată pentru furnizori)
- ✅ Tabelă `invoice_payments` (recent creată, funcțională)
- ✅ Câmpuri: vatCategory, isCashVAT (de la Sales Journal)

#### 2. Backend Service (Parțial Funcțional)
- ✅ `PurchaseJournalService` există
- ✅ Metode implementate:
  - `getSupplierInvoices()` - listare cu filtre ✅
  - `getSupplierInvoice()` - detalii factură ✅
  - `recordSupplierInvoice()` - salvare factură ✅
  - `createPurchaseInvoiceEntry()` - generare notă contabilă ✅
- ✅ Conturi contabile mapate (401, 4426, 301, 302, 628, etc.)
- ✅ ExpenseType enum (7 categorii de cheltuieli)

#### 3. Frontend (Parțial)
- ✅ Pagină `/accounting/purchase-journal` există
- ✅ Listare facturi furnizori
- ✅ Dialog vizualizare factură

### ❌ CE LIPSEȘTE (CRITICAL):

#### 1. Probleme Schema/DB
- ❌ **invoice_details NU e populată** pentru furnizori (CUI lipsește!)
- ❌ Folosește `customerId` pentru `supplierId` (confuz!)
- ❌ Folosește `customerName` pentru `supplierName` (confuz!)

#### 2. Probleme Backend
- ❌ **NU există `generatePurchaseJournal()`** - raport conform OMFP 2634/2015
- ❌ **Note contabile NU se generează automat** (metoda există dar NU e apelată!)
- ❌ TVA la încasare NU e implementat pentru cumpărări (transferDeferredVAT lipsește)
- ❌ Diferențe de curs NU sunt calculate (TODO în cod)
- ❌ TVA parțial deductibil NU e implementat complet
- ❌ NU există tracking plăți furnizori cu transfer TVA

#### 3. Probleme Frontend
- ❌ **NU există tab "Raport Jurnal Cumpărări"**
- ❌ NU există export Excel/PDF
- ❌ NU există totaluri pe cote TVA
- ❌ NU există verificări contabile

---

## 🎯 PLAN DE IMPLEMENTARE - JURNAL CUMPĂRĂRI

Conform documentului atașat și inspirat din implementarea Sales Journal, voi implementa:

### ETAPA 1: Schema și Migrații (Backend)
1. ✅ Adăugare cont 4428 pentru TVA neexigibilă cumpărări
2. ✅ Verificare că invoice_payments funcționează pentru PURCHASE
3. ✅ NU trebuie migrații noi (am folosit deja schema unificată)

### ETAPA 2: Backend Service (Core)
1. Implementare `generatePurchaseJournal()` similar cu Sales
2. Populare automată `invoice_details` cu date furnizor (CUI!)
3. Apelare automată `createPurchaseInvoiceEntry()` la salvare
4. Implementare `recordSupplierPayment()` cu transfer TVA
5. Implementare `transferDeferredVATForPurchases()`
6. Calculare diferențe de curs la plată

### ETAPA 3: Tipuri și Interfețe
1. Creare `purchase-journal-types.ts` (similar sales)
2. Interface PurchaseJournalReport
3. Interface PurchaseJournalRow
4. Parametri pentru generare

### ETAPA 4: Controller și API
1. Metoda `generatePurchaseJournal()` în controller
2. Endpoint `GET /api/accounting/purchases/journal`
3. Export Excel/PDF pentru cumpărări

### ETAPA 5: Frontend
1. Adăugare tab "Raport Jurnal" în purchase-journal/index.tsx
2. Tabel complet cu toate coloanele
3. Filtre și opțiuni
4. Butoane export funcționale

---

## 📋 CHECKLIST CONFORMITATE

Conform OMFP 2634/2015 și Cod Fiscal art. 319:

- [ ] Denumire furnizor pe fiecare linie
- [ ] **CUI/CIF furnizor** (LIPSEȘTE ACUM!)
- [ ] Număr și dată factură
- [ ] Bază impozabilă și TVA deductibil
- [ ] Defalcare pe cote TVA (19%, 9%, 5%)
- [ ] Tratament taxare inversă
- [ ] Tratament TVA la încasare
- [ ] Totaluri lunare/trimestriale
- [ ] Integrare cu note contabile
- [ ] Export Excel/PDF

---

## ⚠️ PROBLEMA CRITICĂ IDENTIFICATĂ:

**CUI FURNIZOR LIPSEȘTE DIN REGISTRU!**

În `recordSupplierInvoice()` linia 241:
```typescript
customerName: supplier.name, // Using customerName for supplierName
```

DAR **NU se salvează CUI-ul furnizorului** nicăieri!  
`invoice_details` **NU este populată** pentru facturile de cumpărare!

➡️ **Acest lucru face jurnalul NECONFORM cu art. 319 Cod Fiscal!**

---

## 🚀 PORNESC IMPLEMENTAREA ACUM!

Voi folosi EXACT structura de la Sales Journal și o voi adapta pentru Purchase Journal.

