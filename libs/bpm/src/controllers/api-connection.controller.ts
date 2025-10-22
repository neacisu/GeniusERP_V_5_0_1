/**
 * API Connection Controller
 * 
 * This controller handles API connection-related operations and implements the business logic
 * for managing external API connections, authentication, and testing.
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { Logger } from '../../../common/logger';
import { ApiConnectionService } from '../services/api-connection.service';
import { AuditService, AuditAction } from '../../../modules/audit/services/audit.service';
import { BpmApiConnectionType } from '../schema/bpm.schema';

// Validation schemas
const createConnectionSchema = z.object({
  name: z.string().min(3).max(100),
  type: z.nativeEnum(BpmApiConnectionType),
  description: z.string().optional().nullable(),
  configuration: z.record(z.string(), z.any()),
  isActive: z.boolean().optional(),
});

const updateConnectionSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  type: z.nativeEnum(BpmApiConnectionType).optional(),
  description: z.string().optional().nullable(),
  configuration: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().optional(),
});

/**
 * API Connection Controller Class
 */
export class ApiConnectionController {
  private _logger: Logger;
  private _apiConnectionService: ApiConnectionService;

  /**
   * Constructor
   */
  constructor(apiConnectionService: ApiConnectionService) {
    this._logger = new Logger('ApiConnectionController');
    this._apiConnectionService = apiConnectionService;
  }

  /**
   * Get all API connections for a company
   */
  async getApiConnections(req: Request, res: Response): Promise<Response> {
    try {
      const companyId = req.user?.companyId;
      const { provider, isActive, page, limit, search } = req.query;

      if (!companyId) {
        return res.status(400).json({ 
          success: false,
          error: 'Company ID is required' 
        });
      }

      const filter: any = {
        provider: provider as string,
        isActive: isActive === 'true',
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 25,
        search: search as string,
      };

      const connections = await this._apiConnectionService.getApiConnections(companyId, filter);
      
      return res.status(200).json({
        success: true,
        data: connections
      });
    } catch (error) {
      this._logger.error('Error getting API connections', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      return res.status(500).json({ 
        success: false,
        error: 'Failed to get API connections' 
      });
    }
  }

  /**
   * Get an API connection by ID
   */
  async getApiConnectionById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ 
          success: false,
          error: 'Company ID is required' 
        });
      }
      
      const connection = await this._apiConnectionService.getApiConnection(id, companyId);
      
      if (!connection) {
        return res.status(404).json({ 
          success: false,
          error: 'API connection not found' 
        });
      }
      
      return res.status(200).json({
        success: true,
        data: connection
      });
    } catch (error) {
      this._logger.error('Error getting API connection', { 
        error: error instanceof Error ? error.message : String(error), 
        id: req.params.id 
      });
      
      return res.status(500).json({ 
        success: false,
        error: 'Failed to get API connection' 
      });
    }
  }

  /**
   * Create a new API connection
   */
  async createApiConnection(req: Request, res: Response): Promise<Response> {
    try {
      const validatedData = createConnectionSchema.parse(req.body);
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ 
          success: false,
          error: 'User and company information are required' 
        });
      }

      const connection = await this._apiConnectionService.createApiConnection({
        ...validatedData,
        companyId,
        createdBy: userId,
        updatedBy: userId
      });

      // Record audit log
      await AuditService.log({
        userId,
        companyId,
        action: AuditAction.CREATE,
        entity: 'bpm_api_connection',
        entityId: connection.id,
        details: {
          name: connection.name,
          type: connection.type
        }
      });

      return res.status(201).json({
        success: true,
        data: connection
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false,
          error: 'Validation error',
          details: error.issues 
        });
      }
      
      this._logger.error('Error creating API connection', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      
      return res.status(500).json({ 
        success: false,
        error: 'Failed to create API connection' 
      });
    }
  }

  /**
   * Update an API connection
   */
  async updateApiConnection(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const validatedData = updateConnectionSchema.parse(req.body);
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ 
          success: false,
          error: 'User and company information are required' 
        });
      }

      // Check if connection exists and belongs to the company
      const existingConnection = await this._apiConnectionService.getApiConnection(id, companyId);
      if (!existingConnection) {
        return res.status(404).json({ 
          success: false,
          error: 'API connection not found' 
        });
      }

      const connection = await this._apiConnectionService.updateApiConnection(id, companyId, {
        ...validatedData,
        updatedBy: userId
      });

      // Record audit log
      await AuditService.log({
        userId,
        companyId,
        action: AuditAction.UPDATE,
        entity: 'bpm_api_connection',
        entityId: id,
        details: {
          changes: validatedData
        }
      });

      return res.status(200).json({
        success: true,
        data: connection
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false,
          error: 'Validation error',
          details: error.issues 
        });
      }
      
      this._logger.error('Error updating API connection', { 
        error: error instanceof Error ? error.message : String(error), 
        id: req.params.id 
      });
      
      return res.status(500).json({ 
        success: false,
        error: 'Failed to update API connection' 
      });
    }
  }

  /**
   * Delete an API connection
   */
  async deleteApiConnection(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;
      const userId = req.user?.id;
      
      if (!companyId || !userId) {
        return res.status(400).json({ 
          success: false,
          error: 'User and company information are required' 
        });
      }
      
      // Check if connection exists and belongs to the company
      const existingConnection = await this._apiConnectionService.getApiConnection(id, companyId);
      if (!existingConnection) {
        return res.status(404).json({ 
          success: false,
          error: 'API connection not found' 
        });
      }

      const success = await this._apiConnectionService.deleteApiConnection(id, companyId);
      
      // Record audit log
      await AuditService.log({
        userId,
        companyId,
        action: AuditAction.DELETE,
        entity: 'bpm_api_connection',
        entityId: id,
        details: {
          name: existingConnection.name,
          type: existingConnection.type
        }
      });
      
      return res.status(200).json({ 
        success: true,
        message: 'API connection deleted successfully' 
      });
    } catch (error) {
      this._logger.error('Error deleting API connection', { 
        error: error instanceof Error ? error.message : String(error), 
        id: req.params.id 
      });
      
      return res.status(500).json({ 
        success: false,
        error: 'Failed to delete API connection' 
      });
    }
  }

  /**
   * Test an API connection
   */
  async testApiConnection(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;
      const userId = req.user?.id;

      if (!companyId || !userId) {
        return res.status(400).json({ 
          success: false,
          error: 'User and company information are required' 
        });
      }

      // Check if connection exists and belongs to the company
      const existingConnection = await this._apiConnectionService.getApiConnection(id, companyId);
      if (!existingConnection) {
        return res.status(404).json({ 
          success: false,
          error: 'API connection not found' 
        });
      }

      const testResult = await this._apiConnectionService.testApiConnection(id, companyId);
      
      // Record audit log
      await AuditService.log({
        userId,
        companyId,
        action: 'BPM_PROCESS_ACTION',
        entity: 'bpm_api_connection',
        entityId: id,
        details: {
          operation: 'test_connection',
          success: testResult.success
        }
      });
      
      return res.status(200).json({
        success: true,
        data: testResult
      });
    } catch (error) {
      this._logger.error('Error testing API connection', { 
        error: error instanceof Error ? error.message : String(error), 
        id: req.params.id 
      });
      
      return res.status(500).json({ 
        success: false,
        error: 'Failed to test API connection' 
      });
    }
  }
}