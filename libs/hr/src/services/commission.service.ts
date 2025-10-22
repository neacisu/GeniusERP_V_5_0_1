/**
 * Commission Service
 * 
 * This service handles sales agent commission calculations, tracking and payments.
 * It supports Romanian-specific commission structures and integrates with invoicing.
 */

import { commissionStructures, employeeCommissions } from '../schema';
import { v4 as uuidv4 } from 'uuid';
import { AuditService } from '../../audit/services/audit.service';
import { AuditAction, AuditResourceType } from "@common/enums/audit.enum";
import { sql } from 'drizzle-orm';
import { DrizzleService } from "@common/drizzle/drizzle.service";

export enum CommissionType {
  FIXED = 'fixed',                   // Fixed amount per sale
  PERCENTAGE = 'percentage',         // Percentage of sale value
  TIERED_PERCENTAGE = 'tiered_percentage', // Tiered percentages based on sale value
  PROGRESSIVE = 'progressive',       // Progressive rate based on total sales
  TEAM = 'team',                     // Team-based commission
  MIXED = 'mixed'                    // Combination of different commission types
}

export enum CommissionStatus {
  CALCULATED = 'calculated',
  APPROVED = 'approved',
  PAID = 'paid',
  CANCELLED = 'cancelled'
}

export class CommissionService {
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
   * Get a commission by ID
   * 
   * @param companyId Company ID
   * @param commissionId Commission ID
   * @returns Commission details or null if not found
   */
  async getCommissionById(companyId: string, commissionId: string) {
    try {
      const commission = await this.db.execute(
        `SELECT 
          c.*,
          e.first_name as employee_first_name,
          e.last_name as employee_last_name,
          s.name as structure_name,
          s.type as structure_type
        FROM hr_employee_commissions c
        LEFT JOIN hr_employees e ON c.employee_id = e.id
        LEFT JOIN hr_commission_structures s ON c.structure_id = s.id
        WHERE c.id = $1 AND c.company_id = $2`,
        [commissionId, companyId]
      );
      
      if (!commission.rows || commission.rows.length === 0) {
        return null;
      }
      
      return commission.rows[0];
    } catch (error: any) {
      console.error('Error retrieving commission by ID:', error);
      throw new Error(`Failed to retrieve commission: ${error.message}`);
    }
  }
  
  /**
   * Get all commissions for a company with optional filtering
   * 
   * @param companyId Company ID
   * @param year Optional year filter
   * @param month Optional month filter
   * @param status Optional status filter
   * @returns List of commissions
   */
  async getCompanyCommissions(
    companyId: string,
    year?: number | null,
    month?: number | null,
    status?: string | null
  ) {
    try {
      let query = `
        SELECT 
          c.*,
          e.first_name as employee_first_name,
          e.last_name as employee_last_name,
          s.name as structure_name,
          s.type as structure_type
        FROM hr_employee_commissions c
        LEFT JOIN hr_employees e ON c.employee_id = e.id
        LEFT JOIN hr_commission_structures s ON c.structure_id = s.id
        WHERE c.company_id = $1
      `;
      
      const params: any[] = [companyId];
      let paramIndex = 2;
      
      // Add year filter if provided
      if (year) {
        query += ` AND EXTRACT(YEAR FROM c.created_at) = $${paramIndex++}`;
        params.push(year);
      }
      
      // Add month filter if provided
      if (month) {
        query += ` AND EXTRACT(MONTH FROM c.created_at) = $${paramIndex++}`;
        params.push(month);
      }
      
      // Add status filter if provided and not 'all'
      if (status && status.toLowerCase() !== 'all') {
        query += ` AND c.status = $${paramIndex++}`;
        params.push(status);
      }
      
      // Order by newest first
      query += ` ORDER BY c.created_at DESC`;
      
      const commissions = await this.drizzle.executeQuery(query, params);
      
      return commissions.rows || [];
    } catch (error: any) {
      console.error('Error retrieving company commissions:', error);
      throw new Error(`Failed to retrieve commissions: ${error.message}`);
    }
  }

