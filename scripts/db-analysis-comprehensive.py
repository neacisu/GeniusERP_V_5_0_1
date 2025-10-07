#!/usr/bin/env python3
"""
Comprehensive Database Analysis Script

This script analyzes the database audit report and generates a comprehensive
report comparing the expected schema from code with the actual database structure.
"""

import json
import os
from collections import defaultdict
from typing import Dict, List, Set

# Expected tables based on schema analysis
EXPECTED_TABLES = {
    # Core system tables
    'users', 'roles', 'permissions', 'user_roles', 'role_permissions',
    'companies', 'licenses', 'company_licenses',
    
    # Accounting tables
    'account_classes', 'account_groups', 'synthetic_accounts', 'analytic_accounts',
    'accounts', 'account_balances', 'account_mappings',
    'journal_entries', 'journal_lines',
    'accounting_ledger_entries', 'accounting_ledger_lines',
    'accounting_journal_types',
    'bank_accounts', 'bank_transactions',
    'cash_registers', 'cash_transactions',
    
    # Invoicing
    'invoices', 'invoice_lines', 'invoice_details', 'invoice_payments',
    'invoice_numbering_settings',
    
    # Inventory
    'inventory_categories', 'inventory_units', 'inventory_products',
    'inventory_stock', 'inventory_stock_movements',
    'warehouses',
    'inventory_assessments', 'inventory_assessment_items',
    'inventory_valuations', 'inventory_batches',
    'nir_documents', 'nir_items',
    'transfer_documents', 'transfer_items',
    'stock_reservations', 'stocks',
    'purchase_orders', 'purchase_order_items',
    
    # CRM
    'crm_customers', 'crm_contacts', 'crm_companies',
    'crm_deals', 'crm_pipelines', 'crm_stages',
    'crm_activities', 'crm_tasks', 'crm_notes',
    'crm_tags', 'crm_taggables',
    'crm_custom_fields', 'crm_segments', 'crm_scoring_rules',
    'crm_email_templates', 'crm_forecasts',
    'crm_stage_history', 'crm_deal_products',
    'financial_data', 'financial_data_errors', 'financial_data_jobs',
    
    # HR
    'employees', 'employee_documents', 'employee_contract',
    'cor_occupations', 'cor_major_groups', 'cor_submajor_groups',
    'cor_minor_groups', 'cor_subminor_groups',
    'employee_contracts', 'attendance_records', 'leave_requests',
    'payroll_records',
    
    # E-commerce
    'ecommerce_orders', 'ecommerce_transactions',
    'ecommerce_carts', 'ecommerce_cart_items',
    'ecommerce_integrations',
    
    # Communications
    'communications_threads', 'communications_messages',
    'communications_contacts', 'communications_channel_configs',
    'communications_message_access', 'communications_thread_access',
    
    # Marketing
    'marketing_campaigns', 'marketing_campaign_messages',
    'marketing_campaign_segments', 'marketing_campaign_templates',
    
    # Collaboration
    'collaboration_tasks', 'collaboration_notes',
    'collaboration_threads', 'collaboration_messages',
    'collaboration_activities', 'collaboration_notifications',
    'collaboration_task_assignments', 'collaboration_task_status_history',
    'collaboration_task_watchers',
    
    # BPM
    'bpm_processes', 'bpm_triggers', 'bpm_process_instances',
    'bpm_step_templates', 'bpm_step_executions',
    'bpm_approvals', 'bpm_api_connections', 'bpm_scheduled_jobs',
    
    # Analytics
    'analytics_metrics', 'analytics_reports', 'analytics_dashboards',
    'analytics_alerts', 'analytics_scenarios', 'analytics_scenario_executions',
    'analytics_scenario_results', 'analytics_predictive_models',
    'analytics_model_executions', 'analytics_time_series_data',
    'analytics_inventory_optimizations', 'analytics_purchasing_recommendations',
    'alert_history', 'metrics_history', 'model_training_history',
    'predictive_models', 'predictive_scenarios', 'report_execution_history',
    'scenario_results',
    
    # Documents
    'documents', 'document_versions',
    
    # Settings
    'settings_global', 'settings_user_preferences',
    'settings_feature_toggles', 'settings_ui_themes',
    
    # Admin
    'setup_steps', 'health_checks', 'api_keys', 'system_configs',
    'admin_actions',
    
    # BI
    'bi_business_units', 'bi_cost_centers', 'bi_cost_allocations',
    'cost_allocation_history',
    'dashboard_views',
    
    # Miscellaneous
    'audit_logs', 'fx_rates', 'chart_of_accounts',
    'anaf_company_data',
}

