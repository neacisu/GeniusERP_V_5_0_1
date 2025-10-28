# Inventar Endpoint-uri API - GeniusERP

**Data generării:** 2025-10-28T17:43:47.167Z

## Sumar Executiv

- **Total Endpoint-uri:** 490
- **Protejate cu Autentificare:** 71 (14%)
- **Cu Rate Limiting:** 60 (12%)
- **Module:** 17

## Module

| Modul | Endpoint-uri | Auth | Rate Limit |
|-------|--------------|------|------------|
| Accounting | 146 | 0 | 58 |
| AI | 21 | 16 | 0 |
| Analytics | 39 | 0 | 0 |
| Audit | 8 | 0 | 0 |
| Auth | 15 | 2 | 2 |
| BPM | 55 | 0 | 0 |
| Collaboration | 20 | 13 | 0 |
| Communications | 37 | 6 | 0 |
| Companies | 12 | 0 | 0 |
| CRM | 11 | 0 | 0 |
| Ecommerce | 35 | 34 | 0 |
| HR | 6 | 0 | 0 |
| Integrations | 12 | 0 | 0 |
| Inventory | 16 | 0 | 0 |
| Invoicing | 11 | 0 | 0 |
| Settings | 36 | 0 | 0 |
| Users | 10 | 0 | 0 |

---

## Modul: Accounting

**Total endpoint-uri:** 146

