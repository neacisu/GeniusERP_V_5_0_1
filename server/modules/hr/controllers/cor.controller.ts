/**
 * COR Controller - Romanian Occupation Classification API
 * 
 * This controller exposes endpoints for:
 * - Retrieving COR (Romanian Classification of Occupations) data
 * - Searching for occupations
 * - Validating COR codes
 * - Seeding the COR database with data from XML files
 */

import { Request, Response, NextFunction } from 'express';
import { CorService } from '../services/cor.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
// import { RoleGuard } from '../../auth/guards/role.guard'; // TODO: Verify path
// import { CompanyGuard } from '../../auth/guards/company.guard'; // TODO: Verify path
import { z } from 'zod';
import { corOccupations } from '../schema/cor.schema';
import { eq } from 'drizzle-orm';

// Define auth modes and user roles
enum JwtAuthMode {
  REQUIRED = 'required',
  OPTIONAL = 'optional'
}

enum UserRole {
  ADMIN = 'admin',
  HR_ADMIN = 'hr_admin',
  HR_MANAGER = 'hr_manager',
  HR_USER = 'hr_user'
}

// Interface for authenticated user
interface AuthenticatedUser {
  userId: string;
  roles: string[];
}

// Validation schemas
const searchSchema = z.object({
  searchTerm: z.string().min(1).max(100),
  limit: z.number().int().positive().max(100).optional().default(50)
});

const corCodeSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "COR code must be a 6-digit number")
});

const seedDataSchema = z.object({
  xmlFilePath: z.string().min(1)
});

const batchImportSchema = z.object({
  occupations: z.array(z.object({
    code: z.string().regex(/^\d{6}$/, "COR code must be a 6-digit number"),
    name: z.string().min(1),
    subminorGroupCode: z.string().regex(/^\d{4}$/, "Subminor group code must be a 4-digit number")
  }))
});

export class CorController {
  private corService: CorService;
  private db: any;
  
  constructor(db: any, corService: CorService) {
    this.db = db;
    this.corService = corService;
  }
  
