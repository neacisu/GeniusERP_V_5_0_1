/**
 * Units Controller
 * 
 * This controller handles all operations related to inventory units (unități de măsură)
 * for the inventory management system.
 */

import { Request, Response, NextFunction, Router } from 'express';
import { AuthGuard } from '@geniuserp/auth';
import { JwtAuthMode } from '@geniuserp/auth';
import { UserRole } from '@geniuserp/auth';
import DB from "@common/drizzle/db";
import { inventoryUnits, inventoryProducts } from '@geniuserp/shared';
import { eq } from 'drizzle-orm';
import { ENTITY_NAME } from '../inventory.module';

// Create router
const router = Router();

// Role constants for inventory operations
const INVENTORY_ROLES = [UserRole.ADMIN, UserRole.USER];

/**
 * Get all units
 * 
 * @route GET /api/inventory/units
 */
router.get('/', 
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const db = DB.getDrizzleInstance();
      
      const units = await db.select().from(inventoryUnits);
      
      return res.status(200).json(units);
    } catch (error: any) {
      console.error('Error fetching inventory units:', error);
      return res.status(500).json({ 
        error: 'Failed to retrieve inventory units', 
        details: error.message 
      });
    }
  }
);

/**
 * Get unit by ID
 * 
 * @route GET /api/inventory/units/:id
 */
router.get('/:id', 
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const db = DB.getDrizzleInstance();
      
      const [unit] = await db
        .select()
        .from(inventoryUnits)
        .where(eq(inventoryUnits.id, id));
      
      if (!unit) {
        return res.status(404).json({ error: 'Unit not found' });
      }
      
      return res.status(200).json(unit);
    } catch (error: any) {
      console.error('Error fetching inventory unit:', error);
      return res.status(500).json({ 
        error: 'Failed to retrieve inventory unit', 
        details: error.message 
      });
    }
  }
);

/**
 * Create new unit
 * 
 * @route POST /api/inventory/units
 */
router.post('/', 
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  AuthGuard.roleGuard(INVENTORY_ROLES),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, abbreviation } = req.body;
      const db = DB.getDrizzleInstance();
      
      if (!name || !abbreviation) {
        return res.status(400).json({ 
          error: 'Unit name and abbreviation are required' 
        });
      }
      
      // Check if unit with same name already exists
      const existingUnits = await db
        .select()
        .from(inventoryUnits)
        .where(eq(inventoryUnits.name, name));
      
      if (existingUnits.length > 0) {
        return res.status(409).json({ 
          error: 'Unit with this name already exists' 
        });
      }
      
      // Create the unit
      const [newUnit] = await db
        .insert(inventoryUnits)
        .values({
          name,
          abbreviation
        })
        .returning();
      
      return res.status(201).json(newUnit);
    } catch (error: any) {
      console.error('Error creating inventory unit:', error);
      return res.status(500).json({ 
        error: 'Failed to create inventory unit', 
        details: error.message 
      });
    }
  }
);

/**
 * Update unit
 * 
 * @route PUT /api/inventory/units/:id
 */
router.put('/:id', 
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  AuthGuard.roleGuard(INVENTORY_ROLES),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { name, abbreviation } = req.body;
      const db = DB.getDrizzleInstance();
      
      if (!name && !abbreviation) {
        return res.status(400).json({ 
          error: 'At least one field (name or abbreviation) must be provided for update' 
        });
      }
      
      // Check if unit exists
      const [existingUnit] = await db
        .select()
        .from(inventoryUnits)
        .where(eq(inventoryUnits.id, id));
      
      if (!existingUnit) {
        return res.status(404).json({ error: 'Unit not found' });
      }
      
      // If name is provided, check if it's unique
      if (name && name !== existingUnit.name) {
        const duplicateUnits = await db
          .select()
          .from(inventoryUnits)
          .where(eq(inventoryUnits.name, name));
        
        if (duplicateUnits.length > 0) {
          return res.status(409).json({ 
            error: 'Unit with this name already exists' 
          });
        }
      }
      
      // Update the unit
      const [updatedUnit] = await db
        .update(inventoryUnits)
        .set({ 
          name: name || existingUnit.name,
          abbreviation: abbreviation || existingUnit.abbreviation,
          updatedAt: new Date()
        })
        .where(eq(inventoryUnits.id, id))
        .returning();
      
      return res.status(200).json(updatedUnit);
    } catch (error: any) {
      console.error('Error updating inventory unit:', error);
      return res.status(500).json({ 
        error: 'Failed to update inventory unit', 
        details: error.message 
      });
    }
  }
);

/**
 * Delete unit
 * 
 * @route DELETE /api/inventory/units/:id
 */
router.delete('/:id', 
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  AuthGuard.roleGuard(INVENTORY_ROLES),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const db = DB.getDrizzleInstance();
      
      // Check if unit exists
      const [existingUnit] = await db
        .select()
        .from(inventoryUnits)
        .where(eq(inventoryUnits.id, id));
      
      if (!existingUnit) {
        return res.status(404).json({ error: 'Unit not found' });
      }
      
      // Check if unit is used by any products
      const products = await db
        .select()
        .from(inventoryProducts)
        .where(eq(inventoryProducts.unitId, id))
        .limit(1);
      
      if (products.length > 0) {
        return res.status(409).json({ 
          error: 'This unit is used by products and cannot be deleted' 
        });
      }
      
      // Delete the unit
      await db
        .delete(inventoryUnits)
        .where(eq(inventoryUnits.id, id));
      
      return res.status(200).json({ 
        message: 'Unit deleted successfully',
        id
      });
    } catch (error: any) {
      console.error('Error deleting inventory unit:', error);
      return res.status(500).json({ 
        error: 'Failed to delete inventory unit', 
        details: error.message 
      });
    }
  }
);

export const unitsController = router;