| Metodă | Endpoint | Auth | Rate Limit | Fișier |
|--------|----------|------|------------|--------|
| GET | /:companyId | ❌ | ✅ | accounting-settings.routes.ts |
| PUT | /:companyId/general | ❌ | ✅ | accounting-settings.routes.ts |
| GET | /:companyId/vat | ❌ | ✅ | accounting-settings.routes.ts |
| PUT | /:companyId/vat | ❌ | ✅ | accounting-settings.routes.ts |
| GET | /:companyId/account-mappings | ❌ | ✅ | accounting-settings.routes.ts |
| PUT | /:companyId/account-mappings/:type | ❌ | ✅ | accounting-settings.routes.ts |
| POST | /:companyId/account-mappings/reset | ❌ | ✅ | accounting-settings.routes.ts |
| GET | /:companyId/relationships | ❌ | ✅ | accounting-settings.routes.ts |
| POST | /:companyId/relationships | ❌ | ✅ | accounting-settings.routes.ts |
| PUT | /:companyId/relationships/:id | ❌ | ✅ | accounting-settings.routes.ts |
| DELETE | /:companyId/relationships/:id | ❌ | ✅ | accounting-settings.routes.ts |
| GET | /:companyId/document-counters | ❌ | ✅ | accounting-settings.routes.ts |
| POST | /:companyId/document-counters | ❌ | ✅ | accounting-settings.routes.ts |
| PUT | /:companyId/document-counters/:type | ❌ | ✅ | accounting-settings.routes.ts |
| DELETE | /:companyId/document-counters/:counterId | ❌ | ✅ | accounting-settings.routes.ts |
| GET | /:companyId/fiscal-periods | ❌ | ✅ | accounting-settings.routes.ts |
| GET | /:companyId/opening-balances | ❌ | ✅ | accounting-settings.routes.ts |
| POST | /:companyId/opening-balances/import | ❌ | ✅ | accounting-settings.routes.ts |
| GET | /metrics | ❌ | ✅ | accounting.routes.ts |
| GET | /recent-transactions | ❌ | ✅ | accounting.routes.ts |
| GET | /account-classes | ❌ | ✅ | accounting.routes.ts |
| GET | /account-groups | ❌ | ✅ | accounting.routes.ts |
| GET | /account-groups/by-class/:classId | ❌ | ✅ | accounting.routes.ts |
| GET | /synthetic-accounts | ❌ | ✅ | accounting.routes.ts |
| GET | /synthetic-accounts/by-group/:groupId | ❌ | ✅ | accounting.routes.ts |
| GET | /synthetic-accounts/by-grade/:grade | ❌ | ✅ | accounting.routes.ts |
| GET | /analytic-accounts | ❌ | ✅ | accounting.routes.ts |
| GET | /analytic-accounts/by-synthetic/:syntheticId | ❌ | ✅ | accounting.routes.ts |
| POST | /analytic-accounts | ❌ | ✅ | accounting.routes.ts |
| GET | /journal-entries | ❌ | ✅ | accounting.routes.ts |
| GET | /journal-entries/:id | ❌ | ✅ | accounting.routes.ts |
| POST | /journal-entries | ❌ | ❌ | accounting.routes.ts |
| GET | /trial-balance/async | ❌ | ❌ | accounting.routes.ts |
| GET | /balance-sheet/async | ❌ | ❌ | accounting.routes.ts |
| GET | /income-statement/async | ❌ | ❌ | accounting.routes.ts |
| GET | /suppliers | ❌ | ✅ | accounting.routes.ts |
| GET | /suppliers/:id | ❌ | ✅ | accounting.routes.ts |
| GET | /bank-accounts | ❌ | ✅ | bank-journal.routes.ts |
| GET | /bank-accounts/:id | ❌ | ✅ | bank-journal.routes.ts |
| POST | /bank-accounts | ❌ | ❌ | bank-journal.routes.ts |
| PUT | /bank-accounts/:id | ❌ | ❌ | bank-journal.routes.ts |
| GET | /bank-transactions | ❌ | ❌ | bank-journal.routes.ts |
| GET | /bank-transactions/:id | ❌ | ❌ | bank-journal.routes.ts |
| POST | /bank-transactions/deposits | ❌ | ❌ | bank-journal.routes.ts |
| POST | /bank-transactions/payments | ❌ | ❌ | bank-journal.routes.ts |
| POST | /bank-transactions/transfers | ❌ | ❌ | bank-journal.routes.ts |
| POST | /bank-statements/import/:bankAccountId | ❌ | ❌ | bank-journal.routes.ts |
| POST | /bank-reconciliations/:bankAccountId | ❌ | ❌ | bank-journal.routes.ts |
| GET | /bank-accounts/:id/balance | ❌ | ✅ | bank-journal.routes.ts |
| GET | /bank-accounts/:id/statement/cached | ❌ | ✅ | bank-journal.routes.ts |
| POST | /bank-reconciliations/:bankAccountId/async | ❌ | ❌ | bank-journal.routes.ts |
| GET | /cash-registers | ❌ | ✅ | cash-register.routes.ts |
| GET | /cash-registers/:id | ❌ | ✅ | cash-register.routes.ts |
| POST | /cash-registers | ❌ | ❌ | cash-register.routes.ts |
| PUT | /cash-registers/:id | ❌ | ❌ | cash-register.routes.ts |
| POST | /receipts | ❌ | ❌ | cash-register.routes.ts |
| POST | /payments | ❌ | ❌ | cash-register.routes.ts |
| POST | /transfers | ❌ | ❌ | cash-register.routes.ts |
| GET | /cash-transactions | ❌ | ✅ | cash-register.routes.ts |
| GET | /cash-registers/:id/transactions | ❌ | ✅ | cash-register.routes.ts |
| GET | /cash-registers/:id/balance | ❌ | ✅ | cash-register.routes.ts |
| POST | /cash-registers/:id/bank-deposits | ❌ | ❌ | cash-register.routes.ts |
| POST | /cash-registers/:id/bank-withdrawals | ❌ | ❌ | cash-register.routes.ts |
| POST | /reconciliations/:registerId | ❌ | ❌ | cash-register.routes.ts |
| GET | /registers/:id/daily-closing | ❌ | ✅ | cash-register.routes.ts |
| GET | /reports/daily/cached | ❌ | ✅ | cash-register.routes.ts |
| POST | /reconciliations/:registerId/async | ❌ | ❌ | cash-register.routes.ts |
| GET | /financial-reports | ❌ | ✅ | financial-reports.routes.ts |
| GET | /financial-indicators | ❌ | ✅ | financial-reports.routes.ts |
| POST | /reopen/:periodId | ❌ | ❌ | fiscal-closure.routes.ts |
| GET | /periods | ❌ | ❌ | fiscal-closure.routes.ts |
| GET | /period/:periodId | ❌ | ❌ | fiscal-closure.routes.ts |
| POST | /generate-periods | ❌ | ❌ | fiscal-closure.routes.ts |
| POST | /validate-period | ❌ | ❌ | fiscal-closure.routes.ts |
| POST | /month/async | ❌ | ❌ | fiscal-closure.routes.ts |
| POST | /year/async | ❌ | ❌ | fiscal-closure.routes.ts |
| POST | /vat/async | ❌ | ❌ | fiscal-closure.routes.ts |
| GET | /vat/d300 | ❌ | ❌ | fiscal-closure.routes.ts |
| GET | /pdf | ❌ | ❌ | general-journal.routes.ts |
| GET | /excel | ❌ | ❌ | general-journal.routes.ts |
| GET | /preview | ❌ | ❌ | general-journal.routes.ts |
| GET | /periods | ❌ | ❌ | general-journal.routes.ts |
| POST | /transactions | ❌ | ✅ | ledger.routes.ts |
| GET | /transactions/:id | ❌ | ✅ | ledger.routes.ts |
| GET | /entries | ❌ | ✅ | ledger.routes.ts |
| POST | /entry | ❌ | ✅ | ledger.routes.ts |
| POST | /entries | ❌ | ✅ | ledger.routes.ts |
| GET | /entries/:id | ❌ | ✅ | ledger.routes.ts |
| POST | /entries/:id/post | ❌ | ❌ | ledger.routes.ts |
| POST | /entries/:id/unpost | ❌ | ❌ | ledger.routes.ts |
| POST | /entries/:id/reverse | ❌ | ❌ | ledger.routes.ts |
| POST | / | ❌ | ❌ | manual-entries.routes.ts |
| GET | / | ❌ | ❌ | manual-entries.routes.ts |
| GET | /:id | ❌ | ❌ | manual-entries.routes.ts |
| POST | /validate | ❌ | ❌ | manual-entries.routes.ts |
| POST | /start | ❌ | ❌ | onboarding.routes.ts |
| POST | /import-chart | ❌ | ❌ | onboarding.routes.ts |
| POST | /import-balances | ❌ | ❌ | onboarding.routes.ts |
| POST | /validate | ❌ | ❌ | onboarding.routes.ts |
| POST | /finalize | ❌ | ❌ | onboarding.routes.ts |
| POST | /upload-preview | ❌ | ❌ | onboarding.routes.ts |
| POST | /import-balances-excel | ❌ | ❌ | onboarding.routes.ts |
| GET | /download-template | ❌ | ❌ | onboarding.routes.ts |
| GET | /status/:companyId | ❌ | ✅ | onboarding.routes.ts |
| GET | /invoices | ❌ | ✅ | purchase-journal.routes.ts |
| GET | /invoices/:id | ❌ | ✅ | purchase-journal.routes.ts |
| POST | /invoices | ❌ | ❌ | purchase-journal.routes.ts |
| PUT | /invoices/:id | ❌ | ❌ | purchase-journal.routes.ts |
| DELETE | /invoices/:id | ❌ | ❌ | purchase-journal.routes.ts |
| POST | /invoices/:id/payments | ❌ | ❌ | purchase-journal.routes.ts |
| GET | /invoices/:id/payments | ❌ | ❌ | purchase-journal.routes.ts |
| DELETE | /payments/:id | ❌ | ❌ | purchase-journal.routes.ts |
| POST | /ledger-entries | ❌ | ❌ | purchase-journal.routes.ts |
| GET | /ledger-entries | ❌ | ❌ | purchase-journal.routes.ts |
| GET | /ledger-entries/:id | ❌ | ❌ | purchase-journal.routes.ts |
| GET | /suppliers/:id/statement | ❌ | ❌ | purchase-journal.routes.ts |
| GET | /suppliers/:id/balance | ❌ | ❌ | purchase-journal.routes.ts |
| POST | /complete-supplier-details | ❌ | ❌ | purchase-journal.routes.ts |
| POST | /journal/generate-async | ❌ | ❌ | purchase-journal.routes.ts |
| POST | /bulk-create-invoices | ❌ | ❌ | purchase-journal.routes.ts |
| POST | /bulk-record-payments | ❌ | ❌ | purchase-journal.routes.ts |
| GET | /invoices | ❌ | ✅ | sales-journal.routes.ts |
| GET | /invoices/:id | ❌ | ✅ | sales-journal.routes.ts |
| POST | /invoices | ❌ | ❌ | sales-journal.routes.ts |
| PUT | /invoices/:id | ❌ | ❌ | sales-journal.routes.ts |
| DELETE | /invoices/:id | ❌ | ❌ | sales-journal.routes.ts |
| POST | /invoices/:id/payments | ❌ | ❌ | sales-journal.routes.ts |
| GET | /invoices/:id/payments | ❌ | ❌ | sales-journal.routes.ts |
| DELETE | /payments/:id | ❌ | ❌ | sales-journal.routes.ts |
| POST | /receipts | ❌ | ❌ | sales-journal.routes.ts |
| GET | /receipts | ❌ | ❌ | sales-journal.routes.ts |
| GET | /receipts/:id | ❌ | ❌ | sales-journal.routes.ts |
| POST | /ledger-entries | ❌ | ❌ | sales-journal.routes.ts |
| GET | /ledger-entries | ❌ | ❌ | sales-journal.routes.ts |
| GET | /ledger-entries/:id | ❌ | ❌ | sales-journal.routes.ts |
| GET | /customers/:id/statement | ❌ | ❌ | sales-journal.routes.ts |
| GET | /customers/:id/balance | ❌ | ❌ | sales-journal.routes.ts |
| GET | /reports/sales-by-period | ❌ | ❌ | sales-journal.routes.ts |
| GET | /reports/sales-by-product | ❌ | ❌ | sales-journal.routes.ts |
| GET | /reports/sales-by-customer | ❌ | ❌ | sales-journal.routes.ts |
| POST | /journal/generate-async | ❌ | ❌ | sales-journal.routes.ts |
| POST | /bulk-create-invoices | ❌ | ❌ | sales-journal.routes.ts |
| POST | /bulk-record-payments | ❌ | ❌ | sales-journal.routes.ts |
| GET | /jobs/:jobId | ❌ | ✅ | sales-journal.routes.ts |
| POST | /jobs/:jobId/cancel | ❌ | ❌ | sales-journal.routes.ts |
| GET | /jobs/metrics | ❌ | ❌ | sales-journal.routes.ts |


