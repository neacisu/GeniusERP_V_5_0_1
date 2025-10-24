/**
 * Authentication Types for Analytics Module
 * 
 * This file defines the types used for authentication in the analytics module.
 * It re-exports the main auth types from the auth module to maintain compatibility.
 */

import { JwtAuthMode, UserRole } from '@geniuserp/auth';
import type { JwtUserData } from '@geniuserp/auth';

// Re-export the auth types for convenience
export { JwtAuthMode, UserRole };
export type { JwtUserData };
export type { AuthenticatedRequest } from '@geniuserp/auth';

// Additional analytics-specific roles
export const AnalyticsRoles = {
  DATA_ANALYST: 'data_analyst',
  BUSINESS_INTELLIGENCE: 'business_intelligence',
  REPORT_VIEWER: 'report_viewer',
  REPORT_CREATOR: 'report_creator',
  DASHBOARD_ADMIN: 'dashboard_admin'
};