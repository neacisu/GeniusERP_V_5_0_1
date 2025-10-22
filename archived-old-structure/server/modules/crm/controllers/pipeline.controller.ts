/**
 * Pipeline Controller
 * 
 * Controller for handling sales pipeline-related API endpoints
 */
import { Express, Request, Response } from 'express';
import { PipelineService } from '../services/pipeline.service';
import { JwtService } from '../../auth/services/jwt.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/types';
import { UserRole } from '../../auth/types';

export class PipelineController {
  private pipelineService: PipelineService;
  
  constructor() {
    this.pipelineService = new PipelineService();
  }
  
  /**
   * Register all pipeline routes
   */
  registerRoutes(app: Express, jwtService: JwtService): void {
    // Create a new pipeline
    app.post(
      '/api/crm/pipelines',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.SALES_AGENT]),
      this.createPipeline.bind(this)
    );
    
    // Get a specific pipeline by ID
    app.get(
      '/api/crm/pipelines/:id',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.SALES_AGENT, UserRole.USER]),
      this.getPipeline.bind(this)
    );
    
    // Update an existing pipeline
    app.put(
      '/api/crm/pipelines/:id',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.SALES_AGENT]),
      this.updatePipeline.bind(this)
    );
    
    // Delete a pipeline
    app.delete(
      '/api/crm/pipelines/:id',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN]),
      this.deletePipeline.bind(this)
    );
    
    // List all pipelines
    app.get(
      '/api/crm/pipelines',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.SALES_AGENT, UserRole.USER]),
      this.listPipelines.bind(this)
    );
    
    // Get default pipeline
    app.get(
      '/api/crm/pipelines/default',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.SALES_AGENT, UserRole.USER]),
      this.getDefaultPipeline.bind(this)
    );
    
    // Create a pipeline stage
    app.post(
      '/api/crm/pipelines/:pipelineId/stages',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.SALES_AGENT]),
      this.createStage.bind(this)
    );
    
    // Update a pipeline stage
    app.put(
      '/api/crm/stages/:id',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.SALES_AGENT]),
      this.updateStage.bind(this)
    );
    
    // Delete a pipeline stage
    app.delete(
      '/api/crm/stages/:id',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN]),
      this.deleteStage.bind(this)
    );
    
    // Get stages for a pipeline
    app.get(
      '/api/crm/pipelines/:pipelineId/stages',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.SALES_AGENT, UserRole.USER]),
      this.getStages.bind(this)
    );
    
    // Reorder pipeline stages
    app.put(
      '/api/crm/pipelines/:pipelineId/stages/reorder',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.SALES_AGENT]),
      this.reorderStages.bind(this)
    );
    
    // Get all stages across all pipelines
    app.get(
      '/api/crm/stages',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.SALES_AGENT, UserRole.USER]),
      this.getAllStages.bind(this)
    );
  }
  
  /**
   * Create a new pipeline
   */
  private async createPipeline(req: Request, res: Response): Promise<void> {
    try {
      const { user, body } = req;
      
      if (!user || !user.id || !user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const pipelineData = {
        ...body,
        companyId: user.companyId
      };
      
      const pipeline = await this.pipelineService.createPipeline(pipelineData, user.id);
      res.status(201).json(pipeline);
    } catch (error) {
      console.error('Error creating pipeline:', error);
      res.status(500).json({ 
        message: 'Failed to create pipeline', 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * Get a specific pipeline by ID
   */
  private async getPipeline(req: Request, res: Response): Promise<void> {
    try {
      const { user, params } = req;
      const { id } = params;
      
      if (!user || !user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const pipeline = await this.pipelineService.getPipelineById(id, user.companyId);
      
      if (!pipeline) {
        res.status(404).json({ message: 'Pipeline not found' });
        return;
      }
      
      res.json(pipeline);
    } catch (error) {
      console.error('Error getting pipeline:', error);
      res.status(500).json({ 
        message: 'Failed to get pipeline', 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * Update an existing pipeline
   */
  private async updatePipeline(req: Request, res: Response): Promise<void> {
    try {
      const { user, params, body } = req;
      const { id } = params;
      
      if (!user || !user.id || !user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const pipelineData = {
        ...body,
        companyId: user.companyId
      };
      
      const pipeline = await this.pipelineService.updatePipeline(id, pipelineData, user.id);
      
      if (!pipeline) {
        res.status(404).json({ message: 'Pipeline not found' });
        return;
      }
      
      res.json(pipeline);
    } catch (error) {
      console.error('Error updating pipeline:', error);
      res.status(500).json({ 
        message: 'Failed to update pipeline', 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * Delete a pipeline
   */
  private async deletePipeline(req: Request, res: Response): Promise<void> {
    try {
      const { user, params } = req;
      const { id } = params;
      
      if (!user || !user.id || !user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const success = await this.pipelineService.deletePipeline(id, user.companyId, user.id);
      
      if (!success) {
        res.status(404).json({ message: 'Pipeline not found' });
        return;
      }
      
      res.json({ message: 'Pipeline deleted successfully' });
    } catch (error) {
      console.error('Error deleting pipeline:', error);
      res.status(500).json({ 
        message: 'Failed to delete pipeline', 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * List all pipelines
   */
  private async listPipelines(req: Request, res: Response): Promise<void> {
    try {
      const { user, query } = req;
      
      if (!user || !user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      // Parse query parameters
      const includeInactive = query.includeInactive === 'true';
      
      const pipelines = await this.pipelineService.getPipelines(user.companyId, includeInactive);
      res.json(pipelines);
    } catch (error) {
      console.error('Error listing pipelines:', error);
      res.status(500).json({ 
        message: 'Failed to list pipelines', 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * Get default pipeline
   */
  private async getDefaultPipeline(req: Request, res: Response): Promise<void> {
    try {
      const { user } = req;
      
      if (!user || !user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const pipeline = await this.pipelineService.getDefaultPipeline(user.companyId);
      
      if (!pipeline) {
        res.status(404).json({ message: 'No default pipeline found' });
        return;
      }
      
      res.json(pipeline);
    } catch (error) {
      console.error('Error getting default pipeline:', error);
      res.status(500).json({ 
        message: 'Failed to get default pipeline', 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * Create a pipeline stage
   */
  private async createStage(req: Request, res: Response): Promise<void> {
    try {
      const { user, params, body } = req;
      const { pipelineId } = params;
      
      if (!user || !user.id || !user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const stageData = {
        ...body,
        pipelineId,
        companyId: user.companyId
      };
      
      const stage = await this.pipelineService.createStage(stageData, user.id);
      res.status(201).json(stage);
    } catch (error) {
      console.error('Error creating pipeline stage:', error);
      res.status(500).json({ 
        message: 'Failed to create pipeline stage', 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * Update a pipeline stage
   */
  private async updateStage(req: Request, res: Response): Promise<void> {
    try {
      const { user, params, body } = req;
      const { id } = params;
      
      if (!user || !user.id || !user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const stageData = {
        ...body,
        companyId: user.companyId
      };
      
      const stage = await this.pipelineService.updateStage(id, stageData, user.id);
      
      if (!stage) {
        res.status(404).json({ message: 'Stage not found' });
        return;
      }
      
      res.json(stage);
    } catch (error) {
      console.error('Error updating pipeline stage:', error);
      res.status(500).json({ 
        message: 'Failed to update pipeline stage', 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * Delete a pipeline stage
   */
  private async deleteStage(req: Request, res: Response): Promise<void> {
    try {
      const { user, params } = req;
      const { id } = params;
      
      if (!user || !user.id || !user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const success = await this.pipelineService.deleteStage(id, user.companyId, user.id);
      
      if (!success) {
        res.status(404).json({ message: 'Stage not found' });
        return;
      }
      
      res.json({ message: 'Stage deleted successfully' });
    } catch (error) {
      console.error('Error deleting pipeline stage:', error);
      res.status(500).json({ 
        message: 'Failed to delete pipeline stage', 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * Get stages for a pipeline
   */
  private async getStages(req: Request, res: Response): Promise<void> {
    try {
      const { user, params, query } = req;
      const { pipelineId } = params;
      
      if (!user || !user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      // Parse query parameters
      const includeInactive = query.includeInactive === 'true';
      
      const stages = await this.pipelineService.getStages(pipelineId, user.companyId, includeInactive);
      res.json(stages);
    } catch (error) {
      console.error('Error getting pipeline stages:', error);
      res.status(500).json({ 
        message: 'Failed to get pipeline stages', 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * Reorder pipeline stages
   */
  private async reorderStages(req: Request, res: Response): Promise<void> {
    try {
      const { user, params, body } = req;
      const { pipelineId } = params;
      const { stageIds } = body;
      
      if (!user || !user.id || !user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      if (!Array.isArray(stageIds) || stageIds.length === 0) {
        res.status(400).json({ message: 'Invalid stageIds array' });
        return;
      }
      
      const success = await this.pipelineService.reorderStages(pipelineId, user.companyId, stageIds, user.id);
      
      if (!success) {
        res.status(404).json({ message: 'Failed to reorder stages' });
        return;
      }
      
      res.json({ message: 'Stages reordered successfully' });
    } catch (error) {
      console.error('Error reordering pipeline stages:', error);
      res.status(500).json({ 
        message: 'Failed to reorder pipeline stages', 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * Get all stages across all pipelines
   */
  private async getAllStages(req: Request, res: Response): Promise<void> {
    try {
      const { user } = req;
      
      if (!user || !user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const stages = await this.pipelineService.getAllStages(user.companyId);
      res.json(stages);
    } catch (error) {
      console.error('Error getting all stages:', error);
      res.status(500).json({ 
        message: 'Failed to get all stages', 
        error: (error as Error).message 
      });
    }
  }
}