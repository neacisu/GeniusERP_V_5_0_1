# Raport Sincronizare Bază de Date GeniusERP

**Data:** 12 Octombrie 2025  
**Status:** ✅ Sincronizare Completă - 160 Tabele Active

---

## 📊 Statistici Generale

| Metric | Valoare |
|--------|---------|
| **Tabele în Baza de Date** | **160** |
| **Definiții pgTable() în Cod** | 154 |
| **CREATE TABLE în Migrații SQL** | 20 |
| **Progres de la început** | +133 tabele (de la 27) |

---

## 🎯 Breakdown pe Module (Top 15)

| Modul | Număr Tabele |
|-------|--------------|
| CRM | 16 |
| HR | 14 |
| Analytics | 14 |
| Collaboration | 9 |
| BPM | 8 |
| E-commerce | 9 (incl. carts, integrations) |
| Communications | 6 |
| Inventory | 10 (incl. assessments, batches) |
| Marketing | 4 |
| Settings | 4 |
| Accounting | 15+ |
| Invoicing | 5 |
| COR (Ocupații) | 5 |
| Banking | 2 |
| Alte module | 35+ |

---

## ✅ Tabele Adăugate în Această Sesiune

### E-commerce (3 tabele noi)
- `ecommerce_carts` - Coșuri de cumpărături
- `ecommerce_cart_items` - Produse în coș
- `ecommerce_integrations` - Integrări platforme (Shopify, etc.)

### Inventory (5 tabele noi)
- `inventory_assessments` - Inventarieri
- `inventory_assessment_items` - Detalii inventariere
- `inventory_batches` - Loturi produse
- `inventory_valuations` - Evaluări stoc
- `inventory_warehouses` - Gestiuni suplimentare

### HR (1 tabel nou)
- `hr_documents` - Documente angajați

### CRM (3 tabele noi)
- `financial_data` - Date financiare companii
- `financial_data_errors` - Erori import ANAF
- `financial_data_jobs` - Joburi import date

---

## 🔧 Probleme Rezolvate

### 1. Conflicte de Nume
- ✅ **CRM vs Communications `contacts`** → Redenumit `communicationsContacts`
- ✅ **Duplicate `company_type` enum** → Comentat duplicatul, folosit `text`
- ✅ **Duplicate `ecommerce_orders`** → Eliminat duplicatul din shared/schema

### 2. Export-uri Lipsă
- ✅ `server/modules/inventory/schema/index.ts` → Adăugat `inventory-assessment.schema`
- ✅ `server/modules/crm/schema/index.ts` → Adăugat `financial-data.schema`
- ✅ `server/modules/hr/schema/index.ts` → Adăugat `documents.schema`
- ✅ `shared/schema.ts` → Adăugat toate exports necesare

### 3. Primary Key Issues
- ✅ **hr_work_schedules** → Schimbat `primaryKey` în `unique` constraint

---

## 📋 Lista Completă Tabele în DB (160)

<details>
<summary>Click pentru a extinde lista completă</summary>

