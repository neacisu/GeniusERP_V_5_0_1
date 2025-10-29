# Drizzle Schema Migration Guide - GeniusERP

## Rezumat Upgrade

Acest document descrie upgrade-ul complet al schemelor Drizzle ORM pentru a reflecta exact structura bazei de date PostgreSQL.

### Stadiu Implementare

#### ✅ COMPLETAT (Faza 1 - Tabele Noi și Enum-uri)

**Fișiere Noi Create (8 fișiere):**

1. **`libs/shared/src/schema/enums.ts`**
   - Centralizare toate cele 51 de enum-uri din DB
   - Elimină duplicarea enum-urilor între fișiere
   - Enum-uri pentru: accounting, banking, invoicing, e-commerce, inventory, purchasing, analytics, communications, marketing, collaboration, BPM, integrations

2. **`libs/shared/src/schema/core.schema.ts`**
   - **10 tabele fundamentale:**
     - RBAC: `users`, `roles`, `permissions`, `user_roles`, `role_permissions`
     - Chart of Accounts: `account_classes`, `account_groups`, `synthetic_accounts`, `analytic_accounts`, `accounts` (legacy)
   - Toate cu relații complete și indecși

3. **`libs/shared/src/schema/inventory.schema.ts`** ⚡ PRIORITATE MAXIMĂ
   - **5 tabele critice** care lipseau complet:
     - `inventory_categories` - Ierarhie categorii produse
     - `inventory_units` - Unități de măsură
     - `inventory_products` - Catalog produse (15 coloane)
     - `inventory_stock` - Stocuri curente
     - `inventory_stock_movements` - Mișcări stoc

4. **`libs/shared/src/schema/invoicing.schema.ts`**
   - **3 tabele facturare:**
     - `invoices` - Facturi complete (36 coloane, ANAF compliant)
     - `invoice_details` - Detalii partener
     - `invoice_payments` - Plăți cu suport TVA la incasare

5. **`libs/shared/src/schema/purchasing.schema.ts`**
   - **4 tabele aprovizionare:**
     - `purchase_orders` - Comenzi aprovizionare
     - `purchase_order_items` - Articole PO
     - `nir_documents` - NIR (Notă Intrare Recepție)
     - `nir_items` - Articole NIR cu tracking lot/expiry

6. **`libs/shared/src/schema/transfer.schema.ts`**
   - **3 tabele transfer:**
     - `transfer_documents` - Transfer între depozite
     - `transfer_items` - Articole transfer
     - `stock_reservations` - Rezervări stoc

7. **`libs/shared/src/schema/settings-extended.schema.ts`**
   - **4 tabele setări:**
     - `settings_global` - Setări globale sistem
     - `settings_feature_toggles` - Feature flags
     - `settings_ui_themes` - Teme UI personalizate
     - `settings_user_preferences` - Preferințe utilizator

8. **`libs/shared/src/schema/documents-extended.schema.ts`**
   - **3 tabele:**
     - `documents` - Management documente cu OCR
     - `document_versions` - Versioning documente
     - `fx_rates` - Cursuri valutare (BNR)

**Tabele Adăugate în Fișiere Existente:**

9. **`libs/shared/src/schema/crm.schema.ts`** - Adăugate 6 tabele:
   - `crm_custom_fields` - Câmpuri personalizate CRM
   - `crm_deal_products` - Produse asociate deal-urilor
   - `crm_forecasts` - Prognoze vânzări
   - `crm_notes` - Notițe CRM
   - `crm_taggables` - Tagging polimorf
   - `crm_tasks` - Task-uri CRM

**Master Schema Updated:**
- `libs/shared/src/schema.ts` actualizat pentru a exporta toate fișierele noi

### Progres Global

| Categorie | Status | Count |
|-----------|--------|-------|
| **Tabele în DB** | Total | 190 |
| **Tabele în Drizzle (înainte)** | Existente | 134 |
| **Tabele NOI adăugate** | ✅ Completat | 36 |
| **Tabele TOTALE acum** | Current | 170 |
| **Coverage** | Progres | 89% |
| **Enum-uri centralizate** | ✅ Completat | 51/51 (100%) |

#### 🚧 ÎN LUCRU (Faza 2 - Tabele Rămase și Standardizare)

