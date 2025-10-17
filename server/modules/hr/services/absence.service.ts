/**
 * Absence Service
 * 
 * This service handles employee absence management including:
 * - Vacation tracking and approval
 * - Medical leave recording
 * - Legal holiday tracking
 * - Leave balance calculations
 * - Handling of Romanian-specific medical leave policies
 */

import { getDrizzle } from '../../../common/drizzle';
import { absences } from '../schema';
import { v4 as uuidv4 } from 'uuid';
import { AuditService } from '../../audit/services/audit.service';
import { AuditAction, AuditResourceType } from '../../../common/enums/audit.enum';

// Absence types according to Romanian labor law
export enum AbsenceType {
  VACATION = 'vacation',                 // Concediu de odihnă
  MEDICAL = 'medical',                   // Concediu medical
  UNPAID = 'unpaid',                     // Concediu fără plată
  PATERNITY = 'paternity',               // Concediu de paternitate
  MATERNITY = 'maternity',               // Concediu de maternitate
  CHILDCARE = 'childcare',               // Concediu îngrijire copil
  DEATH_IN_FAMILY = 'death_in_family',   // Concediu deces în familie
  MARRIAGE = 'marriage',                 // Concediu căsătorie
  LEGAL_HOLIDAY = 'legal_holiday',       // Sărbătoare legală
  BLOOD_DONATION = 'blood_donation',     // Donare de sânge
  STUDY = 'study',                       // Concediu studii
  TRAINING = 'training',                 // Concediu profesional
  RELOCATION = 'relocation',             // Concediu relocare
  OTHER = 'other'                        // Altele
}

// Absence status in approval workflow
export enum AbsenceStatus {
  REQUESTED = 'requested',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

export class AbsenceService {
  private db: any;
  private auditService: AuditService;

  constructor() {
    this.db = getDrizzle();
    this.auditService = new AuditService();
  }

