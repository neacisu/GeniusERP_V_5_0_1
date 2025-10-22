import { Request, Response, NextFunction } from 'express';
import client from 'prom-client';
import { register } from './metrics.middleware';

// ==========================================
// METRICI BUSINESS SPECIFICE PENTRU GENIUSERP
// ==========================================

// ============ INVOICING MODULE ============
export const invoiceMetrics = {
  created: new client.Counter({
    name: 'geniuserp_invoices_created_total',
    help: 'Total number of invoices created',
    labelNames: ['type', 'company_id'], // type: 'sales' | 'purchase'
    registers: [register],
  }),
  
  totalAmount: new client.Gauge({
    name: 'geniuserp_invoices_total_amount',
    help: 'Total amount of invoices (in RON)',
    labelNames: ['type', 'status'], // status: 'draft', 'issued', 'paid', 'cancelled'
    registers: [register],
  }),
  
  processingTime: new client.Histogram({
    name: 'geniuserp_invoice_processing_duration_seconds',
    help: 'Time to process an invoice operation',
    labelNames: ['operation'], // operation: 'create', 'update', 'send', 'anaf_sync'
    buckets: [0.1, 0.5, 1, 2, 5, 10],
    registers: [register],
  }),
};

// ============ ACCOUNTING MODULE ============
export const accountingMetrics = {
  journalEntries: new client.Counter({
    name: 'geniuserp_journal_entries_total',
    help: 'Total number of journal entries',
    labelNames: ['journal_type'], // 'sales', 'purchase', 'bank', 'cash', 'general'
    registers: [register],
  }),
  
  fiscalClosures: new client.Counter({
    name: 'geniuserp_fiscal_closures_total',
    help: 'Total number of fiscal closures performed',
    labelNames: ['period_type'], // 'daily', 'monthly', 'quarterly', 'yearly'
    registers: [register],
  }),
  
  vatAmount: new client.Gauge({
    name: 'geniuserp_vat_amount_ron',
    help: 'VAT amounts tracked by type',
    labelNames: ['vat_type'], // 'collected', 'paid', 'to_pay', 'to_receive'
    registers: [register],
  }),
};

// ============ INVENTORY MODULE ============
export const inventoryMetrics = {
  stockLevel: new client.Gauge({
    name: 'geniuserp_stock_level_units',
    help: 'Current stock levels by warehouse',
    labelNames: ['warehouse_id', 'product_id'],
    registers: [register],
  }),
  
  stockMovements: new client.Counter({
    name: 'geniuserp_stock_movements_total',
    help: 'Total stock movements',
    labelNames: ['movement_type', 'warehouse_id'], // 'in', 'out', 'transfer', 'adjustment'
    registers: [register],
  }),
  
  nirProcessed: new client.Counter({
    name: 'geniuserp_nir_processed_total',
    help: 'Total NIR (Goods Receipt Notes) processed',
    labelNames: ['status'], // 'created', 'approved', 'cancelled'
    registers: [register],
  }),
  
  lowStockAlerts: new client.Gauge({
    name: 'geniuserp_low_stock_alerts_active',
    help: 'Number of active low stock alerts',
    labelNames: ['warehouse_id', 'severity'], // 'warning', 'critical'
    registers: [register],
  }),
};

// ============ CRM MODULE ============
export const crmMetrics = {
  leads: new client.Gauge({
    name: 'geniuserp_crm_leads_count',
    help: 'Number of leads by status',
    labelNames: ['status'], // 'new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'
    registers: [register],
  }),
  
  customers: new client.Gauge({
    name: 'geniuserp_crm_customers_total',
    help: 'Total number of customers',
    labelNames: ['type', 'status'], // type: 'individual', 'company'; status: 'active', 'inactive'
    registers: [register],
  }),
  
  opportunities: new client.Gauge({
    name: 'geniuserp_crm_opportunities_value_ron',
    help: 'Total value of opportunities by stage',
    labelNames: ['stage'],
    registers: [register],
  }),
  
  interactions: new client.Counter({
    name: 'geniuserp_crm_interactions_total',
    help: 'Total customer interactions',
    labelNames: ['interaction_type'], // 'call', 'email', 'meeting', 'note'
    registers: [register],
  }),
};

