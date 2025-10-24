/**
 * Threads Controller
 * 
 * This controller handles HTTP requests related to message threads.
 * It isolates business logic from the request/response handling.
 */

import { Request, Response } from 'express';
import { ThreadsService } from '../services/threads.service';
import { CommunicationChannel, MessageStatus } from '../../../../shared/schema/communications.schema';
import { createModuleLogger } from "@common/logger/loki-logger";

// Create a logger for the threads controller
const logger = createModuleLogger('ThreadsController');

/**
 * Controller for message threads
 */
export class ThreadsController {
  constructor(private threadsService: ThreadsService) {}

  /**
   * Get all threads for a company
   */
  async getThreads(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: 'Missing company ID' });
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
        message: 'Failed to get threads',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get a specific thread by ID
   */
  async getThread(req: Request, res: Response) {
    try {
      const { threadId } = req.params;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: 'Missing company ID' });
      }
      
      const thread = await this.threadsService.getThreadById(threadId, companyId);
      
      if (!thread) {
        return res.status(404).json({ message: 'Thread not found' });
      }
      
      return res.json(thread);
    } catch (error) {
      logger.error(`Error getting thread ${req.params.threadId}`, error);
      return res.status(500).json({ 
        message: 'Failed to get thread',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Create a new thread
   */
  async createThread(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: 'Missing company ID' });
      }
      
      // Validate required fields
      if (!req.body.channel) {
        return res.status(400).json({ message: 'Channel is required' });
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
        message: 'Failed to create thread',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Update an existing thread
   */
  async updateThread(req: Request, res: Response) {
    try {
      const { threadId } = req.params;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: 'Missing company ID' });
      }
      
      // Check if thread exists
      const thread = await this.threadsService.getThreadById(threadId, companyId);
      if (!thread) {
        return res.status(404).json({ message: 'Thread not found' });
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
        message: 'Failed to update thread',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Delete a thread
   */
  async deleteThread(req: Request, res: Response) {
    try {
      const { threadId } = req.params;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: 'Missing company ID' });
      }
      
      // Delete the thread and its messages
      const deleted = await this.threadsService.deleteThread(threadId, companyId);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Thread not found' });
      }
      
      return res.status(204).end();
    } catch (error) {
      logger.error(`Error deleting thread ${req.params.threadId}`, error);
      return res.status(500).json({ 
        message: 'Failed to delete thread',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}