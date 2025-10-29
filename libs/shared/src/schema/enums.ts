/**
import { numeric, json } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
 * Centralized Enum Definitions for GeniusERP
 * 
 * All PostgreSQL enum types defined in one place for consistency.
 * Total: 51 enum types from database
 */

import { pgEnum } from 'drizzle-orm/pg-core';

// ============================================================================
// ACCOUNTING & FINANCE ENUMS
// ============================================================================

/**
 * Account Mapping Type (29 values)
 * Used for mapping various business operations to chart of accounts
 */
export const account_mapping_type = pgEnum('account_mapping_type', [
  'CASH_RON',
  'CASH_CURRENCY',
  'PETTY_CASH',
  'BANK_PRIMARY',
  'BANK_CURRENCY',
  'CUSTOMERS',
  'SUPPLIERS',
  'EMPLOYEE_ADVANCES',
  'EMPLOYEE_PAYROLL',
  'VAT_COLLECTED',
  'VAT_DEDUCTIBLE',
  'UTILITIES',
  'SUPPLIES',
  'TRANSPORT',
  'OTHER_SERVICES',
  'BANK_FEES',
  'INTEREST_EXPENSE',
  'MERCHANDISE_SALES',
  'SERVICE_REVENUE',
  'INTEREST_INCOME',
  'INTERNAL_TRANSFERS',
  'CASH_SHORTAGES',
  'CASH_OVERAGES',
  'EXCHANGE_DIFF_INCOME',
  'EXCHANGE_DIFF_EXPENSE',
  'SHORT_TERM_LOANS',
  'LONG_TERM_LOANS',
  'VAT_PAYABLE',
  'VAT_RECOVERABLE'
]);

/**
 * VAT Category (8 values)
 * Romanian VAT categories per ANAF requirements
 */
export const vat_category = pgEnum('vat_category', [
  'STANDARD_19',
  'REDUCED_9',
  'REDUCED_5',
  'EXEMPT_WITH_CREDIT',
  'EXEMPT_NO_CREDIT',
  'REVERSE_CHARGE',
  'NOT_SUBJECT',
  'ZERO_RATE'
]);

// ============================================================================
// BANKING & CASH ENUMS
// ============================================================================

/**
 * Bank Transaction Type (9 values)
 */
export const bank_transaction_type = pgEnum('bank_transaction_type', [
  'incoming_payment',
  'outgoing_payment',
  'bank_fee',
  'bank_interest',
  'transfer_between_accounts',
  'loan_disbursement',
  'loan_repayment',
  'foreign_exchange',
  'other'
]);

/**
 * Bank Payment Method (7 values)
 */
export const bank_payment_method = pgEnum('bank_payment_method', [
  'bank_transfer',
  'direct_debit',
  'card_payment',
  'standing_order',
  'online_banking',
  'mobile_banking',
  'other'
]);

/**
 * Cash Register Status (3 values)
 */
export const cash_register_status = pgEnum('cash_register_status', [
  'active',
  'closed',
  'suspended'
]);

/**
 * Cash Transaction Type (8 values)
 */
export const cash_transaction_type = pgEnum('cash_transaction_type', [
  'cash_receipt',
  'cash_payment',
  'petty_cash_advance',
  'petty_cash_settlement',
  'cash_count_adjustment',
  'cash_transfer',
  'bank_deposit',
  'bank_withdrawal'
]);

/**
 * Cash Transaction Purpose (10 values)
 */
export const cash_transaction_purpose = pgEnum('cash_transaction_purpose', [
  'customer_payment',
  'supplier_payment',
  'salary_payment',
  'expense_payment',
  'advance_to_employee',
  'advance_settlement',
  'bank_deposit',
  'cash_withdrawal',
  'refund',
  'other'
]);

// ============================================================================
// INVOICING & PAYMENT ENUMS
// ============================================================================

/**
 * Invoice Status (5 values)
 */