// ============ SALES MODULE ============
export const salesMetrics = {
  revenue: new client.Counter({
    name: 'geniuserp_sales_revenue_total_ron',
    help: 'Total sales revenue in RON',
    labelNames: ['channel', 'payment_method'], // channel: 'direct', 'ecommerce', 'pos'
    registers: [register],
  }),
  
  orders: new client.Counter({
    name: 'geniuserp_sales_orders_total',
    help: 'Total number of sales orders',
    labelNames: ['status', 'channel'], // status: 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'
    registers: [register],
  }),
  
  averageOrderValue: new client.Gauge({
    name: 'geniuserp_sales_average_order_value_ron',
    help: 'Average order value in RON',
    labelNames: ['channel', 'period'], // period: 'daily', 'weekly', 'monthly'
    registers: [register],
  }),
};

// ============ E-COMMERCE MODULE ============
export const ecommerceMetrics = {
  onlineOrders: new client.Counter({
    name: 'geniuserp_ecommerce_orders_total',
    help: 'Total e-commerce orders',
    labelNames: ['platform', 'status'], // platform: 'shopify', 'woocommerce', 'internal'
    registers: [register],
  }),
  
  syncOperations: new client.Counter({
    name: 'geniuserp_ecommerce_sync_operations_total',
    help: 'E-commerce sync operations',
    labelNames: ['platform', 'operation', 'result'], // operation: 'products', 'orders', 'inventory'
    registers: [register],
  }),
  
  cartAbandonment: new client.Gauge({
    name: 'geniuserp_ecommerce_cart_abandonment_rate',
    help: 'Shopping cart abandonment rate (percentage)',
    labelNames: ['platform'],
    registers: [register],
  }),
};

// ============ HR MODULE ============
export const hrMetrics = {
  employees: new client.Gauge({
    name: 'geniuserp_hr_employees_total',
    help: 'Total number of employees',
    labelNames: ['department', 'employment_type'], // employment_type: 'full_time', 'part_time', 'contractor'
    registers: [register],
  }),
  
  contracts: new client.Counter({
    name: 'geniuserp_hr_contracts_total',
    help: 'Total employment contracts',
    labelNames: ['contract_type', 'status'], // contract_type: 'permanent', 'temporary', 'internship'
    registers: [register],
  }),
  
  leaves: new client.Counter({
    name: 'geniuserp_hr_leaves_total',
    help: 'Total leave requests',
    labelNames: ['leave_type', 'status'], // leave_type: 'annual', 'sick', 'unpaid', 'maternity'
    registers: [register],
  }),
};

// ============ INTEGRATIONS MODULE ============
export const integrationsMetrics = {
  anafSync: new client.Counter({
    name: 'geniuserp_anaf_sync_requests_total',
    help: 'Total ANAF API sync requests',
    labelNames: ['endpoint', 'status'], // endpoint: 'vat_validation', 'efactura', 'saf-t'
    registers: [register],
  }),
  
  anafErrors: new client.Counter({
    name: 'geniuserp_anaf_errors_total',
    help: 'Total ANAF API errors',
    labelNames: ['error_type'],
    registers: [register],
  }),
  
  externalApiCalls: new client.Counter({
    name: 'geniuserp_external_api_calls_total',
    help: 'Total external API calls',
    labelNames: ['service', 'method', 'status_code'], // service: 'anaf', 'shopify', 'exchange_rate'
    registers: [register],
  }),
};

// ============ AI MODULE ============
export const aiMetrics = {
  requests: new client.Counter({
    name: 'geniuserp_ai_requests_total',
    help: 'Total AI requests',
    labelNames: ['feature', 'model'], // feature: 'document_analysis', 'prediction', 'assistant'
    registers: [register],
  }),
  
  responseTime: new client.Histogram({
    name: 'geniuserp_ai_response_time_seconds',
    help: 'AI response time',
    labelNames: ['feature', 'model'],
    buckets: [0.5, 1, 2, 5, 10, 30],
    registers: [register],
  }),
  
  tokensUsed: new client.Counter({
    name: 'geniuserp_ai_tokens_used_total',
    help: 'Total AI tokens consumed',
    labelNames: ['model', 'type'], // type: 'prompt', 'completion'
    registers: [register],
  }),
};