  /**
   * Create a commission structure for a sales role
   * 
   * @param companyId Company ID
   * @param name Structure name
   * @param description Structure description
   * @param type Commission type
   * @param configuration JSON configuration for the commission structure
   * @param isActive Whether the structure is active
   * @param userId User ID creating the structure
   */
  async createCommissionStructure(
    companyId: string,
    name: string,
    description: string,
    type: CommissionType,
    configuration: Record<string, any>,
    isActive: boolean,
    userId: string
  ) {
    try {
      // Validate configuration based on type
      this.validateCommissionConfig(type, configuration);
      
      // Create commission structure
      const structureId = uuidv4();
      await this.db.execute(
        `INSERT INTO hr_commission_structures (
          id, company_id, name, description, type, 
          configuration, is_active, created_by
        ) VALUES (
          $1, $2, $3, $4, $5, 
          $6, $7, $8
        )`,
        [
          structureId, companyId, name, description, type,
          JSON.stringify(configuration), isActive, userId
        ]
      );
      
      // Audit the creation
      await this.auditService.logAction({
        userId,
        action: AuditAction.CREATE,
        resourceType: AuditResourceType.COMMISSION_STRUCTURE,
        resourceId: structureId,
        metadata: {
          companyId,
          name,
          type,
          isActive
        }
      });
      
      return {
        id: structureId,
        name,
        type,
        isActive
      };
    } catch (error: any) {
      console.error('Error creating commission structure:', error);
      throw new Error(`Failed to create commission structure: ${error.message}`);
    }
  }

  /**
   * Validate commission configuration based on type
   * 
   * @param type Commission type
   * @param config Configuration object
   */
  private validateCommissionConfig(type: CommissionType, config: Record<string, any>): void {
    switch (type) {
      case CommissionType.FIXED:
        if (typeof config.amount !== 'number' || config.amount <= 0) {
          throw new Error('Fixed commission requires a positive amount');
        }
        break;
        
      case CommissionType.PERCENTAGE:
        if (typeof config.percentage !== 'number' || config.percentage <= 0 || config.percentage > 100) {
          throw new Error('Percentage commission requires a positive percentage (0-100)');
        }
        break;
        
      case CommissionType.TIERED_PERCENTAGE:
        if (!Array.isArray(config.tiers) || config.tiers.length === 0) {
          throw new Error('Tiered percentage requires at least one tier');
        }
        
        for (const tier of config.tiers) {
          if (typeof tier.threshold !== 'number' || typeof tier.percentage !== 'number') {
            throw new Error('Each tier must have threshold and percentage values');
          }
          
          if (tier.percentage <= 0 || tier.percentage > 100) {
            throw new Error('Tier percentages must be positive (0-100)');
          }
        }
        break;
        
      case CommissionType.PROGRESSIVE:
        if (!Array.isArray(config.levels) || config.levels.length === 0) {
          throw new Error('Progressive commission requires at least one level');
        }
        
        for (const level of config.levels) {
          if (typeof level.threshold !== 'number' || typeof level.rate !== 'number') {
            throw new Error('Each level must have threshold and rate values');
          }
          
          if (level.rate <= 0 || level.rate > 100) {
            throw new Error('Level rates must be positive (0-100)');
          }
        }
        break;
        
      case CommissionType.TEAM:
        if (typeof config.teamPercentage !== 'number' || config.teamPercentage <= 0 || config.teamPercentage > 100) {
          throw new Error('Team commission requires a positive team percentage (0-100)');
        }
        
        if (!Array.isArray(config.distribution) || config.distribution.length === 0) {
          throw new Error('Team commission requires a distribution array');
        }
        
        let totalShare = 0;
        for (const member of config.distribution) {
          if (typeof member.role !== 'string' || typeof member.share !== 'number') {
            throw new Error('Each team member must have role and share values');
          }
          
          totalShare += member.share;
        }
        
        if (Math.abs(totalShare - 100) > 0.01) { // Allow small floating point error
          throw new Error('Team distribution shares must sum to 100%');
        }
        break;
        
      case CommissionType.MIXED:
        if (!Array.isArray(config.components) || config.components.length === 0) {
          throw new Error('Mixed commission requires at least one component');
        }
        
        for (const component of config.components) {
          if (!component.type || !component.config) {
            throw new Error('Each component must have type and config');
          }
          
          this.validateCommissionConfig(component.type as CommissionType, component.config);
        }
        break;
        
      default:
        throw new Error(`Unsupported commission type: ${type}`);
    }
  }

