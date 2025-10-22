/**
 * Products Service
 * 
 * Service for managing products in the inventory system
 * Provides CRUD operations with support for validation and uniqueness constraints
 */

import { and, desc, eq, sql } from 'drizzle-orm';
import { inventoryProducts } from '../../../../shared/schema';
import { DrizzleService } from "@common/drizzle/drizzle.service";
import AuditService, { AuditAction } from '../../../modules/audit/services/audit.service';
import { ENTITY_NAME } from '../inventory.module';

export class ProductsService {
  constructor(
    private readonly db: DrizzleService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Get all products
   * @returns Promise with all products
   */
  async getAllProducts() {
    return await this.db.query(async (db) => {
      return await db.select().from(inventoryProducts).orderBy(desc(inventoryProducts.name));
    });
  }

  /**
   * Get a product by ID
   * @param id Product ID
   * @returns Product object or null if not found
   */
  async getProductById(id: string) {
    return await this.db.query(async (db) => {
      const products = await db.select().from(inventoryProducts).where(eq(inventoryProducts.id, id)).limit(1);
      return products.length > 0 ? products[0] : null;
    });
  }

  /**
   * Get products by category
   * @param categoryId Category ID
   * @returns Promise with products in the specified category
   */
  async getProductsByCategory(categoryId: string) {
    return await this.db.query(async (db) => {
      return await db.select().from(inventoryProducts)
        .where(eq(inventoryProducts.categoryId, categoryId))
        .orderBy(desc(inventoryProducts.name));
    });
  }

  /**
   * Check if a product with the given name or SKU exists
   * @param name Product name
   * @param sku Product SKU
   * @param excludeId Optional ID to exclude from the check (for updates)
   * @returns Boolean indicating if a duplicate exists
   */
  async checkProductExists(name: string, sku: string, excludeId?: string) {
    return await this.db.query(async (db) => {
      let query = db.select().from(inventoryProducts)
        .where(sql`${inventoryProducts.name} = ${name} OR ${inventoryProducts.sku} = ${sku}`);
      
      if (excludeId) {
        query = query.where(sql`${inventoryProducts.id} != ${excludeId}`);
      }
      
      const results = await query.limit(1);
      return results.length > 0;
    });
  }

  /**
   * Create a new product
   * @param data Product data
   * @param userId User ID who created the product
   * @returns Created product
   */
  async createProduct(data: {
    name: string;
    sku: string;
    description?: string;
    categoryId?: string;
    unitId?: string;
    purchasePrice?: number;
    sellingPrice?: number;
    priceIncludesVat?: boolean;
    vatRate?: number;
    stockAlert?: number;
    isActive?: boolean;
    barcode?: string;
  }, userId: string) {
    // Check if a product with the same name or SKU exists
    const existingProduct = await this.checkProductExists(data.name, data.sku);
    if (existingProduct) {
      throw new Error('A product with this name or SKU already exists');
    }

    const result = await this.db.transaction(async (tx) => {
      const [product] = await tx.insert(inventoryProducts).values({
        name: data.name,
        sku: data.sku,
        description: data.description,
        categoryId: data.categoryId,
        unitId: data.unitId,
        purchasePrice: data.purchasePrice !== undefined ? data.purchasePrice.toString() : "0",
        sellingPrice: data.sellingPrice !== undefined ? data.sellingPrice.toString() : "0",
        priceIncludesVat: data.priceIncludesVat !== undefined ? data.priceIncludesVat : true,
        vatRate: data.vatRate,
        stockAlert: data.stockAlert !== undefined ? data.stockAlert.toString() : "0",
        isActive: data.isActive !== undefined ? data.isActive : true,
        barcode: data.barcode,
      }).returning();

      // Log the action for audit
      await AuditService.log({
        userId,
        companyId: 'system', // Temporar până avem companyId
        action: AuditAction.CREATE,
        entity: ENTITY_NAME,
        entityId: product.id,
        details: {
          message: `Created product: ${data.name} (${data.sku})`,
          oldValue: null,
          newValue: JSON.stringify(product)
        }
      });

      return product;
    });

    return result;
  }

  /**
   * Update a product
   * @param id Product ID
   * @param data Product update data
   * @param userId User ID who updated the product
   * @returns Updated product
   */
  async updateProduct(id: string, data: {
    name?: string;
    sku?: string;
    description?: string;
    categoryId?: string;
    unitId?: string;
    purchasePrice?: number;
    sellingPrice?: number;
    priceIncludesVat?: boolean;
    vatRate?: number;
    stockAlert?: number;
    isActive?: boolean;
    barcode?: string;
  }, userId: string) {
    // Get the current product first for audit log
    const oldProduct = await this.getProductById(id);
    if (!oldProduct) {
      throw new Error(`Product with ID ${id} not found`);
    }

    // If name or SKU is being updated, check for duplicates
    if ((data.name && data.name !== oldProduct.name) || (data.sku && data.sku !== oldProduct.sku)) {
      const nameToCheck = data.name || oldProduct.name;
      const skuToCheck = data.sku || oldProduct.sku;
      
      const existingProduct = await this.checkProductExists(nameToCheck, skuToCheck, id);
      if (existingProduct) {
        throw new Error('A product with this name or SKU already exists');
      }
    }

    const result = await this.db.transaction(async (tx) => {
      const [updatedProduct] = await tx
        .update(inventoryProducts)
        .set({
          name: data.name !== undefined ? data.name : oldProduct.name,
          sku: data.sku !== undefined ? data.sku : oldProduct.sku,
          description: data.description !== undefined ? data.description : oldProduct.description,
          categoryId: data.categoryId !== undefined ? data.categoryId : oldProduct.categoryId,
          unitId: data.unitId !== undefined ? data.unitId : oldProduct.unitId,
          purchasePrice: data.purchasePrice !== undefined ? data.purchasePrice.toString() : oldProduct.purchasePrice,
          sellingPrice: data.sellingPrice !== undefined ? data.sellingPrice.toString() : oldProduct.sellingPrice,
          priceIncludesVat: data.priceIncludesVat !== undefined ? data.priceIncludesVat : oldProduct.priceIncludesVat,
          vatRate: data.vatRate !== undefined ? data.vatRate : oldProduct.vatRate,
          stockAlert: data.stockAlert !== undefined ? data.stockAlert.toString() : oldProduct.stockAlert,
          isActive: data.isActive !== undefined ? data.isActive : oldProduct.isActive,
          barcode: data.barcode !== undefined ? data.barcode : oldProduct.barcode,
          updatedAt: new Date()
        })
        .where(eq(inventoryProducts.id, id))
        .returning();

      // Log the action for audit
      await AuditService.log({
        userId,
        companyId: 'system', // Temporar până avem companyId
        action: AuditAction.UPDATE,
        entity: ENTITY_NAME,
        entityId: id,
        details: {
          message: `Updated product: ${oldProduct.name} → ${updatedProduct.name}`,
          oldValue: JSON.stringify(oldProduct),
          newValue: JSON.stringify(updatedProduct)
        }
      });

      return updatedProduct;
    });

    return result;
  }

  /**
   * Delete a product
   * @param id Product ID
   * @param userId User ID who deleted the product
   * @returns true if deletion was successful
   */
  async deleteProduct(id: string, userId: string) {
    // Get the product for audit log
    const product = await this.getProductById(id);
    if (!product) {
      throw new Error(`Product with ID ${id} not found`);
    }

    // Check if there are stock movements associated with this product
    const movementsCount = await this.db.query(async (db) => {
      const result = await db.execute(
        sql`SELECT COUNT(*) as count FROM inventory_stock_movements WHERE product_id = ${id}`
      );
      return result.rows && result.rows.length > 0 ? parseInt(result.rows[0].count, 10) : 0;
    });
    
    if (movementsCount > 0) {
      throw new Error(`Cannot delete product that has stock movements. Consider deactivating it instead.`);
    }

    return await this.db.transaction(async (tx) => {
      await tx
        .delete(inventoryProducts)
        .where(eq(inventoryProducts.id, id));

      // Log the action for audit
      await AuditService.log({
        userId,
        companyId: 'system', // Temporar până avem companyId
        action: AuditAction.DELETE,
        entity: ENTITY_NAME,
        entityId: id,
        details: {
          message: `Deleted product: ${product.name} (${product.sku})`,
          oldValue: JSON.stringify(product),
          newValue: null
        }
      });

      return true;
    });
  }

  /**
   * Deactivate a product without deleting it
   * @param id Product ID
   * @param userId User ID who deactivated the product
   * @returns Updated product
   */
  async deactivateProduct(id: string, userId: string) {
    const oldProduct = await this.getProductById(id);
    if (!oldProduct) {
      throw new Error(`Product with ID ${id} not found`);
    }

    const result = await this.db.transaction(async (tx) => {
      const [updatedProduct] = await tx
        .update(inventoryProducts)
        .set({
          isActive: false,
          updatedAt: new Date()
        })
        .where(eq(inventoryProducts.id, id))
        .returning();

      // Log the action for audit
      await AuditService.log({
        userId,
        companyId: 'system', // Temporar până avem companyId
        action: AuditAction.UPDATE,
        entity: ENTITY_NAME,
        entityId: id,
        details: {
          message: `Deactivated product: ${oldProduct.name}`,
          oldValue: JSON.stringify(oldProduct),
          newValue: JSON.stringify(updatedProduct)
        }
      });

      return updatedProduct;
    });

    return result;
  }
}