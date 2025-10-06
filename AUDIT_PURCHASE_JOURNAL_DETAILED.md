# 🔍 AUDIT DETALIAT - PURCHASE JOURNAL vs CERINȚE DOCUMENTAȚIE

**Data**: 3 Octombrie 2025

---

## PAS 1: Schema BD pentru date furnizor

### CE CERE DOCUMENTAȚIA:
- Tabelul `invoice_details` cu coloane pentru furnizor
- `partnerName`, `partnerFiscalCode`, `partnerRegistrationNumber`
- `partnerAddress`, `partnerCity`, `partnerCounty`, `partnerCountry`

### CE EXISTĂ:
✅ Tabelul `invoice_details` EXISTĂ în shared/schema.ts (linii 777-794)
✅ TOATE coloanele necesare EXISTĂ deja:
- `partnerName` ✅
- `partnerFiscalCode` ✅  
- `partnerRegistrationNumber` ✅
- `partnerAddress` ✅
- `partnerCity` ✅
- `partnerCounty` ✅
- `partnerCountry` ✅

**VERDICT PAS 1: ✅ COMPLET - Nu necesită migrație nouă!**

---

## PAS 2: Populare automată detalii furnizor

### CE CERE DOCUMENTAȚIA:
- La `recordSupplierInvoice()` să se populeze `invoice_details`
- CUI furnizor obligatoriu
- Toate informațiile furnizor salvate

### CE AM IMPLEMENTAT:
✅ În `purchase-journal.service.ts` linia 278-293:
```typescript
await db.insert(invoiceDetails).values({
  invoiceId: invoiceId,
  partnerId: supplier.id || null,
  partnerName: supplier.name || supplier.supplierName || 'Unknown',
  partnerFiscalCode: supplier.fiscalCode || supplier.cui || supplier.taxId || '',
  partnerRegistrationNumber: supplier.registrationNumber || supplier.regCom || '',
  // ... toate câmpurile
});
```

**VERDICT PAS 2: ✅ IMPLEMENTAT COMPLET**

---

## PAS 3: Clarificare customerId pentru furnizori

### CE CERE DOCUMENTAȚIA:
- Documentare că `customerId` = `supplierId` pentru PURCHASE
- Comentarii clare în cod
- Variabile locale pentru claritate

### CE EXISTĂ:
❌ NU AM FĂCUT - customerId încă folosit fără clarificare
❌ Lipsă comentarii explicative
❌ Lipsă alias-uri locale

**VERDICT PAS 3: ❌ NEIMPLEMENTAT - URGENT!**

---

## PAS 4: Conturi 4426 și 4428

### CE CERE DOCUMENTAȚIA:
- Cont 4426 (TVA deductibilă)
- Cont 4428 (TVA neexigibilă)
- Verificare că există în plan de conturi

### CE AM IMPLEMENTAT:
✅ `PURCHASE_ACCOUNTS.VAT_DEDUCTIBLE = '4426'` (linia 46)
✅ `PURCHASE_ACCOUNTS.VAT_DEFERRED = '4428'` (linia 47)

**VERDICT PAS 4: ✅ IMPLEMENTAT**

---

## PAS 5: generatePurchaseJournal COMPLET

### CE CERE DOCUMENTAȚIA (DETALIAT):
1. ✅ Obținere facturi din perioadă
2. ✅ Iterare prin facturi
3. ❌ **Calcul pe TOATE cotele TVA (19%, 9%, 5%)** - AM DOAR 19%!
4. ❌ **Tratare operațiuni speciale** (IC, Import, Reverse Charge) - LIPSEȘTE!
5. ❌ **Grupare linii pe categorie fiscală** - NU GRUPEZ!
6. ❌ **Determinare automată categorie** - NU FOLOSESC!
7. ❌ **TVA la încasare cu tracking plăți** - SIMPLIFICAT!
8. ❌ **Totaluri COMPLETE pe toate categoriile** - PARȚIAL!

### CE AM IMPLEMENTAT (SIMPLIST):
```typescript
rows.push({
  rowNumber: rows.length + 1,
  date: invoice.issueDate,
  documentNumber: invoice.invoiceNumber,
  supplierName: details?.partnerName || invoice.customerName,
  supplierFiscalCode: details?.partnerFiscalCode || '',
  totalAmount: Number(invoice.amount),
  base19: lines.filter(l => l.vatRate === 19).reduce(...),  // ✅ DOAR 19%
  vat19: lines.filter(l => l.vatRate === 19).reduce(...),   // ✅ DOAR 19%
  vatDeductible: invoice.isCashVAT ? 0 : Number(invoice.vatAmount) // ❌ PREA SIMPLU!
});
```

**PROBLEME IDENTIFICATE:**
1. ❌ NU calculez base9, vat9, base5, vat5
2. ❌ NU determin intraCommunity, import, reverseCharge
3. ❌ NU folosesc determineVATCategory()
4. ❌ NU grupez liniile pe categorie
5. ❌ NU tratez facturi cu multiple cote TVA (ar trebui rânduri separate!)
6. ❌ expenseType NU e inclus în row
7. ❌ NU am pseudo-documente pentru plăți

**VERDICT PAS 5: 🔴 30% IMPLEMENTAT - TREBUIE REFĂCUT COMPLET!**

---

## 🎯 CONCLUZIE AUDIT:

### CE FUNCȚIONEAZĂ:
- ✅ Schema DB completă
- ✅ CUI furnizor se salvează
- ✅ Note contabile automate
- ✅ Conturi 4426/4428 definite

### CE TREBUIE IMPLEMENTAT/REFĂCUT:
1. ❌ **PAS 3**: Clarificare customerId = supplierId (comentarii)
2. 🔴 **PAS 5**: Refacere COMPLETĂ generatePurchaseJournal()
   - Grupare pe categorii fiscale
   - TOATE cotele TVA (9%, 5%)
   - Operațiuni speciale (IC, Import, RC)
   - Tracking plăți pentru TVA încasare
   - Pseudo-documente plăți
   - expenseType în rows

---

## ⚡ ACȚIUNI IMEDIATE:

1. Adaug comentarii clarificatoare (Pas 3)
2. **RESCRIU generatePurchaseJournal()** conform documentației
3. Adaug groupLinesByVATCategory()
4. Adaug buildPurchaseJournalRow()
5. Adaug calculatePurchaseTotals()
6. Adaug tracking plăți cu pseudo-documente

**PORNESC IMPLEMENTAREA ACUM!**