## Modul: AI

**Total endpoint-uri:** 21

| Metodă | Endpoint | Auth | Rate Limit | Fișier |
|--------|----------|------|------------|--------|
| POST | /generate | ❌ | ❌ | ai-reports.routes.ts |
| GET | /:id | ❌ | ❌ | ai-reports.routes.ts |
| GET | / | ❌ | ❌ | ai-reports.routes.ts |
| GET | /health | ❌ | ❌ | ai.routes.ts |
| GET | /status | ✅ | ❌ | ai.routes.ts |
| POST | /report | ❌ | ❌ | ai.routes.ts |
| POST | /analyze | ✅ | ❌ | inbox-ai.routes.ts |
| POST | /suggest-responses | ✅ | ❌ | inbox-ai.routes.ts |
| POST | /complete-response | ✅ | ❌ | inbox-ai.routes.ts |
| POST | /create-reminders | ✅ | ❌ | inbox-ai.routes.ts |
| GET | /status | ✅ | ❌ | openai.routes.ts |
| POST | /completion | ✅ | ❌ | openai.routes.ts |
| POST | /analyze | ✅ | ❌ | openai.routes.ts |
| POST | /answer | ✅ | ❌ | product-qa.routes.ts |
| POST | /compare | ✅ | ❌ | product-qa.routes.ts |
| POST | /search-documentation | ✅ | ❌ | product-qa.routes.ts |
| POST | /usage-suggestions/:productId | ✅ | ❌ | product-qa.routes.ts |
| POST | /lead-scoring/:leadId | ✅ | ❌ | sales-ai.routes.ts |
| POST | /recommendations/deal/:dealId | ✅ | ❌ | sales-ai.routes.ts |
| GET | /predict-outcome/:dealId | ✅ | ❌ | sales-ai.routes.ts |
| GET | /followup-timing/:customerId | ✅ | ❌ | sales-ai.routes.ts |


## Modul: Analytics

**Total endpoint-uri:** 39

