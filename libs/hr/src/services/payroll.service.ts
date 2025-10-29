/**
 * Payroll Service
 * 
 * This service handles payroll calculations, processing, and recordkeeping
 * according to Romanian labor laws. It supports:
 * - Monthly payroll processing
 * - Tax calculations (CAS, CASS, income tax)
 * - Employer contributions
 * - Payslip generation
 * - Year-to-date totals
 */

import { employees, hr_payroll_logs, hr_employment_contracts } from '@geniuserp/shared/schema/hr.schema';
import { v4 as uuidv4 } from 'uuid';
import AuditService from '@geniuserp/audit';
import { AuditAction, AuditResourceType } from "@common/enums/audit.enum";
import { sql, eq, and, gte, lte, desc, sum, count } from 'drizzle-orm';
import { DrizzleService } from "@common/drizzle/drizzle.service";
import { getDrizzle } from "@common/drizzle";

export class PayrollService {
  private drizzle: DrizzleService;
  private db: any;
  private auditService: AuditService;

  constructor() {
    this.drizzle = new DrizzleService();
    this.db = getDrizzle();
    this.auditService = new AuditService();
  }

  /**
   * Calculate payroll for a specific employee
   * 
   * @param employeeId Employee ID
   * @param companyId Company ID
   * @param year Year for calculation
   * @param month Month for calculation (1-12)
   * @param userId User ID performing the action
   */
  async calculateEmployeePayroll(employeeId: string, companyId: string, year: number, month: number, userId: string) {
    try {
      // Get employee details including contract using Drizzle ORM
      const employeeData = await this.db
        .select({
          employeeId: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          baseSalaryGross: hr_employment_contracts.baseSalaryGross,
          contractType: hr_employment_contracts.contractType,
          contractId: hr_employment_contracts.id
        })
        .from(employees)
        .innerJoin(employmentContracts, eq(employees.id, employmentContracts.employeeId))
        .where(
          and(
            eq(employees.id, employeeId),
            eq(employees.companyId, companyId),
            eq(employmentContracts.status, 'active')
          )
        )
        .limit(1);
      
      if (!employeeData || employeeData.length === 0) {
        throw new Error('Employee not found or no active contract');
      }

      const employee = employeeData[0];
      const grossSalary = parseFloat(employee.baseSalaryGross as string);
      
      // Calculate Romanian tax values
      // CAS: 25% employee contribution to social security
      const casEmployeeAmount = grossSalary * 0.25;
      
      // CASS: 10% employee contribution to health insurance
      const cassEmployeeAmount = grossSalary * 0.10;
      
      // Deduction: 600 RON personal deduction (simplified for this example)
      const personalDeduction = 600;
      
      // Taxable income after social contributions and deductions
      const taxableIncome = grossSalary - casEmployeeAmount - cassEmployeeAmount - personalDeduction;
      
      // Income tax: 10% of taxable income
      const incomeTaxAmount = Math.max(0, taxableIncome * 0.10);
      
      // Net salary calculation
      const netSalary = grossSalary - casEmployeeAmount - cassEmployeeAmount - incomeTaxAmount;
      
      // CAM: 2.25% employer contribution to work insurance
      const camEmployerAmount = grossSalary * 0.0225;
      
      // Create payroll record using Drizzle ORM
      const payrollId = uuidv4();
      await this.db
        .insert(payrollLogs)
        .values({
          id: payrollId,
          companyId,
          employeeId,
          employmentContractId: employee.contractId,
          year,
          month,
          workingDaysInMonth: 22, // Poate fi calculat dinamic
          workedDays: '22',
          baseSalaryGross: grossSalary.toString(),
          grossTotal: grossSalary.toString(),
          casEmployeeAmount: casEmployeeAmount.toString(),
          cassEmployeeAmount: cassEmployeeAmount.toString(),
          incomeTaxAmount: incomeTaxAmount.toString(),
          personalDeduction: personalDeduction.toString(),
          netSalary: netSalary.toString(),
          camEmployerAmount: camEmployerAmount.toString(),
          status: 'calculated',
          createdBy: userId,
          updatedBy: userId
        });
      
      // Audit the payroll calculation
      await this.auditService.logAction({
        userId,
        action: AuditAction.CREATE,
        resourceType: AuditResourceType.PAYROLL,
        resourceId: payrollId,
        metadata: {
          companyId,
          employeeId,
          year,
          month,
          grossTotal: grossSalary,
          netSalary
        }
      });
      
      return {
        id: payrollId,
        employeeId,
        year,
        month,
        grossTotal: grossSalary,
        netSalary,
        status: 'calculated'
      };
    } catch (error: any) {
      console.error('Error calculating payroll:', error);
      throw new Error(`Failed to calculate payroll: ${error.message}`);
    }
  }

