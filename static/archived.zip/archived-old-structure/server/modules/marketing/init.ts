/**
 * Marketing Module Initialization
 * 
 * This file contains the initialization logic for the Marketing module
 * including database connection setup and service registration.
 */

import { Logger } from '../../common/logger';
import { DrizzleService } from '../../common/drizzle/drizzle.service';
import { 
  campaigns, 
  campaignMessages, 
  campaignSegments, 
  campaignTemplates 
} from '../../../shared/schema/marketing.schema';
import { 
  messages, 
  contacts, 
  messageThreads, 
  channelConfigurations 
} from '../../../shared/schema/communications.schema';

const logger = new Logger('MarketingInit');

/**
 * Initialize the Marketing module services
 */
export async function initialize() {
  try {
    logger.info('Initializing Marketing module...');
    
    // Nothing specific to initialize here now that we're using DrizzleService
    // Services will create their own DrizzleService instances
    
    logger.info('Marketing module initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Marketing module', error instanceof Error ? error.message : String(error));
    throw error;
  }
}