| Metodă | Endpoint | Auth | Rate Limit | Fișier |
|--------|----------|------|------------|--------|
| POST | /reports | ❌ | ❌ | analytics.routes.ts |
| GET | /reports | ❌ | ❌ | analytics.routes.ts |
| GET | /reports/:id | ❌ | ❌ | analytics.routes.ts |
| POST | /reports/:id/run | ❌ | ❌ | analytics.routes.ts |
| GET | /reports/:id/history | ❌ | ❌ | analytics.routes.ts |
| POST | /dashboards | ❌ | ❌ | analytics.routes.ts |
| GET | /dashboards | ❌ | ❌ | analytics.routes.ts |
| GET | /dashboards/:id | ❌ | ❌ | analytics.routes.ts |
| PUT | /dashboards/:id | ❌ | ❌ | analytics.routes.ts |
| POST | /alerts | ❌ | ❌ | analytics.routes.ts |
| GET | /alerts | ❌ | ❌ | analytics.routes.ts |
| GET | /alerts/history | ❌ | ❌ | analytics.routes.ts |
| GET | /metrics | ❌ | ❌ | analytics.routes.ts |
| GET | /metrics/summary | ❌ | ❌ | analytics.routes.ts |
| GET | /business-units | ❌ | ❌ | business-intelligence.routes.ts |
| POST | /business-units | ❌ | ❌ | business-intelligence.routes.ts |
| GET | /cost-centers | ❌ | ❌ | business-intelligence.routes.ts |
| POST | /cost-centers | ❌ | ❌ | business-intelligence.routes.ts |
| GET | /cost-allocations | ❌ | ❌ | business-intelligence.routes.ts |
| POST | /cost-allocations | ❌ | ❌ | business-intelligence.routes.ts |
| POST | /cost-allocations/run | ❌ | ❌ | business-intelligence.routes.ts |
| GET | /cost-analysis | ❌ | ❌ | business-intelligence.routes.ts |
| GET | /profit-analysis | ❌ | ❌ | business-intelligence.routes.ts |
| GET | /business-performance | ❌ | ❌ | business-intelligence.routes.ts |
| GET | /dashboard | ❌ | ❌ | business-intelligence.routes.ts |
| GET | /models | ❌ | ❌ | predictive.routes.ts |
| POST | /models | ❌ | ❌ | predictive.routes.ts |
| GET | /models/:id | ❌ | ❌ | predictive.routes.ts |
| PUT | /models/:id | ❌ | ❌ | predictive.routes.ts |
| DELETE | /models/:id | ❌ | ❌ | predictive.routes.ts |
| POST | /models/:id/train | ❌ | ❌ | predictive.routes.ts |
| POST | /models/:id/predict | ❌ | ❌ | predictive.routes.ts |
| GET | /scenarios | ❌ | ❌ | predictive.routes.ts |
| POST | /scenarios | ❌ | ❌ | predictive.routes.ts |
| GET | /scenarios/:id | ❌ | ❌ | predictive.routes.ts |
| POST | /scenarios/:id/run | ❌ | ❌ | predictive.routes.ts |
| GET | /inventory-forecast | ❌ | ❌ | predictive.routes.ts |
| GET | /sales-forecast | ❌ | ❌ | predictive.routes.ts |
| GET | /purchase-recommendations | ❌ | ❌ | predictive.routes.ts |


## Modul: Audit

**Total endpoint-uri:** 8

| Metodă | Endpoint | Auth | Rate Limit | Fișier |
|--------|----------|------|------------|--------|
| POST | /test | ❌ | ❌ | audit.routes.ts |
| GET | /entity/:entity/:entityId | ❌ | ❌ | audit.routes.ts |
| GET | /recent/:limit | ❌ | ❌ | audit.routes.ts |
| GET | /recent | ❌ | ❌ | audit.routes.ts |
| GET | /search | ❌ | ❌ | audit.routes.ts |
| GET | /stats | ❌ | ❌ | audit.routes.ts |
| GET | /user/:userId | ❌ | ❌ | audit.routes.ts |
| GET | /admin-actions | ❌ | ❌ | audit.routes.ts |


## Modul: Auth

**Total endpoint-uri:** 15

| Metodă | Endpoint | Auth | Rate Limit | Fișier |
|--------|----------|------|------------|--------|
| POST | /register | ❌ | ✅ | auth.routes.ts |
| POST | /login | ❌ | ✅ | auth.routes.ts |
| GET | /csrf-token | ❌ | ❌ | auth.routes.ts |
| POST | /logout | ❌ | ❌ | auth.routes.ts |
| POST | /refresh | ❌ | ❌ | auth.routes.ts |
| GET | /user | ❌ | ❌ | auth.routes.ts |
| GET | /users | ❌ | ❌ | auth.routes.ts |
| GET | /test-token/:userId | ❌ | ❌ | auth.routes.ts |
| GET | /verify-token | ✅ | ❌ | auth.routes.ts |
| GET | /verify | ✅ | ❌ | auth.routes.ts |
| POST | /setup | ❌ | ❌ | mfa.routes.ts |
| POST | /verify | ❌ | ❌ | mfa.routes.ts |
| POST | /disable | ❌ | ❌ | mfa.routes.ts |
| POST | /regenerate-backup-codes | ❌ | ❌ | mfa.routes.ts |
| GET | /status | ❌ | ❌ | mfa.routes.ts |


## Modul: BPM

**Total endpoint-uri:** 55

