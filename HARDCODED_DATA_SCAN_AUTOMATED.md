# Raport Scanare Date Hardcodate - Automated

**Total Fișiere Scanate:** 1156
**Total Findings:** 7068

## Sumar

| Severitate | Count |
|------------|-------|
| 🔴 CRITICAL | 2 |
| 🟠 HIGH | 125 |
| 🟡 MEDIUM | 6888 |
| 🔵 LOW | 53 |

---

## CRITICAL Findings

### PASSWORD (2 ocurențe)

| Fișier | Linie | Valoare | Recomandare |
|--------|-------|---------|-------------|
| `apps/web/src/modules/auth/pages/auth-page.tsx` | 81 | `password: "admin"` | ELIMINĂ IMEDIAT - Folosește .ENV |
| `apps/api/src/common/drizzle/modules/auth/users/user-mutation.service.ts` | 86 | `password: '[REDACTED]'` | ELIMINĂ IMEDIAT - Folosește .ENV |

## HIGH Findings

### PORT (40 ocurențe)

| Fișier | Linie | Valoare | Recomandare |
|--------|-------|---------|-------------|
| `apps/web/project.json` | 29 | `5000` | Migrare în .ENV |
| `apps/web/src/modules/accounting/components/CashBankTransferDialog.tsx` | 56 | `5000` | Migrare în .ENV |
| `apps/web/src/modules/accounting/pages/journal-entries/index.tsx` | 205 | `5000` | Migrare în .ENV |
| `apps/web/src/modules/accounting/pages/bank-journal/index.tsx` | 317 | `5000` | Migrare în .ENV |
| `apps/web/src/modules/accounting/pages/bank-journal/index.tsx` | 330 | `5000` | Migrare în .ENV |
| `apps/web/src/modules/accounting/pages/cash-register/index.tsx` | 295 | `5000` | Migrare în .ENV |
| `apps/web/src/modules/accounting/pages/cash-register/index.tsx` | 1235 | `5000` | Migrare în .ENV |
| `apps/web/src/modules/accounting/pages/sales-journal/index.tsx` | 411 | `4000` | Migrare în .ENV |
| `apps/web/src/modules/analytics/pages/reports/ReportDetailPage.tsx` | 104 | `4000` | Migrare în .ENV |
| `apps/web/src/modules/analytics/pages/reports/ReportDetailPage.tsx` | 105 | `3000` | Migrare în .ENV |
| `apps/web/src/modules/analytics/pages/reports/ReportDetailPage.tsx` | 106 | `5000` | Migrare în .ENV |
| `apps/web/src/modules/ecommerce/pages/analytics/index.tsx` | 166 | `3000` | Migrare în .ENV |
| `apps/web/src/modules/ecommerce/pages/integrations/shopify/index.tsx` | 175 | `5000` | Migrare în .ENV |
| `apps/web/src/modules/inventory/hooks/useCategories.ts` | 90 | `3000` | Migrare în .ENV |
| `apps/web/src/modules/inventory/hooks/useCategories.ts` | 125 | `5000` | Migrare în .ENV |
| `apps/web/src/modules/ai/hooks/useSalesAI.ts` | 150 | `5000` | Migrare în .ENV |
| `apps/api/src/main.ts` | 67 | `5000` | Migrare în .ENV |
| `apps/api/src/main.ts` | 68 | `5000` | Migrare în .ENV |
| `apps/api/src/main.ts` | 69 | `5000` | Migrare în .ENV |
| `apps/api/src/main.ts` | 70 | `3000` | Migrare în .ENV |
| ... | ... | ... | *+20 mai multe* |

### URL (85 ocurențe)