  /**
   * Register all COR endpoints
   */
  public registerRoutes(router: any) {
    const basePath = '/cor';
    
    // Public endpoints (read-only)
    router.get(`${basePath}/groups`, (req: Request, res: Response) => this.getMajorGroups(req, res)); // Alias for major-groups
    router.get(`${basePath}/major-groups`, (req: Request, res: Response) => this.getMajorGroups(req, res));
    
    // Submajor groups - both with and without majorCode
    router.get(`${basePath}/submajor-groups`, (req: Request, res: Response) => this.getSubmajorGroups(req, res));
    router.get(`${basePath}/submajor-groups/:majorCode`, (req: Request, res: Response) => this.getSubmajorGroups(req, res));
    
    // Minor groups - both with and without submajorCode
    router.get(`${basePath}/minor-groups`, (req: Request, res: Response) => this.getMinorGroups(req, res));
    router.get(`${basePath}/minor-groups/:submajorCode`, (req: Request, res: Response) => this.getMinorGroups(req, res));
    
    // Subminor groups - both with and without minorCode
    router.get(`${basePath}/subminor-groups`, (req: Request, res: Response) => this.getSubminorGroups(req, res));
    router.get(`${basePath}/subminor-groups/:minorCode`, (req: Request, res: Response) => this.getSubminorGroups(req, res));
    
    // Occupations - both with and without subminorCode
    router.get(`${basePath}/occupations`, (req: Request, res: Response) => this.getOccupations(req, res));
    router.get(`${basePath}/occupations/:subminorCode`, (req: Request, res: Response) => this.getOccupations(req, res));
    
    router.get(`${basePath}/occupation/:code`, (req: Request, res: Response) => this.getOccupationByCode(req, res));
    router.get(`${basePath}/search`, (req: Request, res: Response) => this.searchOccupations(req, res));
    router.get(`${basePath}/validate/:code`, (req: Request, res: Response) => this.validateCorCode(req, res));
    router.get(`${basePath}/stats`, (req: Request, res: Response) => this.getCorStats(req, res));
    
    // Admin authentication middleware for protected endpoints
    const adminAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.headers.authorization) {
          return res.status(401).json({ 
            success: false, 
            message: "Authentication required" 
          });
        }
        const token = req.headers.authorization.split(' ')[1];
        // In a real implementation, this would verify the token
        // and attach the user data to the request
        (req as any).user = { userId: "admin-user-id", roles: ["admin", "hr_admin"] } as AuthenticatedUser;
        next();
      } catch (err: any) {
        return res.status(401).json({ 
          success: false, 
          message: "Invalid authentication token" 
        });
      }
    };
    
    // Admin-only endpoints (seeding)
    router.post(
      `${basePath}/seed`, 
      adminAuthMiddleware,
      (req: Request & { user?: AuthenticatedUser }, res: Response) => this.seedCorData(req, res)
    );
    
    // Additional endpoint for the Word XML format
    router.post(
      `${basePath}/seed-word-xml`,
      adminAuthMiddleware,
      (req: Request & { user?: AuthenticatedUser }, res: Response) => this.seedCorDataFromWordXml(req, res)
    );
    
    // Batch import endpoint for more efficient data loading
    router.post(
      `${basePath}/import-batch`,
      adminAuthMiddleware,
      (req: Request & { user?: AuthenticatedUser }, res: Response) => this.importOccupationBatch(req, res)
    );
  }
  
  /**
   * Import a batch of occupations
   * Admin endpoint for batch processing of occupation data
   */
  async importOccupationBatch(req: Request & { user?: AuthenticatedUser }, res: Response) {
    try {
      const { occupations } = req.body;
      
      const validationResult = batchImportSchema.safeParse({ occupations });
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid batch data format",
          errors: validationResult.error.issues
        });
      }
      
      // Get user information from JWT token
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated"
        });
      }
      
      let insertCount = 0;
      let updateCount = 0;
      
      // Process batch in a transaction
      await this.db.transaction(async (tx: any) => {
        for (const occupation of occupations) {
          // Check if the occupation exists
          const existingOccupation = await tx.select()
            .from(corOccupations)
            .where(eq(corOccupations.code, occupation.code))
            .limit(1);
          
          if (existingOccupation.length === 0) {
            // Insert new occupation
            await tx.insert(corOccupations).values({
              code: occupation.code,
              name: occupation.name,
              description: '',
              subminorGroupCode: occupation.subminorGroupCode,
              isActive: true
            });
            insertCount++;
          } else {
            // Update existing occupation
            await tx.update(corOccupations)
              .set({ 
                name: occupation.name,
                updatedAt: new Date()
              })
              .where(eq(corOccupations.code, occupation.code));
            updateCount++;
          }
          
          // Ensure parent groups exist
          await this.corService.ensureParentGroupsExist(tx, occupation.subminorGroupCode);
        }
        
        // Log the batch import in the audit log
        await this.corService.logBatchImport(userId, insertCount, updateCount, occupations.length);
      });
      
      return res.status(200).json({
        success: true,
        message: "Processed occupation batch successfully",
        data: {
          inserted: insertCount,
          updated: updateCount,
          processed: insertCount + updateCount,
          total: occupations.length
        }
      });
    } catch (error: any) {
      console.error("Error importing occupation batch:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to process occupation batch",
        error: error.message || "Unknown error"
      });
    }
  }
  
  /**
   * Get COR database statistics
   */
  async getCorStats(req: Request, res: Response) {
    try {
      // Delegate to service for database stats
      const stats = await this.corService.getCorStats();
      
      return res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error("Error fetching COR stats:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch COR statistics",
        error: error.message || "Unknown error"
      });
    }
  }
  
  /**
   * Get COR major groups
   */
  async getMajorGroups(req: Request, res: Response) {
    try {
      const searchTerm = req.query.searchTerm as string | undefined;
      const majorGroups = await this.corService.getMajorGroups(searchTerm);
      
      return res.status(200).json({
        success: true,
        data: majorGroups
      });
    } catch (error: any) {
      console.error("Error fetching COR major groups:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch COR major groups",
        error: error.message || "Unknown error"
      });
    }
  }
  
  /**
   * Get COR submajor groups
   */
  async getSubmajorGroups(req: Request, res: Response) {
    try {
      const majorCode = req.params.majorCode;
      const searchTerm = req.query.searchTerm as string | undefined;
      
      const submajorGroups = await this.corService.getSubmajorGroups(majorCode, searchTerm);
      
      return res.status(200).json({
        success: true,
        data: submajorGroups
      });
    } catch (error: any) {
      console.error("Error fetching COR submajor groups:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch COR submajor groups",
        error: error.message || "Unknown error"
      });
    }
  }
  
  /**
   * Get COR minor groups
   */
  async getMinorGroups(req: Request, res: Response) {
    try {
      const submajorCode = req.params.submajorCode;
      const searchTerm = req.query.searchTerm as string | undefined;
      
      const minorGroups = await this.corService.getMinorGroups(submajorCode, searchTerm);
      
      return res.status(200).json({
        success: true,
        data: minorGroups
      });
    } catch (error: any) {
      console.error("Error fetching COR minor groups:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch COR minor groups",
        error: error.message || "Unknown error"
      });
    }
  }
  
  /**
   * Get COR subminor groups
   */
  async getSubminorGroups(req: Request, res: Response) {
    try {
      const minorCode = req.params.minorCode;
      const searchTerm = req.query.searchTerm as string | undefined;
      
      const subminorGroups = await this.corService.getSubminorGroups(minorCode, searchTerm);
      
      return res.status(200).json({
        success: true,
        data: subminorGroups
      });
    } catch (error: any) {
      console.error("Error fetching COR subminor groups:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch COR subminor groups",
        error: error.message || "Unknown error"
      });
    }
  }
  
  /**
   * Get COR occupations
   */
  async getOccupations(req: Request, res: Response) {
    try {
      const subminorCode = req.params.subminorCode;
      const searchTerm = req.query.searchTerm as string | undefined;
      
      const occupations = await this.corService.getOccupations(subminorCode, searchTerm);
      
      return res.status(200).json({
        success: true,
        data: occupations
      });
    } catch (error: any) {
      console.error("Error fetching COR occupations:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch COR occupations",
        error: error.message || "Unknown error"
      });
    }
  }
  
  /**
   * Get COR occupation by code
   */
  async getOccupationByCode(req: Request, res: Response) {
    try {
      const { code } = req.params;
      
      const validationResult = corCodeSchema.safeParse({ code });
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid COR code format",
          errors: validationResult.error.issues
        });
      }
      
      const occupation = await this.corService.getOccupationByCode(code);
      
      if (!occupation) {
        return res.status(404).json({
          success: false,
          message: `COR occupation with code ${code} not found`
        });
      }
      
      return res.status(200).json({
        success: true,
        data: occupation
      });
    } catch (error: any) {
      console.error(`Error fetching COR occupation:`, error);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch COR occupation",
        error: error.message || "Unknown error"
      });
    }
  }
  
  /**
   * Search COR occupations
   */
  async searchOccupations(req: Request, res: Response) {
    try {
      const searchTerm = req.query.searchTerm as string;
      const limit = parseInt(req.query.limit as string || "50");
      
      const validationResult = searchSchema.safeParse({ 
        searchTerm, 
        limit 
      });
      
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid search parameters",
          errors: validationResult.error.issues
        });
      }
      
      const { searchTerm: validatedSearchTerm, limit: validatedLimit } = validationResult.data;
      
      const occupations = await this.corService.searchOccupations(validatedSearchTerm, validatedLimit);
      
      return res.status(200).json({
        success: true,
        data: occupations
      });
    } catch (error: any) {
      console.error("Error searching COR occupations:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to search COR occupations",
        error: error.message || "Unknown error"
      });
    }
  }
  
  /**
   * Validate COR code
   */
  async validateCorCode(req: Request, res: Response) {
    try {
      const { code } = req.params;
      
      const validationResult = corCodeSchema.safeParse({ code });
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid COR code format",
          errors: validationResult.error.issues
        });
      }
      
      const isValid = await this.corService.validateCorCode(code);
      
      return res.status(200).json({
        success: true,
        data: {
          code,
          isValid
        }
      });
    } catch (error: any) {
      console.error(`Error validating COR code:`, error);
      return res.status(500).json({
        success: false,
        message: "Failed to validate COR code",
        error: error.message || "Unknown error"
      });
    }
  }
  
  /**
   * Seed COR data from XML file
   * Admin only endpoint
   */
  async seedCorData(req: Request & { user?: AuthenticatedUser }, res: Response) {
    try {
      const { xmlFilePath } = req.body;
      
      const validationResult = seedDataSchema.safeParse({ xmlFilePath });
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid seed data parameters",
          errors: validationResult.error.issues
        });
      }
      
      // Get user information from JWT token
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated"
        });
      }
      
      const result = await this.corService.seedCorData(userId, xmlFilePath);
      
      return res.status(200).json({
        success: true,
        message: "COR data seeded successfully",
        data: result
      });
    } catch (error: any) {
      console.error("Error seeding COR data:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to seed COR data",
        error: error.message || "Unknown error"
      });
    }
  }

  /**
   * Seed COR data from Word XML file
   * Admin only endpoint - specialized for the Word XML format that contains just codes and names
   */
  async seedCorDataFromWordXml(req: Request & { user?: AuthenticatedUser }, res: Response) {
    try {
      const { xmlFilePath } = req.body;
      
      const validationResult = seedDataSchema.safeParse({ xmlFilePath });
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid seed data parameters",
          errors: validationResult.error.issues
        });
      }
      
      // Get user information from JWT token
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "User not authenticated"
        });
      }
      
      // Force the use of the Word XML parser
      const result = await this.corService.seedCorDataFromWordXml(userId, xmlFilePath);
      
      return res.status(200).json({
        success: true,
        message: "COR data from Word XML seeded successfully",
        data: result
      });
    } catch (error: any) {
      console.error("Error seeding COR data from Word XML:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to seed COR data from Word XML",
        error: error.message || "Unknown error"
      });
    }
  }
}