| Metodă | Endpoint | Auth | Rate Limit | Fișier |
|--------|----------|------|------------|--------|
| GET | / | ❌ | ❌ | api-connection.routes.ts |
| GET | /:id | ❌ | ❌ | api-connection.routes.ts |
| POST | / | ❌ | ❌ | api-connection.routes.ts |
| PATCH | /:id | ❌ | ❌ | api-connection.routes.ts |
| DELETE | /:id | ❌ | ❌ | api-connection.routes.ts |
| POST | /:id/test | ❌ | ❌ | api-connection.routes.ts |
| GET | /process-placeholder | ❌ | ❌ | bpm.routes.ts |
| POST | /process-placeholder | ❌ | ❌ | bpm.routes.ts |
| GET | /discover | ❌ | ❌ | bpm.routes.ts |
| GET | / | ❌ | ❌ | process-instance.routes.ts |
| GET | /:id | ❌ | ❌ | process-instance.routes.ts |
| POST | / | ❌ | ❌ | process-instance.routes.ts |
| POST | /:id/cancel | ❌ | ❌ | process-instance.routes.ts |
| POST | /:id/pause | ❌ | ❌ | process-instance.routes.ts |
| POST | /:id/resume | ❌ | ❌ | process-instance.routes.ts |
| GET | /:id/history | ❌ | ❌ | process-instance.routes.ts |
| GET | /:id/status | ❌ | ❌ | process-instance.routes.ts |
| GET | / | ❌ | ❌ | process.routes.ts |
| GET | /:id | ❌ | ❌ | process.routes.ts |
| POST | / | ❌ | ❌ | process.routes.ts |
| PATCH | /:id | ❌ | ❌ | process.routes.ts |
| DELETE | /:id | ❌ | ❌ | process.routes.ts |
| PATCH | /:id/status | ❌ | ❌ | process.routes.ts |
| POST | /:id/duplicate | ❌ | ❌ | process.routes.ts |
| GET | /templates/all | ❌ | ❌ | process.routes.ts |
| POST | /templates/:templateId/create | ❌ | ❌ | process.routes.ts |
| POST | /:processId/start | ❌ | ❌ | process.routes.ts |
| GET | / | ❌ | ❌ | scheduled-job.routes.ts |
| GET | /:id | ❌ | ❌ | scheduled-job.routes.ts |
| POST | / | ❌ | ❌ | scheduled-job.routes.ts |
| PATCH | /:id | ❌ | ❌ | scheduled-job.routes.ts |
| DELETE | /:id | ❌ | ❌ | scheduled-job.routes.ts |
| PATCH | /:id/toggle | ❌ | ❌ | scheduled-job.routes.ts |
| POST | /:id/run | ❌ | ❌ | scheduled-job.routes.ts |
| GET | /instance/:instanceId | ❌ | ❌ | step-execution.routes.ts |
| GET | /:id | ❌ | ❌ | step-execution.routes.ts |
| PATCH | /:id | ❌ | ❌ | step-execution.routes.ts |
| POST | /:id/complete | ❌ | ❌ | step-execution.routes.ts |
| POST | /:id/fail | ❌ | ❌ | step-execution.routes.ts |
| POST | /:id/skip | ❌ | ❌ | step-execution.routes.ts |
| GET | / | ❌ | ❌ | step-template.routes.ts |
| GET | /by-type/:type | ❌ | ❌ | step-template.routes.ts |
| GET | /by-target-type/:targetType | ❌ | ❌ | step-template.routes.ts |
| GET | /:id | ❌ | ❌ | step-template.routes.ts |
| POST | / | ❌ | ❌ | step-template.routes.ts |
| PUT | /:id | ❌ | ❌ | step-template.routes.ts |
| DELETE | /:id | ❌ | ❌ | step-template.routes.ts |
| PATCH | /:id/toggle-global | ❌ | ❌ | step-template.routes.ts |
| GET | / | ❌ | ❌ | trigger.routes.ts |
| GET | /:id | ❌ | ❌ | trigger.routes.ts |
| POST | / | ❌ | ❌ | trigger.routes.ts |
| PATCH | /:id | ❌ | ❌ | trigger.routes.ts |
| DELETE | /:id | ❌ | ❌ | trigger.routes.ts |
| PATCH | /:id/toggle | ❌ | ❌ | trigger.routes.ts |
| POST | /:id/execute | ❌ | ❌ | trigger.routes.ts |


## Modul: Collaboration

**Total endpoint-uri:** 20

| Metodă | Endpoint | Auth | Rate Limit | Fișier |
|--------|----------|------|------------|--------|
| GET | ${BASE_PATH}/:id/replies | ✅ | ❌ | message.routes.ts |
| GET | ${BASE_PATH}/:id | ✅ | ❌ | message.routes.ts |
| PATCH | ${BASE_PATH}/:id | ✅ | ❌ | message.routes.ts |
| DELETE | ${BASE_PATH}/:id | ✅ | ❌ | message.routes.ts |
| GET | /api/collaboration/tasks | ❌ | ❌ | task.routes.ts |
| GET | /api/collaboration/tasks/:id | ❌ | ❌ | task.routes.ts |
| POST | /api/collaboration/tasks | ❌ | ❌ | task.routes.ts |
| PUT | /api/collaboration/tasks/:id | ❌ | ❌ | task.routes.ts |
| DELETE | /api/collaboration/tasks/:id | ❌ | ❌ | task.routes.ts |
| POST | /api/collaboration/tasks/:id/assign | ❌ | ❌ | task.routes.ts |
| POST | /api/collaboration/tasks/:id/status | ❌ | ❌ | task.routes.ts |
| GET | ${BASE_PATH}/:id | ✅ | ❌ | thread.routes.ts |
| PATCH | ${BASE_PATH}/:id | ✅ | ❌ | thread.routes.ts |
| DELETE | ${BASE_PATH}/:id | ✅ | ❌ | thread.routes.ts |
| GET | ${BASE_PATH}/watched-tasks | ✅ | ❌ | watcher.routes.ts |
| POST | ${BASE_PATH}/add-user | ✅ | ❌ | watcher.routes.ts |
| PATCH | ${BASE_PATH}/:taskId | ✅ | ❌ | watcher.routes.ts |
| GET | ${BASE_PATH}/:taskId/is-watching | ✅ | ❌ | watcher.routes.ts |
| DELETE | ${BASE_PATH}/:taskId | ✅ | ❌ | watcher.routes.ts |
| DELETE | ${BASE_PATH}/:taskId/users/:userId | ✅ | ❌ | watcher.routes.ts |


