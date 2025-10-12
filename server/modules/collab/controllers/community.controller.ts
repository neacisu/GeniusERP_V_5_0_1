/**
 * Community Controller
 * 
 * This controller handles HTTP requests related to the community section
 * of the collaboration module. It manages community threads, categorized
 * discussions, resources, and other community-related features.
 */

import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { CommunityService, CommunityCategory } from '../services/community.service';
import { Logger } from '../../../common/logger';
import { insertCollaborationThreadSchema } from '../../../../shared/schema/collaboration.schema';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';

// Create a logger for the community controller
const logger = new Logger('CommunityController');

/**
 * Community controller request validation schemas
 */
const getCommunityThreadsQuerySchema = z.object({
  category: z.nativeEnum(CommunityCategory).optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0),
  sort: z.enum(['newest', 'oldest', 'popular']).optional().default('newest')
});

const createCommunityThreadSchema = insertCollaborationThreadSchema.extend({
  category: z.nativeEnum(CommunityCategory).optional(),
});

/**
 * Community controller class
 */
export class CommunityController {
  /**
   * Create a new community controller
   * 
   * @param communityService Community service instance
   */
  constructor(private readonly communityService: CommunityService) {
    logger.info('Community controller initialized');
  }

  /**
   * Register all community routes on a router
   * 
   * @param router Express router
   */
  registerRoutes(router: Router): void {
    logger.info('Registering community controller routes');

    // GET /api/collaboration/community - Get all community threads
    router.get(
      '/', 
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.getCommunityThreads.bind(this)
    );

    // GET /api/collaboration/community/:id - Get a specific community thread
    router.get(
      '/:id',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.getCommunityThreadById.bind(this)
    );

    // POST /api/collaboration/community/threads - Create a new community thread
    router.post(
      '/threads',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.createCommunityThread.bind(this)
    );

    // PATCH /api/collaboration/community/threads/:id - Update a community thread
    router.patch(
      '/threads/:id',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.updateCommunityThread.bind(this)
    );

    // DELETE /api/collaboration/community/threads/:id - Delete a community thread
    router.delete(
      '/threads/:id',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.deleteCommunityThread.bind(this)
    );

    logger.info('Community controller routes registered');
  }

  /**
   * Get community threads with optional filtering
   */
  async getCommunityThreads(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      if (!userId || !companyId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Validate query parameters
      const validationResult = getCommunityThreadsQuerySchema.safeParse(req.query);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid query parameters',
          errors: validationResult.error.issues
        });
      }

      const options = validationResult.data;
      
      // Get threads from service
      const result = await this.communityService.getCommunityThreads(companyId, options);
      
      return res.status(200).json({
        threads: result.threads,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset
        }
      });
    } catch (error) {
      logger.error(`Error in getCommunityThreads: ${error instanceof Error ? error.message : String(error)}`);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Get a specific community thread by ID
   */
  async getCommunityThreadById(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      const threadId = req.params.id;

      if (!userId || !companyId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!threadId) {
        return res.status(400).json({ message: 'Thread ID is required' });
      }

      const thread = await this.communityService.getCommunityThreadById(threadId, companyId);
      
      if (!thread) {
        return res.status(404).json({ message: 'Thread not found' });
      }

      return res.status(200).json({ thread });
    } catch (error) {
      logger.error(`Error in getCommunityThreadById: ${error instanceof Error ? error.message : String(error)}`);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Create a new community thread
   */
  async createCommunityThread(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      if (!userId || !companyId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Validate request body
      const validationResult = createCommunityThreadSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid thread data',
          errors: validationResult.error.issues
        });
      }

      const threadData = validationResult.data;
      
      // Set required fields
      threadData.companyId = companyId;
      threadData.createdBy = userId;
      
      // Create thread
      const thread = await this.communityService.createCommunityThread(threadData, req.user?.id || 'unknown');
      
      return res.status(201).json({ thread });
    } catch (error) {
      logger.error(`Error in createCommunityThread: ${error instanceof Error ? error.message : String(error)}`);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Update a community thread
   */
  async updateCommunityThread(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      const threadId = req.params.id;

      if (!userId || !companyId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!threadId) {
        return res.status(400).json({ message: 'Thread ID is required' });
      }

      // Validate request body (partial update)
      const validationSchema = createCommunityThreadSchema.partial();
      const validationResult = validationSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Invalid thread data',
          errors: validationResult.error.issues
        });
      }

      const threadData = validationResult.data;
      
      // Set updatedBy
      threadData.updatedBy = userId;
      
      // Update thread
      const thread = await this.communityService.updateCommunityThread(threadId, threadData, companyId, req.user?.id || 'unknown');
      
      if (!thread) {
        return res.status(404).json({ message: 'Thread not found' });
      }
      
      return res.status(200).json({ thread });
    } catch (error) {
      logger.error(`Error in updateCommunityThread: ${error instanceof Error ? error.message : String(error)}`);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Delete a community thread
   */
  async deleteCommunityThread(req: Request, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      const threadId = req.params.id;

      if (!userId || !companyId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      if (!threadId) {
        return res.status(400).json({ message: 'Thread ID is required' });
      }

      const success = await this.communityService.deleteCommunityThread(threadId, companyId);
      
      if (!success) {
        return res.status(404).json({ message: 'Thread not found' });
      }
      
      return res.status(204).send();
    } catch (error) {
      logger.error(`Error in deleteCommunityThread: ${error instanceof Error ? error.message : String(error)}`);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}

// Factory function for compatibility with legacy code
export const createCommunityController = (
  communityService: CommunityService
): CommunityController => {
  return new CommunityController(communityService);
};