/**
 * Warehouse Management Service
 * 
 * This service handles operations related to warehouse management in accordance with
 * Romanian fiscal and accounting regulations. It supports different warehouse types
 * (depozit, magazin, custodie, transfer) as defined in Romanian legislation.
 */

import { eq, desc, ilike, and, or, isNull } from 'drizzle-orm';
import { DrizzleService } from '../../../common/drizzle/drizzle.service';
import { AuditService, AuditAction } from '../../../modules/audit/services/audit.service';
// Note: pool is now a postgres-js Sql instance from server/db.ts
import { pool } from '../../../db';
import {
  InsertWarehouse,
  Warehouse,
  warehouses,
  warehouseTypeEnum
} from '../../../../shared/schema/warehouse';
import { generateRandomCode } from '../../../../server/utils/code-generator';

export class WarehouseService {
  constructor(
    private readonly db: DrizzleService
  ) {}

  /**
   * Create a new warehouse
   * 
   * @param data - Warehouse data
   * @param userId - ID of the user creating the warehouse
   * @returns The created warehouse
   */
  async createWarehouse(data: InsertWarehouse, userId: string): Promise<Warehouse> {
    const warehouseData = {
      ...data,
      code: data.code || await this.generateWarehouseCode(data.companyId)
    };

    const [warehouse] = await this.db.insertInto(warehouses)
      .values(warehouseData)
      .returning();

    // Log the warehouse creation action
    await AuditService.log({
      action: AuditAction.CREATE,
      entity: 'warehouse',
      entityId: warehouse.id,
      userId,
      companyId: warehouse.companyId,
      data: {
        name: warehouse.name,
        code: warehouse.code,
        type: warehouse.type
      }
    });

    return warehouse;
  }

  /**
   * Update an existing warehouse
   * 
   * @param id - Warehouse ID
   * @param data - Updated warehouse data
   * @param userId - ID of the user updating the warehouse
   * @returns The updated warehouse
   */
  async updateWarehouse(id: string, data: Partial<InsertWarehouse>, userId: string): Promise<Warehouse> {
    const [warehouse] = await this.db.update(warehouses)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(warehouses.id, id))
      .returning();

    if (!warehouse) {
      throw new Error(`Warehouse with ID ${id} not found`);
    }

    // Log the warehouse update action
    await AuditService.log({
      action: AuditAction.UPDATE,
      entity: 'warehouse',
      entityId: warehouse.id,
      userId,
      companyId: warehouse.companyId,
      data: {
        name: warehouse.name,
        code: warehouse.code,
        type: warehouse.type,
        updatedFields: Object.keys(data)
      }
    });

