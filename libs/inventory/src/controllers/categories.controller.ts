/**
 * Categories Controller
 * 
 * Handles HTTP requests related to product categories in the inventory system.
 * Implements RESTful endpoints for category management with proper validation.
 */

import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { CategoriesService } from '../services/categories.service';
import { AuthGuard } from '@geniuserp/auth';
import { JwtAuthMode } from '@geniuserp/auth';
import { log } from "@api/vite";

// Validation schema for creating a category
const createCategorySchema = z.object({
  name: z.string().min(2, 'Numele categoriei trebuie să aibă cel puțin 2 caractere').max(100),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
});

// Validation schema for updating a category
const updateCategorySchema = z.object({
  name: z.string().min(2, 'Numele categoriei trebuie să aibă cel puțin 2 caractere').max(100).optional(),
  description: z.string().optional(),
  parentId: z.string().uuid().nullable().optional(),
});

// Function to create the categories controller
export function createCategoriesController(categoriesService: CategoriesService): Router {
  const router = Router();

  /**
   * Get all categories
   * 
   * @route GET /api/inventory/categories
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   */
  router.get('/', 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (req: Request, res: Response) => {
      try {
        const categories = await categoriesService.getAllCategories();
        res.json(categories);
      } catch (error: any) {
        log(`Error fetching categories: ${error.message}`, 'inventory-categories');
        res.status(500).json({ error: 'Eroare la obținerea categoriilor' });
      }
    }
  );

  /**
   * Get category by ID
   * 
   * @route GET /api/inventory/categories/:id
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   */
  router.get('/:id', 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const category = await categoriesService.getCategoryById(id);
        
        if (!category) {
          return res.status(404).json({ error: 'Categoria nu a fost găsită' });
        }
        
        res.json(category);
      } catch (error: any) {
        log(`Error fetching category: ${error.message}`, 'inventory-categories');
        res.status(500).json({ error: 'Eroare la obținerea categoriei' });
      }
    }
  );

  /**
   * Get root categories (categories without a parent)
   * 
   * @route GET /api/inventory/categories/structure/roots
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   */
  router.get('/structure/roots', 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (req: Request, res: Response) => {
      try {
        const rootCategories = await categoriesService.getRootCategories();
        res.json(rootCategories);
      } catch (error: any) {
        log(`Error fetching root categories: ${error.message}`, 'inventory-categories');
        res.status(500).json({ error: 'Eroare la obținerea categoriilor principale' });
      }
    }
  );

  /**
   * Get child categories for a specific parent
   * 
   * @route GET /api/inventory/categories/children/:parentId
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   */
  router.get('/children/:parentId', 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (req: Request, res: Response) => {
      try {
        const { parentId } = req.params;
        const childCategories = await categoriesService.getChildCategories(parentId);
        res.json(childCategories);
      } catch (error: any) {
        log(`Error fetching child categories: ${error.message}`, 'inventory-categories');
        res.status(500).json({ error: 'Eroare la obținerea subcategoriilor' });
      }
    }
  );

  /**
   * Get complete category hierarchy as a tree
   * 
   * @route GET /api/inventory/categories/structure/hierarchy
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   */
  router.get('/structure/hierarchy', 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (req: Request, res: Response) => {
      try {
        const hierarchy = await categoriesService.getCategoryHierarchy();
        res.json(hierarchy);
      } catch (error: any) {
        log(`Error fetching category hierarchy: ${error.message}`, 'inventory-categories');
        res.status(500).json({ error: 'Eroare la obținerea ierarhiei categoriilor' });
      }
    }
  );

  /**
   * Create a new category
   * 
   * @route POST /api/inventory/categories
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   */
  router.post('/', 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (req: Request, res: Response) => {
      try {
        const validation = createCategorySchema.safeParse(req.body);
        
        if (!validation.success) {
          return res.status(400).json({ 
            error: 'Date de intrare invalide', 
            details: validation.error.issues 
          });
        }

        const { name, description, parentId } = validation.data;
        
        // If parentId is provided, check if it exists
        if (parentId) {
          const parentCategory = await categoriesService.getCategoryById(parentId);
          if (!parentCategory) {
            return res.status(400).json({ error: 'Categoria părinte specificată nu există' });
          }
        }

        // Create the category
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: 'Utilizator neautentificat' });
        }

        try {
          const newCategory = await categoriesService.createCategory({
            name, 
            description, 
            parentId
          }, userId);
          
          res.status(201).json(newCategory);
        } catch (error: any) {
          log(`Error creating category: ${error.message}`, 'inventory-categories');
          
          // Verificăm dacă este o eroare de duplicare (nume duplicat)
          if (error.code === '23505' && error.constraint === 'inventory_categories_name_unique') {
            return res.status(400).json({ 
              error: 'Categoria nu a putut fi creată', 
              details: 'Există deja o categorie cu acest nume. Numele categoriilor trebuie să fie unice.' 
            });
          }
          
          res.status(500).json({ error: 'Eroare la crearea categoriei' });
        }
      } catch (error: any) {
        log(`Error processing category creation: ${error.message}`, 'inventory-categories');
        res.status(500).json({ error: 'Eroare la crearea categoriei' });
      }
    }
  );

  /**
   * Update a category
   * 
   * @route PUT /api/inventory/categories/:id
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   */
  router.put('/:id', 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const validation = updateCategorySchema.safeParse(req.body);
        
        if (!validation.success) {
          return res.status(400).json({ 
            error: 'Date de intrare invalide', 
            details: validation.error.issues 
          });
        }

        // Check if category exists
        const existingCategory = await categoriesService.getCategoryById(id);
        if (!existingCategory) {
          return res.status(404).json({ error: 'Categoria nu a fost găsită' });
        }

        const { name, description, parentId } = validation.data;
        
        // If parentId is provided and not null, check if it exists
        if (parentId !== null && parentId !== undefined) {
          // Check that category is not trying to be its own parent
          if (parentId === id) {
            return res.status(400).json({ error: 'O categorie nu poate fi propria sa categorie părinte' });
          }

          const parentCategory = await categoriesService.getCategoryById(parentId);
          if (!parentCategory) {
            return res.status(400).json({ error: 'Categoria părinte specificată nu există' });
          }
        }

        // Update the category
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: 'Utilizator neautentificat' });
        }

        try {
          const updatedCategory = await categoriesService.updateCategory(id, {
            name, 
            description, 
            parentId
          }, userId);

          res.json(updatedCategory);
        } catch (error: any) {
          log(`Error updating category: ${error.message}`, 'inventory-categories');
          
          // Verificăm dacă este o eroare de duplicare (nume duplicat)
          if (error.code === '23505' && error.constraint === 'inventory_categories_name_unique') {
            return res.status(400).json({ 
              error: 'Categoria nu a putut fi actualizată', 
              details: 'Există deja o categorie cu acest nume. Numele categoriilor trebuie să fie unice.' 
            });
          }
          
          res.status(500).json({ error: 'Eroare la actualizarea categoriei' });
        }
      } catch (error: any) {
        log(`Error processing category update: ${error.message}`, 'inventory-categories');
        res.status(500).json({ error: 'Eroare la actualizarea categoriei' });
      }
    }
  );

  /**
   * Delete a category
   * 
   * @route DELETE /api/inventory/categories/:id
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   */
  router.delete('/:id', 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        // Check if category exists
        const existingCategory = await categoriesService.getCategoryById(id);
        if (!existingCategory) {
          return res.status(404).json({ error: 'Categoria nu a fost găsită' });
        }

        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: 'Utilizator neautentificat' });
        }

        // Delete the category
        await categoriesService.deleteCategory(id, userId);
        res.json({ success: true, message: 'Categoria a fost ștearsă cu succes' });
      } catch (error: any) {
        log(`Error deleting category: ${error.message}`, 'inventory-categories');
        
        // Return better error messages for specific errors
        if (error.message && error.message.includes('Cannot delete category with children')) {
          return res.status(400).json({ 
            error: 'Nu se poate șterge o categorie care are subcategorii. Vă rugăm să ștergeți mai întâi subcategoriile sau să le reatribuiți.' 
          });
        }
        
        if (error.message && error.message.includes('Cannot delete category that has products')) {
          return res.status(400).json({ 
            error: 'Nu se poate șterge o categorie care are produse atribuite. Vă rugăm să reatribuiți produsele mai întâi.' 
          });
        }
        
        res.status(500).json({ error: 'Eroare la ștergerea categoriei' });
      }
    }
  );

  return router;
}

// Create a singleton instance for the categories controller

// Import the categories service from our singleton
import { categoriesService } from '../categories.service.instance';

// Create the controller instance
export const categoriesController = createCategoriesController(categoriesService);