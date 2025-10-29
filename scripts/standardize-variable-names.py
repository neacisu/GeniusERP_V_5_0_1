#!/usr/bin/env python3
"""
Script pentru standardizarea automată a numelor de variabile în schema Drizzle
Redenumește TOATE variabilele pentru a match numele tabelelor din DB

Total: 122 redenumiri
"""

import re
import json
from pathlib import Path

# Mapare completă bazată pe audit
RENAMINGS = {
    # CRM (16 redenumiri)
    'anafCompanyData': 'anaf_company_data',
    'customers': 'crm_customers',
    'contacts': 'crm_contacts',
    'pipelines': 'crm_pipelines',
    'pipelineStages': 'crm_stages',
    'deals': 'crm_deals',
    'dealStageHistory': 'crm_stage_history',
    'activities': 'crm_activities',
    'tags': 'crm_tags',
    'customerTags': 'crm_customer_tags',
    'dealTags': 'crm_deal_tags',
    'revenueForecasts': 'crm_revenue_forecasts',
    'salesQuotas': 'crm_sales_quotas',
    'segments': 'crm_segments',
    'scoringRules': 'crm_scoring_rules',
    'emailTemplates': 'crm_email_templates',
    
    # HR (11 redenumiri)
    'employees': 'hr_employees',
    'employmentContracts': 'hr_employment_contracts',
    'payrollLogs': 'hr_payroll_logs',
    'absences': 'hr_absences',
    'workSchedules': 'hr_work_schedules',
    'commissionStructures': 'hr_commission_structures',
    'employeeCommissions': 'hr_employee_commissions',
    'departments': 'hr_departments',
    'jobPositions': 'hr_job_positions',
    'anafExportLogs': 'hr_anaf_export_logs',
    'revisalExportLogs': 'hr_revisal_export_logs',
    
    # Accounting (8 redenumiri)
    'accountingLedgerEntries': 'accounting_ledger_entries',
    'accountingLedgerLines': 'accounting_ledger_lines',
    'ledgerEntries': 'ledger_entries',
    'ledgerLines': 'ledger_lines',
    'journalTypes': 'journal_types',
    'accountBalances': 'account_balances',
    'fiscalPeriods': 'fiscal_periods',
    'chartOfAccounts': 'chart_of_accounts',
    
    # Analytics (16 redenumiri)
    'analyticsDashboards': 'analytics_dashboards',
    'analyticsReports': 'analytics_reports',
    'reportExecutionHistory': 'report_execution_history',
    'dashboardViews': 'dashboard_views',
    'analyticsMetrics': 'analytics_metrics',
    'metricsHistory': 'metrics_history',
    'analyticsAlerts': 'analytics_alerts',
    'alertHistory': 'alert_history',
    'biCostCenters': 'bi_cost_centers',
    'biBusinessUnits': 'bi_business_units',
    'biCostAllocations': 'bi_cost_allocations',
    'costAllocationHistory': 'cost_allocation_history',
    'predictiveModels': 'predictive_models',
    'modelTrainingHistory': 'model_training_history',
    'predictiveScenarios': 'predictive_scenarios',
    'scenarioResults': 'scenario_results',
    
    # E-commerce (5 redenumiri)
    'ecommerceOrders': 'ecommerce_orders',
    'ecommerceTransactions': 'ecommerce_transactions',
    'carts': 'ecommerce_carts',
    'cartItems': 'ecommerce_cart_items',
    'ecommerceIntegrations': 'ecommerce_integrations',
    
    # Collaboration (9 redenumiri)
    'collaborationTasks': 'collaboration_tasks',
    'collaborationNotes': 'collaboration_notes',
    'collaborationThreads': 'collaboration_threads',
    'collaborationMessages': 'collaboration_messages',
    'taskAssignmentHistory': 'collaboration_task_assignments',
    'taskStatusHistory': 'collaboration_task_status_history',
    'taskWatchers': 'collaboration_task_watchers',
    'collaborationActivities': 'collaboration_activities',
    'collaborationNotifications': 'collaboration_notifications',
    
    # Communications (6 redenumiri)
    'messageThreads': 'communications_threads',
    'messages': 'communications_messages',
    # 'contacts': 'communications_contacts',  # Skip - conflict with CRM
    'channelConfigurations': 'communications_channel_configs',
    'messageAccess': 'communications_message_access',
    'threadAccess': 'communications_thread_access',
    
    # BPM (8 redenumiri)
    'bpmProcesses': 'bpm_processes',
    'bpmTriggers': 'bpm_triggers',
    'bpmProcessInstances': 'bpm_process_instances',
    'bpmStepTemplates': 'bpm_step_templates',
    'bpmStepExecutions': 'bpm_step_executions',
    'bpmApprovals': 'bpm_approvals',
    'bpmApiConnections': 'bpm_api_connections',
    'bpmScheduledJobs': 'bpm_scheduled_jobs',
    
    # Predictive (10 redenumiri)
    'analyticsPredictiveModels': 'analytics_predictive_models',
    'analyticsPredictionResults': 'analytics_prediction_results',
    'analyticsTimeSeriesData': 'analytics_time_series_data',
    'analyticsAnomalyRules': 'analytics_anomaly_rules',
    'analyticsAnomalies': 'analytics_anomalies',
    'analyticsSeasonalPatterns': 'analytics_seasonal_patterns',
    'analyticsScenarios': 'analytics_scenarios',
    'analyticsScenarioResults': 'analytics_scenario_results',
    'analyticsInventoryOptimization': 'analytics_inventory_optimization',
    'analyticsPurchasingRecommendations': 'analytics_purchasing_recommendations',
    
    # Restul (26 redenumiri)
    'inventoryWarehouses': 'inventory_warehouses',
    'inventoryAssessments': 'inventory_assessments',
    'inventoryAssessmentItems': 'inventory_assessment_items',
    'inventoryValuations': 'inventory_valuations',
    'inventoryBatches': 'inventory_batches',
    'campaigns': 'marketing_campaigns',
    'campaignMessages': 'marketing_campaign_messages',
    'campaignSegments': 'marketing_campaign_segments',
    'campaignTemplates': 'marketing_campaign_templates',
    'financialDataErrors': 'financial_data_errors',
    'financialData': 'financial_data',
    'financialDataJobs': 'financial_data_jobs',
    'hrDocuments': 'hr_documents',
    'hrEmployeeDrafts': 'hr_employee_drafts',
    'corMajorGroups': 'cor_major_groups',
    'corSubmajorGroups': 'cor_submajor_groups',
    'corMinorGroups': 'cor_minor_groups',
    'corSubminorGroups': 'cor_subminor_groups',
    'corOccupations': 'cor_occupations',
    'bankAccounts': 'bank_accounts',
    'bankTransactions': 'bank_transactions',
    'cashRegisters': 'cash_registers',
    'cashTransactions': 'cash_transactions',
    'accountingSettings': 'accounting_settings',
    'vatSettings': 'vat_settings',
    'accountRelationships': 'account_relationships',
    'openingBalances': 'opening_balances',
    'accountMappings': 'account_mappings',
    'setupSteps': 'setup_steps',
    'healthChecks': 'health_checks',
    'apiKeys': 'api_keys',
    'systemConfigs': 'system_configs',
    'adminActions': 'admin_actions',
    'licenses': 'licenses',
    'companyLicenses': 'company_licenses',
    'configurations': 'configurations',
    'auditLogs': 'audit_logs',
    'documentCounters': 'document_counters',
    'invoiceItems': 'invoice_items',
    'invoiceNumberingSettings': 'invoice_numbering_settings',
    'integrations': 'integrations',
    'hrSettings': 'hr_settings',
    'warehouses': 'warehouses',
}

