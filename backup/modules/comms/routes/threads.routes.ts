/**
 * Threads Router
 * 
 * This router handles HTTP requests related to message threads.
 */

import express, { Router, Request, Response } from 'express';
import { ThreadsService } from '../services/threads.service';
import { requireAuth } from '../../../common/middleware/auth-guard';
import { CommunicationChannel, MessageStatus } from '../../../../shared/schema/communications.schema';
import { Logger } from '../../../common/logger';

// Create a logger for the threads routes
const logger = new Logger('ThreadsRouter');

/**
 * Router for message threads endpoints
 */
export class ThreadsRouter {
  private router: Router;
  
  constructor(private threadsService: ThreadsService) {
    this.router = express.Router();
    this.setupRoutes();
  }
  
  /**
   * Set up the routes for the router
   */
  private setupRoutes() {
    // Get all threads for company
    this.router.get('/', requireAuth(), this.getThreads.bind(this));
    
    // Get a specific thread
    this.router.get('/:threadId', requireAuth(), this.getThread.bind(this));
    
    // Create a new thread
    this.router.post('/', requireAuth(), this.createThread.bind(this));
    
    // Update a thread
    this.router.patch('/:threadId', requireAuth(), this.updateThread.bind(this));
    
    // Delete a thread
    this.router.delete('/:threadId', requireAuth(), this.deleteThread.bind(this));
  }
  
  /**
   * Get the configured router
   * @returns Express Router
   */
  public getRouter(): Router {
    return this.router;
  }
  
  /**
   * Handler for GET /threads
   */
  private async getThreads(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Missing company ID' });
      }
      
      // Extract filter options from query params
      const filter: any = {};
      
      if (req.query.channel) {
        filter.channel = req.query.channel as CommunicationChannel;
      }
      
      if (req.query.status) {
        filter.status = req.query.status as MessageStatus;
      }
      
      if (req.query.assignedTo) {
        filter.assignedTo = req.query.assignedTo as string;
      }
      
      if (req.query.customerId) {
        filter.customerId = req.query.customerId as string;
      }
      
      if (req.query.contactId) {
        filter.contactId = req.query.contactId as string;
      }
      
      const threads = await this.threadsService.getThreadsWithMessageCount(companyId, filter);
      
      return res.json(threads);
    } catch (error) {
      logger.error('Error getting threads', error);
      return res.status(500).json({ 
        error: 'Failed to get threads',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Handler for GET /threads/:threadId
   */
  private async getThread(req: Request, res: Response) {
    try {
      const { threadId } = req.params;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Missing company ID' });
      }
      
      const thread = await this.threadsService.getThreadById(threadId, companyId);
      
      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }
      
      return res.json(thread);
    } catch (error) {
      logger.error(`Error getting thread ${req.params.threadId}`, error);
      return res.status(500).json({ 
        error: 'Failed to get thread',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Handler for POST /threads
   */
  private async createThread(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Missing company ID' });
      }
      
      // Validate required fields
      if (!req.body.channel) {
        return res.status(400).json({ error: 'Channel is required' });
      }
      
      // Create the thread
      const thread = await this.threadsService.createThread(companyId, {
        subject: req.body.subject,
        channel: req.body.channel,
        externalThreadId: req.body.externalThreadId,
        status: req.body.status,
        assignedTo: req.body.assignedTo,
        customerId: req.body.customerId,
        contactId: req.body.contactId,
        metadata: req.body.metadata
      });
      
      return res.status(201).json(thread);
    } catch (error) {
      logger.error('Error creating thread', error);
      return res.status(500).json({ 
        error: 'Failed to create thread',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Handler for PATCH /threads/:threadId
   */
  private async updateThread(req: Request, res: Response) {
    try {
      const { threadId } = req.params;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Missing company ID' });
      }
      
      // Check if thread exists
      const thread = await this.threadsService.getThreadById(threadId, companyId);
      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }
      
      // Update the thread
      const updatedThread = await this.threadsService.updateThread(threadId, companyId, {
        subject: req.body.subject,
        status: req.body.status,
        assignedTo: req.body.assignedTo,
        customerId: req.body.customerId,
        contactId: req.body.contactId,
        metadata: req.body.metadata
      });
      
      return res.json(updatedThread);
    } catch (error) {
      logger.error(`Error updating thread ${req.params.threadId}`, error);
      return res.status(500).json({ 
        error: 'Failed to update thread',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Handler for DELETE /threads/:threadId
   */
  private async deleteThread(req: Request, res: Response) {
    try {
      const { threadId } = req.params;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Missing company ID' });
      }
      
      // Delete the thread and its messages
      const deleted = await this.threadsService.deleteThread(threadId, companyId);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Thread not found' });
      }
      
      return res.status(204).end();
    } catch (error) {
      logger.error(`Error deleting thread ${req.params.threadId}`, error);
      return res.status(500).json({ 
        error: 'Failed to delete thread',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
}