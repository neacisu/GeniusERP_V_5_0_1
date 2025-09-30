/**
 * Communications Module
 * 
 * This module provides unified communications functionality including:
 * - Universal inbox for omni-channel communications (email, WhatsApp, SMS, etc.)
 * - Message threading and conversation management
 * - Contact management across different channels
 * - Role-based access control for messages
 */

import { Express } from 'express';
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { Logger } from '../../common/logger';
import { ThreadsService } from './services/threads.service';
import { MessagesService } from './services/messages.service';
import { ContactsService } from './services/contacts.service';
import { ChannelConfigsService } from './services/channel-configs.service';
import { ThreadsRouter } from './routes/threads.routes';
import { MessagesRouter } from './routes/messages.routes';
import { ContactsRouter } from './routes/contacts.routes';
import { ChannelConfigsRouter } from './routes/channel-configs.routes';

// Create a logger for the module
const logger = new Logger('CommsModule');

/**
 * Communications Module configuration object
 */
export const CommsModule = {
  name: 'communications',
  displayName: 'Communications',
  description: 'Universal inbox system with omni-channel communications support',
  version: '1.0.0',
  initialize: initCommsModule,
  
  /**
   * Register the module with the application
   * @param app Express application
   * @param db Database connection
   * @returns Information about the registered module
   */
  register: (app: Express, db: PostgresJsDatabase) => {
    const moduleInfo = initCommsModule(app, db);
    
    // Register module with service registry if available
    try {
      const { registerModule } = require('../../common/services');
      registerModule('communications', {
        name: CommsModule.name,
        version: CommsModule.version,
        services: moduleInfo.services,
        permissions: CommsModule.permissions
      });
      logger.info('Communications module registered with service registry');
    } catch (error) {
      logger.warn('Service registry not available, module services will not be globally accessible', {});
    }
    
    return moduleInfo;
  },
  
  defaultRoles: [
    'comms_admin',
    'comms_user',
    'comms_viewer'
  ],
  permissions: [
    'communications.threads.create',
    'communications.threads.read',
    'communications.threads.update',
    'communications.threads.delete',
    'communications.messages.create',
    'communications.messages.read',
    'communications.messages.update',
    'communications.messages.delete',
    'communications.contacts.create',
    'communications.contacts.read',
    'communications.contacts.update',
    'communications.contacts.delete',
    'communications.channels.configure',
    'communications.channels.integrate'
  ],
  routes: [
    {
      path: '/api/communications/threads',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      description: 'Manage message threads'
    },
    {
      path: '/api/communications/messages',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      description: 'Manage individual messages'
    },
    {
      path: '/api/communications/contacts',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      description: 'Manage communication contacts'
    },
    {
      path: '/api/communications/channels',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      description: 'Configure communication channels'
    }
  ],
  dependencies: ['settings', 'customers', 'integrations', 'crm']
};

/**
 * Initialize the Communications module
 * @param app Express application instance
 * @param db Database connection
 * @returns Information about the initialized module
 */
export function initCommsModule(app: Express, db: PostgresJsDatabase) {
  logger.info('Initializing Communications module');
  
  try {
    // Initialize core services
    const threadsService = new ThreadsService(db);
    const messagesService = new MessagesService(db);
    const contactsService = new ContactsService(db);
    const channelConfigsService = new ChannelConfigsService(db);
    
    // Initialize and mount routers
    const threadsRouter = new ThreadsRouter(threadsService);
    const messagesRouter = new MessagesRouter(messagesService);
    const contactsRouter = new ContactsRouter(contactsService);
    const channelConfigsRouter = new ChannelConfigsRouter(channelConfigsService);
    
    // Mount routes
    if (app) {
      app.use('/api/communications/threads', threadsRouter.getRouter());
      app.use('/api/communications/messages', messagesRouter.getRouter());
      app.use('/api/communications/contacts', contactsRouter.getRouter());
      app.use('/api/communications/channels', channelConfigsRouter.getRouter());
    }
    
    logger.info('Communications module initialized successfully');
    
    return {
      name: CommsModule.name,
      version: CommsModule.version,
      services: {
        threadsService,
        messagesService,
        contactsService,
        channelConfigsService
      }
    };
  } catch (error) {
    logger.error('Failed to initialize Communications module', error);
    throw new Error('Communications module initialization failed');
  }
}