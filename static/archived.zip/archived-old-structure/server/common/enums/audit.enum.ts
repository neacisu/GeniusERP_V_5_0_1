/**
 * Audit Enums
 * 
 * This file defines enums used by the audit service to track actions and resource types
 * throughout the application.
 */

// Action types for the audit log
export enum AuditAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  EXPORT = 'export',
  IMPORT = 'import',
  APPROVE = 'approve',
  REJECT = 'reject',
  CANCEL = 'cancel',
  SUBMIT = 'submit',
  GENERATE = 'generate',
  SEND = 'send',
  RECEIVE = 'receive',
  DOWNLOAD = 'download',
  UPLOAD = 'upload',
  VERIFY = 'verify',
  SIGN = 'sign',
  PAY = 'pay'
}

// Resource types that can be audited
export enum AuditResourceType {
  // User and Auth resources
  USER = 'user',
  ROLE = 'role',
  PERMISSION = 'permission',
  SESSION = 'session',
  
  // Company and Settings resources
  COMPANY = 'company',
  COMPANY_SETTINGS = 'company_settings',
  
  // Accounting resources
  ACCOUNT = 'account',
  JOURNAL_ENTRY = 'journal_entry',
  TRANSACTION = 'transaction',
  LEDGER = 'ledger',
  
  // Inventory resources
  INVENTORY_ITEM = 'inventory_item',
  WAREHOUSE = 'warehouse',
  STOCK = 'stock',
  STOCK_MOVEMENT = 'stock_movement',
  NIR_DOCUMENT = 'nir_document',
  TRANSFER_DOCUMENT = 'transfer_document',
  
  // Invoice resources
  INVOICE = 'invoice',
  INVOICE_ITEM = 'invoice_item',
  CLIENT = 'client',
  SUPPLIER = 'supplier',
  
  // Document resources
  DOCUMENT = 'document',
  DOCUMENT_VERSION = 'document_version',
  DOCUMENT_SIGNATURE = 'document_signature',
  DOCUMENT_TEMPLATE = 'document_template',
  
  // CRM resources
  CUSTOMER = 'customer',
  CONTACT = 'contact',
  DEAL = 'deal',
  PIPELINE = 'pipeline',
  STAGE = 'stage',
  ACTIVITY = 'activity',
  TASK = 'task',
  NOTE = 'note',
  
  // HR resources
  EMPLOYEE = 'employee',
  EMPLOYMENT_CONTRACT = 'employment_contract',
  DEPARTMENT = 'department',
  PAYROLL = 'payroll',
  ABSENCE = 'absence',
  REVISAL_EXPORT = 'revisal_export',
  ANAF_EXPORT = 'anaf_export',
  COMMISSION_STRUCTURE = 'commission_structure',
  EMPLOYEE_COMMISSION = 'employee_commission'
}