/**
 * Warehouse Management Service
 * 
 * This service handles operations related to warehouse management in accordance with
 * Romanian fiscal and accounting regulations. It supports different warehouse types
 * (depozit, magazin, custodie, transfer) as defined in Romanian legislation.
 */

import { eq, desc, ilike, and, or, isNull, sql } from 'drizzle-orm';
import { DrizzleService } from "@common/drizzle/drizzle.service";
import { AuditService, AuditAction } from '@geniuserp/audit';
// Postgres pool for raw queries
import { pool } from '@api/db';
import {
  InsertWarehouse,
  Warehouse,
  warehouses,
  warehouseTypeEnum
} from '@geniuserp/shared/schema/warehouse';
import { generateRandomCode } from '../utils/code-generator';

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

    const [warehouse] = await this.db.query(async (db) => 
      db.insert(warehouses)
        .values(warehouseData)
        .returning()
    );

    // Log the warehouse creation action
    await AuditService.console.log({
      action: AuditAction.CREATE,
      entity: 'warehouse',
      entityId: warehouse.id,
      userId,
      companyId: warehouse.companyId,
      details: {
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
    const [warehouse] = await this.db.query(async (db) => 
      db.update(warehouses)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(warehouses.id, id))
        .returning()
    );

    if (!warehouse) {
      throw new Error(`Warehouse with ID ${id} not found`);
    }

    // Log the warehouse update action
    await AuditService.console.log({
      action: AuditAction.UPDATE,
      entity: 'warehouse',
      entityId: warehouse.id,
      userId,
      companyId: warehouse.companyId,
      details: {
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
    const [warehouse] = await this.db.query(async (db) => 
      db.select()
        .from(warehouses)
        .where(eq(warehouses.id, id))
        .limit(1)
    );

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
    const [result] = await this.db.query(async (db) => 
      db.update(warehouses)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(warehouses.id, id))
        .returning()
    );

    // Log the warehouse deletion action
    await AuditService.console.log({
      action: AuditAction.DELETE,
      entity: 'warehouse',
      entityId: id,
      userId,
      companyId: warehouse.companyId,
      details: {
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

    // For total count using DrizzleService
    const total = await this.db.query(async (db) => {
      const result = await db.select({ count: sql<number>`count(*)::int` })
        .from(warehouses)
        .where(eq(warehouses.companyId, companyId));
      return result[0]?.count || 0;
    });
    
    // Build dynamic filters for DrizzleService
    const conditions = [eq(warehouses.companyId, companyId)];
    
    if (isActive !== undefined) {
      conditions.push(eq(warehouses.isActive, isActive));
    }
    
    if (type) {
      // Convert type from enum key to lowercase value for DB comparison
      const typeValue = warehouseTypeEnum[type];
      conditions.push(eq(warehouses.type, typeValue));
    }
    
    if (parentId !== undefined) {
      if (parentId === null) {
        conditions.push(isNull(warehouses.franchiseId));
      } else {
        conditions.push(eq(warehouses.franchiseId, parentId));
      }
    }
    
    if (search) {
      const searchConditions = [
        ilike(warehouses.name, `%${search}%`),
        ilike(warehouses.code, `%${search}%`)
      ];
      if (warehouses.address) {
        searchConditions.push(ilike(warehouses.address, `%${search}%`));
      }
      const searchOr = or(...searchConditions);
      if (searchOr) {
        conditions.push(searchOr);
      }
    }
    
    const warehouseRows = await this.db.query(async (db) => 
      db.select()
        .from(warehouses)
        .where(and(...conditions))
        .orderBy(desc(warehouses.createdAt))
        .limit(limit)
        .offset((page - 1) * limit)
    );
      
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
    return await this.db.query(async (db) => 
      db.select()
        .from(warehouses)
        .where(
          and(
            eq(warehouses.franchiseId, parentId),
            eq(warehouses.companyId, companyId),
            eq(warehouses.isActive, true)
          )
        )
        .orderBy(warehouses.name)
    );
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
      const [existing] = await this.db.query(async (db) => 
        db.select()
          .from(warehouses)
          .where(
            and(
              eq(warehouses.code, code),
              eq(warehouses.companyId, companyId)
            )
          )
          .limit(1)
      );
      
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
    const childWarehouses = await this.db.query(async (db) => 
      db.select()
        .from(warehouses)
        .where(eq(warehouses.franchiseId, warehouseId)) // Using franchiseId instead of parentId
        .limit(1)
    );

    if (childWarehouses.length > 0) {
      throw new Error('Cannot delete warehouse with child warehouses. Please delete child warehouses first.');
    }

    // TODO: Add other validation checks (no stock, no assessments, etc.)
    // This will be implemented when those services are available
  }
}