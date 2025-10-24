/**
 * Messages Router
 * 
 * This router handles HTTP requests related to messages.
 * Updated to use MessagesController for request handling.
 */

import express, { Router } from 'express';
import { MessagesService } from '../services/messages.service';
import { AuthGuard } from '@geniuserp/auth';
import { JwtAuthMode } from '@geniuserp/auth';
import { createModuleLogger } from "@common/logger/loki-logger";
import { createMessagesController } from '../controllers/messages.controller';

// Create a logger for the messages routes
const logger = createModuleLogger('MessagesRouter');

/**
 * Router for messages endpoints
 */
export class MessagesRouter {
  private router: Router;
  private messagesController: ReturnType<typeof createMessagesController>;
  
  constructor(private messagesService: MessagesService) {
    this.router = express.Router();
    this.messagesController = createMessagesController(messagesService);
    this.setupRoutes();
  }
  
  /**
   * Set up the routes for the router
   */
  private setupRoutes() {
    // Get messages for a thread
    this.router.get('/thread/:threadId', 
      AuthGuard.protect(JwtAuthMode.REQUIRED), 
      this.messagesController.getThreadMessages
    );
    
    // Get a specific message
    this.router.get('/:messageId', 
      AuthGuard.protect(JwtAuthMode.REQUIRED), 
      this.messagesController.getMessageById
    );
    
    // Create a new message
    this.router.post('/thread/:threadId', 
      AuthGuard.protect(JwtAuthMode.REQUIRED), 
      this.messagesController.createMessage
    );
    
    // Update a message
    this.router.patch('/:messageId', 
      AuthGuard.protect(JwtAuthMode.REQUIRED), 
      this.messagesController.updateMessage
    );
    
    // Mark a message as read
    this.router.patch('/:messageId/read', 
      AuthGuard.protect(JwtAuthMode.REQUIRED), 
      this.messagesController.markMessageAsRead
    );
    
    // Delete a message
    this.router.delete('/:messageId', 
      AuthGuard.protect(JwtAuthMode.REQUIRED), 
      this.messagesController.deleteMessage
    );
    
    // Search messages
    this.router.get('/search', 
      AuthGuard.protect(JwtAuthMode.REQUIRED), 
      this.messagesController.searchMessages
    );
  }
  
  /**
   * Get the configured router
   * @returns Express Router
   */
  public getRouter(): Router {
    return this.router;
  }
}