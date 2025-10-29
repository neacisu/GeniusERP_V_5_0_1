/**
 * Contract Service
 * 
 * This service handles employment contract operations including:
 * - Contract creation and updates
 * - Contract history retrieval
 * - Contract status management
 */

import { employees, hr_employment_contracts } from '../schema';
import { v4 as uuidv4 } from 'uuid';
import { AuditService } from '@geniuserp/audit';
import { AuditAction, AuditResourceType } from "@common/enums/audit.enum";
import { eq, sql, asc, desc } from 'drizzle-orm';
import { createModuleLogger } from "@common/logger/loki-logger";
import { DrizzleService } from "@common/drizzle/drizzle.service";

export enum EmploymentContractType {
  STANDARD = 'standard',
  PART_TIME = 'part_time',
  TEMPORARY = 'temporary',
  INTERNSHIP = 'internship',
  APPRENTICESHIP = 'apprenticeship',
  HOME_BASED = 'home_based'
}

export enum EmploymentContractStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  TERMINATED = 'terminated',
  TRANSFERRED = 'transferred'
}

export class ContractService {
  private drizzle: DrizzleService;
  private auditService: AuditService;
  private logger = createModuleLogger('ContractService');

  constructor() {
    this.drizzle = new DrizzleService();
    this.auditService = new AuditService();
  }
  
  // Backward compatibility getter
  private get db() {
    return this.drizzle.db;
  }

  /**
   * Create a new employment contract
   * 
   * This method creates an employment contract and ensures compliance with:
   * - CIM format requirements (REVISAL)
   * - Single active contract validation
   * - Date format validation (Romanian format DD.MM.YYYY)
   */
  async createEmploymentContract(
    employeeId: string,
    companyId: string,
    contractNumber: string,
    contractType: string,
    startDate: Date,
    endDate: Date | null,
    baseSalaryGross: number,
    workingTime: number,
    corCode: string | null,
    annualVacationDays: number | null,
    userId: string,
    additionalData: any = {}
  ) {
    try {
      // Validate employee exists and belongs to the company
      const employee = await this.drizzle.db.select()
        .from(employees)
        .where(sql`${employees.id} = ${employeeId} AND ${employees.companyId} = ${companyId}`)
        .execute();

      if (!employee || employee.length === 0) {
        throw new Error('Employee not found or does not belong to the company');
      }

      // Check if employee already has an active contract
      const activeContract = await this.drizzle.db.select()
        .from(employmentContracts)
        .where(sql`
          ${employmentContracts.employeeId} = ${employeeId} AND 
          ${employmentContracts.status} = 'active'
        `)
        .execute();

      if (activeContract && activeContract.length > 0) {
        // Automatically set previous active contract to terminated
        await this.drizzle.db.update(employmentContracts)
          .set({
            status: EmploymentContractStatus.TERMINATED,
            updatedAt: new Date(),
            updatedBy: userId
          })
          .where(sql`${employmentContracts.id} = ${activeContract[0].id}`)
          .execute();

        // Log the termination
        await this.auditService.logAction({
          userId,
          action: AuditAction.UPDATE,
          resourceType: AuditResourceType.EMPLOYMENT_CONTRACT,
          resourceId: activeContract[0].id,
          oldValue: JSON.stringify({ status: EmploymentContractStatus.ACTIVE }),
          newValue: JSON.stringify({ status: EmploymentContractStatus.TERMINATED }),
          companyId
        });

        this.logger.info(`Previous active contract ${activeContract[0].id} set to terminated`);
      }

      // Create the new contract
      const contract = await this.drizzle.db.insert(employmentContracts)
        .values({
          id: uuidv4(),
          employeeId,
          companyId,
          contractNumber,
          contractType,
          startDate,
          endDate,
          baseSalaryGross,
          workingTime,
          corCode,
          annualVacationDays,
          isIndefinite: !endDate,
          status: EmploymentContractStatus.ACTIVE,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: userId,
          updatedBy: userId,
          ...additionalData
        })
        .returning()
        .execute();

      // Log contract creation
      await this.auditService.logAction({
        userId,
        action: AuditAction.CREATE,
        resourceType: AuditResourceType.EMPLOYMENT_CONTRACT,
        resourceId: contract[0].id,
        newValue: JSON.stringify(contract[0]),
        companyId
      });

      return contract[0];
    } catch (error: any) {
      this.logger.error('Failed to create employment contract:', error);
      throw error;
    }
  }

