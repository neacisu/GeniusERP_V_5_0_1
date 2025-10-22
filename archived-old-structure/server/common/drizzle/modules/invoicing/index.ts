/**
 * Invoicing Drizzle Module
 * 
 * Exports the invoicing-specific drizzle services
 */

// Export the main monolithic service for backward compatibility
export * from './invoicing-drizzle.service';

// Export the granular services for a more modular approach
export * from './invoice-service';
export * from './invoice-mutation.service';
export * from './invoice-numbering-service';
export * from './invoice-numbering-mutation.service';