## Modul: Communications

**Total endpoint-uri:** 37

| Metodă | Endpoint | Auth | Rate Limit | Fișier |
|--------|----------|------|------------|--------|
| GET | / | ❌ | ❌ | channel-configs.routes.ts |
| GET | /type/:channel | ❌ | ❌ | channel-configs.routes.ts |
| GET | /:configId | ❌ | ❌ | channel-configs.routes.ts |
| POST | / | ❌ | ❌ | channel-configs.routes.ts |
| PATCH | /:configId | ❌ | ❌ | channel-configs.routes.ts |
| DELETE | /:configId | ❌ | ❌ | channel-configs.routes.ts |
| GET | / | ✅ | ❌ | contacts.routes.ts |
| GET | /:contactId | ✅ | ❌ | contacts.routes.ts |
| POST | / | ✅ | ❌ | contacts.routes.ts |
| PATCH | /:contactId | ✅ | ❌ | contacts.routes.ts |
| DELETE | /:contactId | ✅ | ❌ | contacts.routes.ts |
| POST | /find | ✅ | ❌ | contacts.routes.ts |
| GET | /:messageId/users | ❌ | ❌ | message-access.routes.ts |
| GET | /:messageId/users/:userId | ❌ | ❌ | message-access.routes.ts |
| POST | /:messageId/users/:userId | ❌ | ❌ | message-access.routes.ts |
| PATCH | /:messageId/users/:userId | ❌ | ❌ | message-access.routes.ts |
| DELETE | /:messageId/users/:userId | ❌ | ❌ | message-access.routes.ts |
| GET | /:messageId/users/:userId/permissions/:permission | ❌ | ❌ | message-access.routes.ts |
| POST | /:messageId/users/bulk | ❌ | ❌ | message-access.routes.ts |
| GET | /thread/:threadId | ❌ | ❌ | messages.routes.ts |
| GET | /:messageId | ❌ | ❌ | messages.routes.ts |
| POST | /thread/:threadId | ❌ | ❌ | messages.routes.ts |
| PATCH | /:messageId | ❌ | ❌ | messages.routes.ts |
| PATCH | /:messageId/read | ❌ | ❌ | messages.routes.ts |
| DELETE | /:messageId | ❌ | ❌ | messages.routes.ts |
| GET | /search | ❌ | ❌ | messages.routes.ts |
| GET | /:threadId/users | ❌ | ❌ | thread-access.routes.ts |
| GET | /:threadId/users/:userId | ❌ | ❌ | thread-access.routes.ts |
| POST | /:threadId/users/:userId | ❌ | ❌ | thread-access.routes.ts |
| PATCH | /:threadId/users/:userId | ❌ | ❌ | thread-access.routes.ts |
| DELETE | /:threadId/users/:userId | ❌ | ❌ | thread-access.routes.ts |
| GET | /:threadId/users/:userId/permissions/:permission | ❌ | ❌ | thread-access.routes.ts |
| GET | / | ❌ | ❌ | threads.routes.ts |
| GET | /:threadId | ❌ | ❌ | threads.routes.ts |
| POST | / | ❌ | ❌ | threads.routes.ts |
| PATCH | /:threadId | ❌ | ❌ | threads.routes.ts |
| DELETE | /:threadId | ❌ | ❌ | threads.routes.ts |


## Modul: Companies

**Total endpoint-uri:** 12

| Metodă | Endpoint | Auth | Rate Limit | Fișier |
|--------|----------|------|------------|--------|
| GET | / | ❌ | ❌ | company.routes.ts |
| GET | /search | ❌ | ❌ | company.routes.ts |
| GET | /hierarchy | ❌ | ❌ | company.routes.ts |
| GET | /franchises | ❌ | ❌ | company.routes.ts |
| GET | /:id | ❌ | ❌ | company.routes.ts |
| POST | / | ❌ | ❌ | company.routes.ts |
| PUT | /:id | ❌ | ❌ | company.routes.ts |
| DELETE | /:id | ❌ | ❌ | company.routes.ts |
| GET | /companies/:id | ❌ | ❌ | company.routes.ts |
| POST | /companies | ❌ | ❌ | company.routes.ts |
| PUT | /companies/:id | ❌ | ❌ | company.routes.ts |
| DELETE | /companies/:id | ❌ | ❌ | company.routes.ts |


## Modul: CRM

**Total endpoint-uri:** 11

| Metodă | Endpoint | Auth | Rate Limit | Fișier |
|--------|----------|------|------------|--------|
| POST | /customers | ❌ | ❌ | crm.routes.ts |
| GET | /customers/:id | ❌ | ❌ | crm.routes.ts |
| PUT | /customers/:id | ❌ | ❌ | crm.routes.ts |
| DELETE | /customers/:id | ❌ | ❌ | crm.routes.ts |
| POST | /deals | ❌ | ❌ | crm.routes.ts |
| GET | /deals/:id | ❌ | ❌ | crm.routes.ts |
| PUT | /deals/:id | ❌ | ❌ | crm.routes.ts |
| DELETE | /deals/:id | ❌ | ❌ | crm.routes.ts |
| POST | /anaf-proxy | ❌ | ❌ | crm.routes.ts |
| GET | /company/:cui | ❌ | ❌ | crm.routes.ts |
| POST | /companies/batch | ❌ | ❌ | crm.routes.ts |


## Modul: Ecommerce