  /**
   * Update an employment contract
   */
  async updateEmploymentContract(
    contractId: string,
    companyId: string,
    userId: string,
    updates: any
  ) {
    try {
      // Fetch current contract for audit
      const currentContract = await this.drizzle.db.select()
        .from(employmentContracts)
        .where(sql`
          ${employmentContracts.id} = ${contractId} AND
          ${employmentContracts.companyId} = ${companyId}
        `)
        .execute();

      if (!currentContract || currentContract.length === 0) {
        throw new Error('Contract not found or does not belong to the company');
      }

      // Prepare updates with audit timestamps
      const updateData = {
        ...updates,
        updatedAt: new Date(),
        updatedBy: userId
      };

      // Handle ending dates and status changes
      if (updates.endDate && !currentContract[0].endDate) {
        updateData.isIndefinite = false;
      }

      // Update the contract
      const updated = await this.drizzle.db.update(employmentContracts)
        .set(updateData)
        .where(sql`${employmentContracts.id} = ${contractId}`)
        .returning()
        .execute();

      if (!updated || updated.length === 0) {
        throw new Error('Failed to update contract');
      }

      // Log the update
      await this.auditService.logAction({
        userId,
        action: AuditAction.UPDATE,
        resourceType: AuditResourceType.EMPLOYMENT_CONTRACT,
        resourceId: contractId,
        oldValue: JSON.stringify(currentContract[0]),
        newValue: JSON.stringify(updated[0]),
        companyId
      });

      return updated[0];
    } catch (error: any) {
      this.logger.error('Failed to update employment contract:', error);
      throw error;
    }
  }

  /**
   * Get the active employment contract for an employee
   */
  async getActiveEmploymentContract(employeeId: string) {
    try {
      const contracts = await this.drizzle.db.select()
        .from(employmentContracts)
        .where(sql`
          ${employmentContracts.employeeId} = ${employeeId} AND
          ${employmentContracts.status} = 'active'
        `)
        .orderBy(desc(employmentContracts.startDate))
        .limit(1)
        .execute();

      return contracts.length > 0 ? contracts[0] : null;
    } catch (error: any) {
      this.logger.error('Failed to get active employment contract:', error);
      throw error;
    }
  }

  /**
   * Get employment contract history for an employee
   */
  async getEmploymentContractHistory(employeeId: string) {
    try {
      const result = await this.drizzle.db.select()
        .from(employmentContracts)
        .where(sql`${employmentContracts.employeeId} = ${employeeId}`)
        .orderBy(desc(employmentContracts.startDate))
        .execute();

      return result;
    } catch (error: any) {
      this.logger.error('Failed to get employment contract history:', error);
      throw error;
    }
  }

  /**
   * Terminate an active employment contract
   */
  async terminateContract(
    contractId: string,
    companyId: string,
    userId: string,
    terminationDate: Date,
    terminationReason: string
  ) {
    try {
      // Validate the contract
      const contract = await this.drizzle.db.select()
        .from(employmentContracts)
        .where(sql`
          ${employmentContracts.id} = ${contractId} AND
          ${employmentContracts.companyId} = ${companyId} AND
          ${employmentContracts.status} = 'active'
        `)
        .execute();

      if (!contract || contract.length === 0) {
        throw new Error('Active contract not found or does not belong to the company');
      }

      // Update contract status and add termination details
      const updated = await this.drizzle.db.update(employmentContracts)
        .set({
          status: EmploymentContractStatus.TERMINATED,
          endDate: terminationDate,
          isIndefinite: false,
          terminationReason,
          updatedAt: new Date(),
          updatedBy: userId
        })
        .where(sql`${employmentContracts.id} = ${contractId}`)
        .returning()
        .execute();

      // Log the termination
      await this.auditService.logAction({
        userId,
        action: AuditAction.UPDATE,
        resourceType: AuditResourceType.EMPLOYMENT_CONTRACT,
        resourceId: contractId,
        oldValue: JSON.stringify({ 
          status: EmploymentContractStatus.ACTIVE,
          endDate: contract[0].endDate,
          isIndefinite: contract[0].isIndefinite
        }),
        newValue: JSON.stringify({ 
          status: EmploymentContractStatus.TERMINATED,
          endDate: terminationDate,
          isIndefinite: false,
          terminationReason
        }),
        companyId
      });

      return updated[0];
    } catch (error: any) {
      this.logger.error('Failed to terminate contract:', error);
      throw error;
    }
  }

