/**
 * Products Service Singleton
 * 
 * Singleton instance for the products service
 * Ensures a single instance is used across the application
 */

import { ProductsService } from './products.service';
import { drizzleService } from "@common/drizzle/drizzle.service.instance";
import AuditService from '@geniuserp/audit';

// Create the singleton instance of the products service
const auditService = new AuditService();
export const productsService = new ProductsService(drizzleService, auditService);