  /**
   * Update an existing commission structure
   * 
   * @param structureId Structure ID
   * @param updates Object containing fields to update
   * @param userId User ID performing the update
   */
  async updateCommissionStructure(
    structureId: string,
    updates: Partial<{
      name: string;
      description: string;
      type: CommissionType;
      configuration: Record<string, any>;
      isActive: boolean;
    }>,
    userId: string
  ) {
    try {
      // Get the current structure
      const currentStructure = await this.db.execute(
        `SELECT * FROM hr_commission_structures WHERE id = $1`,
        [structureId]
      );
      
      if (!currentStructure.rows || currentStructure.rows.length === 0) {
        throw new Error('Commission structure not found');
      }
      
      // Validate the configuration if provided
      if (updates.configuration) {
        const type = updates.type || currentStructure.rows[0].type;
        this.validateCommissionConfig(type as CommissionType, updates.configuration);
      }
      
      // Build update query
      let updateQuery = 'UPDATE hr_commission_structures SET updated_by = $1, updated_at = NOW()';
      const params: any[] = [userId];
      let paramIndex = 2;
      
      if (updates.name !== undefined) {
        updateQuery += `, name = $${paramIndex++}`;
        params.push(updates.name);
      }
      
      if (updates.description !== undefined) {
        updateQuery += `, description = $${paramIndex++}`;
        params.push(updates.description);
      }
      
      if (updates.type !== undefined) {
        updateQuery += `, type = $${paramIndex++}`;
        params.push(updates.type);
      }
      
      if (updates.configuration !== undefined) {
        updateQuery += `, configuration = $${paramIndex++}`;
        params.push(JSON.stringify(updates.configuration));
      }
      
      if (updates.isActive !== undefined) {
        updateQuery += `, is_active = $${paramIndex++}`;
        params.push(updates.isActive);
      }
      
      updateQuery += ` WHERE id = $${paramIndex}`;
      params.push(structureId);
      
      // Execute the update
      await this.db.execute(updateQuery, params);
      
      // Audit the update
      await this.auditService.logAction({
        userId,
        action: AuditAction.UPDATE,
        resourceType: AuditResourceType.COMMISSION_STRUCTURE,
        resourceId: structureId,
        metadata: {
          updates: Object.keys(updates),
          structureId
        }
      });
      
      // Get and return the updated structure
      const updated = await this.db.execute(
        `SELECT * FROM hr_commission_structures WHERE id = $1`,
        [structureId]
      );
      
      return updated.rows[0];
    } catch (error: any) {
      console.error('Error updating commission structure:', error);
      throw new Error(`Failed to update commission structure: ${error.message}`);
    }
  }

  /**
   * Calculate commission for a sale
   * 
   * @param employeeId Employee (sales agent) ID
   * @param companyId Company ID
   * @param structureId Commission structure ID
   * @param saleAmount Sale amount
   * @param saleId Reference to the sale (e.g. invoice ID, deal ID)
   * @param saleType Type of sale (e.g. 'invoice', 'deal')
   * @param metadata Additional metadata about the sale
   * @param userId User ID performing the calculation
   */
  async calculateCommission(
    employeeId: string,
    companyId: string,
    structureId: string,
    saleAmount: number,
    saleId: string,
    saleType: string,
    metadata: Record<string, any>,
    userId: string
  ) {
    try {
      // Get the commission structure
      const structure = await this.db.execute(
        `SELECT * FROM hr_commission_structures WHERE id = $1 AND company_id = $2`,
        [structureId, companyId]
      );
      
      if (!structure.rows || structure.rows.length === 0) {
        throw new Error('Commission structure not found');
      }
      
      const structureData = structure.rows[0];
      if (!structureData.is_active) {
        throw new Error('Commission structure is not active');
      }
      
      // Calculate commission amount based on structure type and configuration
      const commissionAmount = this.calculateCommissionAmount(
        structureData.type,
        JSON.parse(structureData.configuration),
        saleAmount,
        metadata
      );
      
      // Create commission record
      const commissionId = uuidv4();
      await this.db.execute(
        `INSERT INTO hr_employee_commissions (
          id, company_id, employee_id, structure_id,
          sale_amount, commission_amount, sale_id, sale_type,
          status, metadata, created_by
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8,
          $9, $10, $11
        )`,
        [
          commissionId, companyId, employeeId, structureId,
          saleAmount, commissionAmount, saleId, saleType,
          CommissionStatus.CALCULATED, JSON.stringify(metadata), userId
        ]
      );
      
      // Audit the commission calculation
      await this.auditService.logAction({
        userId,
        action: AuditAction.CREATE,
        resourceType: AuditResourceType.EMPLOYEE_COMMISSION,
        resourceId: commissionId,
        metadata: {
          employeeId,
          structureId,
          saleAmount,
          commissionAmount,
          saleId,
          saleType
        }
      });
      
      return {
        id: commissionId,
        employeeId,
        saleAmount,
        commissionAmount,
        status: CommissionStatus.CALCULATED
      };
    } catch (error: any) {
      console.error('Error calculating commission:', error);
      throw new Error(`Failed to calculate commission: ${error.message}`);
    }
  }