# Critical tables that must have default data
CRITICAL_TABLES_REQUIRING_DATA = {
    'account_classes': 'Clase de conturi (Clasa 1-9)',
    'permissions': 'Permisiuni sistem',
    'inventory_units': 'Unități de măsură (buc, kg, l, etc.)',
}

def load_audit_report(filepath: str) -> Dict:
    """Load the database audit report"""
    with open(filepath, 'r') as f:
        return json.load(f)

def analyze_tables(audit_data: Dict) -> Dict:
    """Analyze tables and their structure"""
    existing_tables = set(table['tableName'] for table in audit_data['tables'])
    missing_tables = EXPECTED_TABLES - existing_tables
    extra_tables = existing_tables - EXPECTED_TABLES
    
    # Analyze table row counts
    row_counts = audit_data.get('rowCounts', {})
    empty_tables = {table: count for table, count in row_counts.items() if count == 0}
    populated_tables = {table: count for table, count in row_counts.items() if count > 0}
    
    return {
        'existing_tables': existing_tables,
        'missing_tables': missing_tables,
        'extra_tables': extra_tables,
        'empty_tables': empty_tables,
        'populated_tables': populated_tables,
        'total_existing': len(existing_tables),
        'total_missing': len(missing_tables),
        'total_empty': len(empty_tables),
        'total_populated': len(populated_tables),
    }

def analyze_enums(audit_data: Dict) -> Dict:
    """Analyze PostgreSQL enums"""
    enums = audit_data.get('enums', [])
    enum_names = [e['enumName'] for e in enums]
    
    return {
        'total_enums': len(enums),
        'enum_list': enum_names,
        'enums': enums,
    }

