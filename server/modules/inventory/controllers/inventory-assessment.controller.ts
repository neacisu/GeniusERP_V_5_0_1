/**
 * Inventory Assessment Controller
 * 
 * This controller handles HTTP requests related to inventory assessment (Inventariere) process
 * Required for Romanian accounting compliance as per OMFP 2861/2009 and Law 82/1991
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AuthGuard } from '../../../modules/auth/guards/auth.guard';
import { JwtAuthMode } from '../../../modules/auth/constants/auth-mode.enum';
import { UserRole } from '../../../modules/auth/types';
import { z } from 'zod';
import { InventoryAssessmentService } from '../services/inventory-assessment.service';
import { InventoryValuationService } from '../services/inventory-valuation.service';
import { log } from '../../../vite';
import { validateRequest } from '../../../common/middleware/validate-request';
import { pool } from '../../../db';
import { generateDateBasedCode } from '../../../utils/code-generator';

// Constants for role-based access
const INVENTORY_MANAGER_ROLES = [UserRole.ADMIN, UserRole.INVENTORY_MANAGER];
const INVENTORY_USER_ROLES = [UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.USER];

// Validation schemas
const createAssessmentSchema = z.object({
  // NOTE: assessmentNumber is required by the service layer
  // but we'll derive it from name if not provided
  assessmentNumber: z.string().min(3, 'Numărul documentului trebuie să aibă cel puțin 3 caractere'),
  
  // Name is required for display purposes
  name: z.string().min(3, 'Numele trebuie să aibă cel puțin 3 caractere'),
  
  // Either assessmentType or type is required
  assessmentType: z.enum(['annual', 'monthly', 'unscheduled', 'special']).optional(),
  type: z.enum(['annual', 'monthly', 'unscheduled', 'special']).optional(),
  
  // All other fields
  warehouseId: z.string().uuid('ID-ul gestiunii trebuie să fie un UUID valid'),
  startDate: z.string().refine(value => !isNaN(Date.parse(value)), {
    message: 'Data începerii trebuie să fie o dată validă',
  }),
  endDate: z.string().optional().refine(value => !value || !isNaN(Date.parse(value)), {
    message: 'Data finalizării trebuie să fie o dată validă',
  }),
  commissionOrderNumber: z.string().optional(),
  documentNumber: z.string().optional(),
  legalBasis: z.string().optional(),
  valuationMethod: z.string().optional(),
  notes: z.string().optional(),
  description: z.string().optional(),
}).refine(data => data.type || data.assessmentType, {
  message: "Trebuie să specificați fie 'type', fie 'assessmentType'",
  path: ['type'],
});

const updateStatusSchema = z.object({
  status: z.enum(['draft', 'in_progress', 'pending_approval', 'approved', 'finalized', 'cancelled']),
});

const recordCountSchema = z.object({
  actualQuantity: z.number().min(0, 'Cantitatea trebuie să fie un număr pozitiv'),
  notes: z.string().optional().nullable(),
  countedBy: z.string().uuid('ID-ul utilizatorului trebuie să fie un UUID valid').optional().nullable(),
});

const inventoryValuationSchema = z.object({
  productId: z.string().uuid('ID-ul produsului trebuie să fie un UUID valid'),
  warehouseId: z.string().uuid('ID-ul gestiunii trebuie să fie un UUID valid'),
  valuationMethod: z.enum(['FIFO', 'LIFO', 'weighted_average']),
  date: z.string().optional().refine(value => !value || !isNaN(Date.parse(value)), {
    message: 'Data evaluării trebuie să fie o dată validă',
  }),
});

export function createInventoryAssessmentController(
  assessmentService: InventoryAssessmentService,
  valuationService: InventoryValuationService
): Router {
  const router = Router();

  /**
   * Create a new inventory assessment
   * 
   * @route POST /api/inventory/assessments
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(INVENTORY_MANAGER_ROLES) - Requires inventory manager role
   */
  router.post('/',
    (req: Request, res: Response, next: NextFunction) => {
      // Validate request body manually instead of using middleware
      try {
        // Add assessmentNumber from name if not provided
        const requestBody = { ...req.body };
        if (!requestBody.assessmentNumber && requestBody.name) {
          requestBody.assessmentNumber = requestBody.name;
          log(`Added assessmentNumber from name: ${requestBody.assessmentNumber}`, 'inventory-assessment');
        }
        
        log(`Validating request body: ${JSON.stringify(requestBody, null, 2)}`, 'inventory-assessment');
        
        const validationResult = createAssessmentSchema.safeParse(requestBody);
        if (!validationResult.success) {
          const errors = validationResult.error.format();
          log(`Validation errors: ${JSON.stringify(errors)}`, 'inventory-assessment');
          return res.status(400).json({ 
            message: 'Validation error',
            errors
          });
        }
        
        // Update request body with the modified version
        req.body = requestBody;
        next();
      } catch (error: any) {
        log(`Validation error: ${error.message}`, 'inventory-assessment');
        return res.status(400).json({ 
          message: 'Validation error',
          error: error.message
        });
      }
    },
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Log headers for debugging
        log(`Request headers: ${JSON.stringify({
          authorization: req.headers.authorization ? 'Bearer ***' : 'none',
          contentType: req.headers['content-type'],
          userId: req.headers['x-user-id'],
          companyId: req.headers['x-company-id']
        }, null, 2)}`, 'inventory-assessment');
        
        // Get user info from headers or auth
        let userId = req.user?.id;
        let companyId = req.user?.companyId;
        
        // If auth info isn't in user object, try getting from headers
        if (!userId || !companyId) {
          log('Auth not from middleware, trying X-User-ID and X-Company-ID headers', 'inventory-assessment');
          userId = req.headers['x-user-id'] as string;
          companyId = req.headers['x-company-id'] as string;
          
          // If still missing, return auth error
          if (!userId || !companyId) {
            return res.status(401).json({ error: 'Missing authentication information. Please login again.' });
          }
        }
        
        log(`Creating assessment with user=${userId}, company=${companyId}`, 'inventory-assessment');
        
        // Log request body and headers for debugging
        log(`Creating assessment with body: ${JSON.stringify(req.body, null, 2)}`, 'inventory-assessment');
        log(`Request headers: ${JSON.stringify({
          authorization: req.headers.authorization ? 'Bearer ***' : 'none',
          contentType: req.headers['content-type'],
          userId: req.headers['x-user-id'],
          companyId: req.headers['x-company-id']
        }, null, 2)}`, 'inventory-assessment');
        
        // Map input data to match actual database column names
        const assessmentData = {
          companyId,
          // Convert null to undefined for franchiseId
          franchiseId: req.user?.franchiseId || undefined,
          // Map to assessment_type column
          assessment_type: req.body.type || req.body.assessmentType,
          warehouse_id: req.body.warehouseId,
          // Set both name and assessment_number for compatibility
          name: req.body.name || req.body.assessmentNumber || `Inventariere ${new Date().toLocaleDateString('ro-RO')}`,
          assessment_number: req.body.assessmentNumber || req.body.name || `Inventariere ${new Date().toLocaleDateString('ro-RO')}`,
          // Use commissionOrderNumber instead of documentNumber
          commission_order_number: req.body.commissionOrderNumber || req.body.documentNumber || `INV-${new Date().toISOString().split('T')[0]}`,
          start_date: new Date(req.body.startDate),
          end_date: req.body.endDate ? new Date(req.body.endDate) : undefined,
          status: 'draft',
          notes: req.body.notes
        };
        
        log(`Mapped assessment data: ${JSON.stringify(assessmentData, null, 2)}`, 'inventory-assessment');
        
        const result = await assessmentService.createAssessment(assessmentData, userId, companyId);
        
        res.status(201).json(result);
      } catch (error: any) {
        log(`Error creating inventory assessment: ${error.message}`, 'inventory-assessment');
        res.status(500).json({ error: 'Eroare la crearea documentului de inventariere', details: error.message });
      }
    }
  );

  /**
   * Get a list of assessments
   * 
   * @route GET /api/inventory/assessments
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   */
  router.get('/',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.id;
        const companyId = req.user?.companyId;
        
        if (!userId || !companyId) {
          return res.status(401).json({ error: 'Utilizator neautentificat sau lipsă ID companie' });
        }
        
        // Using a simple raw SQL query instead of ORM functions
        // Updated to use the main warehouses table instead of the old inventory_warehouses table
        const query = `
          SELECT a.*, w.name as warehouse_name
          FROM inventory_assessments a
          LEFT JOIN warehouses w ON a.warehouse_id = w.id
          WHERE a.company_id = $1
          ORDER BY a.created_at DESC
        `;
        
        // Execute the query directly with PostgreSQL
        const result = await pool.unsafe(query, [companyId]);
        
        // Structure the response to match the expected format in the frontend
        res.json({ 
          assessments: result 
        });
      } catch (error: any) {
        log(`Error fetching inventory assessments: ${error.message}`, 'inventory-assessment');
        res.status(500).json({ error: 'Eroare la obținerea documentelor de inventariere', details: error.message });
      }
    }
  );

  /**
   * Get assessment details by ID
   * 
   * @route GET /api/inventory/assessments/:id
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   */
  router.get('/:id',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.id;
        const companyId = req.user?.companyId;
        
        if (!userId || !companyId) {
          return res.status(401).json({ error: 'Utilizator neautentificat sau lipsă ID companie' });
        }
        
        const assessmentId = req.params.id;
        
        // Using direct SQL queries instead of ORM
        const assessmentQuery = `
          SELECT a.*, w.name as warehouse_name
          FROM inventory_assessments a
          LEFT JOIN warehouses w ON a.warehouse_id = w.id
          WHERE a.id = $1 AND a.company_id = $2
          LIMIT 1
        `;
        
        const itemsQuery = `
          SELECT i.*, p.name as product_name, p.sku, u.name as unit_name
          FROM inventory_assessment_items i
          LEFT JOIN inventory_products p ON i.product_id = p.id
          LEFT JOIN inventory_units u ON p.unit_id = u.id
          WHERE i.assessment_id = $1
          ORDER BY i.created_at
        `;
        
        // Execute the queries directly with PostgreSQL
        // Get assessment
        const assessmentResult = await pool.unsafe(assessmentQuery, [assessmentId, companyId]);
        
        if (assessmentResult.length === 0) {
          return res.status(404).json({ 
            error: 'Document de inventariere negăsit',
            details: 'Documentul de inventariere solicitat nu există sau nu aparține companiei dvs.'
          });
        }
        
        const assessment = assessmentResult[0];
        
        // Get items
        const items = await pool.unsafe(itemsQuery, [assessmentId]);
        
        // Structure the response to match the expected format in the frontend
        res.json({ 
          assessment: {
            ...assessment,
            items
          } 
        });
      } catch (error: any) {
        log(`Error fetching inventory assessment: ${error.message}`, 'inventory-assessment');
        res.status(error.message.includes('not found') ? 404 : 500)
          .json({ error: 'Eroare la obținerea documentului de inventariere', details: error.message });
      }
    }
  );

  /**
   * Initialize assessment items from current stock
   * 
   * @route POST /api/inventory/assessments/:id/initialize
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(INVENTORY_MANAGER_ROLES) - Requires inventory manager role
   */
  router.post('/:id/initialize',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard(INVENTORY_MANAGER_ROLES),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.id;
        const companyId = req.user?.companyId;
        
        if (!userId || !companyId) {
          return res.status(401).json({ error: 'Utilizator neautentificat sau lipsă ID companie' });
        }
        
        const assessmentId = req.params.id;
        console.log(`[inventory-assessment-controller] Initializing assessment items for ID: ${assessmentId}, User ID: ${userId}`);
        
        try {
          // First get the assessment details to extract warehouse_id
          const getAssessmentQuery = `
            SELECT * FROM inventory_assessments WHERE id = $1 AND company_id = $2
          `;
          const assessmentResult = await pool.unsafe(getAssessmentQuery, [assessmentId, companyId]);
          if (assessmentResult.length === 0) {
            return res.status(404).json({ error: 'Document de inventariere negăsit' });
          }
          
          const assessment = assessmentResult[0];
          const warehouseId = assessment.warehouse_id;
          
          console.log(`[inventory-assessment-controller] Found assessment with warehouseId: ${warehouseId}`);
          
          // Now initialize the items with all required parameters
          const result = await assessmentService.initializeAssessmentItems(assessmentId, warehouseId, companyId, userId);
          console.log(`[inventory-assessment-controller] Successfully initialized assessment items:`, result ? 'Result returned' : 'No result');
          res.json(result);
        } catch (initError) {
          console.error(`[inventory-assessment-controller] Error in initializeAssessmentItems:`, initError);
          throw initError; // Re-throw to be caught by outer catch block
        }
      } catch (error: any) {
        log(`Error initializing assessment items: ${error.message}`, 'inventory-assessment');
        res.status(500).json({ error: 'Eroare la inițializarea articolelor de inventariere', details: error.message });
      }
    }
  );

  /**
   * Update assessment status
   * 
   * @route PUT /api/inventory/assessments/:id/status
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(INVENTORY_MANAGER_ROLES) - Requires inventory manager role
   */
  router.put('/:id/status',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard(INVENTORY_MANAGER_ROLES),
    validateRequest({ body: updateStatusSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.id;
        const companyId = req.user?.companyId;
        
        if (!userId || !companyId) {
          return res.status(401).json({ error: 'Utilizator neautentificat sau lipsă ID companie' });
        }
        
        const assessmentId = req.params.id;
        const status = req.body.status;
        
        const result = await assessmentService.updateAssessmentStatus(assessmentId, status, userId);
        
        res.json(result);
      } catch (error: any) {
        log(`Error updating assessment status: ${error.message}`, 'inventory-assessment');
        res.status(500).json({ error: 'Eroare la actualizarea stării documentului de inventariere', details: error.message });
      }
    }
  );

  /**
   * Record actual count for an assessment item
   * 
   * @route PUT /api/inventory/assessments/items/:id
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(INVENTORY_USER_ROLES) - Requires inventory user role
   */
  router.put('/items/:id',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard(INVENTORY_USER_ROLES),
    validateRequest({ body: recordCountSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.id;
        const companyId = req.user?.companyId;
        
        if (!userId || !companyId) {
          return res.status(401).json({ error: 'Utilizator neautentificat sau lipsă ID companie' });
        }
        
        const itemId = req.params.id;
        const { actualQuantity, notes, countedBy } = req.body;
        
        const result = await assessmentService.recordItemCount(
          itemId,
          actualQuantity,
          notes || null,
          countedBy || userId,
          userId
        );
        
        res.json(result);
      } catch (error: any) {
        log(`Error recording item count: ${error.message}`, 'inventory-assessment');
        res.status(500).json({ error: 'Eroare la înregistrarea numărării articolului', details: error.message });
      }
    }
  );

  /**
   * Process inventory differences and update stock
   * 
   * @route POST /api/inventory/assessments/:id/process
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(INVENTORY_MANAGER_ROLES) - Requires inventory manager role
   */
  router.post('/:id/process',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    AuthGuard.roleGuard(INVENTORY_MANAGER_ROLES),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.id;
        const companyId = req.user?.companyId;
        
        if (!userId || !companyId) {
          return res.status(401).json({ error: 'Utilizator neautentificat sau lipsă ID companie' });
        }
        
        const assessmentId = req.params.id;
        const result = await assessmentService.processInventoryDifferences(assessmentId, userId);
        
        res.json(result);
      } catch (error: any) {
        log(`Error processing inventory differences: ${error.message}`, 'inventory-assessment');
        res.status(500).json({ error: 'Eroare la procesarea diferențelor de inventar', details: error.message });
      }
    }
  );

  /**
   * Get summary of assessments by status
   * 
   * @route GET /api/inventory/assessments/summary/status
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   */
  router.get('/summary/status',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.id;
        const companyId = req.user?.companyId;
        
        if (!userId || !companyId) {
          return res.status(401).json({ error: 'Utilizator neautentificat sau lipsă ID companie' });
        }
        
        // Using a simple raw SQL query to get summary counts by status
        const query = `
          SELECT
            COUNT(*) AS total_count,
            COUNT(CASE WHEN status = 'draft' THEN 1 END) AS draft_count,
            COUNT(CASE WHEN status = 'in_progress' THEN 1 END) AS in_progress_count,
            COUNT(CASE WHEN status = 'pending_approval' THEN 1 END) AS pending_approval_count,
            COUNT(CASE WHEN status = 'approved' THEN 1 END) AS approved_count,
            COUNT(CASE WHEN status = 'finalized' THEN 1 END) AS finalized_count,
            COUNT(CASE WHEN status = 'cancelled' THEN 1 END) AS cancelled_count
          FROM inventory_assessments
          WHERE company_id = $1
        `;
        
        // Execute the query directly with PostgreSQL
        const result = await pool.unsafe(query, [companyId]);
        const summary = result[0] || {
          total_count: 0,
          draft_count: 0,
          in_progress_count: 0,
          pending_approval_count: 0,
          approved_count: 0,
          finalized_count: 0,
          cancelled_count: 0
        };
        
        // Structure the response to match the expected format in the frontend
        res.json({ 
          summary: {
            totalCount: parseInt(summary.total_count),
            statusCounts: {
              draft: parseInt(summary.draft_count),
              in_progress: parseInt(summary.in_progress_count),
              pending_approval: parseInt(summary.pending_approval_count),
              approved: parseInt(summary.approved_count),
              finalized: parseInt(summary.finalized_count),
              cancelled: parseInt(summary.cancelled_count)
            }
          } 
        });
      } catch (error: any) {
        log(`Error fetching assessment summary: ${error.message}`, 'inventory-assessment');
        res.status(500).json({ error: 'Eroare la obținerea rezumatului de inventariere', details: error.message });
      }
    }
  );

  /**
   * Calculate stock valuation using specified method
   * 
   * @route POST /api/inventory/valuation/calculate
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   */
  router.post('/valuation/calculate',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    validateRequest({ body: inventoryValuationSchema }),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.id;
        const companyId = req.user?.companyId;
        
        if (!userId || !companyId) {
          return res.status(401).json({ error: 'Utilizator neautentificat sau lipsă ID companie' });
        }
        
        const { productId, warehouseId, valuationMethod, date } = req.body;
        const calculationDate = date ? new Date(date) : undefined;
        
        const result = await valuationService.calculateStockValue(
          productId,
          warehouseId,
          valuationMethod,
          calculationDate
        );
        
        res.json(result);
      } catch (error: any) {
        log(`Error calculating stock valuation: ${error.message}`, 'inventory-assessment');
        res.status(500).json({ error: 'Eroare la calcularea valorii stocului', details: error.message });
      }
    }
  );

  /**
   * Get valuation history for a product
   * 
   * @route GET /api/inventory/valuation/history
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   */
  router.get('/valuation/history',
    AuthGuard.protect(JwtAuthMode.REQUIRED),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const userId = req.user?.id;
        const companyId = req.user?.companyId;
        
        if (!userId || !companyId) {
          return res.status(401).json({ error: 'Utilizator neautentificat sau lipsă ID companie' });
        }
        
        const productId = req.query.productId as string;
        const warehouseId = req.query.warehouseId as string;
        
        if (!productId || !warehouseId) {
          return res.status(400).json({ error: 'ID-ul produsului și ID-ul gestiunii sunt obligatorii' });
        }
        
        const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
        const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
        
        const result = await valuationService.getValuationHistory(
          productId,
          warehouseId,
          startDate,
          endDate
        );
        
        res.json(result);
      } catch (error: any) {
        log(`Error fetching valuation history: ${error.message}`, 'inventory-assessment');
        res.status(500).json({ error: 'Eroare la obținerea istoricului de evaluare', details: error.message });
      }
    }
  );

  return router;
}

// Create and export the controller instance
export const inventoryAssessmentController = Router();
// Note: The actual initialization will happen in routes/inventory.routes.ts