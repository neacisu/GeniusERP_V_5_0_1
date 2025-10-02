# Ghid Utilizare: Jurnal de Vânzări și TVA la Încasare

## Introducere

Această funcționalitate implementează cerințele legale pentru Jurnalul de Vânzări conform OMFP 2634/2015 și suportă mecanismul TVA la încasare (art. 282 Cod Fiscal).

## Ce este TVA la Încasare?

TVA la încasare este un mecanism special prin care **TVA devine exigibilă doar la momentul încasării facturii**, nu la emitere.

### Avantaje:
- 🔄 Îmbunătățește fluxul de numerar
- 📊 TVA se plătește doar pentru sumele încasate
- ⚖️ Reduce riscul de neplată

### Condiții:
- Firmă înscrisă în Registrul special TVA la încasare
- Plafonul legal respectat
- Clienți din România (pentru TVA la încasare)

## Configurare Firmă

### Activare TVA la Încasare

1. Accesați **Setări Companie**
2. Bifați opțiunea **"Aplică TVA la încasare"**
3. Salvați modificările

```
┌─────────────────────────────────────┐
│  Setări TVA                         │
├─────────────────────────────────────┤
│  ☑ Plătitor de TVA                  │
│  Cotă standard: 19%                 │
│  ☑ Aplică TVA la încasare           │
│                                     │
│  [Salvează]                         │
└─────────────────────────────────────┘
```

## Emitere Facturi

### Factură Normală (fără TVA la încasare)

Procesul standard:
1. Completați datele facturii
2. Adăugați linii cu produse/servicii
3. TVA se calculează automat
4. La salvare, TVA devine imediat exigibilă

**În contabilitate**:
```
4111 (Clienți)           = 1190   (debit)
  707 (Venituri)         = 1000   (credit)
  4427 (TVA colectată)   = 190    (credit)
```

### Factură cu TVA la Încasare

Dacă firma are activată opțiunea:
1. Factura se marchează automat cu TVA la încasare
2. TVA se înregistrează ca **neexigibilă**
3. La încasare, TVA devine exigibilă

**La emitere** (contabilitate):
```
4111 (Clienți)           = 1190   (debit)
  707 (Venituri)         = 1000   (credit)
  4428 (TVA neexigibilă) = 190    (credit)
```

**La încasare** (contabilitate automată):
```
5121 (Cont curent)       = 1190   (debit)
  4111 (Clienți)         = 1190   (credit)

+

4428 (TVA neexigibilă)   = 190    (debit)
  4427 (TVA colectată)   = 190    (credit)
```

### Încasări Parțiale

Pentru plăți în rate, TVA devine exigibil proporțional:

**Exemplu**: Factură 1000 lei + 190 lei TVA = 1190 lei

| Plată | Suma | TVA exigibil | TVA neexigibil rămas |
|-------|------|--------------|---------------------|
| 1     | 595  | 95           | 95                  |
| 2     | 595  | 95           | 0                   |

## Categorii Fiscale

### Ce sunt categoriile fiscale?

Categoriile fiscale clasifică fiecare vânzare pentru raportarea corectă în Jurnalul de Vânzări.

### Categorii disponibile:

#### 1. **Livrări Taxabile**
- **19% (Standard)** - Majoritatea bunurilor și serviciilor
- **9% (Redus)** - Produse alimentare, medicamente, cărți
- **5% (Redus)** - Cazuri speciale (ex: locuințe sociale)

#### 2. **Scutit cu Drept de Deducere**
- Exporturi (țări non-UE)
- Livrări intracomunitare (UE)
- Operațiuni similare exporturilor

**Caracteristici**:
- ✅ Drept de deducere păstrat
- 📄 Documentație specială necesară
- 🌍 Client din UE/non-UE

#### 3. **Scutit Fără Drept de Deducere**
- Operațiuni art. 292 Cod Fiscal
- Activități financiar-bancare
- Asigurări
- Educație/sănătate (cazuri specifice)

**Caracteristici**:
- ❌ Fără drept de deducere
- 📋 Condiții speciale în lege

#### 4. **Taxare Inversă**
- TVA datorată de beneficiar
- Operațiuni specifice (ex: construcții, deșeuri)
- Vânzător nu colectează TVA

#### 5. **Neimpozabil**
- În afara sferei de aplicare a TVA
- Nu se datorează TVA

### Determinare Automată

Aplicația determină automat categoria pe bază de:
- 📍 **Țara clientului**
- 🔢 **Cota de TVA**
- 🆔 **Cod TVA client**
- 📦 **Tip produs/serviciu**

### Exemple Practice

#### Exemplul 1: Client Român - Vânzare Normală
```
Client: SC EXEMPLE SRL, România, CUI: RO12345678
Produs: Echipament IT
Cotă TVA: 19%

→ Categorie: STANDARD_19 (Livrări taxabile 19%)
→ TVA colectată: DA
```

#### Exemplul 2: Client din Germania
```
Client: Deutsche Firma GmbH, Germania, VAT: DE123456789
Produs: Software
Cotă TVA: 0%

→ Categorie: EXEMPT_WITH_CREDIT (Livrare intracomunitară)
→ TVA colectată: NU (client plătește TVA în Germania)
→ Documentație: Factură + Certificat CMR/AWB
```

