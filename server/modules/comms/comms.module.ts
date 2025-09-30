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
import { Logger } from '../../common/logger';
import { DrizzleService } from '../../common/drizzle/drizzle.service';
import { ThreadsService } from './services/threads.service';
import { MessagesService } from './services/messages.service';
import { ContactsService } from './services/contacts.service';
import { ChannelConfigsService } from './services/channel-configs.service';
import { ThreadAccessService } from './services/thread-access.service';
import { MessageAccessService } from './services/message-access.service';
import { ThreadsRouter } from './routes/threads.routes';
import { MessagesRouter } from './routes/messages.routes';
import { ContactsRouter } from './routes/contacts.routes';
import { ChannelConfigsRouter } from './routes/channel-configs.routes';
import { ThreadAccessRouter } from './routes/thread-access.routes';
import { MessageAccessRouter } from './routes/message-access.routes';
import { MessagesController, createMessagesController } from './controllers';

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
   * @param drizzleService DrizzleService instance
   * @returns Information about the registered module
   */
  register: (app: Express, drizzleService: DrizzleService) => {
    const moduleInfo = initCommsModule(app, drizzleService);
    
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
      logger.warn('Service registry not available, module services will not be globally accessible');
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
    'communications.channels.integrate',
    'communications.thread_access.create',
    'communications.thread_access.read',
    'communications.thread_access.update',
    'communications.thread_access.delete',
    'communications.message_access.create',
    'communications.message_access.read',
    'communications.message_access.update',
    'communications.message_access.delete'
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
    },
    {
      path: '/api/communications/thread-access',
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      description: 'Manage thread access permissions'
    },
    {
      path: '/api/communications/message-access',
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      description: 'Manage message access permissions'
    }
  ],
  dependencies: ['settings', 'customers', 'integrations', 'crm']
};

/**
 * Initialize the Communications module
 * @param app Express application instance
 * @param drizzleService DrizzleService instance
 * @returns Information about the initialized module
 */
export function initCommsModule(app: Express, drizzleService: DrizzleService) {
  logger.info('Initializing Communications module');
  
  try {
    // Initialize core services
    const threadsService = new ThreadsService(drizzleService);
    const messagesService = new MessagesService(drizzleService);
    const contactsService = new ContactsService(drizzleService);
    const channelConfigsService = new ChannelConfigsService(drizzleService);
    const threadAccessService = new ThreadAccessService(drizzleService);
    const messageAccessService = new MessageAccessService(drizzleService);
    
    // Initialize controllers
    const messagesController = createMessagesController(messagesService);

    // Initialize and mount routers
    const threadsRouter = new ThreadsRouter(threadsService);
    const messagesRouter = new MessagesRouter(messagesService);
    const contactsRouter = new ContactsRouter(contactsService);
    const channelConfigsRouter = new ChannelConfigsRouter(channelConfigsService);
    const threadAccessRouter = new ThreadAccessRouter(threadAccessService);
    const messageAccessRouter = new MessageAccessRouter(messageAccessService);
    
    // Mount routes
    if (app) {
      app.use('/api/communications/threads', threadsRouter.getRouter());
      app.use('/api/communications/messages', messagesRouter.getRouter());
      app.use('/api/communications/contacts', contactsRouter.getRouter());
      app.use('/api/communications/channels', channelConfigsRouter.getRouter());
      app.use('/api/communications/thread-access', threadAccessRouter.getRouter());
      app.use('/api/communications/message-access', messageAccessRouter.getRouter());
    }
    
    logger.info('Communications module initialized successfully');
    
    return {
      name: CommsModule.name,
      version: CommsModule.version,
      services: {
        threadsService,
        messagesService,
        contactsService,
        channelConfigsService,
        threadAccessService,
        messageAccessService
      },
      controllers: {
        messagesController
      }
    };
  } catch (error) {
    logger.error('Failed to initialize Communications module', error);
    throw new Error('Communications module initialization failed');
  }
}