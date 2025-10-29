#!/usr/bin/env python3
"""
Script pentru audit coloane lipsă în tabelele Drizzle existente
Compară structura din DB cu fișierele schema Drizzle
"""

import json
import re
from pathlib import Path
from collections import defaultdict

# Încarcă coloanele din DB
def load_db_columns():
    columns_by_table = defaultdict(list)
    
    with open('/tmp/db_columns_full.txt', 'r') as f:
        for line in f:
            if not line.strip():
                continue
            
            parts = line.strip().split('|')
            if len(parts) >= 10:
                table_name = parts[0]
                columns_by_table[table_name].append({
                    'name': parts[1],
                    'position': int(parts[2]) if parts[2] else None,
                    'data_type': parts[3],
                    'is_nullable': parts[7] == 'YES',
                    'column_default': parts[8] if parts[8] else None,
                })
    
    return dict(columns_by_table)

# Extrage coloanele din fișierele Drizzle
def extract_drizzle_columns(file_path):
    """Extrage numele coloanelor din fișierul Drizzle"""
    columns = set()
    
    try:
        with open(file_path, 'r') as f:
            content = f.read()
            
        # Pattern pentru coloane: variableName: type("column_name")
        # Exemplu: firstName: varchar("first_name", ...)
        # Sau: id: uuid("id").primaryKey()
        
        # Pattern 1: camelCase: type("snake_case")
        pattern1 = r'(\w+):\s+\w+\("([^"]+)"'
        matches = re.findall(pattern1, content)
        for _, col_name in matches:
            columns.add(col_name)
            
    except Exception as e:
        print(f"Eroare la citire {file_path}: {e}")
    
    return columns

# Mapare fișier Drizzle → tabele
SCHEMA_FILE_TO_TABLES = {
    'core.schema.ts': ['users', 'roles', 'permissions', 'user_roles', 'role_permissions', 
                       'account_classes', 'account_groups', 'synthetic_accounts', 'analytic_accounts', 'accounts'],
    'inventory.schema.ts': ['inventory_categories', 'inventory_units', 'inventory_products', 
                            'inventory_stock', 'inventory_stock_movements'],
    'invoicing.schema.ts': ['invoices', 'invoice_details', 'invoice_payments'],
    'purchasing.schema.ts': ['purchase_orders', 'purchase_order_items', 'nir_documents', 'nir_items'],
    'transfer.schema.ts': ['transfer_documents', 'transfer_items', 'stock_reservations'],
    'settings-extended.schema.ts': ['settings_global', 'settings_feature_toggles', 
                                     'settings_ui_themes', 'settings_user_preferences'],
    'documents-extended.schema.ts': ['documents', 'document_versions', 'fx_rates'],
    'crm.schema.ts': ['anaf_company_data', 'crm_companies', 'crm_customers', 'crm_contacts',
                      'crm_pipelines', 'crm_stages', 'crm_deals', 'crm_stage_history',
                      'crm_activities', 'crm_tags', 'crm_customer_tags', 'crm_deal_tags',
                      'crm_revenue_forecasts', 'crm_sales_quotas', 'crm_segments',
                      'crm_scoring_rules', 'crm_email_templates', 'crm_custom_fields',
                      'crm_deal_products', 'crm_forecasts', 'crm_notes', 'crm_taggables', 'crm_tasks'],
    'hr.schema.ts': ['hr_employees', 'hr_employment_contracts', 'hr_payroll_logs', 'hr_absences',
                     'hr_work_schedules', 'hr_commission_structures', 'hr_employee_commissions',
                     'hr_departments', 'hr_job_positions', 'hr_anaf_export_logs', 'hr_revisal_export_logs',
                     'employees', 'employee_contracts', 'employee_documents',
                     'leave_requests', 'payroll_records', 'attendance_records'],
    'accounting.schema.ts': ['accounting_ledger_entries', 'accounting_ledger_lines',
                             'account_balances', 'fiscal_periods', 'chart_of_accounts',
                             'accounting_account_balances', 'accounting_journal_types',
                             'journal_entries', 'journal_lines', 'journal_types', 'ledger_entries', 'ledger_lines', 'stocks'],
    'analytics.schema.ts': ['analytics_dashboards', 'analytics_reports', 'report_execution_history',
                            'dashboard_views', 'analytics_metrics', 'metrics_history',
                            'analytics_alerts', 'alert_history', 'bi_cost_centers',
                            'bi_business_units', 'bi_cost_allocations', 'cost_allocation_history',
                            'predictive_models', 'model_training_history', 'predictive_scenarios',
                            'scenario_results', 'analytics_inventory_optimizations',
                            'analytics_model_executions', 'analytics_scenario_executions'],
    'ecommerce.schema.ts': ['ecommerce_orders', 'ecommerce_transactions', 'ecommerce_carts',
                            'ecommerce_cart_items', 'ecommerce_integrations', 'ecommerce_order_items',
                            'ecommerce_shopify_collections', 'ecommerce_shopify_products', 'ecommerce_shopify_variants'],
    # ... restul vor fi adăugate
}

def main():
    print("=== AUDIT COLOANE LIPSĂ ÎN SCHEMA DRIZZLE ===\n")
    
    db_columns = load_db_columns()
    schema_dir = Path('/var/www/GeniusERP/libs/shared/src/schema')
    
    report = {
        'total_tables': 0,
        'tables_complete': 0,
        'tables_incomplete': 0,
        'total_missing_columns': 0,
        'details': {}
    }
    
    for schema_file, tables in SCHEMA_FILE_TO_TABLES.items():
        file_path = schema_dir / schema_file
        
        if not file_path.exists():
            print(f"⚠️  SKIP: {schema_file} (nu există)")
            continue
        
        drizzle_columns = extract_drizzle_columns(file_path)
        
        for table in tables:
            report['total_tables'] += 1
            
            db_cols = {col['name'] for col in db_columns.get(table, [])}
            missing = db_cols - drizzle_columns
            
            if missing:
                report['tables_incomplete'] += 1
                report['total_missing_columns'] += len(missing)
                report['details'][table] = {
                    'file': schema_file,
                    'db_columns': len(db_cols),
                    'drizzle_columns': len(drizzle_columns),
                    'missing_count': len(missing),
                    'missing_columns': sorted(list(missing)),
                    'missing_with_types': [
                        col for col in db_columns.get(table, [])
                        if col['name'] in missing
                    ]
                }
                print(f"❌ {table}: {len(missing)} coloane lipsă (din {len(db_cols)} total)")
            else:
                report['tables_complete'] += 1
                print(f"✅ {table}: Complete ({len(db_cols)} coloane)")
    
    # Salvează raportul
    with open('/var/www/GeniusERP/docs/audit/missing-columns-detailed.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\n{'='*60}")
    print(f"REZUMAT AUDIT COLOANE:")
    print(f"  Total tabele: {report['total_tables']}")
    print(f"  Tabele complete: {report['tables_complete']}")
    print(f"  Tabele incomplete: {report['tables_incomplete']}")
    print(f"  Total coloane lipsă: {report['total_missing_columns']}")
    print(f"{'='*60}")
    print(f"\n✅ Raport salvat: docs/audit/missing-columns-detailed.json")
    
    return 0

if __name__ == "__main__":
    exit(main())

