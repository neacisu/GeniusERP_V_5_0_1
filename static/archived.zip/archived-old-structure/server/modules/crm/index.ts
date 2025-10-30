/**
 * CRM Module Index
 * 
 * Main export file for the CRM module, providing access to the module's
 * public interfaces, services, and components.
 */

// Export the module class
export * from './crm.module';

// Export the schema
export * from './schema';

// Export controllers
export { CustomerController } from './controllers/customer.controller';
export { DealController } from './controllers/deal.controller';
export { SalesController } from './controllers/sales.controller';

// Export placeholder services (to be implemented in future steps)
export const customerService = null;
export const contactService = null;
export const pipelineService = null;
export const dealService = null;
export const activityService = null;
export const forecastService = null;
export const salesQuotaService = null;
export const tagService = null;