// ============ ANALYTICS MODULE ============
export const analyticsMetrics = {
  dashboardViews: new client.Counter({
    name: 'geniuserp_analytics_dashboard_views_total',
    help: 'Total analytics dashboard views',
    labelNames: ['dashboard_type', 'user_role'],
    registers: [register],
  }),
  
  reportGeneration: new client.Counter({
    name: 'geniuserp_analytics_reports_generated_total',
    help: 'Total reports generated',
    labelNames: ['report_type', 'format'], // format: 'pdf', 'excel', 'csv'
    registers: [register],
  }),
};

// ============ AUDIT MODULE ============
export const auditMetrics = {
  logEntries: new client.Counter({
    name: 'geniuserp_audit_log_entries_total',
    help: 'Total audit log entries',
    labelNames: ['entity_type', 'action', 'user_role'], // action: 'create', 'read', 'update', 'delete'
    registers: [register],
  }),
  
  securityEvents: new client.Counter({
    name: 'geniuserp_security_events_total',
    help: 'Total security events',
    labelNames: ['event_type', 'severity'], // event_type: 'login_failed', 'permission_denied', 'suspicious_activity'
    registers: [register],
  }),
};

// ============ BPM MODULE ============
export const bpmMetrics = {
  workflows: new client.Gauge({
    name: 'geniuserp_bpm_workflows_active',
    help: 'Number of active workflows',
    labelNames: ['workflow_type', 'status'],
    registers: [register],
  }),
  
  tasks: new client.Counter({
    name: 'geniuserp_bpm_tasks_total',
    help: 'Total BPM tasks',
    labelNames: ['task_type', 'status'], // status: 'pending', 'in_progress', 'completed', 'rejected'
    registers: [register],
  }),
  
  workflowDuration: new client.Histogram({
    name: 'geniuserp_bpm_workflow_duration_hours',
    help: 'Workflow completion duration in hours',
    labelNames: ['workflow_type'],
    buckets: [1, 4, 8, 24, 48, 168], // 1h, 4h, 8h, 1d, 2d, 1w
    registers: [register],
  }),
};

// ==========================================
// HELPER FUNCTIONS PENTRU TRACKING
// ==========================================

export const trackInvoiceCreation = (type: 'sales' | 'purchase', companyId: string) => {
  invoiceMetrics.created.inc({ type, company_id: companyId });
};

export const trackJournalEntry = (journalType: string) => {
  accountingMetrics.journalEntries.inc({ journal_type: journalType });
};

export const trackStockMovement = (movementType: string, warehouseId: string) => {
  inventoryMetrics.stockMovements.inc({ movement_type: movementType, warehouse_id: warehouseId });
};

export const trackCRMInteraction = (interactionType: string) => {
  crmMetrics.interactions.inc({ interaction_type: interactionType });
};

export const trackSalesOrder = (status: string, channel: string) => {
  salesMetrics.orders.inc({ status, channel });
};

export const trackANAFSync = (endpoint: string, status: 'success' | 'error') => {
  integrationsMetrics.anafSync.inc({ endpoint, status });
};

export const trackAIRequest = (feature: string, model: string) => {
  aiMetrics.requests.inc({ feature, model });
};

export const trackAuditLog = (entityType: string, action: string, userRole: string) => {
  auditMetrics.logEntries.inc({ entity_type: entityType, action, user_role: userRole });
};

// ==========================================
// EXPORT ALL METRICS
// ==========================================
export const businessMetrics = {
  invoice: invoiceMetrics,
  accounting: accountingMetrics,
  inventory: inventoryMetrics,
  crm: crmMetrics,
  sales: salesMetrics,
  ecommerce: ecommerceMetrics,
  hr: hrMetrics,
  integrations: integrationsMetrics,
  ai: aiMetrics,
  analytics: analyticsMetrics,
  audit: auditMetrics,
  bpm: bpmMetrics,
};

