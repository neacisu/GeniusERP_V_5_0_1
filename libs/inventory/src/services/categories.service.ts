/**
 * Categories Service
 * 
 * Service for managing product categories in the inventory system
 * Provides CRUD operations for category management with support for hierarchical categories
 */

import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { inventoryCategories } from '../../../../shared/schema';
import { DrizzleService } from "@common/drizzle/drizzle.service";
import { AuditService } from '../../../modules/audit/services/audit.service';
import { InventoryCategory } from '../../../../shared/schema';
import { ENTITY_NAME } from '../inventory.module';

export class CategoriesService {
  constructor(
    private readonly db: DrizzleService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Get all categories
   * @returns Promise with all categories
   */
  async getAllCategories() {
    return await this.db.query(async (db) => {
      return await db.select().from(inventoryCategories).orderBy(desc(inventoryCategories.name));
    });
  }

  /**
   * Get a category by ID
   * @param id Category ID
   * @returns Category object or null if not found
   */
  async getCategoryById(id: string) {
    return await this.db.query(async (db) => {
      const categories = await db.select().from(inventoryCategories).where(eq(inventoryCategories.id, id)).limit(1);
      return categories.length > 0 ? categories[0] : null;
    });
  }

  /**
   * Get root categories (categories without a parent)
   * @returns Promise with root categories
   */
  async getRootCategories() {
    return await this.db.query(async (db) => {
      return await db.select().from(inventoryCategories)
        .where(isNull(inventoryCategories.parentId))
        .orderBy(desc(inventoryCategories.name));
    });
  }

  /**
   * Get child categories for a given parent category
   * @param parentId Parent category ID
   * @returns Promise with child categories
   */
  async getChildCategories(parentId: string) {
    return await this.db.query(async (db) => {
      return await db.select().from(inventoryCategories)
        .where(eq(inventoryCategories.parentId, parentId))
        .orderBy(desc(inventoryCategories.name));
    });
  }

  /**
   * Create a new category
   * @param data Category data
   * @param userId User ID who created the category
   * @returns Created category
   */
  async createCategory(data: { name: string; description?: string; parentId?: string }, userId: string) {
    const result = await this.db.transaction(async (tx) => {
      const [category] = await tx.insert(inventoryCategories).values({
        name: data.name,
        description: data.description,
        parentId: data.parentId || null,
      }).returning();

      // Log the action for audit
      await this.auditService.logAction({
        userId,
        action: 'create',
        entityType: ENTITY_NAME,
        entityId: category.id,
        details: `Created category: ${data.name}`,
        oldValue: null,
        newValue: JSON.stringify(category)
      });

      return category;
    });

    return result;
  }

  /**
   * Update a category
   * @param id Category ID
   * @param data Category update data
   * @param userId User ID who updated the category
   * @returns Updated category
   */
  async updateCategory(id: string, data: { name?: string; description?: string; parentId?: string | null }, userId: string) {
    // Get the current category first for audit log
    const oldCategory = await this.getCategoryById(id);
    if (!oldCategory) {
      throw new Error(`Category with ID ${id} not found`);
    }

    const result = await this.db.transaction(async (tx) => {
      const [updatedCategory] = await tx
        .update(inventoryCategories)
        .set({
          name: data.name !== undefined ? data.name : oldCategory.name,
          description: data.description !== undefined ? data.description : oldCategory.description,
          parentId: data.parentId !== undefined ? data.parentId : oldCategory.parentId,
          updatedAt: new Date()
        })
        .where(eq(inventoryCategories.id, id))
        .returning();

      // Log the action for audit
      await this.auditService.logAction({
        userId,
        action: 'update',
        entityType: ENTITY_NAME,
        entityId: id,
        details: `Updated category: ${oldCategory.name} → ${updatedCategory.name}`,
        oldValue: JSON.stringify(oldCategory),
        newValue: JSON.stringify(updatedCategory)
      });

      return updatedCategory;
    });

    return result;
  }

  /**
   * Delete a category
   * @param id Category ID
   * @param userId User ID who deleted the category
   * @returns true if deletion was successful
   */
  async deleteCategory(id: string, userId: string) {
    // Get the category for audit log
    const category = await this.getCategoryById(id);
    if (!category) {
      throw new Error(`Category with ID ${id} not found`);
    }

    // Check if there are child categories
    const children = await this.getChildCategories(id);
    if (children.length > 0) {
      throw new Error(`Cannot delete category with children. Please delete or reassign child categories first.`);
    }

    // Check if there are products associated with this category
    const productsCount = await this.db.executeQuery(
      sql`SELECT COUNT(*) FROM inventory_products WHERE category_id = ${id}`
    );
    
    if (productsCount.rows && productsCount.rows[0] && parseInt(productsCount.rows[0].count, 10) > 0) {
      throw new Error(`Cannot delete category that has products. Please reassign or delete products first.`);
    }

    return await this.db.transaction(async (tx) => {
      await tx
        .delete(inventoryCategories)
        .where(eq(inventoryCategories.id, id));

      // Log the action for audit
      await this.auditService.logAction({
        userId,
        action: 'delete',
        entityType: ENTITY_NAME,
        entityId: id,
        details: `Deleted category: ${category.name}`,
        oldValue: JSON.stringify(category),
        newValue: null
      });

      return true;
    });
  }

  /**
   * Get a complete category hierarchy as a tree structure
   * @returns Hierarchical tree of categories
   */
  async getCategoryHierarchy() {
    const allCategories = await this.getAllCategories();
    return this.buildCategoryTree(allCategories);
  }

  /**
   * Build a tree structure from flat category list
   * @param categories List of all categories
   * @param parentId Parent ID to start with (null for root level)
   * @returns Hierarchical tree structure
   */
  private buildCategoryTree(categories: any[], parentId: string | null = null): any[] {
    return categories
      .filter(category => category.parentId === parentId)
      .map(category => ({
        ...category,
        children: this.buildCategoryTree(categories, category.id)
      }));
  }
}