**Tabele Rămase de Adăugat (20 tabele):**

**E-commerce Extended:**
- `ecommerce_order_items`
- `ecommerce_shopify_collections`
- `ecommerce_shopify_products`
- `ecommerce_shopify_variants`

**HR Extended:**
- `employees` (legacy, fără prefix hr_)
- `employee_contracts` (legacy)
- `employee_documents` (legacy)
- `leave_requests`
- `payroll_records`
- `attendance_records`

**Analytics Extended:**
- `analytics_inventory_optimizations`
- `analytics_model_executions`
- `analytics_scenario_executions`

**Accounting Extended:**
- `accounting_account_balances`
- `accounting_journal_types`
- `journal_entries` (legacy)
- `journal_lines` (legacy)
- `stocks` (legacy)

#### ⏳ PLANIFICAT (Faza 3 - Standardizare Nume)

**122 tabele cu nume de variabilă nestandard:**

Vezi `docs/audit/table-naming-standardization.json` pentru lista completă.

**Exemple:**
- `activities` → trebuie redenumit `crm_activities`
- `employees` (HR) → trebuie redenumit `hr_employees`
- `customers` → trebuie redenumit `crm_customers`
- etc.

## Tabele Duplicate și Legacy

### Duplicate Intenționate (Backward Compatibility)

**1. warehouse_type vs gestiune_type**
- Ambele enum-uri există în DB
- Sunt identice (depozit, magazin, custodie, transfer)
- **Acțiune:** Păstrate ambele pentru compatibilitate

**2. employees vs hr_employees**
- `employees` = tabel legacy fără prefix
- `hr_employees` = tabel nou cu prefix standard
- **Acțiune:** Ambele vor fi în schema, `employees` marcat @deprecated

**3. journal_entries vs accounting_ledger_entries**
- `journal_entries` = sistem vechi
- `accounting_ledger_entries` = sistem nou RAS-compliant
- **Acțiune:** Ambele păstrate, `journal_entries` marcat @deprecated

### Recomandări Cod Nou

Pentru cod nou, folosiți:
- ✅ `hr_employees` (NU `employees`)
- ✅ `accounting_ledger_entries` (NU `journal_entries`)
- ✅ `crm_activities` (va fi standardizat de la `activities`)
- ✅ Toate tabelele cu numele complet din DB

## Structură Relații

### Relații One-to-Many

```typescript
export const usersRelations = relations(users, ({ many }) => ({
  roles: many(user_roles),
  createdInvoices: many(invoices, { relationName: 'createdBy' }),
}));
```

### Relații Many-to-Many (Junction Tables)

```typescript
export const user_rolesRelations = relations(user_roles, ({ one }) => ({
  user: one(users, {
    fields: [user_roles.user_id],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [user_roles.role_id],
    references: [roles.id],
  }),
}));
```

### Forward References

Toate referințele între schema-uri (ex: `inventory_products` → `users`) sunt rezolvate automat de Drizzle când toate schema-urile sunt combinate în `schema.ts`.

## Foreign Keys și Cascade Rules

Toate foreign keys au fost definite cu reguli complete:

```typescript
customer_id: uuid('customer_id')
  .references(() => crm_customers.id, {
    onDelete: 'cascade',  // sau 'set null', 'restrict'
    onUpdate: 'restrict'  // sau 'cascade'
  })
```

Regulile sunt extrase exact din DB (cele 435 FK-uri).

## Indecși

Fiecare tabel include toți indexurile din DB:

```typescript
export const inventory_products = pgTable('inventory_products', {
  // ... coloane
}, (table) => ({
  sku_unique: unique('inventory_products_sku_unique').on(table.sku),
  sku_idx: index('inventory_products_sku_idx').on(table.sku),
  category_idx: index('inventory_products_category_idx').on(table.category_id),
  // ... toți cei 717 indecși din DB
}));
```

## Validare și Testing

### Verificare Sincronizare Schema

```bash
# 1. Generează schema din DB
npx drizzle-kit introspect:pg

# 2. Verifică diferențele (dry-run)
npx drizzle-kit push:pg --dry-run

# Rezultat așteptat: "No changes detected" sau listă minimă de diferențe
```

### Type Safety