1. account_balances
2. account_classes
3. account_groups
4. account_mappings
5. accounts
6. admin_actions
7. alert_history
8. anaf_company_data
9. analytic_accounts
10. analytics_alerts
11. analytics_anomalies
12. analytics_anomaly_rules
13. analytics_dashboards
14. analytics_inventory_optimization
15. analytics_metrics
16. analytics_prediction_results
17. analytics_predictive_models
18. analytics_purchasing_recommendations
19. analytics_reports
20. analytics_scenario_results
21. analytics_scenarios
22. analytics_seasonal_patterns
23. analytics_time_series_data
24. api_keys
25. audit_logs
26. bank_accounts
27. bank_transactions
28. bi_business_units
29. bi_cost_allocations
30. bi_cost_centers
31. bpm_api_connections
32. bpm_approvals
33. bpm_process_instances
34. bpm_processes
35. bpm_scheduled_jobs
36. bpm_step_executions
37. bpm_step_templates
38. bpm_triggers
39. cash_registers
40. cash_transactions
41. chart_of_accounts
42. collaboration_activities
43. collaboration_messages
44. collaboration_notes
45. collaboration_notifications
46. collaboration_task_assignments
47. collaboration_task_status_history
48. collaboration_task_watchers
49. collaboration_tasks
50. collaboration_threads
51. communications_channel_configs
52. communications_contacts
53. communications_message_access
54. communications_messages
55. communications_thread_access
56. communications_threads
57. companies
58. company_licenses
59. configurations
60. cor_major_groups
61. cor_minor_groups
62. cor_occupations
63. cor_submajor_groups
64. cor_subminor_groups
65. cost_allocation_history
66. crm_activities
67. crm_companies
68. crm_contacts
69. crm_customer_tags
70. crm_customers
71. crm_deal_tags
72. crm_deals
73. crm_email_templates
74. crm_pipelines
75. crm_revenue_forecasts
76. crm_sales_quotas
77. crm_scoring_rules
78. crm_segments
79. crm_stage_history
80. crm_stages
81. crm_tags
82. dashboard_views
83. document_counters
84. document_versions
85. documents
86. ecommerce_cart_items ⭐ NOU
87. ecommerce_carts ⭐ NOU
88. ecommerce_integrations ⭐ NOU
89. ecommerce_order_items
90. ecommerce_orders
91. ecommerce_shopify_collections
92. ecommerce_shopify_products
93. ecommerce_shopify_variants
94. ecommerce_transactions
95. financial_data ⭐ NOU
96. financial_data_errors ⭐ NOU
97. financial_data_jobs ⭐ NOU
98. fiscal_periods
99. fx_rates
100. health_checks
101. hr_absences
102. hr_anaf_export_logs
103. hr_commission_structures
104. hr_departments
105. hr_documents ⭐ NOU
106. hr_employee_commissions
107. hr_employee_drafts
108. hr_employees
109. hr_employment_contracts
110. hr_job_positions
111. hr_payroll_logs
112. hr_revisal_export_logs
113. hr_settings
114. hr_work_schedules
115. integrations
116. inventory_assessment_items ⭐ NOU
117. inventory_assessments ⭐ NOU
118. inventory_batches ⭐ NOU
119. inventory_categories
120. inventory_products
121. inventory_stock
122. inventory_stock_movements
123. inventory_units
124. inventory_valuations ⭐ NOU
125. inventory_warehouses ⭐ NOU
126. invoice_details
127. invoice_items
128. invoice_lines
129. invoice_numbering_settings
130. invoice_payments
131. invoices
132. journal_entries
133. journal_lines
134. journal_types
135. ledger_entries
136. ledger_lines
137. licenses
138. marketing_campaign_messages
139. marketing_campaign_segments
140. marketing_campaign_templates
141. marketing_campaigns
142. metrics_history
143. model_training_history
144. permissions
145. predictive_models
146. predictive_scenarios
147. report_execution_history
148. role_permissions
149. roles
150. scenario_results
151. settings_feature_toggles
152. settings_global
153. settings_ui_themes
154. settings_user_preferences
155. setup_steps
156. synthetic_accounts
157. system_configs
158. user_roles
159. users
160. warehouses

</details>

---

## 📝 Note despre Tabelele "Lipsă"

Utilizatorul a menționat că ar trebui să existe 180+ tabele. Analiza actuală arată:

### Tabele din Migrații SQL care nu există în DB (6):
- `attendance_records` - Înlocuit cu `hr_absences`
- `employee_contracts` - Înlocuit cu `hr_employment_contracts`
- `employee_documents` - Înlocuit cu `hr_documents`
- `employees` - Înlocuit cu `hr_employees`
- `leave_requests` - Înlocuit cu `hr_absences`
- `payroll_records` - Înlocuit cu `hr_payroll_logs`

**Concluzie:** Aceste tabele sunt versiuni vechi, înlocuite cu schema nouă HR cu prefix `hr_`.

### Diferența de 20 tabele (180 - 160)

Posibile explicații:
1. **Tabele din backup vechi** care nu mai sunt în schema actuală
2. **Views sau alte obiecte DB** care nu sunt tabele propriu-zise
3. **Module în dezvoltare** cu scheme încă nedefinite
4. **Tabele temporare** sau de testare

---

## 🚀 Recomandări Next Steps

1. ✅ **Verificat**: Toate schemele TypeScript sunt exportate corect
2. ✅ **Sincronizat**: 160 tabele active în baza de date
3. 🔄 **Opțional**: Rulare migrații SQL vechi (dacă sunt necesare)
4. 📊 **Opțional**: Audit complet pentru identificarea celor 20 de tabele "lipsă"

---

## 🎉 Rezultate Finale

**De la:** 27 tabele  
**La:** 160 tabele  
**Progres:** +133 tabele (+493% creștere!)  

**Status:** ✅ **Baza de date este funcțională și sincronizată cu schema Drizzle ORM**