  /**
   * Calculate commission amount based on structure type and configuration
   * 
   * @param type Commission type
   * @param config Configuration object
   * @param saleAmount Sale amount
   * @param metadata Additional metadata
   * @returns Calculated commission amount
   */
  private calculateCommissionAmount(
    type: string,
    config: Record<string, any>,
    saleAmount: number,
    metadata: Record<string, any>
  ): number {
    switch (type) {
      case CommissionType.FIXED:
        return config.amount;
        
      case CommissionType.PERCENTAGE:
        return (saleAmount * config.percentage) / 100;
        
      case CommissionType.TIERED_PERCENTAGE:
        // Sort tiers by threshold in descending order
        const sortedTiers = [...config.tiers].sort((a, b) => b.threshold - a.threshold);
        
        // Find the applicable tier
        for (const tier of sortedTiers) {
          if (saleAmount >= tier.threshold) {
            return (saleAmount * tier.percentage) / 100;
          }
        }
        
        // If no tier applies (shouldn't happen if validated correctly)
        return 0;
        
      case CommissionType.PROGRESSIVE:
        // Sort levels by threshold in ascending order
        const sortedLevels = [...config.levels].sort((a, b) => a.threshold - b.threshold);
        
        let totalCommission = 0;
        let remainingSale = saleAmount;
        let prevThreshold = 0;
        
        // Calculate commission for each level
        for (const level of sortedLevels) {
          if (saleAmount >= level.threshold) {
            const levelAmount = Math.min(remainingSale, level.threshold - prevThreshold);
            totalCommission += (levelAmount * level.rate) / 100;
            remainingSale -= levelAmount;
            prevThreshold = level.threshold;
          } else {
            break;
          }
        }
        
        // Add commission for amount above the highest tier
        if (remainingSale > 0 && sortedLevels.length > 0) {
          const highestLevel = sortedLevels[sortedLevels.length - 1];
          totalCommission += (remainingSale * highestLevel.rate) / 100;
        }
        
        return totalCommission;
        
      case CommissionType.TEAM:
        const teamCommission = (saleAmount * config.teamPercentage) / 100;
        
        // If individual role is specified in metadata, calculate their share
        if (metadata.role) {
          const roleDist = config.distribution.find((d: any) => d.role === metadata.role);
          if (roleDist) {
            return (teamCommission * roleDist.share) / 100;
          }
        }
        
        // Return full team commission if no role specified
        return teamCommission;
        
      case CommissionType.MIXED:
        let mixedCommission = 0;
        
        for (const component of config.components) {
          mixedCommission += this.calculateCommissionAmount(
            component.type,
            component.config,
            saleAmount,
            metadata
          );
        }
        
        return mixedCommission;
        
      default:
        throw new Error(`Unsupported commission type: ${type}`);
    }
  }

  /**
   * Approve a calculated commission
   * 
   * @param commissionId Commission ID
   * @param userId User ID performing the approval
   */
  async approveCommission(commissionId: string, userId: string) {
    try {
      const commission = await this.db.execute(
        `SELECT * FROM hr_employee_commissions WHERE id = $1`,
        [commissionId]
      );
      
      if (!commission.rows || commission.rows.length === 0) {
        throw new Error('Commission record not found');
      }
      
      if (commission.rows[0].status !== CommissionStatus.CALCULATED) {
        throw new Error(`Cannot approve commission in ${commission.rows[0].status} status`);
      }
      
      // Update the commission status
      await this.db.execute(
        `UPDATE hr_employee_commissions
         SET status = $1, approved_by = $2, approved_at = NOW(), updated_by = $2, updated_at = NOW()
         WHERE id = $3`,
        [CommissionStatus.APPROVED, userId, commissionId]
      );
      
      // Audit the approval
      await this.auditService.logAction({
        userId,
        action: AuditAction.UPDATE,
        resourceType: AuditResourceType.EMPLOYEE_COMMISSION,
        resourceId: commissionId,
        metadata: {
          status: CommissionStatus.APPROVED,
          commissionId
        }
      });
      
      return {
        id: commissionId,
        status: CommissionStatus.APPROVED,
        message: 'Commission approved successfully'
      };
    } catch (error: any) {
      console.error('Error approving commission:', error);
      throw new Error(`Failed to approve commission: ${error.message}`);
    }
  }