#### Exemplul 3: Export în SUA
```
Client: US Company Inc., SUA
Produs: Servicii consultanță
Cotă TVA: 0%

→ Categorie: EXEMPT_WITH_CREDIT (Export)
→ TVA colectată: NU
→ Documentație: Factură + Dovada livrării
```

#### Exemplul 4: Servicii Construcții
```
Client: SC CONSTRUCT SRL, România, CUI: RO87654321
Serviciu: Lucrări construcții
Taxare inversă: DA

→ Categorie: REVERSE_CHARGE (Taxare inversă)
→ TVA: Datorată de beneficiar, nu de prestator
→ Factură: Mențiune "Taxare inversă art. XXX"
```

## Rapoarte

### Jurnal de Vânzări

**Acces**: Contabilitate → Rapoarte → Jurnal de Vânzări

Raportul include:
- ✅ Toate facturile emise în perioadă
- ✅ Grupare pe categorii fiscale
- ✅ Totaluri bază impozabilă și TVA pe cote
- ✅ Separare TVA exigibil / neexigibil

**Coloane**:
```
┌────┬──────┬────────┬──────────┬──────┬───────┬──────────┬──────┬─────┬──────┐
│Nr. │Data  │Număr   │Client    │CUI   │Total  │Bază 19%  │TVA   │IC   │...   │
│crt │      │factură │          │      │       │          │19%   │     │      │
├────┼──────┼────────┼──────────┼──────┼───────┼──────────┼──────┼─────┼──────┤
│1   │01.10 │F-001   │ABC SRL   │RO123 │1190   │1000      │190   │0    │...   │
│2   │02.10 │F-002   │DE GmbH   │DE456 │1000   │0         │0     │1000 │...   │
├────┴──────┴────────┴──────────┴──────┴───────┴──────────┴──────┴─────┴──────┤
│TOTAL:                                  │2190   │1000      │190   │1000 │...   │
└────────────────────────────────────────┴───────┴──────────┴──────┴─────┴──────┘
```

### Export

**Formate disponibile**:
- 📊 **Excel** (.xlsx) - pentru prelucrare
- 📄 **PDF** - pentru arhivare/prezentare
- 💾 **CSV** - pentru import în alte sisteme

## Întrebări Frecvente (FAQ)

### Q: Când trebuie să folosesc TVA la încasare?

**R**: Când firma dvs. este înscrisă în Registrul TVA la încasare și aveți clienți din România. Pentru clienți din alte țări (export, IC), TVA la încasare nu se aplică.

### Q: Ce se întâmplă dacă un client nu plătește niciodată?

**R**: Pentru TVA la încasare:
- Dacă factura nu se încasează, TVA rămâne în cont 4428 (neexigibil)
- NU datorați TVA statului pentru suma neîncasată
- La momentul prescrierii/anulării facturii, tratament special

Pentru TVA normal:
- TVA a fost deja datorat la emitere
- Creați notă de credit pentru anulare (dacă e cazul)

### Q: Pot avea unele facturi cu TVA la încasare și altele fără?

**R**: Da! Chiar dacă firma e în sistemul TVA la încasare, puteți alege:
- Care facturi să fie cu TVA la încasare
- Care să fie cu TVA normal (exigibil la emitere)

De obicei: TVA la încasare pentru clienți cu plăți lungi, TVA normal pentru vânzări cash.

### Q: Cum apar facturile storno în jurnal?

**R**: Facturile de storno (note de credit) apar:
- Cu același număr dar marcat ca "Storno" sau "NC-XXX"
- Cu valori NEGATIVE la toate coloanele
- Reduc totalurile lunii corespunzător
- Cu referință la factura inițială

### Q: Cum știu că am setat corect categoria fiscală?

**R**: Verificați:
1. **Indicator vizual** în interfață (culoare/icon specific)
2. **Preview factură** - categoria apare clar
3. **Jurnal de vânzări** - verificați că apare în coloana corectă
4. **Totaluri** - trebuie să se potrivească cu decontul D300

### Q: Pot modifica categoria fiscală după emitere?

**R**: NU, după validarea contabilă categoria este fixată. Dacă există o eroare:
1. Anulați factura (notă de credit)
2. Emiteți factură nouă cu categoria corectă
3. Sau: Contact administrator pentru corecție manuală

## Conformitate și Audit

### Cerințe Legale Îndeplinite

✅ **OMFP 2634/2015**
- Jurnalul de vânzări cu toate coloanele obligatorii
- Numerotare continuă
- Păstrare 5 ani

✅ **Codul Fiscal**
- TVA la încasare conform art. 282
- Categorii fiscale corecte
- Separare exigibil/neexigibil

✅ **SAF-T (D406)** - Pregătit pentru viitor
- Coduri tranzacție
- Detalii parteneri
- Legături facturi

### Pentru Audit

Documentele generate sunt:
- 📁 Arhivabile legal
- 🔍 Ușor de verificat
- 📊 Corelate cu balanța contabilă
- ✅ Conforme cu modelele ANAF

## Suport

Pentru întrebări sau probleme:
1. Consultați această documentație
2. Verificați exemplele practice
3. Contactați echipa de suport tehnic

---

**Versiune**: 1.0  
**Data**: Octombrie 2025  
**Conformitate**: OMFP 2634/2015, Cod Fiscal (Legea 227/2015)

