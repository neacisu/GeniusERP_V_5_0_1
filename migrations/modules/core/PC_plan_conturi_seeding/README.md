# PC Plan Conturi Seeding Directory

Acest director conține datele oficiale pentru Planul de Conturi Român și script-urile de seeding pentru tabelele PC_account_classes, PC_account_groups și PC_synthetic_accounts.

## 📁 Structura Directorului

```
PC_plan_conturi_seeding/
├── README.md                    # Acest fișier
├── account_classes.json         # Date pentru tabelele PC_account_classes (9 înregistrări)
├── account_groups.json          # Date pentru tabelele PC_account_groups (67 înregistrări)
├── synthetic_accounts.json      # Date pentru tabelele PC_synthetic_accounts (781 înregistrări)
└── seed_plan_conturi.ts         # Script de seeding pentru popularea tabelelor
```

## 📊 Date Incluse

### Account Classes (9 înregistrări)
- **Clasa 1**: Conturi de capitaluri (P - Pasiv)
- **Clasa 2**: Conturi de active imobilizate (A - Activ)
- **Clasa 3**: Conturi de stocuri (A - Activ)
- **Clasa 4**: Conturi de terți (A - Activ)
- **Clasa 5**: Conturi de trezorerie (A - Activ)
- **Clasa 6**: Conturi de cheltuieli (B - Bifuncțional)
- **Clasa 7**: Conturi de venituri (B - Bifuncțional)
- **Clasa 8**: Conturi speciale (B - Bifuncțional)
- **Clasa 9**: Conturi de gestiune (B - Bifuncțional)

### Account Groups (67 înregistrări)
Grupuri pentru fiecare clasă conform standardelor românești:
- **10-19**: Capital și rezerve
- **20-29**: Imobilizări
- **30-39**: Stocuri
- **40-49**: Terți
- **50-59**: Trezorerie
- **60-69**: Cheltuieli
- **70-79**: Venituri
- **80-89**: Conturi speciale
- **90-99**: Conturi de gestiune

### Synthetic Accounts (781 înregistrări)
Conturi sintetice de grad 1 (3 cifre) și grad 2 (4 cifre):
- **Grad 1** (3 cifre): Conturi de bază (ex: 101, 121, 401, 411, 512, 607, 707)
- **Grad 2** (4 cifre): Detalieri suplimentare (ex: 1011, 1211, 4011, 4111, 5121)
- **Funcții contabile**: A (Activ), P (Pasiv), B (Bifuncțional)
- **Ierarhie**: Conturi grad 2 au referință la conturi grad 1 prin `parent_id`

## 🔧 Utilizare

### În Sistemul de Migrații
Script-ul `seed_plan_conturi.ts` poate fi integrat în sistemul de migrații pentru popularea automată a tuturor tabelelor:

```typescript
import { seedRomanianChartOfAccounts } from './PC_plan_conturi_seeding/seed_plan_conturi';

// În migrare
await seedRomanianChartOfAccounts(db);
```

### Standalone Execution
```bash
cd migrations/modules/core/PC_plan_conturi_seeding
node seed_plan_conturi.ts
```

## 📋 Specificații Tehnice

### Normalizări Aplicate
- `default_account_function` și `account_function`: Convertit din `ASSET`/`EQUITY`/`EXPENSE`/`REVENUE` în `A`/`P`/`B`
- `grade`: Determinat automat din lungimea codului (3 cifre = 1, 4 cifre = 2)
- Date păstrate în format ISO 8601
- UUID-uri păstrate pentru integritate referentială

### Validări Incluse
- ✅ Verificare număr de înregistrări pentru toate tabelele
- ✅ Validare relații între clase și grupe
- ✅ Validare relații între grupe și conturi sintetice
- ✅ Validare ierarhie conturi grad 2 → grad 1 (parent_id)
- ✅ Detectare înregistrări orfane fără referințe valide
- ⚠️ Warning pentru conturi grad 2 fără parent_id

### Gestionare Erori
- Script-ul folosește `ON CONFLICT DO UPDATE` pentru actualizări safe
- Erori de seeding sunt capturate și loguite (skip cu warning)
- Success/skip count pentru monitoring

## 🔒 Sursă Date

Datele sunt extrase din baza de date de producție GeniusERP și reprezintă:
- **Planul de Conturi Român oficial** conform OMFP 1802/2014
- **Date normalizate** pentru consistență între medii
- **Structură ierarhică completă** pentru contabilitate românească
- **781 conturi sintetice** folosite în practică

## ⚠️ Important

- Rulează seeding-ul **DOAR** după aplicarea migrațiilor pentru toate 3 tabele
- Ordinea de seeding este critică:
  1. PC_account_classes (9 înregistrări)
  2. PC_account_groups (67 înregistrări) - depind de classes
  3. PC_synthetic_accounts (781 înregistrări) - depind de groups
- UUID-urile sunt păstrate pentru menținerea relațiilor în producție
- Datele ocupă ~300KB (synthetic_accounts.json)