  /**
   * Mark commission as paid
   * 
   * @param commissionId Commission ID
   * @param paymentReference Reference to the payment
   * @param userId User ID performing the update
   */
  async markCommissionAsPaid(commissionId: string, paymentReference: string, userId: string) {
    try {
      const commission = await this.db.execute(
        `SELECT * FROM hr_employee_commissions WHERE id = $1`,
        [commissionId]
      );
      
      if (!commission.rows || commission.rows.length === 0) {
        throw new Error('Commission record not found');
      }
      
      if (commission.rows[0].status !== CommissionStatus.APPROVED) {
        throw new Error(`Cannot mark commission as paid in ${commission.rows[0].status} status`);
      }
      
      // Update the commission status
      await this.db.execute(
        `UPDATE hr_employee_commissions
         SET status = $1, payment_reference = $2, payment_date = NOW(), updated_by = $3, updated_at = NOW()
         WHERE id = $4`,
        [CommissionStatus.PAID, paymentReference, userId, commissionId]
      );
      
      // Audit the payment
      await this.auditService.logAction({
        userId,
        action: AuditAction.UPDATE,
        resourceType: AuditResourceType.EMPLOYEE_COMMISSION,
        resourceId: commissionId,
        metadata: {
          status: CommissionStatus.PAID,
          commissionId,
          paymentReference
        }
      });
      
      return {
        id: commissionId,
        status: CommissionStatus.PAID,
        paymentReference,
        message: 'Commission marked as paid successfully'
      };
    } catch (error: any) {
      console.error('Error marking commission as paid:', error);
      throw new Error(`Failed to mark commission as paid: ${error.message}`);
    }
  }

  /**
   * Get commissions for an employee
   * 
   * @param employeeId Employee ID
   * @param status Optional status filter
   * @param timeframe Optional timeframe (month, quarter, year)
   * @param limit Optional limit of records to return
   */
  async getEmployeeCommissions(
    employeeId: string,
    status?: CommissionStatus,
    timeframe?: 'month' | 'quarter' | 'year',
    limit: number = 50
  ) {
    try {
      let query = `
        SELECT ec.*, cs.name as structure_name, cs.type as structure_type
        FROM hr_employee_commissions ec
        JOIN hr_commission_structures cs ON ec.structure_id = cs.id
        WHERE ec.employee_id = $1
      `;
      
      const params: any[] = [employeeId];
      
      if (status) {
        query += ` AND ec.status = $${params.length + 1}`;
        params.push(status);
      }
      
      if (timeframe) {
        let interval: string;
        switch (timeframe) {
          case 'month':
            interval = '1 month';
            break;
          case 'quarter':
            interval = '3 months';
            break;
          case 'year':
            interval = '1 year';
            break;
        }
        
        query += ` AND ec.created_at >= NOW() - INTERVAL '${interval}'`;
      }
      
      query += ` ORDER BY ec.created_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);
      
      const commissions = await this.drizzle.executeQuery(query, params);
      
      return commissions.rows || [];
    } catch (error: any) {
      console.error('Error retrieving employee commissions:', error);
      throw new Error(`Failed to retrieve employee commissions: ${error.message}`);
    }
  }

  /**
   * Get commission structures for a company
   * 
   * @param companyId Company ID
   * @param activeOnly Whether to return only active structures
   */
  async getCommissionStructures(companyId: string, activeOnly: boolean = false) {
    try {
      let query = `SELECT * FROM hr_commission_structures WHERE company_id = $1`;
      const params: any[] = [companyId];
      
      if (activeOnly) {
        query += ` AND is_active = true`;
      }
      
      query += ` ORDER BY name ASC`;
      
      const structures = await this.drizzle.executeQuery(query, params);
      
      return structures.rows || [];
    } catch (error: any) {
      console.error('Error retrieving commission structures:', error);
      throw new Error(`Failed to retrieve commission structures: ${error.message}`);
    }
  }

  /**
   * Get a summary of commission amounts by status for a given period
   * 
   * @param companyId Company ID
   * @param year Year for summary
   * @param month Optional month for summary
   */
  async getCommissionSummary(companyId: string, year: number, month?: number) {
    try {
      let dateFilter: string;
      const params: any[] = [companyId];
      
      if (month) {
        dateFilter = `
          EXTRACT(YEAR FROM created_at) = $2 AND 
          EXTRACT(MONTH FROM created_at) = $3
        `;
        params.push(year, month);
      } else {
        dateFilter = `EXTRACT(YEAR FROM created_at) = $2`;
        params.push(year);
      }
      
      const summary = await this.db.execute(
        `SELECT 
          status,
          COUNT(*) as count,
          SUM(commission_amount) as total_amount
         FROM hr_employee_commissions
         WHERE company_id = $1 AND ${dateFilter}
         GROUP BY status`,
        params
      );
      
      return summary.rows || [];
    } catch (error: any) {
      console.error('Error retrieving commission summary:', error);
      throw new Error(`Failed to retrieve commission summary: ${error.message}`);
    }
  }
}