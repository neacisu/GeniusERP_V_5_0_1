/**
 * Absence Controller
 * 
 * Handles HTTP requests related to employee absences, including:
 * - Recording employee absences (sick leave, vacation, etc.)
 * - Approving/denying absence requests
 * - Retrieving absence records
 */

import { Router, Response } from 'express';
import { AbsenceService } from '../services/absence.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { AuthenticatedRequest } from '../../../types/express';
import { Logger } from '../../../common/logger';

// Initialize logger
const logger = new Logger('AbsenceController');

export class AbsenceController {
  constructor(private readonly absenceService: AbsenceService) {}

  registerRoutes(router: Router) {
    // Absence endpoints
    router.post('/absences', this.createAbsence.bind(this));
    router.get('/absences/employee/:id', this.getEmployeeAbsences.bind(this));
    router.put('/absences/:id/approve', this.approveAbsence.bind(this));
    router.put('/absences/:id/deny', this.denyAbsence.bind(this));
    router.get('/absences/pending', this.getPendingAbsences.bind(this));
  }

  /**
   * Create a new absence record
   */
  async createAbsence(req: AuthenticatedRequest, res: Response) {
    try {
      const { 
        employeeId, 
        startDate, 
        endDate, 
        type, 
        reason, 
        documentUrl 
      } = req.body;
      
      if (!employeeId || !startDate || !endDate || !type) {
        return res.status(400).json({ 
          success: false, 
          message: 'Employee ID, start date, end date, and type are required' 
        });
      }
      
      const result = await this.absenceService.recordAbsence(
        req.user.companyId,
        employeeId,
        new Date(startDate),
        new Date(endDate),
        type,
        reason,
        documentUrl,
        req.user.id
      );
      
      res.status(201).json(result);
    } catch (error) {
      logger.error('Error recording absence:', error);
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * Get all absences for a specific employee
   */
  async getEmployeeAbsences(req: AuthenticatedRequest, res: Response) {
    try {
      const employeeId = req.params.id;
      const year = req.query.year ? parseInt(req.query.year as string) : null;
      
      const absences = await this.absenceService.getEmployeeAbsences(
        employeeId,
        req.user.companyId,
        year
      );
      
      res.json(absences);
    } catch (error) {
      logger.error('Error retrieving employee absences:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Approve an absence request
   */
  async approveAbsence(req: AuthenticatedRequest, res: Response) {
    try {
      const absenceId = req.params.id;
      const comments = req.body.comments;
      
      const result = await this.absenceService.approveAbsence(
        absenceId,
        req.user.id,
        comments
      );
      
      res.json(result);
    } catch (error) {
      logger.error('Error approving absence:', error);
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * Deny an absence request
   */
  async denyAbsence(req: AuthenticatedRequest, res: Response) {
    try {
      const absenceId = req.params.id;
      const reason = req.body.reason;
      
      if (!reason) {
        return res.status(400).json({ 
          success: false, 
          message: 'Denial reason is required' 
        });
      }
      
      const result = await this.absenceService.denyAbsence(
        absenceId,
        req.user.id,
        reason
      );
      
      res.json(result);
    } catch (error) {
      logger.error('Error denying absence:', error);
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * Get all pending absence requests
   */
  async getPendingAbsences(req: AuthenticatedRequest, res: Response) {
    try {
      const pendingAbsences = await this.absenceService.getPendingAbsences(
        req.user.companyId
      );
      
      res.json(pendingAbsences);
    } catch (error) {
      logger.error('Error retrieving pending absences:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
}