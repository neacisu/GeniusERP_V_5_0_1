/**
 * REVISAL Service
 * 
 * This service handles REVISAL (Romanian Employee Registry) export and compliance.
 * REVISAL is a mandatory electronic registry maintained by Romanian employers
 * that tracks all employment contracts and their changes.
 */

import { DrizzleService } from '../../../common/drizzle/drizzle.service';
import { employees, employmentContracts, revisalExportLogs } from '../schema';
import { v4 as uuidv4 } from 'uuid';
import { AuditService } from '../../audit/services/audit.service';
import { AuditAction, AuditResourceType } from '../../../common/enums/audit.enum';

export enum RevisalExportType {
  INITIAL_REGISTRATION = 'initial_registration',
  CONTRACT_ADDITION = 'contract_addition', 
  CONTRACT_MODIFICATION = 'contract_modification',
  CONTRACT_SUSPENSION = 'contract_suspension',
  CONTRACT_TERMINATION = 'contract_termination',
  COMPANY_MODIFICATION = 'company_modification'
}

export enum RevisalExportStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export class RevisalService {
  private drizzle: DrizzleService;
  private auditService: AuditService;

  constructor() {
    this.drizzle = new DrizzleService();
    this.auditService = new AuditService();
  }
  
  // Backward compatibility getter
  private get db() {
    return this.drizzle.db;
  }

  /**
   * Generate a REVISAL export file for new/modified contracts
   * 
   * @param companyId Company ID
   * @param exportType Type of REVISAL export
   * @param employeeIds Optional array of employee IDs to include
   * @param userId User ID performing the export
   */
  async generateRevisalExport(
    companyId: string,
    exportType: RevisalExportType,
    employeeIds: string[] | null,
    userId: string
  ) {
    try {
      let query = `
        SELECT 
          e.*,
          ec.*
        FROM hr_employees e
        JOIN hr_employment_contracts ec ON e.id = ec.employee_id
        WHERE e.company_id = $1
      `;
      
      const params = [companyId];
      
      // If specific employees are requested
      if (employeeIds && employeeIds.length > 0) {
        query += ` AND e.id IN (${employeeIds.map((_, idx) => `$${params.length + idx + 1}`).join(',')})`;
        params.push(...employeeIds);
      }
      
      const employees = await this.drizzle.executeQuery(query, params);
      
      if (!employees || employees.length === 0) {
        throw new Error('No employees found for REVISAL export');
      }
      
      // Create an export log entry
      const exportId = uuidv4();
      const exportLog = await this.drizzle.executeQuery(
        `INSERT INTO hr_revisal_export_logs (
          id, company_id, export_type, employee_count, status,
          created_by
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6
        ) RETURNING *`,
        [
          exportId, companyId, exportType, employees.length, RevisalExportStatus.PENDING,
          userId
        ]
      );
      
      // Audit the export initiation
      await this.auditService.logAction({
        userId,
        action: AuditAction.CREATE,
        resourceType: AuditResourceType.REVISAL_EXPORT,
        resourceId: exportId,
        metadata: {
          companyId,
          exportType,
          employeeCount: employees.length
        }
      });
      
      // Generate the REVISAL XML content
      const revisalXml = this.generateRevisalXmlContent(employees, exportType);
      
      // Update the export log with the XML content
      await this.drizzle.executeQuery(
        `UPDATE hr_revisal_export_logs
         SET revisal_xml = $1, status = $2, completed_at = NOW(), updated_by = $3, updated_at = NOW()
         WHERE id = $4`,
        [revisalXml, RevisalExportStatus.COMPLETED, userId, exportId]
      );
      
      // Audit the export completion
      await this.auditService.logAction({
        userId,
        action: AuditAction.UPDATE,
        resourceType: AuditResourceType.REVISAL_EXPORT,
        resourceId: exportId,
        metadata: {
          status: RevisalExportStatus.COMPLETED,
          xmlLength: revisalXml.length
        }
      });
      
      return {
        id: exportId,
        exportType,
        employeeCount: employees.length,
        status: RevisalExportStatus.COMPLETED,
        revisalXml
      };
    } catch (error: any) {
      console.error('Error generating REVISAL export:', error);
      
      // If we've already created an export log, update it to failed
      if (error.exportId) {
        await this.drizzle.executeQuery(
          `UPDATE hr_revisal_export_logs
           SET status = $1, error_message = $2, updated_by = $3, updated_at = NOW()
           WHERE id = $4`,
          [RevisalExportStatus.FAILED, error.message, userId, error.exportId]
        );
        
        // Audit the export failure
        await this.auditService.logAction({
          userId,
          action: AuditAction.UPDATE,
          resourceType: AuditResourceType.REVISAL_EXPORT,
          resourceId: error.exportId,
          metadata: {
            status: RevisalExportStatus.FAILED,
            error: error.message
          }
        });
      }
      
      throw new Error(`Failed to generate REVISAL export: ${error.message}`);
    }
  }