**Total endpoint-uri:** 35

| Metodă | Endpoint | Auth | Rate Limit | Fișier |
|--------|----------|------|------------|--------|
| GET | /active | ✅ | ❌ | cart.routes.ts |
| GET | /:cartId | ✅ | ❌ | cart.routes.ts |
| POST | /item | ✅ | ❌ | cart.routes.ts |
| PUT | /item/:itemId | ✅ | ❌ | cart.routes.ts |
| DELETE | /item/:itemId | ✅ | ❌ | cart.routes.ts |
| DELETE | /:cartId/clear | ✅ | ❌ | cart.routes.ts |
| POST | /:cartId/discount | ✅ | ❌ | cart.routes.ts |
| POST | /cart/:cartId | ✅ | ❌ | checkout.routes.ts |
| POST | /direct | ✅ | ❌ | checkout.routes.ts |
| GET | / | ✅ | ❌ | orders.routes.ts |
| GET | /:orderId | ✅ | ❌ | orders.routes.ts |
| POST | / | ✅ | ❌ | orders.routes.ts |
| PUT | /:orderId | ✅ | ❌ | orders.routes.ts |
| PATCH | /:orderId/status | ✅ | ❌ | orders.routes.ts |
| GET | /stats/count-by-status | ✅ | ❌ | orders.routes.ts |
| GET | /search/:query | ✅ | ❌ | orders.routes.ts |
| POST | /connect | ✅ | ❌ | pos.routes.ts |
| GET | /status/:posSystem | ✅ | ❌ | pos.routes.ts |
| POST | /import-orders | ✅ | ❌ | pos.routes.ts |
| POST | /export-products | ✅ | ❌ | pos.routes.ts |
| POST | /sync-inventory | ✅ | ❌ | pos.routes.ts |
| GET | /status | ✅ | ❌ | shopify.routes.ts |
| POST | /credentials | ✅ | ❌ | shopify.routes.ts |
| POST | /verify-credentials | ✅ | ❌ | shopify.routes.ts |
| PUT | /enabled | ✅ | ❌ | shopify.routes.ts |
| POST | /sync/products | ✅ | ❌ | shopify.routes.ts |
| POST | /import/orders | ✅ | ❌ | shopify.routes.ts |
| POST | /webhook/:type | ❌ | ❌ | shopify.routes.ts |
| GET | / | ✅ | ❌ | transactions.routes.ts |
| GET | /:transactionId | ✅ | ❌ | transactions.routes.ts |
| GET | /order/:orderId | ✅ | ❌ | transactions.routes.ts |
| POST | / | ✅ | ❌ | transactions.routes.ts |
| PATCH | /:transactionId/status | ✅ | ❌ | transactions.routes.ts |
| POST | /:transactionId/refund | ✅ | ❌ | transactions.routes.ts |
| GET | /stats/:period | ✅ | ❌ | transactions.routes.ts |


## Modul: HR

**Total endpoint-uri:** 6

| Metodă | Endpoint | Auth | Rate Limit | Fișier |
|--------|----------|------|------------|--------|
| GET | /settings | ❌ | ❌ | hr.routes.ts |
| PUT | /settings/:id | ❌ | ❌ | hr.routes.ts |
| POST | /employees/draft | ❌ | ❌ | hr.routes.ts |
| POST | /documents/generate-compliance | ❌ | ❌ | hr.routes.ts |
| POST | /documents/upload | ❌ | ❌ | hr.routes.ts |
| GET | /holidays | ❌ | ❌ | hr.routes.ts |


## Modul: Integrations

**Total endpoint-uri:** 12

| Metodă | Endpoint | Auth | Rate Limit | Fișier |
|--------|----------|------|------------|--------|
| GET | /exchange-rates | ❌ | ❌ | integrations.routes.ts |
| GET | /exchange-rates/bnr | ❌ | ❌ | integrations.routes.ts |
| GET | /exchange-rates/historical | ❌ | ❌ | integrations.routes.ts |
| POST | /exchange-rates/bnr/update | ❌ | ❌ | integrations.routes.ts |
| GET | /exchange-rates/bnr/test-rss | ❌ | ❌ | integrations.routes.ts |
| GET | /exchange-rates/convert | ❌ | ❌ | integrations.routes.ts |
| GET | /anaf/validate-vat/:vatNumber | ❌ | ❌ | integrations.routes.ts |
| GET | /anaf/company/:fiscalCode | ❌ | ❌ | integrations.routes.ts |
| GET | /exchange-rates/bnr/all | ❌ | ❌ | integrations.routes.ts |
| GET | /exchange-rates/bnr/all | ❌ | ❌ | public.routes.ts |
| GET | /exchange-rates/historical | ❌ | ❌ | public.routes.ts |
| POST | /exchange-rates/bnr/update | ❌ | ❌ | public.routes.ts |


## Modul: Inventory

**Total endpoint-uri:** 16

| Metodă | Endpoint | Auth | Rate Limit | Fișier |
|--------|----------|------|------------|--------|
| POST | /nir | ❌ | ❌ | inventory.routes.ts |
| GET | /nir/:id | ❌ | ❌ | inventory.routes.ts |
| PUT | /nir/:id/status | ❌ | ❌ | inventory.routes.ts |
| GET | /nir | ❌ | ❌ | inventory.routes.ts |
| POST | /transfer | ❌ | ❌ | inventory.routes.ts |
| GET | /transfer/:id | ❌ | ❌ | inventory.routes.ts |
| GET | /transfers | ❌ | ❌ | inventory.routes.ts |
| PUT | /transfer/:id/status | ❌ | ❌ | inventory.routes.ts |
| POST | /check-stock-levels | ❌ | ❌ | inventory.routes.ts |
| GET | /stock/low | ❌ | ❌ | inventory.routes.ts |
| POST | /stock/threshold | ❌ | ❌ | inventory.routes.ts |
| GET | /stock/notifications | ❌ | ❌ | inventory.routes.ts |
| PUT | /stock/notifications | ❌ | ❌ | inventory.routes.ts |
| GET | /stock-items | ❌ | ❌ | inventory.routes.ts |
| GET | /stock-items/:id | ❌ | ❌ | inventory.routes.ts |
| POST | /stock-items/check-levels | ❌ | ❌ | inventory.routes.ts |