  /**
   * Process payroll for all active employees in a company
   * 
   * @param companyId Company ID
   * @param year Year for processing
   * @param month Month for processing (1-12)
   * @param userId User ID performing the action
   */
  async processCompanyPayroll(companyId: string, year: number, month: number, userId: string) {
    try {
      // Get all active employees with valid contracts using Drizzle ORM
      const activeEmployees = await this.db
        .select({
          id: employees.id
        })
        .from(employees)
        .innerJoin(employmentContracts, eq(employees.id, employmentContracts.employeeId))
        .where(
          and(
            eq(employees.companyId, companyId),
            eq(employees.isActive, true),
            eq(employmentContracts.status, 'active')
          )
        );
      
      if (!activeEmployees || activeEmployees.length === 0) {
        return { processed: 0, message: 'No active employees found' };
      }
      
      const results = [];
      
      // Process each employee's payroll
      for (const employee of activeEmployees) {
        try {
          const payrollResult = await this.calculateEmployeePayroll(
            employee.id, 
            companyId, 
            year, 
            month, 
            userId
          );
          results.push(payrollResult);
        } catch (employeeError) {
          console.error(`Error processing payroll for employee ${employee.id}:`, employeeError);
          // Continue with the next employee
        }
      }
      
      return {
        processed: results.length,
        total: activeEmployees.length,
        results
      };
    } catch (error: any) {
      console.error('Error processing company payroll:', error);
      throw new Error(`Failed to process company payroll: ${error.message}`);
    }
  }

  /**
   * Approve a calculated payroll record
   * 
   * @param payrollId Payroll record ID
   * @param userId User ID performing the approval
   */
  async approvePayroll(payrollId: string, userId: string) {
    try {
      const payroll = await this.drizzle.db.execute(
        sql`SELECT * FROM hr_payroll_logs WHERE id = ${payrollId}`
      );
      
      if (!payroll || payroll.length === 0) {
        throw new Error('Payroll record not found');
      }
      
      if (payroll[0].status !== 'calculated') {
        throw new Error(`Cannot approve payroll in ${payroll[0].status} status`);
      }
      
      // Update the payroll status
      // Update payroll status using Drizzle ORM
      await this.db
        .update(payrollLogs)
        .set({
          status: 'approved',
          updatedBy: userId,
          updatedAt: new Date().toISOString()
        })
        .where(eq(payrollLogs.id, payrollId));
      
      // Audit the approval
      await this.auditService.logAction({
        userId,
        action: AuditAction.UPDATE,
        resourceType: AuditResourceType.PAYROLL,
        resourceId: payrollId,
        metadata: {
          companyId: payroll[0].companyId,
          status: 'approved',
          payrollId
        }
      });
      
      return {
        id: payrollId,
        status: 'approved',
        message: 'Payroll approved successfully'
      };
    } catch (error: any) {
      console.error('Error approving payroll:', error);
      throw new Error(`Failed to approve payroll: ${error.message}`);
    }
  }

  /**
   * Get payroll details for an employee
   * 
   * @param employeeId Employee ID
   * @param year Year (optional)
   * @param month Month (optional)
   */
  async getEmployeePayroll(employeeId: string, year?: number, month?: number) {
    try {
      // Build WHERE conditions dynamically
      const conditions = [eq(payrollLogs.employeeId, employeeId)];
      
      if (year) {
        conditions.push(eq(payrollLogs.year, year));
      }
      
      if (month) {
        conditions.push(eq(payrollLogs.month, month));
      }
      
      // Query using Drizzle ORM with JOIN
      const payrollRecords = await this.db
        .select({
          // Payroll fields
          id: hr_payroll_logs.id,
          companyId: hr_payroll_logs.companyId,
          employeeId: hr_payroll_logs.employeeId,
          employmentContractId: hr_payroll_logs.employmentContractId,
          year: hr_payroll_logs.year,
          month: hr_payroll_logs.month,
          baseSalaryGross: hr_payroll_logs.baseSalaryGross,
          grossTotal: hr_payroll_logs.grossTotal,
          netSalary: hr_payroll_logs.netSalary,
          casEmployeeAmount: hr_payroll_logs.casEmployeeAmount,
          cassEmployeeAmount: hr_payroll_logs.cassEmployeeAmount,
          incomeTaxAmount: hr_payroll_logs.incomeTaxAmount,
          camEmployerAmount: hr_payroll_logs.camEmployerAmount,
          personalDeduction: hr_payroll_logs.personalDeduction,
          status: hr_payroll_logs.status,
          createdAt: hr_payroll_logs.createdAt,
          updatedAt: hr_payroll_logs.updatedAt,
          // Employee fields
          firstName: employees.firstName,
          lastName: employees.lastName
        })
        .from(payrollLogs)
        .innerJoin(employees, eq(payrollLogs.employeeId, employees.id))
        .where(and(...conditions))
        .orderBy(desc(payrollLogs.year), desc(payrollLogs.month));
      
      return payrollRecords || [];
    } catch (error: any) {
      console.error('Error retrieving employee payroll:', error);
      throw new Error(`Failed to retrieve employee payroll: ${(error as Error).message}`);
    }
  }

