/**
 * Schema Index
 * 
 * This file exports all database schema elements to allow for easy imports elsewhere
 */

export * from './ecommerce.schema';
export * from './communications.schema';
export * from './marketing.schema';
export * from './bpm.schema';
export * from './collaboration.schema';
export * from './inventory-assessment';
export * from './cash-register.schema';
export * from './bank-journal.schema';
// Integrations schema moved to server modules
export * from '../../server/modules/integrations/schema/integrations.schema';

// Export invoicing schemas from server modules  
// Note: Path is relative to shared/schema/index.ts location
export * from '../../server/modules/invoicing/schema/invoice.schema';