  /**
   * Generate REVISAL XML content based on employees and export type
   * This implementation follows the XML structure required by Romania's REVISAL system
   * 
   * @param employees Array of employee and contract data
   * @param exportType Type of REVISAL export
   * @returns XML content as string
   */
  private generateRevisalXmlContent(employees: any[], exportType: RevisalExportType): string {
    // Create the XML header with registration info
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<revisal xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n';
    xml += '  <header>\n';
    xml += `    <data_export>${new Date().toISOString().split('T')[0]}</data_export>\n`;
    xml += '    <ore_export>12:00</ore_export>\n';
    xml += `    <tip_export>${this.getRevisalExportTypeCode(exportType)}</tip_export>\n`;
    xml += '  </header>\n';
    
    // Add company data (would be retrieved from company settings in a real implementation)
    xml += '  <angajator>\n';
    xml += '    <cif_cui>12345678</cif_cui>\n'; // This would be dynamic in production
    xml += '    <denumire>COMPANY NAME SRL</denumire>\n'; // This would be dynamic in production
    xml += '  </angajator>\n';
    
    // Add employees section
    xml += '  <salariati>\n';
    
    // Process each employee
    employees.forEach(employee => {
      xml += '    <salariat>\n';
      
      // Personal data
      xml += '      <date_personale>\n';
      xml += `        <cnp>${employee.cnp}</cnp>\n`;
      xml += `        <nume>${employee.last_name}</nume>\n`;
      xml += `        <prenume>${employee.first_name}</prenume>\n`;
      xml += `        <nationalitate>${employee.nationality || 'Română'}</nationalitate>\n`;
      xml += '      </date_personale>\n';
      
      // Contract data
      xml += '      <contract>\n';
      xml += `        <numar_contract>${employee.contract_number}</numar_contract>\n`;
      xml += `        <data_contract>${new Date(employee.contract_start_date).toISOString().split('T')[0]}</data_contract>\n`;
      xml += `        <tip_contract>${this.getContractTypeCode(employee.contract_type)}</tip_contract>\n`;
      xml += `        <data_inceput>${new Date(employee.start_date).toISOString().split('T')[0]}</data_inceput>\n`;
      
      if (employee.end_date) {
        xml += `        <data_sfarsit>${new Date(employee.end_date).toISOString().split('T')[0]}</data_sfarsit>\n`;
      }
      
      xml += `        <durata_contract>${employee.is_indefinite ? 'nedeterminata' : 'determinata'}</durata_contract>\n`;
      xml += `        <norma>${this.getWorkingTimeCode(employee.working_time)}</norma>\n`;
      xml += `        <stare_contract>${this.getContractStatusCode(employee.status)}</stare_contract>\n`;
      xml += `        <cod_cor>${employee.cor_code}</cod_cor>\n`;
      xml += `        <salariu_de_baza>${employee.base_salary_gross}</salariu_de_baza>\n`;
      xml += '      </contract>\n';
      
      xml += '    </salariat>\n';
    });
    
    xml += '  </salariati>\n';
    xml += '</revisal>';
    
    return xml;
  }

