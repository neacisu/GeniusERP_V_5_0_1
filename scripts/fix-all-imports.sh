#!/bin/bash
#
# 🚨 URGENT FIX: Înlocuiește TOATE folosirile numelor vechi cu nume noi
# Total estimate: ~2300+ locații
#

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  🚨 URGENT FIX: Update 2300+ import-uri              ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

cd /var/www/GeniusERP

# Funcție pentru replace sigur (doar în apps/ și libs/, exclude node_modules)
safe_replace() {
    local old=$1
    local new=$2
    local count=0
    
    # Find și replace în toate fișierele .ts/.tsx
    find apps/ libs/ -type f \( -name "*.ts" -o -name "*.tsx" \) \
        ! -path "*/node_modules/*" ! -path "*/dist/*" ! -path "*/.next/*" \
        -exec grep -l "\b$old\b" {} \; 2>/dev/null | while read file; do
        
        # Replace DOAR în contexte sigure (imports, from clauses, db.select)
        sed -i "s/\bfrom($old)\b/from($new)/g" "$file"
        sed -i "s/{ $old }/{ $new }/g" "$file"
        sed -i "s/{ $old,/{ $new,/g" "$file"
        sed -i "s/, $old }/, $new }/g" "$file"
        sed -i "s/, $old,/, $new,/g" "$file"
        sed -i "s/\.$old\./$.$new./g" "$file"
        sed -i "s/: $old\b/: $new/g" "$file"
        
        ((count++))
    done
    
    echo "  ✅ $old → $new ($count fișiere)"
}

echo "🔧 CRM (16 redenumiri)..."
safe_replace "activities" "crm_activities"
safe_replace "customers" "crm_customers"
safe_replace "contacts" "crm_contacts"
safe_replace "pipelines" "crm_pipelines"
safe_replace "pipelineStages" "crm_stages"
safe_replace "deals" "crm_deals"
safe_replace "dealStageHistory" "crm_stage_history"
safe_replace "customerTags" "crm_customer_tags"
safe_replace "dealTags" "crm_deal_tags"
safe_replace "segments" "crm_segments"
safe_replace "emailTemplates" "crm_email_templates"
safe_replace "revenueForecasts" "crm_revenue_forecasts"
safe_replace "salesQuotas" "crm_sales_quotas"
safe_replace "scoringRules" "crm_scoring_rules"
safe_replace "anafCompanyData" "anaf_company_data"

echo ""
echo "🔧 HR (11 redenumiri)..."
safe_replace "employmentContracts" "hr_employment_contracts"
safe_replace "payrollLogs" "hr_payroll_logs"
safe_replace "absences" "hr_absences"
safe_replace "workSchedules" "hr_work_schedules"
safe_replace "commissionStructures" "hr_commission_structures"
safe_replace "employeeCommissions" "hr_employee_commissions"
safe_replace "departments" "hr_departments"
safe_replace "jobPositions" "hr_job_positions"
safe_replace "anafExportLogs" "hr_anaf_export_logs"
safe_replace "revisalExportLogs" "hr_revisal_export_logs"

echo ""
echo "🔧 Accounting (8 redenumiri)..."
safe_replace "accountingLedgerEntries" "accounting_ledger_entries"
safe_replace "accountingLedgerLines" "accounting_ledger_lines"
safe_replace "ledgerEntries" "ledger_entries"
safe_replace "ledgerLines" "ledger_lines"
safe_replace "journalTypes" "journal_types"
safe_replace "accountBalances" "account_balances"
safe_replace "fiscalPeriods" "fiscal_periods"
safe_replace "chartOfAccounts" "chart_of_accounts"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✅ IMPORT FIX COMPLET!                                 ║"
echo "╚══════════════════════════════════════════════════════════╝"