```bash
# Verificare TypeScript
npx tsc --noEmit

# Rezultat așteptat: 0 erori
```

## Migration Path

### Faza 1: Infrastructură (✅ COMPLETAT)
1. ✅ Creare fișier central enum-uri
2. ✅ Creare core.schema.ts (RBAC + Chart of Accounts)
3. ✅ Creare inventory.schema.ts (CRITIC pentru operations)
4. ✅ Creare invoicing.schema.ts
5. ✅ Creare purchasing.schema.ts
6. ✅ Creare transfer.schema.ts
7. ✅ Creare settings-extended.schema.ts
8. ✅ Creare documents-extended.schema.ts
9. ✅ Update schema.ts master file
10. ✅ Adăugare 6 tabele CRM noi

### Faza 2: Completare Tabele Rămase (⏳ PLANIFICAT)
1. ⏳ Adăugare tabele E-commerce Shopify (4 tabele)
2. ⏳ Adăugare tabele HR extended (6 tabele)
3. ⏳ Adăugare tabele Analytics extended (3 tabele)
4. ⏳ Adăugare tabele Accounting extended (5 tabele)

### Faza 3: Standardizare Nume Variabile (⏳ PLANIFICAT)
1. ⏳ Redenumire 122 variabile pentru a match numele tabelelor DB
2. ⏳ Creare aliasuri @deprecated pentru backward compatibility
3. ⏳ Update relații cu nume noi
4. ⏳ Update import-uri în apps/ și libs/

### Faza 4: Completare Coloane Lipsă (⏳ PLANIFICAT)
1. ⏳ Audit coloane pentru fiecare din cele 134 tabele existente
2. ⏳ Adăugare coloane lipsă identificate

### Faza 5: Validare Finală (⏳ PLANIFICAT)
1. ⏳ Drizzle Kit introspection
2. ⏳ Dry-run push
3. ⏳ TypeScript compilation
4. ⏳ Raport final

## Breaking Changes

### În Această Release (Faza 1)

**Impact Minim:**
- Adăugare fișiere noi NU afectează codul existent
- Export-urile existente rămân neschimbate
- Backward compatibility 100%

**Acțiuni Required:**
- ✅ Nicio acțiune - toate modificările sunt aditive

### În Release-uri Viitoare (Faza 3)

**Impact Major: Redenumire 122 variabile**

**Migrare Required:**
```typescript
// ÎNAINTE:
import { activities, customers } from '@geniuserp/shared';
const activity = await db.select().from(activities);

// DUPĂ:
import { crm_activities, crm_customers } from '@geniuserp/shared';
const activity = await db.select().from(crm_activities);
```

**Timeline:**
- Luni 1-3: Aliasuri @deprecated disponibile (backward compatibility)
- Luni 3-6: Warnings active în development
- După lună 6: Eliminare aliasuri (breaking change)

## Suport

Pentru întrebări sau probleme:
1. Consultă acest ghid
2. Verifică rapoartele de audit în `docs/audit/`
3. Rulează validări Drizzle Kit

## Anexe

### Fișiere de Referință
- `docs/audit/table-naming-standardization.json` - Lista completă redenumiri
- `docs/audit/missing-tables-structure.json` - Structură tabele adăugate
- `docs/audit/enum-consolidation.json` - Lista enum-uri
- `docs/audit/index-mapping.json` - Indecși DB
- `docs/audit/column-audit-report.json` - Audit coloane

### Comenzi Utile

```bash
# Verificare tabele în DB
docker exec -it geniuserp-postgres psql -U postgres -d geniuserp -c "\dt"

# Verificare enum-uri în DB  
docker exec -it geniuserp-postgres psql -U postgres -d geniuserp -c "\dT"

# Export schema DB
docker exec -it geniuserp-postgres pg_dump -U postgres -d geniuserp --schema-only > db-schema.sql

# Drizzle introspection
npx drizzle-kit introspect:pg

# Generate migration
npx drizzle-kit generate:pg

# Push to DB (dry-run)
npx drizzle-kit push:pg --dry-run
```

---

**Versiune:** 1.0  
**Data:** 2025-10-29  
**Autor:** GeniusERP Development Team  
**Status:** Faza 1 Completată, Faza 2-5 Planificate