| Fișier | Linie | Valoare | Recomandare |
|--------|-------|---------|-------------|
| `apps/web/src/modules/sales/components/common/PaginationControls.tsx` | 68 | `http://www.w3.org` | Migrare în .ENV sau config |
| `apps/web/src/modules/sales/components/common/PaginationControls.tsx` | 82 | `http://www.w3.org` | Migrare în .ENV sau config |
| `apps/web/src/modules/crm/pages/settings/index.tsx` | 886 | `http://www.w3.org` | Migrare în .ENV sau config |
| `apps/web/src/modules/hr/components/modals/EmployeeDetailsModal.tsx` | 121 | `https://api.dicebear.com` | Migrare în .ENV sau config |
| `apps/web/src/modules/hr/components/forms/AbsenceForm.tsx` | 779 | `http://www.w3.org` | Migrare în .ENV sau config |
| `apps/web/src/modules/hr/components/forms/ContractForm.tsx` | 1323 | `http://www.w3.org` | Migrare în .ENV sau config |
| `apps/web/src/modules/hr/components/forms/ContractForm.tsx` | 1342 | `http://www.w3.org` | Migrare în .ENV sau config |
| `apps/web/src/modules/hr/components/forms/DepartmentForm.tsx` | 415 | `http://www.w3.org` | Migrare în .ENV sau config |
| `apps/web/src/modules/hr/components/cards/EmployeeCard.tsx` | 62 | `https://api.dicebear.com` | Migrare în .ENV sau config |
| `apps/web/src/modules/hr/components/tables/EmployeesTable.tsx` | 190 | `https://api.dicebear.com` | Migrare în .ENV sau config |
| `apps/web/src/modules/hr/pages/settings/index.tsx` | 483 | `https://www.companie.ro` | Migrare în .ENV sau config |
| `apps/web/src/modules/hr/pages/employees/[id].tsx` | 203 | `https://api.dicebear.com` | Migrare în .ENV sau config |
| `apps/web/src/modules/ecommerce/pages/integrations/shopify/index.tsx` | 682 | `https://api.erp.ro` | Migrare în .ENV sau config |
| `apps/web/src/modules/ecommerce/pages/integrations/shopify/index.tsx` | 700 | `https://api.erp.ro` | Migrare în .ENV sau config |
| `apps/web/src/modules/ecommerce/pages/integrations/shopify/index.tsx` | 718 | `https://api.erp.ro` | Migrare în .ENV sau config |
| `apps/web/src/modules/ecommerce/pages/shop/index.tsx` | 89 | `https://images.unsplash.com` | Migrare în .ENV sau config |
| `apps/web/src/modules/ecommerce/pages/shop/index.tsx` | 90 | `https://images.unsplash.com` | Migrare în .ENV sau config |
| `apps/web/src/modules/ecommerce/pages/shop/index.tsx` | 91 | `https://images.unsplash.com` | Migrare în .ENV sau config |
| `apps/web/src/modules/ecommerce/pages/shop/index.tsx` | 92 | `https://images.unsplash.com` | Migrare în .ENV sau config |
| `apps/web/src/modules/ecommerce/pages/products/index.tsx` | 84 | `https://images.unsplash.com` | Migrare în .ENV sau config |
| ... | ... | ... | *+65 mai multe* |

## MEDIUM Findings

### IP_ADDRESS (5 ocurențe)

| Fișier | Linie | Valoare | Recomandare |
|--------|-------|---------|-------------|
| `apps/web/vite.config.ts` | 38 | `0.0.0.0` | Folosește variabile de configurare |
| `apps/web/vite.config.ts` | 63 | `0.0.0.0` | Folosește variabile de configurare |
| `apps/api/src/main.ts` | 68 | `0.0.0.0` | Folosește variabile de configurare |
| `apps/api/src/main.ts` | 247 | `0.0.0.0` | Folosește variabile de configurare |
| `apps/api/migrations/seedDefaultCompany.ts` | 37 | `40.123.456.789` | Folosește variabile de configurare |

### UUID (6883 ocurențe)

| Fișier | Linie | Valoare | Recomandare |
|--------|-------|---------|-------------|
| `apps/api/seeds/accounting/synthetic-accounts.json` | 1 | `229cacea-f394-4da4-b427-ef70b7cce325` | Generare dinamic sau citire din DB |
| `apps/api/seeds/accounting/synthetic-accounts.json` | 1 | `43476343-adc3-4732-9a78-6399a9f84dd0` | Generare dinamic sau citire din DB |
| `apps/api/seeds/accounting/synthetic-accounts.json` | 1 | `36d59e6e-8055-4d6e-b67e-0679b32098a3` | Generare dinamic sau citire din DB |
| `apps/api/seeds/accounting/synthetic-accounts.json` | 1 | `43476343-adc3-4732-9a78-6399a9f84dd0` | Generare dinamic sau citire din DB |
| `apps/api/seeds/accounting/synthetic-accounts.json` | 1 | `229cacea-f394-4da4-b427-ef70b7cce325` | Generare dinamic sau citire din DB |
| `apps/api/seeds/accounting/synthetic-accounts.json` | 1 | `d5b5ff61-6f0b-4471-8feb-82b0f85a5857` | Generare dinamic sau citire din DB |
| `apps/api/seeds/accounting/synthetic-accounts.json` | 1 | `43476343-adc3-4732-9a78-6399a9f84dd0` | Generare dinamic sau citire din DB |
| `apps/api/seeds/accounting/synthetic-accounts.json` | 1 | `229cacea-f394-4da4-b427-ef70b7cce325` | Generare dinamic sau citire din DB |
| `apps/api/seeds/accounting/synthetic-accounts.json` | 1 | `3df8826c-2e48-457d-a16e-5eaccdd43b78` | Generare dinamic sau citire din DB |
| `apps/api/seeds/accounting/synthetic-accounts.json` | 1 | `43476343-adc3-4732-9a78-6399a9f84dd0` | Generare dinamic sau citire din DB |
| `apps/api/seeds/accounting/synthetic-accounts.json` | 1 | `69c9bf14-dcec-4f5b-8ee3-f0e560b58a98` | Generare dinamic sau citire din DB |
| `apps/api/seeds/accounting/synthetic-accounts.json` | 1 | `43476343-adc3-4732-9a78-6399a9f84dd0` | Generare dinamic sau citire din DB |
| `apps/api/seeds/accounting/synthetic-accounts.json` | 1 | `b0db3b8c-9cbc-4af2-9c3e-9819d2423a99` | Generare dinamic sau citire din DB |
| `apps/api/seeds/accounting/synthetic-accounts.json` | 1 | `43476343-adc3-4732-9a78-6399a9f84dd0` | Generare dinamic sau citire din DB |
| `apps/api/seeds/accounting/synthetic-accounts.json` | 1 | `229cacea-f394-4da4-b427-ef70b7cce325` | Generare dinamic sau citire din DB |
| `apps/api/seeds/accounting/synthetic-accounts.json` | 1 | `be2a9b1b-59da-48d1-97f6-6fa2d27f08fd` | Generare dinamic sau citire din DB |
| `apps/api/seeds/accounting/synthetic-accounts.json` | 1 | `43476343-adc3-4732-9a78-6399a9f84dd0` | Generare dinamic sau citire din DB |
| `apps/api/seeds/accounting/synthetic-accounts.json` | 1 | `229cacea-f394-4da4-b427-ef70b7cce325` | Generare dinamic sau citire din DB |
| `apps/api/seeds/accounting/synthetic-accounts.json` | 1 | `d0d9e4ec-f39f-41e7-aefc-a3bfb5f91a4f` | Generare dinamic sau citire din DB |
| `apps/api/seeds/accounting/synthetic-accounts.json` | 1 | `43476343-adc3-4732-9a78-6399a9f84dd0` | Generare dinamic sau citire din DB |
| ... | ... | ... | *+6863 mai multe* |

