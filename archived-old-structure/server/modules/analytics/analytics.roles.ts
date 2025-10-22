/**
 * Analytics Module Role Definitions
 * 
 * This file defines the roles that have access to the Analytics module features.
 * These roles are used for role-based access control (RBAC) throughout the module.
 */

export enum AnalyticsRole {
  // Admin roles
  ADMIN = 'ADMIN',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  
  // Analytics-specific roles
  BI_ANALYST = 'BI_ANALYST',
  DATA_ANALYST = 'DATA_ANALYST',
  DATA_SCIENTIST = 'DATA_SCIENTIST',
  
  // Executive roles that need analytics access
  CEO = 'CEO',
  CFO = 'CFO',
  COO = 'COO',
  CTO = 'CTO',
  
  // Manager roles with analytics permissions
  FINANCE_MANAGER = 'FINANCE_MANAGER',
  SALES_MANAGER = 'SALES_MANAGER',
  MARKETING_MANAGER = 'MARKETING_MANAGER',
  OPERATIONS_MANAGER = 'OPERATIONS_MANAGER',
  
  // Other specialized roles
  RISK_ANALYST = 'RISK_ANALYST',
  PRODUCT_MANAGER = 'PRODUCT_MANAGER'
}

/**
 * Array of roles that have access to analytics features
 */
export const ANALYTICS_ROLES = [
  AnalyticsRole.ADMIN,
  AnalyticsRole.COMPANY_ADMIN,
  AnalyticsRole.BI_ANALYST,
  AnalyticsRole.DATA_ANALYST,
  AnalyticsRole.DATA_SCIENTIST,
  AnalyticsRole.CEO,
  AnalyticsRole.CFO,
  AnalyticsRole.COO,
  AnalyticsRole.CTO,
  AnalyticsRole.FINANCE_MANAGER,
  AnalyticsRole.SALES_MANAGER,
  AnalyticsRole.MARKETING_MANAGER,
  AnalyticsRole.OPERATIONS_MANAGER,
  AnalyticsRole.RISK_ANALYST,
  AnalyticsRole.PRODUCT_MANAGER
];

/**
 * Roles with full access to all analytics features
 * including predictive analytics and business intelligence
 */
export const ANALYTICS_FULL_ACCESS_ROLES = [
  AnalyticsRole.ADMIN,
  AnalyticsRole.COMPANY_ADMIN,
  AnalyticsRole.BI_ANALYST,
  AnalyticsRole.DATA_ANALYST,
  AnalyticsRole.DATA_SCIENTIST,
  AnalyticsRole.CEO,
  AnalyticsRole.CFO,
  AnalyticsRole.CTO
];

/**
 * Roles with access to business intelligence features
 */
export const BI_ROLES = [
  AnalyticsRole.ADMIN,
  AnalyticsRole.COMPANY_ADMIN,
  AnalyticsRole.BI_ANALYST,
  AnalyticsRole.DATA_ANALYST,
  AnalyticsRole.CEO,
  AnalyticsRole.CFO,
  AnalyticsRole.COO,
  AnalyticsRole.CTO,
  AnalyticsRole.FINANCE_MANAGER
];

/**
 * Roles with access to predictive analytics features
 */
export const PREDICTIVE_ROLES = [
  AnalyticsRole.ADMIN,
  AnalyticsRole.COMPANY_ADMIN,
  AnalyticsRole.DATA_SCIENTIST,
  AnalyticsRole.DATA_ANALYST,
  AnalyticsRole.BI_ANALYST,
  AnalyticsRole.CEO,
  AnalyticsRole.CTO,
  AnalyticsRole.PRODUCT_MANAGER
];

/**
 * Checks if a user has analytics access
 * 
 * @param userRoles Array of user roles
 * @returns Boolean indicating if user has access
 */
export function hasAnalyticsAccess(userRoles: string[]): boolean {
  return userRoles.some(role => ANALYTICS_ROLES.includes(role as AnalyticsRole));
}

/**
 * Checks if a user has full analytics access
 * 
 * @param userRoles Array of user roles
 * @returns Boolean indicating if user has full access
 */
export function hasFullAnalyticsAccess(userRoles: string[]): boolean {
  return userRoles.some(role => ANALYTICS_FULL_ACCESS_ROLES.includes(role as AnalyticsRole));
}

/**
 * Checks if a user has access to business intelligence features
 * 
 * @param userRoles Array of user roles
 * @returns Boolean indicating if user has BI access
 */
export function hasBusinessIntelligenceAccess(userRoles: string[]): boolean {
  return userRoles.some(role => BI_ROLES.includes(role as AnalyticsRole));
}

/**
 * Checks if a user has access to predictive analytics features
 * 
 * @param userRoles Array of user roles
 * @returns Boolean indicating if user has predictive analytics access
 */
export function hasPredictiveAnalyticsAccess(userRoles: string[]): boolean {
  return userRoles.some(role => PREDICTIVE_ROLES.includes(role as AnalyticsRole));
}