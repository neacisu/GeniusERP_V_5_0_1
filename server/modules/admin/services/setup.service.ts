/**
 * Setup Service for System Administration
 * 
 * This service manages system setup steps tracking for proper initialization
 * of companies, franchises, and various system components.
 */

// Import database related dependencies
import { setup_steps } from '../../../../shared/schema/admin.schema';
import { eq, and } from 'drizzle-orm';
import { Express, Request, Response, NextFunction, Router } from 'express';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { Logger } from '../../../common/logger';

// Define setup step status types
export type SetupStepStatus = 'completed' | 'in_progress' | 'not_started' | 'skipped';

export class SetupService {
  private db: any;
  private logger = new Logger('SetupService');
  
  constructor(db: any) {
    this.db = db;
  }

  /**
   * Record a setup step for a company
   */
  async recordSetupStep(
    companyId: string,
    step: string,
    status: SetupStepStatus = 'completed',
    franchiseId?: string
  ) {
    try {
      // Check if the step already exists
      const existingSteps = await this.db.select()
        .from(setup_steps)
        .where(
          and(
            eq(setup_steps.company_id, companyId),
            eq(setup_steps.step, step),
            franchiseId ? eq(setup_steps.franchise_id, franchiseId) : undefined
          )
        );

      // If step exists, update it; otherwise, create it
      if (existingSteps.length > 0) {
        await this.db.update(setup_steps)
          .set({ 
            status,
            updated_at: new Date()
          })
          .where(
            and(
              eq(setup_steps.company_id, companyId),
              eq(setup_steps.step, step),
              franchiseId ? eq(setup_steps.franchise_id, franchiseId) : undefined
            )
          );
        return existingSteps[0].id;
      } else {
        const [result] = await this.db.insert(setup_steps)
          .values({
            company_id: companyId,
            franchise_id: franchiseId,
            step,
            status
          })
          .returning();
        return result.id;
      }
    } catch (error) {
      console.error('Error recording setup step:', error);
      throw error;
    }
  }

  /**
   * Get all setup steps for a company
   */
  async getCompanySetupSteps(companyId: string, franchiseId?: string) {
    try {
      return await this.db.select()
        .from(setup_steps)
        .where(
          and(
            eq(setup_steps.company_id, companyId),
            franchiseId ? eq(setup_steps.franchise_id, franchiseId) : undefined
          )
        );
    } catch (error) {
      console.error('Error getting company setup steps:', error);
      throw error;
    }
  }

  /**
   * Check if a specific step is completed
   */
  async isStepComplete(companyId: string, step: string, franchiseId?: string): Promise<boolean> {
    try {
      const steps = await this.db.select()
        .from(setup_steps)
        .where(
          and(
            eq(setup_steps.company_id, companyId),
            eq(setup_steps.step, step),
            eq(setup_steps.status, 'completed'),
            franchiseId ? eq(setup_steps.franchise_id, franchiseId) : undefined
          )
        );
      return steps.length > 0;
    } catch (error) {
      console.error('Error checking step completion:', error);
      return false;
    }
  }

  /**
   * Get setup progress percentage
   */
  async getSetupProgress(companyId: string, franchiseId?: string): Promise<number> {
    try {
      const totalSteps = await this.db.select()
        .from(setup_steps)
        .where(
          and(
            eq(setup_steps.company_id, companyId),
            franchiseId ? eq(setup_steps.franchise_id, franchiseId) : undefined
          )
        );
      
      // Count completed and skipped steps as done for progress calculation
      const completedSteps = totalSteps.filter(step => 
        step.status === 'completed' || step.status === 'skipped'
      );
      
      if (totalSteps.length === 0) return 0;
      return Math.round((completedSteps.length / totalSteps.length) * 100);
    } catch (error) {
      console.error('Error calculating setup progress:', error);
      return 0;
    }
  }

  /**
   * Register API routes for setup functionality
   */
  registerRoutes(app: Express): void {
    this.logger.info('Registering setup routes...');
    const router = Router();

    // Middleware to verify authentication
    const requireAuth = AuthGuard.AuthGuard.protect(JwtAuthMode.REQUIRED);
    
    // GET /api/admin/setup/steps/:companyId - Get all setup steps for a company
    router.get('/steps/:companyId', requireAuth, async (req: Request, res: Response) => {
      try {
        const { companyId } = req.params;
        const franchiseId = req.query.franchiseId as string | undefined;
        
        const steps = await this.getCompanySetupSteps(companyId, franchiseId);
        res.json({ success: true, data: steps });
      } catch (error) {
        this.logger.error('Error fetching setup steps:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch setup steps' });
      }
    });

    // POST /api/admin/setup/steps/:companyId - Record a setup step
    router.post('/steps/:companyId', requireAuth, async (req: Request, res: Response) => {
      try {
        const { companyId } = req.params;
        const { step, status, franchiseId } = req.body;
        
        if (!step) {
          return res.status(400).json({ success: false, message: 'Step name is required' });
        }
        
        const stepStatus = status as SetupStepStatus || 'completed';
        const id = await this.recordSetupStep(companyId, step, stepStatus, franchiseId);
        
        res.json({ success: true, data: { id, step, status: stepStatus } });
      } catch (error) {
        this.logger.error('Error recording setup step:', error);
        res.status(500).json({ success: false, message: 'Failed to record setup step' });
      }
    });

    // GET /api/admin/setup/progress/:companyId - Get setup progress percentage
    router.get('/progress/:companyId', requireAuth, async (req: Request, res: Response) => {
      try {
        const { companyId } = req.params;
        const franchiseId = req.query.franchiseId as string | undefined;
        
        const progress = await this.getSetupProgress(companyId, franchiseId);
        res.json({ success: true, data: { progress } });
      } catch (error) {
        this.logger.error('Error calculating setup progress:', error);
        res.status(500).json({ success: false, message: 'Failed to calculate setup progress' });
      }
    });

    // GET /api/admin/setup/completed/:companyId/:step - Check if step is completed
    router.get('/completed/:companyId/:step', requireAuth, async (req: Request, res: Response) => {
      try {
        const { companyId, step } = req.params;
        const franchiseId = req.query.franchiseId as string | undefined;
        
        const isCompleted = await this.isStepComplete(companyId, step, franchiseId);
        res.json({ success: true, data: { completed: isCompleted } });
      } catch (error) {
        this.logger.error('Error checking step completion:', error);
        res.status(500).json({ success: false, message: 'Failed to check step completion' });
      }
    });

    // Mount routes
    app.use('/api/admin/setup', router);
    this.logger.info('Setup routes registered successfully');
  }
}