## LOW Findings

### EMAIL (53 ocurențe)

| Fișier | Linie | Valoare | Recomandare |
|--------|-------|---------|-------------|
| `apps/web/src/modules/crm/pages/customers/CustomerDetailPage.tsx` | 64 | `ion.ionescu@acme.ro` | Verifică dacă e placeholder sau real |
| `apps/web/src/modules/crm/pages/customers/CustomerDetailPage.tsx` | 77 | `maria.popescu@acme.ro` | Verifică dacă e placeholder sau real |
| `apps/web/src/modules/crm/pages/customers/CustomerDetailPage.tsx` | 90 | `mihai.stanescu@acme.ro` | Verifică dacă e placeholder sau real |
| `apps/web/src/modules/crm/pages/contacts/index.tsx` | 33 | `ion.ionescu@acme.ro` | Verifică dacă e placeholder sau real |
| `apps/web/src/modules/crm/pages/contacts/index.tsx` | 45 | `maria.popescu@techsoft.ro` | Verifică dacă e placeholder sau real |
| `apps/web/src/modules/crm/pages/contacts/index.tsx` | 57 | `george.popa@medicare.ro` | Verifică dacă e placeholder sau real |
| `apps/web/src/modules/crm/pages/contacts/index.tsx` | 69 | `ana.dumitrescu@medicare.ro` | Verifică dacă e placeholder sau real |
| `apps/web/src/modules/crm/pages/contacts/index.tsx` | 81 | `mihai.stanescu@acme.ro` | Verifică dacă e placeholder sau real |
| `apps/web/src/modules/crm/pages/contacts/index.tsx` | 93 | `elena.vasilescu@constructexpert.ro` | Verifică dacă e placeholder sau real |
| `apps/web/src/modules/crm/pages/contacts/index.tsx` | 105 | `alexandru.munteanu@agritech.ro` | Verifică dacă e placeholder sau real |
| `apps/web/src/modules/accounting/pages/sales-journal/index.tsx` | 480 | `contact@abc-srl.ro` | Verifică dacă e placeholder sau real |
| `apps/web/src/modules/accounting/pages/purchase-journal/index.tsx` | 448 | `contact@techsupply.ro` | Verifică dacă e placeholder sau real |
| `apps/web/src/modules/hr/components/forms/EmployeeForm.tsx` | 697 | `nume.prenume@companie.ro` | Verifică dacă e placeholder sau real |
| `apps/web/src/modules/hr/components/forms/EmployeeForm.tsx` | 735 | `nume@email.com` | Verifică dacă e placeholder sau real |
| `apps/web/src/modules/hr/pages/settings/index.tsx` | 469 | `office@companie.ro` | Verifică dacă e placeholder sau real |
| `apps/web/src/modules/hr/pages/settings/index.tsx` | 515 | `ion.ionescu@companie.ro` | Verifică dacă e placeholder sau real |
| `apps/web/src/modules/ecommerce/pages/shop/index.tsx` | 714 | `contact@magazindemo.ro` | Verifică dacă e placeholder sau real |
| `apps/web/src/modules/ecommerce/pages/settings/index.tsx` | 142 | `shop@erp.ro` | Verifică dacă e placeholder sau real |
| `apps/web/src/modules/ecommerce/pages/settings/index.tsx` | 1097 | `no-reply@erp.ro` | Verifică dacă e placeholder sau real |
| `apps/web/src/modules/ai/hooks/useInboxAI.ts` | 96 | `office@firma-client.ro` | Verifică dacă e placeholder sau real |
| ... | ... | ... | *+33 mai multe* |
