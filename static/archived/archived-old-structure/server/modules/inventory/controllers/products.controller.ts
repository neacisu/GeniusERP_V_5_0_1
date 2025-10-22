/**
 * Products Controller
 * 
 * Handles HTTP requests related to products in the inventory system.
 * Implements RESTful endpoints for product management with proper validation.
 */

import { Router, Request, Response } from 'express';
import { AuthGuard } from '../../../modules/auth/guards/auth.guard';
import { JwtAuthMode } from '../../../modules/auth/constants/auth-mode.enum';
import { z } from 'zod';
import { ProductsService } from '../services/products.service';
import { log } from '../../../vite';
import { importValidatorService } from '../services/import-validator.service.instance';
import { ImportOptions } from '../types/import-validation';

// Define validation schemas
const createProductSchema = z.object({
  name: z.string().min(2, 'Numele produsului trebuie să aibă cel puțin 2 caractere').max(100),
  sku: z.string().min(2, 'SKU-ul produsului trebuie să aibă cel puțin 2 caractere').max(50),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
  purchasePrice: z.number().nonnegative().optional(),
  sellingPrice: z.number().nonnegative().optional(),
  vatRate: z.number().min(0).max(100).optional(),
  stockAlert: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
  barcode: z.string().optional()
});

const updateProductSchema = z.object({
  name: z.string().min(2, 'Numele produsului trebuie să aibă cel puțin 2 caractere').max(100).optional(),
  sku: z.string().min(2, 'SKU-ul produsului trebuie să aibă cel puțin 2 caractere').max(50).optional(),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  unitId: z.string().uuid().optional(),
  purchasePrice: z.number().nonnegative().optional(),
  sellingPrice: z.number().nonnegative().optional(),
  vatRate: z.number().min(0).max(100).optional(),
  stockAlert: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
  barcode: z.string().optional()
});

