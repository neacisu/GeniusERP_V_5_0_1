# GeniusERP Migration System v2.0

Sistem centralizat și modular de migrații pentru baza de date GeniusERP.

## 🎯 Sistemul Nou de Migrații

### Structură
```
migrations/
├── index.ts                    # Controller principal pentru toate migrațiile
├── modules/                    # Migrații modulare pe fiecare modul
│   ├── core/                   # Tabele de bază (users, companies, roles)
│   ├── accounting/             # Modul contabil (ledger, accounts, balances)
│   ├── inventory/              # Gestionare inventar
│   ├── crm/                    # Customer Relationship Management
│   ├── hr/                     # Human Resources
│   ├── ecommerce/              # E-commerce
│   ├── analytics/              # Analytics și reporting
│   ├── collaboration/          # Colaborare și documente
│   ├── communications/         # Comunicații
│   ├── bpm/                    # Business Process Management
│   ├── marketing/              # Marketing
│   └── integrations/           # Integrări externe
└── README.md                   # Acest fișier
```

### Comenzi Disponibile

```bash
# Rulează toate migrațiile
npm run migrate:all

# Rulează migrațiile pentru un modul specific
npm run migrate:module accounting

# Verifică statusul migrațiilor
npm run migrate:status

# Creează o nouă migrare
npm run migrate:create <module> <table>
```

### Exemple
```bash
# Rulează toate migrațiile
npm run migrate:all

# Rulează doar migrațiile pentru modulul contabil
npm run migrate:module accounting

# Creează migrarea pentru tabelul account_balances
npm run migrate:create accounting account_balances
```

## 📚 Istoric și Backup

Toate migrațiile vechi au fost mutate în directorul:
```
/var/www/GeniusERP/static/archived/archived_old_migrations/
```

Acest director conține toate fișierele de migrații din versiunile anterioare și NU trebuie șters.

## 🔧 Dezvoltare

### Adăugarea unei noi migrații

1. Rulează comanda de creare:
   ```bash
   npm run migrate:create <module> <table>
   ```

2. Editează fișierul generat în `migrations/modules/<module>/`

3. Testează migrarea:
   ```bash
   npm run migrate:module <module>
   ```

### Structura unei migrații

```typescript
export const up = async (db: any) => {
  // Logic pentru aplicarea migrației
};

export const down = async (db: any) => {
  // Logic pentru rollback
};
```

### Convenții de nume pentru fișiere

**❌ GREȘIT (probleme în echipă):**
```
20251030_143645_create_account_classes.ts  // Timestamp problematic
20251030_144512_create_account_groups.ts    // Conflicte în Git/CI
```

**✅ CORECT (nume descriptive):**
```
create_account_classes.ts     // Simplu, clar, fără conflicte
create_account_groups.ts      // Ușor de citit și înțeles
add_user_permissions.ts       // Descrie acțiunea, nu data
```

**Avantaje:**
- 🚫 **Fără conflicte** în echipă sau CI/CD
- 📖 **Nume clare** și descriptive
- 🔄 **Git-friendly** - nu modifică fișiere când rulează în paralel
- 🧪 **Testare ușoară** - știe exact ce face fiecare migrare

## 🚨 Important

- NU modificați fișierele din directorul `archived_old_migrations/`
- Folosiți întotdeauna sistemul nou de migrații pentru modificări viitoare
- Testați migrațiile pe un mediu de development înainte de production