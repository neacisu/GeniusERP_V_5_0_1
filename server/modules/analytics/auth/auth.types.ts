/**
 * Authentication Types for Analytics Module
 * 
 * This file defines the types used for authentication in the analytics module.
 * It re-exports the main auth types from the auth module to maintain compatibility.
 */

import { Request } from 'express';
import { JwtAuthMode, UserRole, JwtUserData } from '../../auth/types';

// Re-export the auth types
export { JwtAuthMode, UserRole, JwtUserData };

/**
 * Extended Express Request with authenticated user data
 */
export interface AuthenticatedRequest extends Request {
  user?: JwtUserData;
}

// Additional analytics-specific roles
export const AnalyticsRoles = {
  DATA_ANALYST: 'data_analyst',
  BUSINESS_INTELLIGENCE: 'business_intelligence',
  REPORT_VIEWER: 'report_viewer',
  REPORT_CREATOR: 'report_creator',
  DASHBOARD_ADMIN: 'dashboard_admin'
};