  /**
   * Map REVISAL export type to the required code
   * 
   * @param exportType Export type enum
   * @returns REVISAL code
   */
  private getRevisalExportTypeCode(exportType: RevisalExportType): string {
    const codeMap: Record<RevisalExportType, string> = {
      [RevisalExportType.INITIAL_REGISTRATION]: '1',
      [RevisalExportType.CONTRACT_ADDITION]: '2',
      [RevisalExportType.CONTRACT_MODIFICATION]: '3',
      [RevisalExportType.CONTRACT_SUSPENSION]: '4',
      [RevisalExportType.CONTRACT_TERMINATION]: '5',
      [RevisalExportType.COMPANY_MODIFICATION]: '6'
    };
    
    return codeMap[exportType] || '1';
  }

  /**
   * Map contract type to REVISAL code
   * 
   * @param contractType Contract type
   * @returns REVISAL code
   */
  private getContractTypeCode(contractType: string): string {
    const typeMap: Record<string, string> = {
      'standard': '1', // Contract individual de muncă
      'part_time': '2', // Contract de muncă cu timp parțial
      'temporary': '3', // Contract de muncă temporară
      'internship': '4', // Contract de stagiu
      'apprenticeship': '5', // Contract de ucenicie
      'home_based': '6'  // Telemuncă
    };
    
    return typeMap[contractType] || '1';
  }

  /**
   * Map working time to REVISAL code
   * 
   * @param workingTime Working time string
   * @returns REVISAL code
   */
  private getWorkingTimeCode(workingTime: string): string {
    if (workingTime === 'full_time') {
      return '1'; // Normă întreagă
    } else {
      // Extract hours from part_time_X format
      const hours = workingTime.match(/part_time_(\d+)/);
      if (hours && hours[1]) {
        return hours[1]; // Number of hours
      }
      return '2'; // Default part-time
    }
  }

  /**
   * Map contract status to REVISAL code
   * 
   * @param status Contract status
   * @returns REVISAL code
   */
  private getContractStatusCode(status: string): string {
    const statusMap: Record<string, string> = {
      'active': '1', // Activ
      'suspended': '2', // Suspendat
      'terminated': '3', // Încetat
      'transferred': '4'  // Transferat
    };
    
    return statusMap[status] || '1';
  }