export const invoice_status = pgEnum('invoice_status', [
  'draft',
  'issued',
  'sent',
  'canceled',
  'paid'
]);

/**
 * Payment Method (8 values)
 */
export const payment_method = pgEnum('payment_method', [
  'credit_card',
  'debit_card',
  'bank_transfer',
  'cash',
  'revolut',
  'stripe',
  'paypal',
  'other'
]);

/**
 * Payment Status (5 values)
 */
export const payment_status = pgEnum('payment_status', [
  'pending',
  'paid',
  'partially_paid',
  'refunded',
  'partially_refunded',
  'failed'
]);

/**
 * Transaction Type (2 values)
 */
export const transaction_type = pgEnum('transaction_type', [
  'payment',
  'refund'
]);

// ============================================================================
// E-COMMERCE ENUMS
// ============================================================================

/**
 * Order Status (9 values)
 */
export const order_status = pgEnum('order_status', [
  'pending',
  'processing',
  'completed',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
  'on_hold',
  'payment_failed'
]);

/**
 * Order Source (5 values)
 */
export const order_source = pgEnum('order_source', [
  'manual',
  'website',
  'pos',
  'shopify',
  'mobile_app'
]);

/**
 * Platform Type (7 values)
 */
export const platform_type = pgEnum('platform_type', [
  'website',
  'pos',
  'shopify',
  'prestashop',
  'woocommerce',
  'marketplace',
  'other'
]);

/**
 * Cart Status (4 values)
 */
export const cart_status = pgEnum('cart_status', [
  'active',
  'completed',
  'abandoned',
  'expired'
]);

// ============================================================================
// INVENTORY & WAREHOUSE ENUMS
// ============================================================================

/**
 * Warehouse Type / Gestiune Type (4 values)
 */
export const warehouse_type = pgEnum('warehouse_type', [
  'depozit',
  'magazin',
  'custodie',
  'transfer'
]);

/**
 * Gestiune Type (4 values) - Alias for warehouse_type
 * Kept for backward compatibility
 */
export const gestiune_type = pgEnum('gestiune_type', [
  'depozit',
  'magazin',
  'custodie',
  'transfer'
]);

/**
 * Inventory Assessment Status (6 values)
 */
export const inventory_assessment_status = pgEnum('inventory_assessment_status', [
  'draft',
  'in_progress',
  'pending_approval',
  'approved',
  'finalized',
  'cancelled'
]);

/**
 * Inventory Assessment Type (4 values)
 */
export const inventory_assessment_type = pgEnum('inventory_assessment_type', [
  'annual',
  'monthly',
  'unscheduled',
  'special'
]);

/**
 * Inventory Count Result (3 values)
 */
export const inventory_count_result = pgEnum('inventory_count_result', [
  'match',
  'surplus',
  'deficit'
]);

/**
 * Inventory Valuation Method (4 values)
 */
export const inventory_valuation_method = pgEnum('inventory_valuation_method', [
  'FIFO',
  'LIFO',
  'weighted_average',
  'standard_cost'
]);

// ============================================================================
// PURCHASING ENUMS
// ============================================================================

/**
 * Purchase Order Status (6 values)
 */
export const po_status = pgEnum('po_status', [
  'draft',
  'pending',
  'approved',
  'received',
  'partially_received',
  'canceled'
]);

/**
 * NIR (Notă Intrare Recepție) Status (4 values)
 */
export const nir_status = pgEnum('nir_status', [
  'draft',
  'approved',
  'canceled',
  'completed'
]);

/**
 * Transfer Status (5 values)
 */
export const transfer_status = pgEnum('transfer_status', [
  'draft',
  'in_transit',
  'partially_received',
  'received',
  'canceled'
]);

// ============================================================================
// CRM ENUMS
// ============================================================================

// Note: Most CRM enums are TypeScript enums, not pgEnum
// Keeping this section for future pgEnum additions

