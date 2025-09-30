/**
 * HR Module
 * 
 * This module manages all human resources functionality including:
 * - Payroll management
 * - Revisal compliance
 * - ANAF declarations
 * - Employee absences
 * - Sales agent commissions
 * - Employment contract tracking
 */

import { Router } from 'express';
import { getDrizzle } from '../../common/drizzle/drizzle.service';
import { PayrollService } from './services/payroll.service';
import { AbsenceService } from './services/absence.service';
import { RevisalService } from './services/revisal.service';
import { CommissionService } from './services/commission.service';
import { EmployeeService } from './services/employee.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { JwtAuthMode } from '../auth/models/auth.enum';

/**
 * HR Module implementation using the AuthGuard for protecting routes
 */
export class HrModule {
  static register() {
    const router = Router();
    const db = getDrizzle();
    const services = {} as Record<string, any>;
    // Use static methods from AuthGuard
    
    // Initialize services
    const payrollService = new PayrollService();
    const absenceService = new AbsenceService();
    const revisalService = new RevisalService();
    const commissionService = new CommissionService();
    const employeeService = new EmployeeService();
    
    // Employee endpoints
    router.get('/employees', AuthGuard.protect(), async (req, res) => {
      try {
        const { 
          search, 
          departmentId, 
          isActive, 
          page, 
          limit 
        } = req.query;
        
        const result = await employeeService.searchEmployees(
          req.user.companyId,
          search as string || null,
          departmentId as string || null,
          isActive === 'true' ? true : isActive === 'false' ? false : null,
          parseInt(page as string) || 1,
          parseInt(limit as string) || 50
        );
        
        res.json(result);
      } catch (error) {
        console.error('Error searching employees:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    router.get('/employees/:id', AuthGuard.protect(), async (req, res) => {
      try {
        const employee = await employeeService.getEmployeeById(req.params.id);
        res.json(employee);
      } catch (error) {
        console.error('Error getting employee:', error);
        res.status(404).json({ error: error.message });
      }
    });
    
    router.post('/employees', AuthGuard.protect(), async (req, res) => {
      try {
        const { 
          firstName, lastName, email, phone, position, 
          departmentId, cnp, address, birthDate, hireDate, data 
        } = req.body;
        
        const result = await employeeService.createEmployee(
          req.user.companyId,
          firstName,
          lastName,
          email,
          phone,
          position,
          departmentId,
          cnp,
          address,
          new Date(birthDate),
          new Date(hireDate),
          data || {},
          req.user.id
        );
        
        res.status(201).json(result);
      } catch (error) {
        console.error('Error creating employee:', error);
        res.status(400).json({ error: error.message });
      }
    });
    
    router.put('/employees/:id', AuthGuard.protect(), async (req, res) => {
      try {
        const result = await employeeService.updateEmployee(
          req.params.id,
          req.body,
          req.user.id
        );
        
        res.json(result);
      } catch (error) {
        console.error('Error updating employee:', error);
        res.status(400).json({ error: error.message });
      }
    });
    
    // Employment contracts endpoints
    router.post('/contracts', AuthGuard.protect(), async (req, res) => {
      try {
        const { 
          employeeId, contractNumber, contractType, startDate, endDate,
          baseSalaryGross, workingTime, corCode, annualVacationDays,
          contractFilePath, annexesFilePaths
        } = req.body;
        
        const result = await employeeService.createEmploymentContract(
          employeeId,
          req.user.companyId,
          contractNumber,
          contractType,
          new Date(startDate),
          endDate ? new Date(endDate) : null,
          baseSalaryGross,
          workingTime,
          corCode,
          annualVacationDays,
          contractFilePath,
          annexesFilePaths,
          req.user.id
        );
        
        res.status(201).json(result);
      } catch (error) {
        console.error('Error creating employment contract:', error);
        res.status(400).json({ error: error.message });
      }
    });
    
    router.get('/contracts/:employeeId', AuthGuard.protect(), async (req, res) => {
      try {
        const contracts = await employeeService.getEmploymentContractHistory(req.params.employeeId);
        res.json(contracts);
      } catch (error) {
        console.error('Error retrieving contracts:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    router.put('/contracts/:id', AuthGuard.protect(), async (req, res) => {
      try {
        const result = await employeeService.updateEmploymentContract(
          req.params.id,
          req.body,
          req.user.id
        );
        
        res.json(result);
      } catch (error) {
        console.error('Error updating contract:', error);
        res.status(400).json({ error: error.message });
      }
    });
    
    // Department endpoints
    router.get('/departments', AuthGuard.protect(), async (req, res) => {
      try {
        const includeInactive = req.query.includeInactive === 'true';
        const departments = await employeeService.getDepartments(req.user.companyId, includeInactive);
        res.json(departments);
      } catch (error) {
        console.error('Error retrieving departments:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    router.post('/departments', AuthGuard.protect(), async (req, res) => {
      try {
        const { name, description, managerId, parentDepartmentId } = req.body;
        
        const result = await employeeService.createDepartment(
          req.user.companyId,
          name,
          description,
          managerId,
          parentDepartmentId,
          req.user.id
        );
        
        res.status(201).json(result);
      } catch (error) {
        console.error('Error creating department:', error);
        res.status(400).json({ error: error.message });
      }
    });
    
    router.get('/departments/:id/employees', AuthGuard.protect(), async (req, res) => {
      try {
        const includeInactive = req.query.includeInactive === 'true';
        const employees = await employeeService.getEmployeesByDepartment(req.params.id, includeInactive);
        res.json(employees);
      } catch (error) {
        console.error('Error retrieving department employees:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    // Payroll endpoints
    router.post('/payroll/calculate', AuthGuard.protect(), async (req, res) => {
      try {
        const { employeeId, year, month } = req.body;
        
        const result = await payrollService.calculateEmployeePayroll(
          employeeId,
          req.user.companyId,
          year,
          month,
          req.user.id
        );
        
        res.json(result);
      } catch (error) {
        console.error('Error calculating payroll:', error);
        res.status(400).json({ error: error.message });
      }
    });
    
    router.post('/payroll/process-company', AuthGuard.protect(), async (req, res) => {
      try {
        const { year, month } = req.body;
        
        const result = await payrollService.processCompanyPayroll(
          req.user.companyId,
          year,
          month,
          req.user.id
        );
        
        res.json(result);
      } catch (error) {
        console.error('Error processing company payroll:', error);
        res.status(400).json({ error: error.message });
      }
    });
    
    router.put('/payroll/:id/approve', AuthGuard.protect(), async (req, res) => {
      try {
        const result = await payrollService.approvePayroll(
          req.params.id,
          req.user.id
        );
        
        res.json(result);
      } catch (error) {
        console.error('Error approving payroll:', error);
        res.status(400).json({ error: error.message });
      }
    });
    
    router.get('/payroll/employee/:id', AuthGuard.protect(), async (req, res) => {
      try {
        const { year, month } = req.query;
        
        const result = await payrollService.getEmployeePayroll(
          req.params.id,
          year ? parseInt(year as string) : undefined,
          month ? parseInt(month as string) : undefined
        );
        
        res.json(result);
      } catch (error) {
        console.error('Error retrieving employee payroll:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    router.get('/payroll/summary', AuthGuard.protect(), async (req, res) => {
      try {
        const { year, month } = req.query;
        
        if (!year) {
          return res.status(400).json({ error: 'Year parameter is required' });
        }
        
        const result = await payrollService.getCompanyPayrollSummary(
          req.user.companyId,
          parseInt(year as string),
          month ? parseInt(month as string) : undefined
        );
        
        res.json(result);
      } catch (error) {
        console.error('Error retrieving payroll summary:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    // Absence endpoints
    router.post('/absences', AuthGuard.protect(), async (req, res) => {
      try {
        const { 
          employeeId, startDate, endDate, type, description,
          medicalCertificateNumber, medicalCertificateFilePath
        } = req.body;
        
        const result = await absenceService.requestAbsence(
          employeeId,
          req.user.companyId,
          new Date(startDate),
          new Date(endDate),
          type,
          description,
          medicalCertificateNumber,
          medicalCertificateFilePath,
          req.user.id
        );
        
        res.status(201).json(result);
      } catch (error) {
        console.error('Error requesting absence:', error);
        res.status(400).json({ error: error.message });
      }
    });
    
    router.put('/absences/:id/review', AuthGuard.protect(), async (req, res) => {
      try {
        const { approved, comment } = req.body;
        
        const result = await absenceService.reviewAbsence(
          req.params.id,
          approved,
          comment,
          req.user.id
        );
        
        res.json(result);
      } catch (error) {
        console.error('Error reviewing absence:', error);
        res.status(400).json({ error: error.message });
      }
    });
    
    router.put('/absences/:id/cancel', AuthGuard.protect(), async (req, res) => {
      try {
        const { reason } = req.body;
        
        const result = await absenceService.cancelAbsence(
          req.params.id,
          reason,
          req.user.id
        );
        
        res.json(result);
      } catch (error) {
        console.error('Error cancelling absence:', error);
        res.status(400).json({ error: error.message });
      }
    });
    
    router.get('/absences/employee/:id', AuthGuard.protect(), async (req, res) => {
      try {
        const { year, status } = req.query;
        
        const result = await absenceService.getEmployeeAbsences(
          req.params.id,
          year ? parseInt(year as string) : undefined,
          status as any
        );
        
        res.json(result);
      } catch (error) {
        console.error('Error retrieving employee absences:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    router.get('/absences/vacation-balance/:id', AuthGuard.protect(), async (req, res) => {
      try {
        const { year } = req.query;
        
        if (!year) {
          return res.status(400).json({ error: 'Year parameter is required' });
        }
        
        const result = await absenceService.calculateRemainingVacationDays(
          req.params.id,
          parseInt(year as string)
        );
        
        res.json(result);
      } catch (error) {
        console.error('Error calculating vacation balance:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    router.get('/absences/upcoming', AuthGuard.protect(), async (req, res) => {
      try {
        const { days } = req.query;
        
        const result = await absenceService.getUpcomingCompanyAbsences(
          req.user.companyId,
          days ? parseInt(days as string) : 30
        );
        
        res.json(result);
      } catch (error) {
        console.error('Error retrieving upcoming absences:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    // REVISAL export endpoints
    router.post('/revisal/export', AuthGuard.protect(), async (req, res) => {
      try {
        const { exportType, employeeIds } = req.body;
        
        const result = await revisalService.generateRevisalExport(
          req.user.companyId,
          exportType,
          employeeIds,
          req.user.id
        );
        
        res.json(result);
      } catch (error) {
        console.error('Error generating REVISAL export:', error);
        res.status(400).json({ error: error.message });
      }
    });
    
    router.get('/revisal/logs', AuthGuard.protect(), async (req, res) => {
      try {
        const { limit } = req.query;
        
        const result = await revisalService.getRevisalExportLogs(
          req.user.companyId,
          limit ? parseInt(limit as string) : 50
        );
        
        res.json(result);
      } catch (error) {
        console.error('Error retrieving REVISAL export logs:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    router.get('/revisal/logs/:id', AuthGuard.protect(), async (req, res) => {
      try {
        const result = await revisalService.getRevisalExportById(req.params.id);
        res.json(result);
      } catch (error) {
        console.error('Error retrieving REVISAL export log:', error);
        res.status(404).json({ error: error.message });
      }
    });
    
    // Commission structure endpoints
    router.post('/commissions/structures', AuthGuard.protect(), async (req, res) => {
      try {
        const { name, description, type, configuration, isActive } = req.body;
        
        const result = await commissionService.createCommissionStructure(
          req.user.companyId,
          name,
          description,
          type,
          configuration,
          isActive !== false,
          req.user.id
        );
        
        res.status(201).json(result);
      } catch (error) {
        console.error('Error creating commission structure:', error);
        res.status(400).json({ error: error.message });
      }
    });
    
    router.put('/commissions/structures/:id', AuthGuard.protect(), async (req, res) => {
      try {
        const result = await commissionService.updateCommissionStructure(
          req.params.id,
          req.body,
          req.user.id
        );
        
        res.json(result);
      } catch (error) {
        console.error('Error updating commission structure:', error);
        res.status(400).json({ error: error.message });
      }
    });
    
    router.get('/commissions/structures', AuthGuard.protect(), async (req, res) => {
      try {
        const activeOnly = req.query.activeOnly === 'true';
        
        const result = await commissionService.getCommissionStructures(
          req.user.companyId,
          activeOnly
        );
        
        res.json(result);
      } catch (error) {
        console.error('Error retrieving commission structures:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    // Employee commission endpoints
    router.post('/commissions/calculate', AuthGuard.protect(), async (req, res) => {
      try {
        const { 
          employeeId, structureId, saleAmount, saleId, 
          saleType, metadata 
        } = req.body;
        
        const result = await commissionService.calculateCommission(
          employeeId,
          req.user.companyId,
          structureId,
          saleAmount,
          saleId,
          saleType,
          metadata || {},
          req.user.id
        );
        
        res.json(result);
      } catch (error) {
        console.error('Error calculating commission:', error);
        res.status(400).json({ error: error.message });
      }
    });
    
    router.put('/commissions/:id/approve', AuthGuard.protect(), async (req, res) => {
      try {
        const result = await commissionService.approveCommission(
          req.params.id,
          req.user.id
        );
        
        res.json(result);
      } catch (error) {
        console.error('Error approving commission:', error);
        res.status(400).json({ error: error.message });
      }
    });
    
    router.put('/commissions/:id/mark-paid', AuthGuard.protect(), async (req, res) => {
      try {
        const { paymentReference } = req.body;
        
        const result = await commissionService.markCommissionAsPaid(
          req.params.id,
          paymentReference,
          req.user.id
        );
        
        res.json(result);
      } catch (error) {
        console.error('Error marking commission as paid:', error);
        res.status(400).json({ error: error.message });
      }
    });
    
    router.get('/commissions/employee/:id', AuthGuard.protect(), async (req, res) => {
      try {
        const { status, timeframe, limit } = req.query;
        
        const result = await commissionService.getEmployeeCommissions(
          req.params.id,
          status as any,
          timeframe as any,
          limit ? parseInt(limit as string) : 50
        );
        
        res.json(result);
      } catch (error) {
        console.error('Error retrieving employee commissions:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    router.get('/commissions/summary', AuthGuard.protect(), async (req, res) => {
      try {
        const { year, month } = req.query;
        
        if (!year) {
          return res.status(400).json({ error: 'Year parameter is required' });
        }
        
        const result = await commissionService.getCommissionSummary(
          req.user.companyId,
          parseInt(year as string),
          month ? parseInt(month as string) : undefined
        );
        
        res.json(result);
      } catch (error) {
        console.error('Error retrieving commission summary:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    // Placeholder endpoint with role-based access control
    router.post('/placeholder', AuthGuard.protect(), async (req, res) => {
      try {
        // Return a simple response with user info from the token
        res.json({
          message: 'HR Module placeholder endpoint',
          success: true,
          user: {
            id: req.user.id,
            companyId: req.user.companyId
          },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error in placeholder endpoint:', error);
        res.status(500).json({ error: error.message });
      }
    });
    
    // Return router and all services
    return { 
      router,
      services: {
        payrollService,
        absenceService,
        revisalService,
        commissionService,
        employeeService
      }
    };
  }
}