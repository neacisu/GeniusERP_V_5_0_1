#!/bin/bash
#
# URGENT: Găsește TOATE folosirile numelor vechi în apps/ și libs/
# Aplicația e BROKEN după standardizare - trebuie fix-uit imports!
#

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  🚨 URGENT: Căutare folosiri nume vechi (BREAKAGE!)    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

cd /var/www/GeniusERP

# Output file
OUTPUT_FILE="docs/audit/old-variable-usage-report.txt"
echo "RAPORT: Folosiri nume vechi în codebase" > "$OUTPUT_FILE"
echo "Data: $(date)" >> "$OUTPUT_FILE"
echo "========================================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Funcție helper
find_usage() {
    local old_name=$1
    local new_name=$2
    local count=0
    
    # Caută în apps/ și libs/ (exclude node_modules, dist, .next)
    count=$(grep -r "\b$old_name\b" apps/ libs/ \
        --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
        --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.next \
        --exclude-dir=build 2>/dev/null | wc -l)
    
    if [ $count -gt 0 ]; then
        echo "❌ $old_name → $new_name: $count folosiri"
        echo "$old_name → $new_name: $count locations" >> "$OUTPUT_FILE"
        
        # Listează primele 5 fișiere
        grep -r "\b$old_name\b" apps/ libs/ \
            --include="*.ts" --include="*.tsx" \
            --exclude-dir=node_modules --exclude-dir=dist \
            -l 2>/dev/null | head -5 >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
    fi
    
    return $count
}

total_usages=0

echo "🔍 Căutare CRM imports (16 nume)..."
find_usage "activities" "crm_activities" && ((total_usages+=$?))
find_usage "customers" "crm_customers" && ((total_usages+=$?))
find_usage "contacts" "crm_contacts" && ((total_usages+=$?))
find_usage "pipelines" "crm_pipelines" && ((total_usages+=$?))
find_usage "pipelineStages" "crm_stages" && ((total_usages+=$?))
find_usage "deals" "crm_deals" && ((total_usages+=$?))
find_usage "dealStageHistory" "crm_stage_history" && ((total_usages+=$?))
find_usage "customerTags" "crm_customer_tags" && ((total_usages+=$?))
find_usage "dealTags" "crm_deal_tags" && ((total_usages+=$?))
find_usage "segments" "crm_segments" && ((total_usages+=$?))
find_usage "emailTemplates" "crm_email_templates" && ((total_usages+=$?))

echo ""
echo "🔍 Căutare HR imports (11 nume)..."
find_usage "employees" "hr_employees" && ((total_usages+=$?))
find_usage "employmentContracts" "hr_employment_contracts" && ((total_usages+=$?))
find_usage "payrollLogs" "hr_payroll_logs" && ((total_usages+=$?))
find_usage "absences" "hr_absences" && ((total_usages+=$?))
find_usage "departments" "hr_departments" && ((total_usages+=$?))

echo ""
echo "🔍 Căutare Accounting imports (8 nume)..."
find_usage "accountingLedgerEntries" "accounting_ledger_entries" && ((total_usages+=$?))
find_usage "accountingLedgerLines" "accounting_ledger_lines" && ((total_usages+=$?))
find_usage "ledgerEntries" "ledger_entries" && ((total_usages+=$?))
find_usage "ledgerLines" "ledger_lines" && ((total_usages+=$?))

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  📊 REZULTAT CĂUTARE                                    ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Total folosiri găsite: $total_usages"
echo "Raport complet: $OUTPUT_FILE"
echo ""
echo "⚠️  ACȚIUNE REQUIRED: Update toate import-urile!"
echo ""