// ============================================================================
// ANALYTICS & REPORTING ENUMS
// ============================================================================

/**
 * Alert Severity (5 values)
 */
export const alert_severity = pgEnum('alert_severity', [
  'critical',
  'high',
  'medium',
  'low',
  'info'
]);

/**
 * Alert Status (4 values)
 */
export const alert_status = pgEnum('alert_status', [
  'active',
  'acknowledged',
  'resolved',
  'dismissed'
]);

/**
 * Report Type (6 values)
 */
export const report_type = pgEnum('report_type', [
  'financial',
  'inventory',
  'sales',
  'marketing',
  'operations',
  'custom'
]);

/**
 * Predictive Model Type (6 values)
 */
export const predictive_model_type = pgEnum('predictive_model_type', [
  'inventory',
  'sales',
  'pricing',
  'marketing',
  'financial',
  'custom'
]);

/**
 * Predictive Scenario Type (6 values)
 */
export const predictive_scenario_type = pgEnum('predictive_scenario_type', [
  'inventory_planning',
  'sales_forecasting',
  'pricing_optimization',
  'budget_planning',
  'marketing_campaign',
  'custom'
]);

// ============================================================================
// COMMUNICATIONS ENUMS
// ============================================================================

/**
 * Communication Channel (10 values)
 */
export const communication_channel = pgEnum('communication_channel', [
  'email',
  'whatsapp',
  'messenger',
  'comment',
  'call',
  'shopify-inbox',
  'sms',
  'contact-form',
  'chat',
  'other'
]);

/**
 * Message Direction (3 values)
 */
export const message_direction = pgEnum('message_direction', [
  'inbound',
  'outbound',
  'internal'
]);

/**
 * Message Status (9 values)
 */
export const message_status = pgEnum('message_status', [
  'new',
  'read',
  'responded',
  'archived',
  'spam',
  'deleted',
  'pending',
  'scheduled',
  'draft'
]);

/**
 * Sentiment Type (4 values)
 */
export const sentiment_type = pgEnum('sentiment_type', [
  'positive',
  'negative',
  'neutral',
  'mixed'
]);

// ============================================================================
// MARKETING ENUMS
// ============================================================================

/**
 * Campaign Status (6 values)
 */
export const campaign_status = pgEnum('campaign_status', [
  'draft',
  'scheduled',
  'active',
  'paused',
  'completed',
  'cancelled'
]);

/**
 * Campaign Type (6 values)
 */
export const campaign_type = pgEnum('campaign_type', [
  'email',
  'sms',
  'social',
  'push',
  'whatsapp',
  'multi_channel'
]);

/**
 * Audience Type (5 values)
 */
export const audience_type = pgEnum('audience_type', [
  'segment',
  'list',
  'custom',
  'all_customers',
  'filtered'
]);

// ============================================================================
// COLLABORATION & TASK ENUMS
// ============================================================================

/**
 * Task Status (7 values)
 */
export const task_status = pgEnum('task_status', [
  'pending',
  'in_progress',
  'completed',
  'blocked',
  'deferred',
  'cancelled',
  'review'
]);

/**
 * Task Priority (5 values)
 */
export const task_priority = pgEnum('task_priority', [
  'low',
  'normal',
  'high',
  'urgent',
  'critical'
]);

/**
 * Task Type (6 values)
 */
export const task_type = pgEnum('task_type', [
  'regular',
  'project',
  'meeting',
  'approval',
  'review',
  'decision'
]);

// ============================================================================
// BPM (Business Process Management) ENUMS
// ============================================================================

/**
 * BPM Process Status (4 values)
 */
export const bpm_process_status = pgEnum('bpm_process_status', [
  'draft',
  'active',
  'paused',
  'archived'
]);

/**
 * BPM Trigger Type (4 values)
 */
export const bpm_trigger_type = pgEnum('bpm_trigger_type', [
  'WEBHOOK',
  'SCHEDULED',
  'EVENT',
  'MANUAL'
]);

