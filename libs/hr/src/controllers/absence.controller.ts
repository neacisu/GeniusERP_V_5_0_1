/**
 * Absence Controller
 * 
 * Handles HTTP requests related to employee absences, including:
 * - Recording employee absences (sick leave, vacation, etc.)
 * - Approving/denying absence requests
 * - Retrieving absence records
 */

import { Router, Request, Response } from 'express';
import { AbsenceService, AbsenceStatus } from '../services/absence.service';
import { AuthGuard } from '@geniuserp/auth';
import { JwtAuthMode } from '@geniuserp/auth';
import { AuthenticatedRequest, JwtUserData } from '../../../types/express';
import { createModuleLogger } from "@common/logger/loki-logger";

// Initialize logger
const logger = createModuleLogger('AbsenceController');

export class AbsenceController {
  constructor(private readonly absenceService: AbsenceService) {}

  registerRoutes(router: Router) {
    // Absence endpoints
    router.post('/absences',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard(['hr_team', 'admin']),
      this.createAbsence.bind(this)
    );
    router.get('/absences/employee/:id',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard(['hr_team', 'admin']),
      this.getEmployeeAbsences.bind(this)
    );
    router.put('/absences/:id/approve',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard(['hr_team', 'admin']),
      this.approveAbsence.bind(this)
    );
    router.put('/absences/:id/deny',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard(['hr_team', 'admin']),
      this.denyAbsence.bind(this)
    );
    router.get('/absences/pending',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard(['hr_team', 'admin']),
      this.getPendingAbsences.bind(this)
    );
  }

  /**
   * Create a new absence record
   */
  async createAbsence(req: Request, res: Response) {
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
      
      const user = req.user as JwtUserData;
      if (!user.companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
      const result = await this.absenceService.requestAbsence(
        employeeId,
        user.companyId,
        new Date(startDate),
        new Date(endDate),
        type as any,
        reason || '',
        null, // medicalCertificateNumber
        documentUrl,
        user.id
      );
      
      res.status(201).json(result);
    } catch (error: any) {
      logger.error('Error recording absence:', error);
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * Get all absences for a specific employee
   */
  async getEmployeeAbsences(req: Request, res: Response) {
    try {
      const employeeId = req.params.id;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      
      const user = req.user as JwtUserData;
      if (!user.companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
      const absences = await this.absenceService.getEmployeeAbsences(
        user.companyId,
        employeeId,
        year
      );
      
      res.json(absences);
    } catch (error: any) {
      logger.error('Error retrieving employee absences:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Approve an absence request
   */
  async approveAbsence(req: Request, res: Response) {
    try {
      const absenceId = req.params.id;
      const comments = req.body.comments;
      
      const user = req.user as JwtUserData;
      const result = await this.absenceService.reviewAbsence(
        absenceId,
        true,
        comments,
        user.id
      );
      
      res.json(result);
    } catch (error: any) {
      logger.error('Error approving absence:', error);
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * Deny an absence request
   */
  async denyAbsence(req: Request, res: Response) {
    try {
      const absenceId = req.params.id;
      const reason = req.body.reason;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Denial reason is required'
        });
      }

      const user = req.user as JwtUserData;
      const result = await this.absenceService.reviewAbsence(
        absenceId,
        false,
        reason,
        user.id
      );
      
      res.json(result);
    } catch (error: any) {
      logger.error('Error denying absence:', error);
      res.status(400).json({ error: (error as Error).message });
    }
  }

  /**
   * Get all pending absence requests
   */
  async getPendingAbsences(req: Request, res: Response) {
    try {
      const user = req.user as JwtUserData;
      if (!user.companyId) {
        return res.status(400).json({ error: 'Company ID is required' });
      }
      // Get all absences with status 'requested' (pending)
      const pendingAbsences = await this.absenceService.getEmployeeAbsences(
        user.companyId,
        undefined, // no employee filter
        undefined, // no year filter
        AbsenceStatus.REQUESTED
      );
      
      res.json(pendingAbsences);
    } catch (error: any) {
      logger.error('Error retrieving pending absences:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  }
}