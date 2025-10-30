# PC Plan Conturi Seeding Directory

Acest director conține datele oficiale pentru Planul de Conturi Român și script-urile de seeding pentru tabelele PC_account_classes și PC_account_groups.

## 📁 Structura Directorului

```
PC_plan_conturi_seeding/
├── README.md                    # Acest fișier
├── account_classes.json         # Date pentru tabelele PC_account_classes (9 înregistrări)
├── account_groups.json          # Date pentru tabelele PC_account_groups (71 înregistrări)
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

### Account Groups (71 înregistrări)
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

## 🔧 Utilizare

### În Sistemul de Migrații
Script-ul `seed_plan_conturi.ts` poate fi integrat în sistemul de migrații pentru popularea automată a tabelelor PC_account_classes și PC_account_groups:

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
- `default_account_function`: Convertit din `ASSET`/`EQUITY`/`EXPENSE`/`REVENUE`/`OFF_BALANCE` în `A`/`P`/`B`
- Date păstrate în format ISO 8601
- UUID-uri păstrate pentru integritate referentială

### Validări Incluse
- Verificare număr de înregistrări
- Validare relații între clase și grupe
- Detectare grupuri orfane fără referință de clasă

## 🔒 Sursă Date

Datele sunt extrase din baza de date de producție GeniusERP și reprezintă:
- **Planul de Conturi Român oficial** conform OMFP 1802/2014
- **Date normalizate** pentru consistență între medii
- **Structură ierarhică completă** pentru contabilitate românească

## ⚠️ Important

- Rulează seeding-ul **DOAR** după aplicarea migrațiilor pentru `account_classes` și `account_groups`
- Datele folosesc `ON CONFLICT DO UPDATE` pentru actualizări safe
- UUID-urile sunt păstrate pentru menținerea relațiilor în producție
