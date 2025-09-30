/**
 * Revisal Controller
 * 
 * Handles HTTP requests related to Revisal (Romanian HR reporting system), including:
 * - Generating Revisal XML reports
 * - Managing Revisal submission logs
 * - Handling Revisal validation errors
 */

import { Router, Response } from 'express';
import { RevisalService } from '../services/revisal.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { AuthenticatedRequest } from '../../../types/express';
import { Logger } from '../../../common/logger';

// Initialize logger
const logger = new Logger('RevisalController');

export class RevisalController {
  constructor(private readonly revisalService: RevisalService) {}

  registerRoutes(router: Router) {
    // Revisal endpoints
    router.post('/revisal/generate', this.generateRevisalXml.bind(this));
    router.post('/revisal/validate', this.validateRevisalXml.bind(this));
    router.post('/revisal/submit-log', this.logRevisalSubmission.bind(this));
    router.get('/revisal/logs', this.getRevisalLogs.bind(this));
    router.get('/revisal/logs/:id', this.getRevisalLogById.bind(this));
  }

  /**
   * Generate Revisal XML file for submission
   */
  async generateRevisalXml(req: AuthenticatedRequest, res: Response) {
    try {
      const { reference, date, employeeIds } = req.body;
      
      if (!reference || !date) {
        return res.status(400).json({ 
          success: false, 
          message: 'Reference and date are required' 
        });
      }
      
      const result = await this.revisalService.generateRevisalXml(
        req.user.companyId,
        reference,
        new Date(date),
        employeeIds,
        req.user.id
      );
      
      res.json(result);
    } catch (error) {
      logger.error('Error generating Revisal XML:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Validate Revisal XML file
   */
  async validateRevisalXml(req: AuthenticatedRequest, res: Response) {
    try {
      const { xmlData } = req.body;
      
      if (!xmlData) {
        return res.status(400).json({ 
          success: false, 
          message: 'XML data is required' 
        });
      }
      
      const validationResult = await this.revisalService.validateRevisalXml(xmlData);
      
      res.json(validationResult);
    } catch (error) {
      logger.error('Error validating Revisal XML:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Log a Revisal submission
   */
  async logRevisalSubmission(req: AuthenticatedRequest, res: Response) {
    try {
      const { 
        reference, 
        submissionDate, 
        submissionMethod, 
        registrationNumber, 
        xmlPath, 
        notes 
      } = req.body;
      
      if (!reference || !submissionDate || !submissionMethod) {
        return res.status(400).json({ 
          success: false, 
          message: 'Reference, submission date, and submission method are required' 
        });
      }
      
      const result = await this.revisalService.logRevisalSubmission(
        req.user.companyId,
        reference,
        new Date(submissionDate),
        submissionMethod,
        registrationNumber,
        xmlPath,
        notes,
        req.user.id
      );
      
      res.status(201).json(result);
    } catch (error) {
      logger.error('Error logging Revisal submission:', error);
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * Get Revisal submission logs
   */
  async getRevisalLogs(req: AuthenticatedRequest, res: Response) {
    try {
      const year = req.query.year ? parseInt(req.query.year as string) : null;
      
      const logs = await this.revisalService.getRevisalLogs(
        req.user.companyId,
        year
      );
      
      res.json(logs);
    } catch (error) {
      logger.error('Error retrieving Revisal logs:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Get Revisal submission log by ID
   */
  async getRevisalLogById(req: AuthenticatedRequest, res: Response) {
    try {
      const log = await this.revisalService.getRevisalLogById(req.params.id);
      
      if (!log) {
        return res.status(404).json({ 
          success: false, 
          message: 'Revisal log not found' 
        });
      }
      
      res.json(log);
    } catch (error) {
      logger.error('Error retrieving Revisal log:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
}