  /**
   * Get REVISAL export logs for a company
   * 
   * @param companyId Company ID
   * @param limit Optional limit of records to return
   */
  async getRevisalExportLogs(companyId: string, limit: number = 50) {
    try {
      const logs = await this.drizzle.executeQuery(
        `SELECT * FROM hr_revisal_export_logs
         WHERE company_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [companyId, limit]
      );
      
      return logs || [];
    } catch (error: any) {
      console.error('Error retrieving REVISAL export logs:', error);
      throw new Error(`Failed to retrieve REVISAL export logs: ${(error as Error).message}`);
    }
  }

  /**
   * Get a specific REVISAL export log by ID
   * 
   * @param exportId Export log ID
   */
  async getRevisalExportById(exportId: string) {
    try {
      const log = await this.drizzle.executeQuery(
        `SELECT * FROM hr_revisal_export_logs WHERE id = $1`,
        [exportId]
      );
      
      if (!log || log.length === 0) {
        throw new Error('REVISAL export log not found');
      }
      
      return log[0];
    } catch (error: any) {
      console.error('Error retrieving REVISAL export log:', error);
      throw new Error(`Failed to retrieve REVISAL export log: ${(error as Error).message}`);
    }
  }

  /**
   * Validate REVISAL XML content
   * 
   * @param xmlContent XML content to validate
   * @returns Validation result
   */
  async validateRevisalXml(xmlContent: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      // Basic XML structure validation
      if (!xmlContent.includes('<?xml')) {
        errors.push('Missing XML declaration');
      }
      
      if (!xmlContent.includes('<revisal')) {
        errors.push('Missing root <revisal> element');
      }
      
      if (!xmlContent.includes('<header>')) {
        errors.push('Missing <header> section');
      }
      
      if (!xmlContent.includes('<angajator>')) {
        errors.push('Missing <angajator> section');
      }
      
      if (!xmlContent.includes('<salariati>')) {
        errors.push('Missing <salariati> section');
      }
      
      // Validate required fields in header
      if (!xmlContent.includes('<data_export>')) {
        errors.push('Missing export date in header');
      }
      
      // Validate employee data
      if (!xmlContent.includes('<cnp>')) {
        errors.push('Missing CNP data for employees');
      }
      
      return {
        valid: errors.length === 0,
        errors
      };
    } catch (error: any) {
      errors.push(`Validation error: ${(error as Error).message}`);
      return {
        valid: false,
        errors
      };
    }
  }

  /**
   * Log a REVISAL submission
   * 
   * @param exportId Export log ID
   * @param submissionData Submission details
   * @param userId User ID performing the submission
   */
  async logRevisalSubmission(
    exportId: string,
    submissionData: {
      status: string;
      registrationNumber?: string;
      submissionResponse?: string;
    },
    userId: string
  ) {
    try {
      await this.drizzle.executeQuery(
        `UPDATE hr_revisal_export_logs
         SET submission_status = $1, 
             registration_number = $2,
             submission_date = NOW(),
             updated_by = $3,
             updated_at = NOW()
         WHERE id = $4`,
        [
          submissionData.status,
          submissionData.registrationNumber || null,
          userId,
          exportId
        ]
      );
      
      // Audit the submission
      await this.auditService.logAction({
        userId,
        action: AuditAction.UPDATE,
        resourceType: AuditResourceType.REVISAL_EXPORT,
        resourceId: exportId,
        metadata: {
          submissionStatus: submissionData.status,
          registrationNumber: submissionData.registrationNumber
        }
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Error logging REVISAL submission:', error);
      throw new Error(`Failed to log REVISAL submission: ${(error as Error).message}`);
    }
  }

  /**
   * Get REVISAL logs for a company with optional filters
   * 
   * @param companyId Company ID
   * @param filters Optional filters (status, dateFrom, dateTo)
   * @param limit Optional limit of records
   */
  async getRevisalLogs(
    companyId: string,
    filters?: {
      status?: string;
      dateFrom?: Date;
      dateTo?: Date;
    },
    limit: number = 50
  ) {
    try {
      let query = `
        SELECT * FROM hr_revisal_export_logs
        WHERE company_id = $1
      `;
      const params: any[] = [companyId];
      let paramIndex = 2;
      
      if (filters?.status) {
        query += ` AND submission_status = $${paramIndex++}`;
        params.push(filters.status);
      }
      
      if (filters?.dateFrom) {
        query += ` AND export_date >= $${paramIndex++}`;
        params.push(filters.dateFrom);
      }
      
      if (filters?.dateTo) {
        query += ` AND export_date <= $${paramIndex++}`;
        params.push(filters.dateTo);
      }
      
      query += ` ORDER BY export_date DESC LIMIT $${paramIndex}`;
      params.push(limit);
      
      const logs = await this.drizzle.executeQuery(query, params);
      
      return logs || [];
    } catch (error: any) {
      console.error('Error retrieving REVISAL logs:', error);
      throw new Error(`Failed to retrieve REVISAL logs: ${(error as Error).message}`);
    }
  }

  /**
   * Alias for getRevisalExportById to match controller usage
   */
  async getRevisalLogById(exportId: string) {
    return this.getRevisalExportById(exportId);
  }
}