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

import { getDrizzle } from "@common/drizzle";
import { hr_absences, employees, hr_employment_contracts, hr_departments } from '@geniuserp/shared/schema/hr.schema';
import { v4 as uuidv4 } from 'uuid';
import { AuditService } from '@geniuserp/audit';
import { AuditAction, AuditResourceType } from "@common/enums/audit.enum";
import { eq, and, gte, lte, sql, between, or, inArray } from 'drizzle-orm';
import { addDays, differenceInCalendarDays, differenceInBusinessDays, isWeekend } from 'date-fns';

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
      
      // Convert dates to strings for PostgreSQL
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Check for overlapping absences using Drizzle ORM
      const overlappingAbsences = await this.db
        .select()
        .from(absences)
        .where(
          and(
            eq(absences.employeeId, employeeId),
            inArray(absences.status, ['requested', 'approved']),
            or(
              and(lte(absences.startDate, startDateStr), gte(absences.endDate, startDateStr)),
              and(lte(absences.startDate, endDateStr), gte(absences.endDate, endDateStr)),
              and(gte(absences.startDate, startDateStr), lte(absences.endDate, endDateStr))
            )
          )
        );
      
      if (overlappingAbsences && overlappingAbsences.length > 0) {
        throw new Error('Overlapping absence already exists');
      }
      
      // Additional validation for medical leave
      if (type === AbsenceType.MEDICAL && !medicalCertificateNumber) {
        throw new Error('Medical certificate number is required for medical leave');
      }
      
      // Create absence record using Drizzle ORM
      const absenceId = uuidv4();
      await this.db
        .insert(absences)
        .values({
          id: absenceId,
          companyId,
          employeeId,
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          absenceType: type,
          notes: description,
          workingDays: totalDays.toString(),
          status: AbsenceStatus.REQUESTED,
          medicalCertificateNumber,
          medicalCertificateFilePath,
          createdBy: userId,
          updatedBy: userId
        });
      
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
    } catch (error: any) {
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
      // Find absence using Drizzle ORM
      const absence = await this.db
        .select()
        .from(absences)
        .where(eq(absences.id, absenceId))
        .limit(1);
      
      if (!absence || absence.length === 0) {
        throw new Error('Absence record not found');
      }
      
      if (absence[0].status !== AbsenceStatus.REQUESTED) {
        throw new Error(`Cannot review absence in ${absence[0].status} status`);
      }
      
      const newStatus = approved ? AbsenceStatus.APPROVED : AbsenceStatus.REJECTED;
      
      // Update the absence status using Drizzle ORM
      await this.db
        .update(absences)
        .set({
          status: newStatus,
          rejectionReason: comment,
          approvedBy: userId,
          approvedAt: new Date().toISOString(),
          updatedBy: userId,
          updatedAt: new Date().toISOString()
        })
        .where(eq(absences.id, absenceId));
      
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
    } catch (error: any) {
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
      // Find absence using Drizzle ORM
      const absence = await this.db
        .select()
        .from(absences)
        .where(eq(absences.id, absenceId))
        .limit(1);
      
      if (!absence || absence.length === 0) {
        throw new Error('Absence record not found');
      }
      
      if (![AbsenceStatus.REQUESTED, AbsenceStatus.APPROVED].includes(absence[0].status as AbsenceStatus)) {
        throw new Error(`Cannot cancel absence in ${absence[0].status} status`);
      }
      
      // Update the absence status using Drizzle ORM
      await this.db
        .update(absences)
        .set({
          status: AbsenceStatus.CANCELLED,
          rejectionReason: reason,
          updatedBy: userId,
          updatedAt: new Date().toISOString()
        })
        .where(eq(absences.id, absenceId));
      
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
    } catch (error: any) {
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
      // Build WHERE conditions dynamically
      const conditions = [eq(absences.companyId, companyId)];
      
      if (employeeId) {
        conditions.push(eq(absences.employeeId, employeeId));
      }
      
      if (year) {
        conditions.push(sql`EXTRACT(YEAR FROM ${absences.startDate}) = ${year}`);
      }
      
      if (status) {
        conditions.push(eq(absences.status, status));
      }
      
      // Query using Drizzle ORM with JOIN
      const result = await this.db
        .select({
          // Absence fields
          id: hr_absences.id,
          companyId: hr_absences.companyId,
          employeeId: hr_absences.employeeId,
          startDate: hr_absences.startDate,
          endDate: hr_absences.endDate,
          workingDays: hr_absences.workingDays,
          absenceType: hr_absences.absenceType,
          absenceCode: hr_absences.absenceCode,
          status: hr_absences.status,
          approvedBy: hr_absences.approvedBy,
          approvedAt: hr_absences.approvedAt,
          rejectionReason: hr_absences.rejectionReason,
          medicalCertificateNumber: hr_absences.medicalCertificateNumber,
          medicalCertificateDate: hr_absences.medicalCertificateDate,
          medicalCertificateFilePath: hr_absences.medicalCertificateFilePath,
          notes: hr_absences.notes,
          createdAt: hr_absences.createdAt,
          updatedAt: hr_absences.updatedAt,
          createdBy: hr_absences.createdBy,
          updatedBy: hr_absences.updatedBy,
          // Employee fields
          firstName: employees.firstName,
          lastName: employees.lastName
        })
        .from(absences)
        .innerJoin(employees, eq(absences.employeeId, employees.id))
        .where(and(...conditions))
        .orderBy(sql`${absences.startDate} DESC`);
      
      return result || [];
    } catch (error: any) {
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
      // Get employee's annual vacation days from contract using Drizzle ORM
      const employeeContract = await this.db
        .select({
          annualLeaveEntitlement: hr_employment_contracts.annualLeaveEntitlement
        })
        .from(employmentContracts)
        .where(
          and(
            eq(employmentContracts.employeeId, employeeId),
            eq(employmentContracts.status, 'active')
          )
        )
        .limit(1);
      
      if (!employeeContract || employeeContract.length === 0) {
        throw new Error('No active contract found for employee');
      }
      
      const totalVacationDays = employeeContract[0].annualLeaveEntitlement || 21;
      
      // Get used vacation days for the year using Drizzle ORM
      const usedDaysResult = await this.db
        .select({
          usedDays: sql<number>`COALESCE(SUM(CAST(${absences.workingDays} AS numeric)), 0)`
        })
        .from(absences)
        .where(
          and(
            eq(absences.employeeId, employeeId),
            eq(absences.absenceType, AbsenceType.VACATION),
            eq(absences.status, AbsenceStatus.APPROVED),
            sql`EXTRACT(YEAR FROM ${absences.startDate}) = ${year}`
          )
        );
      
      const usedVacationDays = Number(usedDaysResult[0]?.usedDays) || 0;
      
      return {
        employeeId,
        year,
        totalVacationDays,
        usedVacationDays,
        remainingVacationDays: totalVacationDays - usedVacationDays
      };
    } catch (error: any) {
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
      const futureDate = new Date();
      futureDate.setDate(now.getDate() + days);
      
      const nowStr = now.toISOString().split('T')[0];
      const futureDateStr = futureDate.toISOString().split('T')[0];
      
      // Query using Drizzle ORM with JOINs
      const result = await this.db
        .select({
          // Absence fields
          id: hr_absences.id,
          companyId: hr_absences.companyId,
          employeeId: hr_absences.employeeId,
          startDate: hr_absences.startDate,
          endDate: hr_absences.endDate,
          workingDays: hr_absences.workingDays,
          absenceType: hr_absences.absenceType,
          status: hr_absences.status,
          notes: hr_absences.notes,
          // Employee fields  
          firstName: employees.firstName,
          lastName: employees.lastName,
          position: employees.position,
          // Department name
          departmentName: hr_departments.name
        })
        .from(absences)
        .innerJoin(employees, eq(absences.employeeId, employees.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .where(
          and(
            eq(absences.companyId, companyId),
            eq(absences.status, AbsenceStatus.APPROVED),
            lte(absences.startDate, futureDateStr),
            gte(absences.endDate, nowStr)
          )
        )
        .orderBy(sql`${absences.startDate} ASC`);
      
      return result || [];
    } catch (error: any) {
      console.error('Error retrieving upcoming company absences:', error);
      throw new Error(`Failed to retrieve upcoming company absences: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}