## Modul: Invoicing

**Total endpoint-uri:** 11

| Metodă | Endpoint | Auth | Rate Limit | Fișier |
|--------|----------|------|------------|--------|
| GET | / | ❌ | ❌ | customer.routes.ts |
| GET | / | ❌ | ❌ | invoice-numbering.routes.ts |
| GET | /:id | ❌ | ❌ | invoice-numbering.routes.ts |
| POST | / | ❌ | ❌ | invoice-numbering.routes.ts |
| PATCH | /:id | ❌ | ❌ | invoice-numbering.routes.ts |
| DELETE | /:id | ❌ | ❌ | invoice-numbering.routes.ts |
| POST | /generate-number | ❌ | ❌ | invoice-numbering.routes.ts |
| GET | / | ❌ | ❌ | invoice.routes.ts |
| GET | /:id | ❌ | ❌ | invoice.routes.ts |
| PUT | /:id | ❌ | ❌ | invoice.routes.ts |
| DELETE | /:id | ❌ | ❌ | invoice.routes.ts |


## Modul: Settings

**Total endpoint-uri:** 36

| Metodă | Endpoint | Auth | Rate Limit | Fișier |
|--------|----------|------|------------|--------|
| GET | /global | ❌ | ❌ | settings.routes.ts |
| GET | /global/:key | ❌ | ❌ | settings.routes.ts |
| POST | /global | ❌ | ❌ | settings.routes.ts |
| PUT | /global/:id | ❌ | ❌ | settings.routes.ts |
| DELETE | /global/:id | ❌ | ❌ | settings.routes.ts |
| GET | /features | ❌ | ❌ | settings.routes.ts |
| GET | /features/:feature/status | ❌ | ❌ | settings.routes.ts |
| POST | /features | ❌ | ❌ | settings.routes.ts |
| PUT | /features/:id/enable | ❌ | ❌ | settings.routes.ts |
| PUT | /features/:id/disable | ❌ | ❌ | settings.routes.ts |
| DELETE | /features/:id | ❌ | ❌ | settings.routes.ts |
| GET | /modules/:moduleName/settings | ❌ | ❌ | settings.routes.ts |
| GET | /modules/:moduleName/settings/:key | ❌ | ❌ | settings.routes.ts |
| POST | /modules/:moduleName/settings | ❌ | ❌ | settings.routes.ts |
| POST | /modules/:moduleName/defaults | ❌ | ❌ | settings.routes.ts |
| GET | /multi-modules | ❌ | ❌ | settings.routes.ts |
| GET | /user-preferences/:userId | ❌ | ❌ | settings.routes.ts |
| GET | /user-preferences/:userId/category/:category | ❌ | ❌ | settings.routes.ts |
| GET | /user-preferences/:userId/module/:module | ❌ | ❌ | settings.routes.ts |
| GET | /user-preferences/:userId/key/:key | ❌ | ❌ | settings.routes.ts |
| POST | /user-preferences | ❌ | ❌ | settings.routes.ts |
| PUT | /user-preferences/:id | ❌ | ❌ | settings.routes.ts |
| DELETE | /user-preferences/:id | ❌ | ❌ | settings.routes.ts |
| GET | /themes/:companyId | ❌ | ❌ | settings.routes.ts |
| GET | /themes/:companyId/default | ❌ | ❌ | settings.routes.ts |
| GET | /themes/id/:id | ❌ | ❌ | settings.routes.ts |
| POST | /themes | ❌ | ❌ | settings.routes.ts |
| PUT | /themes/:id | ❌ | ❌ | settings.routes.ts |
| PUT | /themes/:id/set-default | ❌ | ❌ | settings.routes.ts |
| DELETE | /themes/:id | ❌ | ❌ | settings.routes.ts |
| POST | /setup-placeholder | ❌ | ❌ | settings.routes.ts |
| GET | / | ❌ | ❌ | setup.routes.ts |
| GET | /progress | ❌ | ❌ | setup.routes.ts |
| POST | /step | ❌ | ❌ | setup.routes.ts |
| GET | /check/:step | ❌ | ❌ | setup.routes.ts |
| GET | /onboarding | ❌ | ❌ | setup.routes.ts |


## Modul: Users

**Total endpoint-uri:** 10

| Metodă | Endpoint | Auth | Rate Limit | Fișier |
|--------|----------|------|------------|--------|
| GET | / | ❌ | ❌ | user.routes.ts |
| GET | /:id | ❌ | ❌ | user.routes.ts |
| POST | / | ❌ | ❌ | user.routes.ts |
| PUT | /:id | ❌ | ❌ | user.routes.ts |
| GET | /roles/all | ❌ | ❌ | user.routes.ts |
| GET | /:id/roles | ❌ | ❌ | user.routes.ts |
| POST | /:id/roles/:roleId | ❌ | ❌ | user.routes.ts |
| DELETE | /:id/roles/:roleId | ❌ | ❌ | user.routes.ts |
| GET | /permissions/all | ❌ | ❌ | user.routes.ts |
| GET | /roles/:id/permissions | ❌ | ❌ | user.routes.ts |