def generate_markdown_report(analysis: Dict, enum_analysis: Dict, audit_data: Dict) -> str:
    """Generate a comprehensive markdown report"""
    
    report = []
    report.append("# 📊 AUDIT COMPLET BAZĂ DE DATE - GeniusERP")
    report.append(f"\n**Data Audit:** {audit_data['auditDate']}")
    report.append(f"\n**Generat pentru:** Recuperare după formatare HDD\n")
    
    # Executive Summary
    report.append("## 📋 SUMAR EXECUTIV")
    report.append(f"\n- **Total Tabele în DB:** {analysis['total_existing']}")
    report.append(f"- **Total Tabele Așteptate:** {len(EXPECTED_TABLES)}")
    report.append(f"- **Tabele Lipsă:** {analysis['total_missing']}")
    report.append(f"- **Tabele Goale:** {analysis['total_empty']}")
    report.append(f"- **Tabele cu Date:** {analysis['total_populated']}")
    report.append(f"- **Total Enums:** {enum_analysis['total_enums']}")
    
    # Status General
    report.append("\n## ⚠️ STATUS GENERAL")
    if analysis['total_missing'] > 0:
        report.append(f"\n❌ **CRITIN:** {analysis['total_missing']} tabele lipsesc din baza de date!")
    else:
        report.append("\n✅ Toate tabelele așteptate există în baza de date")
    
    if analysis['total_empty'] == analysis['total_existing']:
        report.append(f"\n❌ **CRITIC:** TOATE tabelele sunt goale! Baza de date trebuie populată cu date inițiale.")
    elif analysis['total_empty'] > analysis['total_existing'] * 0.5:
        report.append(f"\n⚠️  **ATENȚIE:** {analysis['total_empty']} tabele ({analysis['total_empty']/analysis['total_existing']*100:.1f}%) sunt goale.")
    
    # Tabele Lipsă
    if analysis['missing_tables']:
        report.append("\n## 🚨 TABELE LIPSĂ")
        report.append("\nAceste tabele trebuie create urgent:\n")
        for table in sorted(analysis['missing_tables']):
            report.append(f"- `{table}`")
    
    # Tabele cu Date
    if analysis['populated_tables']:
        report.append("\n## ✅ TABELE CU DATE")
        report.append(f"\n**Total:** {analysis['total_populated']} tabele\n")
        # Sort by row count descending
        sorted_tables = sorted(analysis['populated_tables'].items(), key=lambda x: x[1], reverse=True)
        for table, count in sorted_tables[:20]:  # Top 20
            report.append(f"- `{table}`: **{count:,}** rânduri")
        if len(sorted_tables) > 20:
            report.append(f"\n... și încă {len(sorted_tables) - 20} tabele cu date")
    
    # Tabele Goale
    if analysis['empty_tables']:
        report.append("\n## ⚠️ TABELE GOALE")
        report.append(f"\n**Total:** {analysis['total_empty']} tabele goale\n")
        
        # Categorize empty tables
        critical_empty = []
        optional_empty = []
        
        for table in sorted(analysis['empty_tables'].keys()):
            if table in CRITICAL_TABLES_REQUIRING_DATA:
                critical_empty.append((table, CRITICAL_TABLES_REQUIRING_DATA[table]))
            else:
                optional_empty.append(table)
        
        if critical_empty:
            report.append("\n### 🔴 CRITICE (necesită date inițiale obligatorii):\n")
            for table, description in critical_empty:
                report.append(f"- `{table}`: {description}")
        
        if optional_empty:
            report.append("\n### 🟡 OPȚIONALE (pot fi goale inițial):\n")
            report.append("\n<details>")
            report.append("<summary>Click pentru a vedea lista completă</summary>\n")
            for table in optional_empty[:50]:
                report.append(f"- `{table}`")
            if len(optional_empty) > 50:
                report.append(f"\n... și încă {len(optional_empty) - 50} tabele")
            report.append("\n</details>")
    
    # Enums
    report.append(f"\n## 🔢 ENUMS PostgreSQL ({enum_analysis['total_enums']} Total)")
    report.append("\n<details>")
    report.append("<summary>Click pentru a vedea lista completă</summary>\n")
    for enum in enum_analysis['enums'][:30]:
        values = ', '.join(enum['enumValues'][:5])
        if len(enum['enumValues']) > 5:
            values += f"... (+{len(enum['enumValues']) - 5} values)"
        report.append(f"\n- **{enum['enumName']}**: {values}")
    if len(enum_analysis['enums']) > 30:
        report.append(f"\n... și încă {len(enum_analysis['enums']) - 30} enums")
    report.append("\n</details>")
    
    # Recommendations
    report.append("\n## 🎯 RECOMANDĂRI ACȚIUNI")
    report.append("\n### 1. Prioritate CRITICĂ - Date Inițiale")
    report.append("\nAceste date TREBUIE create înainte ca aplicația să poată funcționa:\n")
    report.append("```sql")
    report.append("-- 1. Plan de conturi (Clasa 1-9)")
    report.append("INSERT INTO account_classes (code, name, description, default_account_function) VALUES")
    report.append("  ('1', 'Conturi de capitaluri', 'Capital, rezerve, rezultat reportat', 'P'),")
    report.append("  ('2', 'Conturi de imobilizări', 'Imobilizări necorporale, corporale, financiare', 'A'),")
    report.append("  ('3', 'Conturi de stocuri și producție', 'Materii prime, produse finite', 'A'),")
    report.append("  ('4', 'Conturi de terți', 'Furnizori, clienți, personal, stat', 'B'),")
    report.append("  ('5', 'Conturi de trezorerie', 'Bănci, case, acreditive', 'A'),")
    report.append("  ('6', 'Conturi de cheltuieli', 'Cheltuieli de exploatare', 'A'),")
    report.append("  ('7', 'Conturi de venituri', 'Venituri din exploatare', 'P'),")
    report.append("  ('8', 'Conturi speciale', 'Angajamente, conturi în afara bilanțului', 'B');")
    report.append("")
    report.append("-- 2. Unități de măsură")
    report.append("INSERT INTO inventory_units (name, abbreviation) VALUES")
    report.append("  ('Bucată', 'buc'),")
    report.append("  ('Kilogram', 'kg'),")
    report.append("  ('Litru', 'l'),")
    report.append("  ('Metru', 'm'),")
    report.append("  ('Metru pătrat', 'mp'),")
    report.append("  ('Metru cub', 'mc'),")
    report.append("  ('Pachet', 'pach'),")
    report.append("  ('Set', 'set'),")
    report.append("  ('Cutie', 'cutie'),")
    report.append("  ('Oră', 'h');")
    report.append("")
    report.append("-- 3. Permisiuni de bază")
    report.append("INSERT INTO permissions (name, description, resource, action) VALUES")
    report.append("  ('users.read', 'Vizualizare utilizatori', 'users', 'read'),")
    report.append("  ('users.create', 'Creare utilizatori', 'users', 'create'),")
    report.append("  ('users.update', 'Modificare utilizatori', 'users', 'update'),")
    report.append("  ('users.delete', 'Ștergere utilizatori', 'users', 'delete'),")
    report.append("  ('invoices.read', 'Vizualizare facturi', 'invoices', 'read'),")
    report.append("  ('invoices.create', 'Creare facturi', 'invoices', 'create'),")
    report.append("  ('invoices.update', 'Modificare facturi', 'invoices', 'update'),")
    report.append("  ('invoices.delete', 'Ștergere facturi', 'invoices', 'delete');")
    report.append("```")
    
    report.append("\n### 2. Prioritate MEDIE - Configurări Sistem")
    report.append("\n- Creare companie inițială în tabela `companies`")
    report.append("- Creare utilizator administrator în tabela `users`")
    report.append("- Creare rol de administrator în tabela `roles`")
    report.append("- Asociere permisiuni la rolul de administrator")
    report.append("- Creare gestiuni (depozite) în tabela `warehouses`")
    report.append("- Configurare serii facturi în tabela `invoice_numbering_settings`")
    report.append("- Configurare case în tabela `cash_registers`")
    report.append("- Configurare conturi bancare în tabela `bank_accounts`")
    
    report.append("\n### 3. Prioritate JOASĂ - Date Opționale")
    report.append("\n- Categorii inventar (`inventory_categories`)")
    report.append("- Template-uri email (`crm_email_templates`)")
    report.append("- Pipeline-uri CRM (`crm_pipelines`, `crm_stages`)")
    report.append("- Template-uri marketing (`marketing_campaign_templates`)")
    
    report.append("\n## 📝 SCRIPTURI DE REMEDIERE")
    report.append("\nVezi fișierul `db-recovery-scripts.sql` generat automat.")
    
    report.append("\n## 🔍 VERIFICĂRI SUPLIMENTARE")
    report.append("\nPentru a verifica detaliile fiecărei tabele, rulează:")
    report.append("```bash")
    report.append("psql -h localhost -p 5433 -U postgres -d geniuserp -c \"\\d+ nume_tabela\"")
    report.append("```")
    
    report.append("\n## 📊 STATISTICI DETALIATE")
    report.append(f"\n- Total coloane în DB: {sum(len(t['columns']) for t in audit_data['tables'])}")
    report.append(f"- Total indexuri: {sum(len(t['indexes']) for t in audit_data['tables'])}")
    report.append(f"- Total constrângeri: {sum(len(t['constraints']) for t in audit_data['tables'])}")
    
    report.append("\n---")
    report.append("\n*Acest raport a fost generat automat pentru a ajuta la recuperarea bazei de date după formatarea HDD-ului.*")
    
    return '\n'.join(report)