  /**
   * Get payroll summary for a company in a specific period
   * 
   * @param companyId Company ID
   * @param year Year for summary
   * @param month Month for summary (optional)
   */
  async getCompanyPayrollSummary(companyId: string, year: number, month?: number) {
    try {
      // Build WHERE conditions
      const conditions = [
        eq(payrollLogs.companyId, companyId),
        eq(payrollLogs.year, year)
      ];
      
      if (month) {
        conditions.push(eq(payrollLogs.month, month));
      }
      
      // Query using Drizzle ORM with aggregations
      const summary = await this.db
        .select({
          employeeCount: count(payrollLogs.id),
          totalGross: sql<number>`COALESCE(SUM(CAST(${payrollLogs.grossTotal} AS numeric)), 0)`,
          totalNet: sql<number>`COALESCE(SUM(CAST(${payrollLogs.netSalary} AS numeric)), 0)`,
          totalCasEmployee: sql<number>`COALESCE(SUM(CAST(${payrollLogs.casEmployeeAmount} AS numeric)), 0)`,
          totalCassEmployee: sql<number>`COALESCE(SUM(CAST(${payrollLogs.cassEmployeeAmount} AS numeric)), 0)`,
          totalIncomeTax: sql<number>`COALESCE(SUM(CAST(${payrollLogs.incomeTaxAmount} AS numeric)), 0)`,
          totalCamEmployer: sql<number>`COALESCE(SUM(CAST(${payrollLogs.camEmployerAmount} AS numeric)), 0)`
        })
        .from(payrollLogs)
        .where(and(...conditions));
      
      if (!summary || summary.length === 0) {
        return {
          employeeCount: 0,
          totalGross: 0,
          totalNet: 0,
          totalCasEmployee: 0,
          totalCassEmployee: 0,
          totalIncomeTax: 0,
          totalCamEmployer: 0
        };
      }
      
      return {
        employeeCount: Number(summary[0].employeeCount) || 0,
        totalGross: Number(summary[0].totalGross) || 0,
        totalNet: Number(summary[0].totalNet) || 0,
        totalCasEmployee: Number(summary[0].totalCasEmployee) || 0,
        totalCassEmployee: Number(summary[0].totalCassEmployee) || 0,
        totalIncomeTax: Number(summary[0].totalIncomeTax) || 0,
        totalCamEmployer: Number(summary[0].totalCamEmployer) || 0
      };
    } catch (error: any) {
      console.error('Error retrieving company payroll summary:', error);
      throw new Error(`Failed to retrieve company payroll summary: ${(error as Error).message}`);
    }
  }

  /**
   * Get payroll report for a company
   * 
   * @param companyId Company ID
   * @param year Year for report
   * @param month Month for report (optional)
   */
  async getPayrollReport(companyId: string, year: number, month?: number) {
    try {
      // Build WHERE conditions
      const conditions = [
        eq(payrollLogs.companyId, companyId),
        eq(payrollLogs.year, year)
      ];
      
      if (month) {
        conditions.push(eq(payrollLogs.month, month));
      }
      
      // Get detailed payroll data using Drizzle ORM
      const payrollData = await this.db
        .select({
          // Payroll log fields
          id: hr_payroll_logs.id,
          companyId: hr_payroll_logs.companyId,
          employeeId: hr_payroll_logs.employeeId,
          employmentContractId: hr_payroll_logs.employmentContractId,
          year: hr_payroll_logs.year,
          month: hr_payroll_logs.month,
          baseSalaryGross: hr_payroll_logs.baseSalaryGross,
          grossTotal: hr_payroll_logs.grossTotal,
          netSalary: hr_payroll_logs.netSalary,
          casEmployeeAmount: hr_payroll_logs.casEmployeeAmount,
          cassEmployeeAmount: hr_payroll_logs.cassEmployeeAmount,
          incomeTaxAmount: hr_payroll_logs.incomeTaxAmount,
          camEmployerAmount: hr_payroll_logs.camEmployerAmount,
          personalDeduction: hr_payroll_logs.personalDeduction,
          status: hr_payroll_logs.status,
          createdAt: hr_payroll_logs.createdAt,
          // Employee fields
          firstName: employees.firstName,
          lastName: employees.lastName,
          cnp: employees.cnp,
          // Contract fields
          contractNumber: hr_employment_contracts.contractNumber
        })
        .from(payrollLogs)
        .innerJoin(employees, eq(payrollLogs.employeeId, employees.id))
        .leftJoin(employmentContracts, eq(payrollLogs.employmentContractId, employmentContracts.id))
        .where(and(...conditions))
        .orderBy(employees.lastName, employees.firstName, payrollLogs.month);
      
      // Get summary data
      const summary = await this.getCompanyPayrollSummary(companyId, year, month);
      
      return {
        payrollData: payrollData || [],
        summary,
        year,
        month: month || null,
        generatedAt: new Date()
      };
    } catch (error: any) {
      console.error('Error generating payroll report:', error);
      throw new Error(`Failed to generate payroll report: ${(error as Error).message}`);
    }
  }