    return warehouse;
  }

  /**
   * Get warehouse by ID
   * 
   * @param id - Warehouse ID
   * @returns The warehouse or null if not found
   */
  async getWarehouseById(id: string): Promise<Warehouse | null> {
    const [warehouse] = await this.db.from(warehouses)
      .where(eq(warehouses.id, id))
      .limit(1);

    return warehouse || null;
  }

  /**
   * Delete a warehouse
   * 
   * @param id - Warehouse ID
   * @param userId - ID of the user deleting the warehouse
   * @returns True if deleted successfully
   */
  async deleteWarehouse(id: string, userId: string): Promise<boolean> {
    // Get warehouse details for audit log
    const warehouse = await this.getWarehouseById(id);
    if (!warehouse) {
      throw new Error(`Warehouse with ID ${id} not found`);
    }

    // Check if warehouse can be deleted (no stock, no assessments, etc.)
    await this.validateWarehouseCanBeDeleted(id);

    // Perform soft delete by setting isActive to false
    const [result] = await this.db.update(warehouses)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(warehouses.id, id))
      .returning();

    // Log the warehouse deletion action
    await AuditService.log({
      action: AuditAction.DELETE,
      entity: 'warehouse',
      entityId: id,
      userId,
      companyId: warehouse.companyId,
      data: {
        name: warehouse.name,
        code: warehouse.code,
        type: warehouse.type
      }
    });

    return !!result;
  }

  /**
   * Get all warehouses for a company with filtering and pagination
   * 
   * @param options - Filter and pagination options
   * @returns List of warehouses and total count
   */
  async getWarehouses(options: {
    companyId: string;
    search?: string;
    type?: keyof typeof warehouseTypeEnum;
    isActive?: boolean;
    page?: number;
    limit?: number;
    parentId?: string | null;
  }): Promise<{ warehouses: Warehouse[]; total: number }> {
    const {
      companyId,
      search,
      type,
      isActive = true,
      page = 1,
      limit = 20,
      parentId
    } = options;

    // For total count
    const countQuery = `
      SELECT COUNT(*) as count
      FROM warehouses
      WHERE company_id = $1
    `;
    const countResult = await pool.query(countQuery, [companyId]);
    const total = Number(countResult.rows[0]?.count || 0);
    
    // Build the base query 
    let query = `
      SELECT * 
      FROM warehouses 
      WHERE company_id = $1
    `;
    
    // Add additional conditions
    const queryParams = [companyId];
    let paramCounter = 2;
    
    if (isActive !== undefined) {
      query += ` AND is_active = $${paramCounter}`;
      queryParams.push(isActive);
      paramCounter++;
    }
    
    if (type) {
      query += ` AND type = $${paramCounter}`;
      queryParams.push(type);
      paramCounter++;
    }
    
    if (parentId !== undefined) {
      if (parentId === null) {
        query += ` AND franchise_id IS NULL`; // Using franchiseId instead of parentId
      } else {
        query += ` AND franchise_id = $${paramCounter}`; // Using franchiseId instead of parentId
        queryParams.push(parentId);
        paramCounter++;
      }
    }
    
    if (search) {
      query += ` AND (name ILIKE $${paramCounter} OR code ILIKE $${paramCounter} OR address ILIKE $${paramCounter})`;
      queryParams.push(`%${search}%`);
      paramCounter++;
    }
    
    // Add sorting and pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
    const offset = (page - 1) * limit;
    queryParams.push(limit, offset);
    
    // Execute the query
    const result = await pool.query(query, queryParams);
    const warehouseRows = result.rows;
      
    return { warehouses: warehouseRows, total };
  }

  /**
   * Get all child warehouses for a parent warehouse
   * 
   * @param parentId - Parent warehouse ID
   * @param companyId - Company ID
   * @returns List of child warehouses
   */
  async getChildWarehouses(parentId: string, companyId: string): Promise<Warehouse[]> {
    const query = `
      SELECT *
      FROM warehouses
      WHERE franchise_id = $1
        AND company_id = $2
        AND is_active = true
      ORDER BY name
    `;
    
    const result = await pool.query(query, [parentId, companyId]);
    return result.rows;
  }

  /**
   * Generate a unique warehouse code
   * 
   * @param companyId - Company ID
   * @returns A unique warehouse code
   */
  private async generateWarehouseCode(companyId: string): Promise<string> {
    const prefix = 'WH';
    let code: string;
    let isUnique = false;
    
    while (!isUnique) {
      // Generate a code in format WH12345
      code = `${prefix}${generateRandomCode(5, 'numeric')}`;
      
      // Check if code already exists
      const [existing] = await this.db.from(warehouses)
        .where(
          and(
            eq(warehouses.code, code),
            eq(warehouses.companyId, companyId)
          )
        )
        .limit(1);
      
      isUnique = !existing;
    }
    
    return code!;
  }

  /**
   * Validate if a warehouse can be deleted
   * 
   * @param warehouseId - Warehouse ID
   * @throws Error if warehouse cannot be deleted
   */
  private async validateWarehouseCanBeDeleted(warehouseId: string): Promise<void> {
    // Check for child warehouses
    const childWarehouses = await this.db.from(warehouses)
      .where(eq(warehouses.franchiseId, warehouseId)) // Using franchiseId instead of parentId
      .limit(1);

    if (childWarehouses.length > 0) {
      throw new Error('Cannot delete warehouse with child warehouses. Please delete child warehouses first.');
    }

    // TODO: Add other validation checks (no stock, no assessments, etc.)
    // This will be implemented when those services are available
  }
}