def generate_recovery_sql(analysis: Dict) -> str:
    """Generate SQL script for database recovery"""
    
    sql = []
    sql.append("-- Database Recovery Script")
    sql.append("-- Generated for GeniusERP after HDD format")
    sql.append(f"-- Date: {audit_data['auditDate']}")
    sql.append("")
    sql.append("-- ====================================")
    sql.append("-- STEP 1: CORE SYSTEM DATA")
    sql.append("-- ====================================")
    sql.append("")
    
    # Account Classes
    sql.append("-- Plan de conturi românesc (Clasa 1-9)")
    sql.append("INSERT INTO account_classes (code, name, description, default_account_function)")
    sql.append("VALUES")
    sql.append("  ('1', 'Conturi de capitaluri', 'Capital, rezerve, rezultat reportat', 'P'),")
    sql.append("  ('2', 'Conturi de imobilizări', 'Imobilizări necorporale, corporale, financiare', 'A'),")
    sql.append("  ('3', 'Conturi de stocuri și producție', 'Materii prime, produse finite', 'A'),")
    sql.append("  ('4', 'Conturi de terți', 'Furnizori, clienți, personal, stat', 'B'),")
    sql.append("  ('5', 'Conturi de trezorerie', 'Bănci, case, acreditive', 'A'),")
    sql.append("  ('6', 'Conturi de cheltuieli', 'Cheltuieli de exploatare', 'A'),")
    sql.append("  ('7', 'Conturi de venituri', 'Venituri din exploatare', 'P'),")
    sql.append("  ('8', 'Conturi speciale', 'Angajamente, conturi în afara bilanțului', 'B')")
    sql.append("ON CONFLICT (code) DO NOTHING;")
    sql.append("")
    
    # Inventory Units
    sql.append("-- Unități de măsură")
    sql.append("INSERT INTO inventory_units (name, abbreviation)")
    sql.append("VALUES")
    sql.append("  ('Bucată', 'buc'),")
    sql.append("  ('Kilogram', 'kg'),")
    sql.append("  ('Litru', 'l'),")
    sql.append("  ('Metru', 'm'),")
    sql.append("  ('Metru pătrat', 'mp'),")
    sql.append("  ('Metru cub', 'mc'),")
    sql.append("  ('Pachet', 'pach'),")
    sql.append("  ('Set', 'set'),")
    sql.append("  ('Cutie', 'cutie'),")
    sql.append("  ('Oră', 'h')")
    sql.append("ON CONFLICT (name) DO NOTHING;")
    sql.append("")
    
    # Permissions
    sql.append("-- Permisiuni de bază")
    sql.append("INSERT INTO permissions (name, description, resource, action)")
    sql.append("VALUES")
    permissions = [
        ("users.read", "Vizualizare utilizatori", "users", "read"),
        ("users.create", "Creare utilizatori", "users", "create"),
        ("users.update", "Modificare utilizatori", "users", "update"),
        ("users.delete", "Ștergere utilizatori", "users", "delete"),
        ("invoices.read", "Vizualizare facturi", "invoices", "read"),
        ("invoices.create", "Creare facturi", "invoices", "create"),
        ("invoices.update", "Modificare facturi", "invoices", "update"),
        ("invoices.delete", "Ștergere facturi", "invoices", "delete"),
        ("products.read", "Vizualizare produse", "products", "read"),
        ("products.create", "Creare produse", "products", "create"),
        ("products.update", "Modificare produse", "products", "update"),
        ("products.delete", "Ștergere produse", "products", "delete"),
        ("accounting.read", "Vizualizare contabilitate", "accounting", "read"),
        ("accounting.create", "Creare înregistrări contabile", "accounting", "create"),
        ("accounting.update", "Modificare înregistrări contabile", "accounting", "update"),
        ("accounting.delete", "Ștergere înregistrări contabile", "accounting", "delete"),
    ]
    for i, (name, desc, resource, action) in enumerate(permissions):
        comma = "," if i < len(permissions) - 1 else ""
        sql.append(f"  ('{name}', '{desc}', '{resource}', '{action}'){comma}")
    sql.append("ON CONFLICT (name) DO NOTHING;")
    sql.append("")
    
    sql.append("-- ====================================")
    sql.append("-- STEP 2: RECOMMENDED INITIAL DATA")
    sql.append("-- ====================================")
    sql.append("-- Uncomment and modify the following as needed:")
    sql.append("")
    sql.append("-- Create default company")
    sql.append("-- INSERT INTO companies (name, fiscal_code, registration_number, address, city, county, country)")
    sql.append("-- VALUES ('Compania Mea SRL', 'RO12345678', 'J40/1234/2024', 'Str. Exemplu nr. 1', 'București', 'București', 'Romania');")
    sql.append("")
    sql.append("-- Create admin user (password: admin123 - CHANGE IMMEDIATELY!)")
    sql.append("-- INSERT INTO users (username, email, password, first_name, last_name, role)")
    sql.append("-- VALUES ('admin', 'admin@example.com', '$2b$10$..hash..', 'Admin', 'System', 'admin');")
    sql.append("")
    sql.append("-- Create admin role")
    sql.append("-- INSERT INTO roles (company_id, name, description)")
    sql.append("-- VALUES ((SELECT id FROM companies LIMIT 1), 'Administrator', 'Administrator sistem cu toate permisiunile');")
    sql.append("")
    
    return '\n'.join(sql)