// Factory function to create a products controller with dependency injection
export function createProductsController(productsService: ProductsService): Router {
  const router = Router();

  /**
   * Get all products
   * 
   * @route GET /api/inventory/products
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   */
  router.get('/', 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (req: Request, res: Response) => {
      try {
        const products = await productsService.getAllProducts();
        res.json(products);
      } catch (error: any) {
        log(`Error fetching products: ${error.message}`, 'inventory-products');
        res.status(500).json({ error: 'Eroare la obținerea produselor' });
      }
    }
  );

  /**
   * Get a product by ID
   * 
   * @route GET /api/inventory/products/:id
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   */
  router.get('/:id', 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const product = await productsService.getProductById(id);
        
        if (!product) {
          return res.status(404).json({ error: 'Produsul nu a fost găsit' });
        }
        
        res.json(product);
      } catch (error: any) {
        log(`Error fetching product: ${error.message}`, 'inventory-products');
        res.status(500).json({ error: 'Eroare la obținerea produsului' });
      }
    }
  );

  /**
   * Get products by category
   * 
   * @route GET /api/inventory/products/category/:categoryId
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   */
  router.get('/category/:categoryId', 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (req: Request, res: Response) => {
      try {
        const { categoryId } = req.params;
        const products = await productsService.getProductsByCategory(categoryId);
        res.json(products);
      } catch (error: any) {
        log(`Error fetching products by category: ${error.message}`, 'inventory-products');
        res.status(500).json({ error: 'Eroare la obținerea produselor după categorie' });
      }
    }
  );

  /**
   * Create a new product
   * 
   * @route POST /api/inventory/products
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   */
  router.post('/', 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (req: Request, res: Response) => {
      try {
        const validation = createProductSchema.safeParse(req.body);
        
        if (!validation.success) {
          return res.status(400).json({ 
            error: 'Date de intrare invalide', 
            details: validation.error.issues 
          });
        }

        const productData = validation.data;
        
        // Create the product
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: 'Utilizator neautentificat' });
        }

        try {
          const newProduct = await productsService.createProduct(productData, userId);
          res.status(201).json(newProduct);
        } catch (error: any) {
          log(`Error creating product: ${error.message}`, 'inventory-products');
          
          // Check if it's a duplicate error
          if (error.message && error.message.includes('already exists')) {
            return res.status(400).json({ 
              error: 'Produsul nu a putut fi creat', 
              details: 'Există deja un produs cu acest nume sau SKU. Numele și SKU-ul produselor trebuie să fie unice.' 
            });
          } else if (error.code === '23505') {
            // Handle SQL unique constraint violation
            if (error.constraint === 'inventory_products_name_unique') {
              return res.status(400).json({ 
                error: 'Produsul nu a putut fi creat', 
                details: 'Există deja un produs cu acest nume. Numele produselor trebuie să fie unice.' 
              });
            } else if (error.constraint === 'inventory_products_sku_unique') {
              return res.status(400).json({ 
                error: 'Produsul nu a putut fi creat', 
                details: 'Există deja un produs cu acest SKU. SKU-ul produselor trebuie să fie unic.' 
              });
            }
          }
          
          res.status(500).json({ error: 'Eroare la crearea produsului' });
        }
      } catch (error: any) {
        log(`Error processing product creation: ${error.message}`, 'inventory-products');
        res.status(500).json({ error: 'Eroare la crearea produsului' });
      }
    }
  );

  /**
   * Update a product
   * 
   * @route PUT /api/inventory/products/:id
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   */
  router.put('/:id', 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const validation = updateProductSchema.safeParse(req.body);
        
        if (!validation.success) {
          return res.status(400).json({ 
            error: 'Date de intrare invalide', 
            details: validation.error.issues 
          });
        }

        // Check if product exists
        const existingProduct = await productsService.getProductById(id);
        if (!existingProduct) {
          return res.status(404).json({ error: 'Produsul nu a fost găsit' });
        }

        const productData = validation.data;
        
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: 'Utilizator neautentificat' });
        }

        try {
          const updatedProduct = await productsService.updateProduct(id, productData, userId);
          res.json(updatedProduct);
        } catch (error: any) {
          log(`Error updating product: ${error.message}`, 'inventory-products');
          
          // Check if it's a duplicate error
          if (error.message && error.message.includes('already exists')) {
            return res.status(400).json({ 
              error: 'Produsul nu a putut fi actualizat', 
              details: 'Există deja un produs cu acest nume sau SKU. Numele și SKU-ul produselor trebuie să fie unice.' 
            });
          } else if (error.code === '23505') {
            // Handle SQL unique constraint violation
            if (error.constraint === 'inventory_products_name_unique') {
              return res.status(400).json({ 
                error: 'Produsul nu a putut fi actualizat', 
                details: 'Există deja un produs cu acest nume. Numele produselor trebuie să fie unice.' 
              });
            } else if (error.constraint === 'inventory_products_sku_unique') {
              return res.status(400).json({ 
                error: 'Produsul nu a putut fi actualizat', 
                details: 'Există deja un produs cu acest SKU. SKU-ul produselor trebuie să fie unic.' 
              });
            }
          }
          
          res.status(500).json({ error: 'Eroare la actualizarea produsului' });
        }
      } catch (error: any) {
        log(`Error processing product update: ${error.message}`, 'inventory-products');
        res.status(500).json({ error: 'Eroare la actualizarea produsului' });
      }
    }
  );

  /**
   * Delete a product
   * 
   * @route DELETE /api/inventory/products/:id
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   */
  router.delete('/:id', 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        // Check if product exists
        const existingProduct = await productsService.getProductById(id);
        if (!existingProduct) {
          return res.status(404).json({ error: 'Produsul nu a fost găsit' });
        }

        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: 'Utilizator neautentificat' });
        }

        try {
          // Delete the product
          await productsService.deleteProduct(id, userId);
          res.json({ success: true, message: 'Produsul a fost șters cu succes' });
        } catch (error: any) {
          log(`Error deleting product: ${error.message}`, 'inventory-products');
          
          // Return better error messages for specific errors
          if (error.message && error.message.includes('has stock movements')) {
            return res.status(400).json({ 
              error: 'Nu se poate șterge un produs care are mișcări de stoc. Vă rugăm să îl dezactivați în loc să-l ștergeți.' 
            });
          }
          
          res.status(500).json({ error: 'Eroare la ștergerea produsului' });
        }
      } catch (error: any) {
        log(`Error processing product deletion: ${error.message}`, 'inventory-products');
        res.status(500).json({ error: 'Eroare la ștergerea produsului' });
      }
    }
  );

  /**
   * Deactivate a product
   * 
   * @route PUT /api/inventory/products/:id/deactivate
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   */
  router.put('/:id/deactivate', 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        // Check if product exists
        const existingProduct = await productsService.getProductById(id);
        if (!existingProduct) {
          return res.status(404).json({ error: 'Produsul nu a fost găsit' });
        }

        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: 'Utilizator neautentificat' });
        }

        const deactivatedProduct = await productsService.deactivateProduct(id, userId);
        res.json(deactivatedProduct);
      } catch (error: any) {
        log(`Error deactivating product: ${error.message}`, 'inventory-products');
        res.status(500).json({ error: 'Eroare la dezactivarea produsului' });
      }
    }
  );

  /**
   * Validează datele de import pentru produse
   * Procesul de import în două etape - etapa 1: validarea datelor
   * 
   * @route POST /api/inventory/products/validate-import
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   */
  router.post('/validate-import', 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (req: Request, res: Response) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: 'Utilizator neautentificat' });
        }

        const { data } = req.body;

        if (!Array.isArray(data) || data.length === 0) {
          return res.status(400).json({ 
            error: 'Format invalid pentru importul de produse', 
            details: 'Date lipsă sau în format incorect.' 
          });
        }

        // Validează datele
        const validationReport = await importValidatorService.validateProductImport(data);

        if (!validationReport.isValid) {
          // Returnăm raportul detaliat de validare care conține toate erorile
          return res.status(400).json({
            error: 'Fișierul de import conține erori',
            validationReport
          });
        }

        // Returnăm raportul de validare și datele validate pentru a fi utilizate în pasul 2
        res.json({
          message: 'Validarea importului a reușit',
          validationReport,
          preview: validationReport.validData.slice(0, 5) // Primele 5 înregistrări pentru previzualizare
        });
      } catch (error: any) {
        log(`Error validating import: ${error.message}`, 'inventory-products');
        res.status(500).json({ error: 'Eroare la validarea importului' });
      }
    }
  );

  /**
   * Importă produse validat anterior
   * Procesul de import în două etape - etapa 2: importul efectiv
   * 
   * @route POST /api/inventory/products/import
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   */
  router.post('/import', 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (req: Request, res: Response) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: 'Utilizator neautentificat' });
        }

        const { data, options } = req.body;

        if (!Array.isArray(data) || data.length === 0) {
          return res.status(400).json({ 
            error: 'Date invalide', 
            details: 'Datele validat anterior lipsesc sau sunt incorecte.' 
          });
        }

        if (!options || typeof options !== 'object') {
          return res.status(400).json({ 
            error: 'Opțiuni invalide', 
            details: 'Opțiunile de import lipsesc sau sunt incorecte.' 
          });
        }

        // Configurăm opțiunile de import
        const importOptions: ImportOptions = {
          mode: options.mode || 'create',
          matchField: options.matchField || 'sku',
          format: options.format || 'excel',
          generateBarcodes: options.generateBarcodes !== false,  // Implicit true
          companyId: options.companyId || req.user?.companyId || ''
        };

        // Verificăm dacă avem un companyId valid
        if (!importOptions.companyId) {
          return res.status(400).json({ 
            error: 'Opțiuni invalide', 
            details: 'ID-ul companiei lipsește.' 
          });
        }

        // Importăm datele în baza de date
        const importResult = await importValidatorService.importProducts(data, importOptions);

        res.json({
          message: importResult.message,
          success: importResult.success,
          report: importResult.report
        });
      } catch (error: any) {
        log(`Error importing products: ${error.message}`, 'inventory-products');
        res.status(500).json({ error: 'Eroare la importul produselor' });
      }
    }
  );

  /**
   * Verifică existența unui cod de bare
   * 
   * @route GET /api/inventory/products/check-barcode/:barcode
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   */
  router.get('/check-barcode/:barcode', 
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (req: Request, res: Response) => {
      try {
        const { barcode } = req.params;
        
        if (!barcode || barcode.length !== 13) {
          return res.status(400).json({ 
            error: 'Cod de bare invalid', 
            details: 'Codul de bare trebuie să aibă exact 13 cifre.' 
          });
        }

        const exists = await importValidatorService.barcodeExists(barcode);
        
        res.json({
          barcode,
          exists,
          message: exists 
            ? 'Codul de bare există deja în baza de date' 
            : 'Codul de bare este disponibil'
        });
      } catch (error: any) {
        log(`Error checking barcode: ${error.message}`, 'inventory-products');
        res.status(500).json({ error: 'Eroare la verificarea codului de bare' });
      }
    }
  );

  return router;
}

// Import the products service from our singleton
import { productsService } from '../services/products.service.instance';

// Create the controller instance
export const productsController = createProductsController(productsService);