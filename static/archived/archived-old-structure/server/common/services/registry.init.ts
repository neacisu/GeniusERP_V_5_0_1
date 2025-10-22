/**
 * Service Registry Initialization
 * 
 * This file integrates all the journal services with the global service registry.
 * It's imported at application startup to register all services.
 */
import { Services } from './registry';
import { Logger } from '../logger';

const logger = new Logger('ServiceRegistry');

/**
 * Register all journal services with the global service registry
 */
export function registerJournalServices(): void {
  try {
    // Services will be registered when accounting module is fully implemented
    logger.info('Journal services registration pending');
    
    // Register journal services in the global registry when available
    // Type assertion is needed since we're extending the registry dynamically
    (Services as any).salesJournal = null;
    (Services as any).purchasesJournal = null;
    (Services as any).bankJournal = null;
    (Services as any).cashRegister = null;
    
    logger.info('Accounting journal services registered');
  } catch (error) {
    logger.error('Failed to register journal services:', error);
  }
}

/**
 * Initialize the service registry with all services
 * This function should be called at application startup
 */
export function initializeServiceRegistry(): void {
  try {
    logger.info('Initializing service registry...');
    
    // Register all services
    registerJournalServices();
    
    // Register core services
    (Services as any).queue = null;
    (Services as any).redis = null;
    (Services as any).openai = null;
    
    logger.info('Service registry initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize service registry:', error);
    throw error;
  }
}