  /**
   * Get employee payroll history
   * Alias for getEmployeePayroll for backward compatibility
   * 
   * @param employeeId Employee ID
   * @param year Year (optional)
   * @param limit Limit of records to return
   */
  async getEmployeePayrollHistory(employeeId: string, year?: number, limit: number = 12) {
    try {
      // Build WHERE conditions
      const conditions = [eq(payrollLogs.employeeId, employeeId)];
      
      if (year) {
        conditions.push(eq(payrollLogs.year, year));
      }
      
      // Query using Drizzle ORM
      const history = await this.db
        .select({
          // Payroll log fields
          id: hr_payroll_logs.id,
          companyId: hr_payroll_logs.companyId,
          employeeId: hr_payroll_logs.employeeId,
          employmentContractId: hr_payroll_logs.employmentContractId,
          year: hr_payroll_logs.year,
          month: hr_payroll_logs.month,
          baseSalaryGross: hr_payroll_logs.baseSalaryGross,
          grossTotal: hr_payroll_logs.grossTotal,
          netSalary: hr_payroll_logs.netSalary,
          casEmployeeAmount: hr_payroll_logs.casEmployeeAmount,
          cassEmployeeAmount: hr_payroll_logs.cassEmployeeAmount,
          incomeTaxAmount: hr_payroll_logs.incomeTaxAmount,
          camEmployerAmount: hr_payroll_logs.camEmployerAmount,
          personalDeduction: hr_payroll_logs.personalDeduction,
          status: hr_payroll_logs.status,
          createdAt: hr_payroll_logs.createdAt,
          updatedAt: hr_payroll_logs.updatedAt,
          // Employee fields
          firstName: employees.firstName,
          lastName: employees.lastName,
          // Contract fields
          contractNumber: hr_employment_contracts.contractNumber
        })
        .from(payrollLogs)
        .innerJoin(employees, eq(payrollLogs.employeeId, employees.id))
        .leftJoin(employmentContracts, eq(payrollLogs.employmentContractId, employmentContracts.id))
        .where(and(...conditions))
        .orderBy(desc(payrollLogs.year), desc(payrollLogs.month))
        .limit(limit);
      
      return history || [];
    } catch (error: any) {
      console.error('Error retrieving employee payroll history:', error);
      throw new Error(`Failed to retrieve employee payroll history: ${(error as Error).message}`);
    }
  }

  /**
   * Export payroll data to CSV or Excel format
   * 
   * @param companyId Company ID
   * @param year Year for export
   * @param month Month for export (optional)
   * @param format Export format ('csv' or 'excel')
   */
  async exportPayroll(
    companyId: string,
    year: number,
    month?: number,
    format: 'csv' | 'excel' = 'csv'
  ) {
    try {
      // Get the payroll report data
      const reportData = await this.getPayrollReport(companyId, year, month);
      
      if (format === 'csv') {
        // Generate CSV content
        const headers = [
          'CNP',
          'Nume',
          'Prenume',
          'Luna',
          'An',
          'Salariu Brut',
          'CAS',
          'CASS',
          'Impozit',
          'Salariu Net',
          'Status'
        ].join(',');
        
        const rows = reportData.payrollData.map((record: any) => {
          return [
            record.cnp,
            record.last_name,
            record.first_name,
            record.month,
            record.year,
            record.gross_total,
            record.cas_employee_amount,
            record.cass_employee_amount,
            record.income_tax_amount,
            record.net_salary,
            record.status
          ].join(',');
        });
        
        const csvContent = [headers, ...rows].join('\n');
        
        return {
          content: csvContent,
          filename: `payroll_${year}_${month || 'all'}.csv`,
          mimeType: 'text/csv'
        };
      } else {
        // For Excel, return JSON that can be processed by a library like xlsx
        return {
          content: JSON.stringify(reportData.payrollData, null, 2),
          filename: `payroll_${year}_${month || 'all'}.json`,
          mimeType: 'application/json'
        };
      }
    } catch (error: any) {
      console.error('Error exporting payroll:', error);
      throw new Error(`Failed to export payroll: ${(error as Error).message}`);
    }
  }
}