def standardize_file(file_path, mappings):
    """Standardizează numele de variabile într-un fișier schema"""
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    original_content = content
    changes_made = []
    
    for old_name, new_name in mappings.items():
        # Pattern: export const OLD_NAME = pgTable
        pattern1 = f'export const {old_name} = pgTable'
        replacement1 = f'export const {new_name} = pgTable'
        
        if pattern1 in content:
            content = content.replace(pattern1, replacement1)
            changes_made.append(f'{old_name} → {new_name} (declaration)')
        
        # Pattern: export const OLD_NAME: any = pgTable
        pattern2 = f'export const {old_name}: any = pgTable'
        replacement2 = f'export const {new_name} = pgTable'
        
        if pattern2 in content:
            content = content.replace(pattern2, replacement2)
            changes_made.append(f'{old_name} → {new_name} (declaration with any)')
    
    if content != original_content:
        with open(file_path, 'w') as f:
            f.write(content)
        return True, changes_made
    
    return False, []

def main():
    print("=== STANDARDIZARE NUME VARIABILE DRIZZLE ===\n")
    
    schema_dir = Path('/var/www/GeniusERP/libs/shared/src/schema')
    
    # Procesează fiecare fișier cu mapările relevante
    files_to_process = [
        ('crm.schema.ts', [k for k in RENAMINGS if RENAMINGS[k].startswith('crm_') or RENAMINGS[k] == 'anaf_company_data']),
        ('hr.schema.ts', [k for k in RENAMINGS if RENAMINGS[k].startswith('hr_')]),
        ('accounting.schema.ts', ['accountingLedgerEntries', 'accountingLedgerLines', 'ledgerEntries', 'ledgerLines', 'journalTypes', 'accountBalances', 'fiscalPeriods', 'chartOfAccounts']),
        ('analytics.schema.ts', ['analyticsDashboards', 'analyticsReports', 'reportExecutionHistory', 'dashboardViews', 'analyticsMetrics', 'metricsHistory', 'analyticsAlerts', 'alertHistory', 'biCostCenters', 'biBusinessUnits', 'biCostAllocations', 'costAllocationHistory', 'predictiveModels', 'modelTrainingHistory', 'predictiveScenarios', 'scenarioResults']),
        ('ecommerce.schema.ts', ['ecommerceOrders', 'ecommerceTransactions', 'carts', 'cartItems', 'ecommerceIntegrations']),
        ('collaboration.schema.ts', ['collaborationTasks', 'collaborationNotes', 'collaborationThreads', 'collaborationMessages', 'taskAssignmentHistory', 'taskStatusHistory', 'taskWatchers', 'collaborationActivities', 'collaborationNotifications']),
        ('communications.schema.ts', ['messageThreads', 'messages', 'channelConfigurations', 'messageAccess', 'threadAccess']),
        ('bpm.schema.ts', ['bpmProcesses', 'bpmTriggers', 'bpmProcessInstances', 'bpmStepTemplates', 'bpmStepExecutions', 'bpmApprovals', 'bpmApiConnections', 'bpmScheduledJobs']),
        ('predictive.schema.ts', ['analyticsPredictiveModels', 'analyticsPredictionResults', 'analyticsTimeSeriesData', 'analyticsAnomalyRules', 'analyticsAnomalies', 'analyticsSeasonalPatterns', 'analyticsScenarios', 'analyticsScenarioResults', 'analyticsInventoryOptimization', 'analyticsPurchasingRecommendations']),
        ('inventory-assessment.ts', ['inventoryWarehouses', 'inventoryAssessments', 'inventoryAssessmentItems', 'inventoryValuations', 'inventoryBatches']),
        ('marketing.schema.ts', ['campaigns', 'campaignMessages', 'campaignSegments', 'campaignTemplates']),
        ('financial-data.schema.ts', ['financialDataErrors', 'financialData', 'financialDataJobs']),
        ('documents.schema.ts', ['hrDocuments', 'hrEmployeeDrafts']),
        ('cor.schema.ts', ['corMajorGroups', 'corSubmajorGroups', 'corMinorGroups', 'corSubminorGroups', 'corOccupations']),
        ('bank-journal.schema.ts', ['bankAccounts', 'bankTransactions']),
        ('cash-register.schema.ts', ['cashRegisters', 'cashTransactions']),
        ('accounting-settings.schema.ts', ['accountingSettings', 'vatSettings', 'accountRelationships', 'openingBalances']),
        ('account-mappings.schema.ts', ['accountMappings']),
        ('admin.schema.ts', ['setupSteps', 'healthChecks', 'apiKeys', 'systemConfigs', 'adminActions', 'licenses', 'companyLicenses', 'configurations']),
        ('audit.schema.ts', ['auditLogs']),
        ('document-counters.schema.ts', ['documentCounters']),
        ('invoice.schema.ts', ['invoiceItems']),
        ('invoice-numbering.schema.ts', ['invoiceNumberingSettings']),
        ('integrations.schema.ts', ['integrations']),
        ('settings.schema.ts', ['hrSettings']),
        ('warehouse.ts', ['warehouses']),
    ]
    
    total_changes = 0
    
    for filename, var_names in files_to_process:
        file_path = schema_dir / filename
        if not file_path.exists():
            print(f"⚠️  SKIP: {filename} (nu există)")
            continue
        
        # Construiește maparea pentru fișierul curent
        file_mappings = {k: RENAMINGS[k] for k in var_names if k in RENAMINGS}
        
        if not file_mappings:
            print(f"⏭️  {filename}: Nicio mapare")
            continue
        
        changed, changes = standardize_file(file_path, file_mappings)
        
        if changed:
            print(f"✅ {filename}: {len(changes)} redenumiri")
            for change in changes:
                print(f"   - {change}")
            total_changes += len(changes)
        else:
            print(f"⏭️  {filename}: Nicio schimbare")
    
    print(f"\n{'='*60}")
    print(f"TOTAL REDENUMIRI: {total_changes}")
    print(f"{'='*60}")
    
    return 0

if __name__ == "__main__":
    exit(main())