if __name__ == '__main__':
    # Load audit report
    audit_filepath = '/Users/alexneacsu/Projects/GeniusERP/GeniusERP_V_5/db-audit-report.json'
    audit_data = load_audit_report(audit_filepath)
    
    # Perform analysis
    print("🔍 Analyzing database structure...")
    table_analysis = analyze_tables(audit_data)
    enum_analysis = analyze_enums(audit_data)
    
    # Generate markdown report
    print("📝 Generating comprehensive report...")
    markdown_report = generate_markdown_report(table_analysis, enum_analysis, audit_data)
    
    # Save markdown report
    report_path = '/Users/alexneacsu/Projects/GeniusERP/GeniusERP_V_5/DB-AUDIT-COMPREHENSIVE.md'
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(markdown_report)
    print(f"✅ Comprehensive report saved to: {report_path}")
    
    # Generate recovery SQL
    print("🔧 Generating recovery SQL script...")
    recovery_sql = generate_recovery_sql(table_analysis)
    
    # Save recovery SQL
    sql_path = '/Users/alexneacsu/Projects/GeniusERP/GeniusERP_V_5/db-recovery-scripts.sql'
    with open(sql_path, 'w', encoding='utf-8') as f:
        f.write(recovery_sql)
    print(f"✅ Recovery SQL script saved to: {sql_path}")
    
    print("\n📊 === SUMMARY ===")
    print(f"Total Tables in DB: {table_analysis['total_existing']}")
    print(f"Tables with Data: {table_analysis['total_populated']}")
    print(f"Empty Tables: {table_analysis['total_empty']}")
    print(f"Missing Tables: {table_analysis['total_missing']}")
    print(f"Total Enums: {enum_analysis['total_enums']}")
    print("\n✅ Analysis complete! Check the generated files for details.")

