/**
 * Categories Service Singleton Instance
 * 
 * This file creates and exports a singleton instance of the CategoriesService
 * to be used across the application.
 */

import { DrizzleService } from '../../common/drizzle/drizzle.service';
import { AuditService } from '@geniuserp/audit/services/audit.service';
import { CategoriesService } from './services/categories.service';

// Get service dependencies
const drizzleService = new DrizzleService();
const auditService = new AuditService();

// Create and export a singleton instance
export const categoriesService = new CategoriesService(drizzleService, auditService);