  /**
   * Suspend an active employment contract
   */
  async suspendContract(
    contractId: string,
    companyId: string,
    userId: string,
    suspensionDate: Date,
    suspensionReason: string,
    suspensionEndDate?: Date
  ) {
    try {
      // Validate the contract
      const contract = await this.drizzle.db.select()
        .from(employmentContracts)
        .where(sql`
          ${employmentContracts.id} = ${contractId} AND
          ${employmentContracts.companyId} = ${companyId} AND
          ${employmentContracts.status} = 'active'
        `)
        .execute();

      if (!contract || contract.length === 0) {
        throw new Error('Active contract not found or does not belong to the company');
      }

      // Update contract status and add suspension details
      const updated = await this.drizzle.db.update(employmentContracts)
        .set({
          status: EmploymentContractStatus.SUSPENDED,
          suspensionDate,
          suspensionEndDate,
          suspensionReason,
          updatedAt: new Date(),
          updatedBy: userId
        })
        .where(sql`${employmentContracts.id} = ${contractId}`)
        .returning()
        .execute();

      // Log the suspension
      await this.auditService.logAction({
        userId,
        action: AuditAction.UPDATE,
        resourceType: AuditResourceType.EMPLOYMENT_CONTRACT,
        resourceId: contractId,
        oldValue: JSON.stringify({ 
          status: EmploymentContractStatus.ACTIVE
        }),
        newValue: JSON.stringify({ 
          status: EmploymentContractStatus.SUSPENDED,
          suspensionDate,
          suspensionEndDate,
          suspensionReason
        }),
        companyId
      });

      return updated[0];
    } catch (error: any) {
      this.logger.error('Failed to suspend contract:', error);
      throw error;
    }
  }

  /**
   * Reactivate a suspended employment contract
   */
  async reactivateContract(
    contractId: string,
    companyId: string,
    userId: string,
    reactivationDate: Date,
    reactivationReason: string
  ) {
    try {
      // Validate the contract
      const contract = await this.drizzle.db.select()
        .from(employmentContracts)
        .where(sql`
          ${employmentContracts.id} = ${contractId} AND
          ${employmentContracts.companyId} = ${companyId} AND
          ${employmentContracts.status} = 'suspended'
        `)
        .execute();

      if (!contract || contract.length === 0) {
        throw new Error('Suspended contract not found or does not belong to the company');
      }

      // Update contract status and add reactivation details
      const updated = await this.drizzle.db.update(employmentContracts)
        .set({
          status: EmploymentContractStatus.ACTIVE,
          suspensionEndDate: reactivationDate,
          reactivationReason,
          updatedAt: new Date(),
          updatedBy: userId
        })
        .where(sql`${employmentContracts.id} = ${contractId}`)
        .returning()
        .execute();

      // Log the reactivation
      await this.auditService.logAction({
        userId,
        action: AuditAction.UPDATE,
        resourceType: AuditResourceType.EMPLOYMENT_CONTRACT,
        resourceId: contractId,
        oldValue: JSON.stringify({ 
          status: EmploymentContractStatus.SUSPENDED
        }),
        newValue: JSON.stringify({ 
          status: EmploymentContractStatus.ACTIVE,
          suspensionEndDate: reactivationDate,
          reactivationReason
        }),
        companyId
      });

      return updated[0];
    } catch (error: any) {
      this.logger.error('Failed to reactivate contract:', error);
      throw error;
    }
  }

  /**
   * Get contract by ID
   */
  async getContractById(contractId: string, companyId: string) {
    try {
      const contracts = await this.drizzle.db.select()
        .from(employmentContracts)
        .where(sql`
          ${employmentContracts.id} = ${contractId} AND
          ${employmentContracts.companyId} = ${companyId}
        `)
        .execute();

      return contracts.length > 0 ? contracts[0] : null;
    } catch (error: any) {
      this.logger.error('Failed to get contract by ID:', error);
      throw error;
    }
  }
}