/**
 * Trigger Type (5 values) - Alternative naming
 */
export const trigger_type = pgEnum('trigger_type', [
  'scheduled',
  'event_based',
  'data_change',
  'manual',
  'api_webhook'
]);

/**
 * Process Step Type (8 values)
 */
export const process_step_type = pgEnum('process_step_type', [
  'action',
  'decision',
  'delay',
  'notification',
  'approval',
  'subprocess',
  'api_call',
  'document_generation'
]);

/**
 * Action Target Type (9 values)
 */
export const action_target_type = pgEnum('action_target_type', [
  'invoicing',
  'inventory',
  'crm',
  'logistics',
  'accounting',
  'documents',
  'communications',
  'marketing',
  'external_api'
]);

/**
 * BPM Process Instance Status (5 values)
 */
export const bpm_process_instance_status = pgEnum('bpm_process_instance_status', [
  'CREATED',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'CANCELED'
]);

/**
 * BPM Step Execution Status (5 values)
 */
export const bpm_step_execution_status = pgEnum('bpm_step_execution_status', [
  'PENDING',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'SKIPPED'
]);

/**
 * BPM Scheduled Job Status (5 values)
 */
export const bpm_scheduled_job_status = pgEnum('bpm_scheduled_job_status', [
  'SCHEDULED',
  'RUNNING',
  'COMPLETED',
  'FAILED',
  'CANCELED'
]);

/**
 * BPM API Connection Status (3 values)
 */
export const bpm_api_connection_status = pgEnum('bpm_api_connection_status', [
  'ACTIVE',
  'INACTIVE',
  'ERROR'
]);

// ============================================================================
// INTEGRATIONS ENUMS
// ============================================================================

/**
 * Integration Provider (30 values)
 * All supported external integrations
 */
export const integration_provider = pgEnum('integration_provider', [
  'shopify_admin',
  'shopify_storefront',
  'prestashop',
  'woocommerce',
  'stripe',
  'paypal',
  'email',
  'sms',
  'anaf',
  'revisal',
  'anaf_efactura',
  'revolut_business',
  'pandadoc',
  'microsoft_graph',
  'shopify_inbox',
  'sameday',
  'termene_ro',
  'openai',
  'elevenlabs',
  'google',
  'microsoft',
  'amazon',
  'facebook',
  'twitter',
  'hubspot',
  'mailchimp',
  'quickbooks',
  'xero'
]);

/**
 * Integration Status (4 values)
 */
export const integration_status = pgEnum('integration_status', [
  'active',
  'inactive',
  'pending',
  'error'
]);

// ============================================================================
// EXPORT ALL ENUMS
// ============================================================================

/**
 * Export map pentru backward compatibility
 */
export const AllEnums = {
  account_mapping_type,
  action_target_type,
  alert_severity,
  alert_status,
  audience_type,
  bank_payment_method,
  bank_transaction_type,
  bpm_api_connection_status,
  bpm_process_instance_status,
  bpm_process_status,
  bpm_scheduled_job_status,
  bpm_step_execution_status,
  bpm_trigger_type,
  campaign_status,
  campaign_type,
  cart_status,
  cash_register_status,
  cash_transaction_purpose,
  cash_transaction_type,
  communication_channel,
  gestiune_type,
  integration_provider,
  integration_status,
  inventory_assessment_status,
  inventory_assessment_type,
  inventory_count_result,
  inventory_valuation_method,
  invoice_status,
  message_direction,
  message_status,
  nir_status,
  order_source,
  order_status,
  payment_method,
  payment_status,
  platform_type,
  po_status,
  predictive_model_type,
  predictive_scenario_type,
  process_step_type,
  report_type,
  sentiment_type,
  task_priority,
  task_status,
  task_type,
  transaction_type,
  transfer_status,
  trigger_type,
  vat_category,
  warehouse_type
} as const;