  /**
   * Request a new absence period for an employee
   * 
   * @param employeeId Employee ID
   * @param companyId Company ID
   * @param startDate Start date of absence
   * @param endDate End date of absence
   * @param type Type of absence
   * @param description Optional description
   * @param medicalCertificateNumber Medical certificate number (for medical leave)
   * @param userId User ID requesting the absence
   */
  async requestAbsence(
    employeeId: string,
    companyId: string,
    startDate: Date,
    endDate: Date,
    type: AbsenceType,
    description: string,
    medicalCertificateNumber: string | null,
    medicalCertificateFilePath: string | null,
    userId: string
  ) {
    try {
      // Calculate total absence days (excluding weekends for certain types)
      const totalDays = this.calculateBusinessDays(startDate, endDate, type);
      
      // Basic validation
      if (startDate > endDate) {
        throw new Error('Start date cannot be after end date');
      }
      
      if (totalDays <= 0) {
        throw new Error('Invalid absence period');
      }
      
      // Check for overlapping absences
      const overlappingAbsences = await this.db.query(
        `SELECT * FROM hr_absences 
         WHERE employee_id = $1 
         AND status IN ('requested', 'approved')
         AND ((start_date <= $2 AND end_date >= $2) 
           OR (start_date <= $3 AND end_date >= $3)
           OR (start_date >= $2 AND end_date <= $3))`,
        [employeeId, startDate, endDate]
      );
      
      if (overlappingAbsences.rows && overlappingAbsences.rows.length > 0) {
        throw new Error('Overlapping absence already exists');
      }
      
      // Additional validation for medical leave
      if (type === AbsenceType.MEDICAL && !medicalCertificateNumber) {
        throw new Error('Medical certificate number is required for medical leave');
      }
      
      // Create absence record
      const absenceId = uuidv4();
      await this.db.query(
        `INSERT INTO hr_absences (
          id, company_id, employee_id, start_date, end_date,
          type, description, total_days, status,
          medical_certificate_number, medical_certificate_file_path,
          created_by
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9,
          $10, $11,
          $12
        )`,
        [
          absenceId, companyId, employeeId, startDate, endDate,
          type, description, totalDays, AbsenceStatus.REQUESTED,
          medicalCertificateNumber, medicalCertificateFilePath,
          userId
        ]
      );
      
      // Audit the absence request
      await this.auditService.logAction({
        userId,
        action: AuditAction.CREATE,
        resourceType: AuditResourceType.ABSENCE,
        resourceId: absenceId,
        metadata: {
          employeeId,
          companyId,
          type,
          startDate: typeof startDate === 'string' ? startDate : startDate.toISOString(),
          endDate: typeof endDate === 'string' ? endDate : endDate.toISOString(),
          totalDays,
          status: AbsenceStatus.REQUESTED
        }
      });
      
      return {
        id: absenceId,
        employeeId,
        startDate,
        endDate,
        type,
        totalDays,
        status: AbsenceStatus.REQUESTED
      };
    } catch (error) {
      console.error('Error requesting absence:', error);
      throw new Error(`Failed to request absence: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Calculate business days between two dates
   * For certain absence types like vacation, we exclude weekends
   * For others like medical leave, we count all calendar days
   * 
   * @param startDate Start date
   * @param endDate End date
   * @param type Absence type
   * @returns Number of business days
   */
  private calculateBusinessDays(startDate: Date, endDate: Date, type: AbsenceType): number {
    // For certain types, we count calendar days including weekends
    const countAllDays = [
      AbsenceType.MEDICAL,
      AbsenceType.MATERNITY,
      AbsenceType.PATERNITY,
      AbsenceType.CHILDCARE
    ].includes(type);
    
    if (countAllDays) {
      // Simple day difference calculation including weekends
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include the end day
    } else {
      // Business days calculation (excluding weekends)
      let count = 0;
      const curDate = new Date(startDate.getTime());
      
      while (curDate <= endDate) {
        const dayOfWeek = curDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) count++; // Skip Saturday and Sunday
        curDate.setDate(curDate.getDate() + 1);
      }
      
      return count;
    }
  }

  /**
   * Approve or reject an absence request
   * 
   * @param absenceId Absence ID
   * @param approved Whether to approve (true) or reject (false)
   * @param comment Optional comment
   * @param userId User ID performing the action
   */
  async reviewAbsence(absenceId: string, approved: boolean, comment: string, userId: string) {
    try {
      const absence = await this.db.query(
        `SELECT * FROM hr_absences WHERE id = $1`,
        [absenceId]
      );
      
      if (!absence.rows || absence.rows.length === 0) {
        throw new Error('Absence record not found');
      }
      
      if (absence.rows[0].status !== AbsenceStatus.REQUESTED) {
        throw new Error(`Cannot review absence in ${absence.rows[0].status} status`);
      }
      
      const newStatus = approved ? AbsenceStatus.APPROVED : AbsenceStatus.REJECTED;
      
      // Update the absence status
      await this.db.query(
        `UPDATE hr_absences
         SET status = $1, review_comment = $2, reviewed_by = $3, reviewed_at = NOW(), updated_by = $3, updated_at = NOW()
         WHERE id = $4`,
        [newStatus, comment, userId, absenceId]
      );
      
      // Audit the review
      await this.auditService.logAction({
        userId,
        action: AuditAction.UPDATE,
        resourceType: AuditResourceType.ABSENCE,
        resourceId: absenceId,
        metadata: {
          absenceId,
          status: newStatus,
          comment
        }
      });
      
      return {
        id: absenceId,
        status: newStatus,
        message: approved ? 'Absence approved successfully' : 'Absence rejected',
        comment
      };
    } catch (error) {
      console.error('Error reviewing absence:', error);
      throw new Error(`Failed to review absence: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Cancel an existing absence
   * 
   * @param absenceId Absence ID
   * @param reason Cancellation reason
   * @param userId User ID performing the cancellation
   */
  async cancelAbsence(absenceId: string, reason: string, userId: string) {
    try {
      const absence = await this.db.query(
        `SELECT * FROM hr_absences WHERE id = $1`,
        [absenceId]
      );
      
      if (!absence.rows || absence.rows.length === 0) {
        throw new Error('Absence record not found');
      }
      
      if (![AbsenceStatus.REQUESTED, AbsenceStatus.APPROVED].includes(absence.rows[0].status as AbsenceStatus)) {
        throw new Error(`Cannot cancel absence in ${absence.rows[0].status} status`);
      }
      
      // Update the absence status
      await this.db.query(
        `UPDATE hr_absences
         SET status = $1, cancellation_reason = $2, cancelled_by = $3, cancelled_at = NOW(), updated_by = $3, updated_at = NOW()
         WHERE id = $4`,
        [AbsenceStatus.CANCELLED, reason, userId, absenceId]
      );
      
      // Audit the cancellation
      await this.auditService.logAction({
        userId,
        action: AuditAction.UPDATE,
        resourceType: AuditResourceType.ABSENCE,
        resourceId: absenceId,
        metadata: {
          absenceId,
          status: AbsenceStatus.CANCELLED,
          reason
        }
      });
      
      return {
        id: absenceId,
        status: AbsenceStatus.CANCELLED,
        message: 'Absence cancelled successfully',
        reason
      };
    } catch (error) {
      console.error('Error cancelling absence:', error);
      throw new Error(`Failed to cancel absence: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get absences for employees in a company
   *
   * @param companyId Company ID
   * @param employeeId Optional employee ID (if not provided, gets all employees)
   * @param year Optional year filter
   * @param status Optional status filter
   */
  async getEmployeeAbsences(companyId: string, employeeId?: string, year?: number, status?: AbsenceStatus) {
    try {
      let query = `
        SELECT a.*, e.first_name, e.last_name
        FROM hr_absences a
        JOIN hr_employees e ON a.employee_id = e.id
        WHERE a.company_id = $1
      `;

      const params = [companyId];

      // If employeeId is provided, filter by specific employee
      if (employeeId) {
        query += ` AND a.employee_id = $${params.length + 1}`;
        params.push(employeeId);
      }
      
      if (year) {
        query += ` AND EXTRACT(YEAR FROM a.start_date) = $${params.length + 1}`;
        params.push(year.toString());
      }
      
      if (status) {
        query += ` AND a.status = $${params.length + 1}`;
        params.push(status);
      }
      
      query += ` ORDER BY a.start_date DESC`;
      
      const absences = await this.db.query(query, params);
      
      return absences.rows || [];
    } catch (error) {
      console.error('Error retrieving employee absences:', error);
      throw new Error(`Failed to retrieve employee absences: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Calculate remaining vacation days for an employee
   * 
   * @param employeeId Employee ID
   * @param year Year for calculation
   */
  async calculateRemainingVacationDays(employeeId: string, year: number) {
    try {
      // Get employee's annual vacation days from contract
      const employeeContract = await this.db.query(
        `SELECT ec.annual_vacation_days 
         FROM hr_employment_contracts ec
         WHERE ec.employee_id = $1 AND ec.status = 'active'`,
        [employeeId]
      );
      
      if (!employeeContract.rows || employeeContract.rows.length === 0) {
        throw new Error('No active contract found for employee');
      }
      
      const totalVacationDays = parseInt(employeeContract.rows[0].annual_vacation_days) || 0;
      
      // Get used vacation days for the year
      const usedDays = await this.db.query(
        `SELECT SUM(total_days) as used_days
         FROM hr_absences
         WHERE employee_id = $1 
         AND type = $2
         AND status = $3
         AND EXTRACT(YEAR FROM start_date) = $4`,
        [employeeId, AbsenceType.VACATION, AbsenceStatus.APPROVED, year]
      );
      
      const usedVacationDays = parseInt(usedDays.rows[0]?.used_days) || 0;
      
      return {
        employeeId,
        year,
        totalVacationDays,
        usedVacationDays,
        remainingVacationDays: totalVacationDays - usedVacationDays
      };
    } catch (error) {
      console.error('Error calculating remaining vacation days:', error);
      throw new Error(`Failed to calculate remaining vacation days: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get a list of upcoming absences for a company
   * 
   * @param companyId Company ID
   * @param days Number of days to look ahead
   */
  async getUpcomingCompanyAbsences(companyId: string, days: number = 30) {
    try {
      const now = new Date();
      const endDate = new Date();
      endDate.setDate(now.getDate() + days);
      
      const absences = await this.db.query(
        `SELECT a.*, e.first_name, e.last_name, e.position, d.name as department_name
         FROM hr_absences a
         JOIN hr_employees e ON a.employee_id = e.id
         LEFT JOIN hr_departments d ON e.department_id = d.id
         WHERE a.company_id = $1 
         AND a.status = $2
         AND a.start_date <= $4
         AND a.end_date >= $3
         ORDER BY a.start_date ASC`,
        [companyId, AbsenceStatus.APPROVED, now, endDate]
      );
      
      return absences.rows || [];
    } catch (error) {
      console.error('Error retrieving upcoming company absences:', error);
      throw new Error(`Failed to retrieve upcoming company absences: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}