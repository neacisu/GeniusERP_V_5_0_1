/**
 * Setup Routes for Settings Module
 * 
 * Provides endpoints for tracking and managing setup progress
 * for companies and franchises. These endpoints are secured with
 * role-based access controls and multi-tenant company guards.
 */

import express, { Request as ExpressRequest, Response } from 'express';
import { SetupService } from '../services/setup.service';
import { AuthGuard } from '../../../auth/src/guards/auth.guard';
import { JwtAuthMode } from '../../../auth/src/constants/auth-mode.enum';
import { JwtUserData } from '../../../auth/src/types';

// Extend Express Request with user
interface AuthenticatedRequest extends ExpressRequest {
  user?: JwtUserData;
}

const router = express.Router();
const setupService = new SetupService();

// Apply authentication middleware to all routes
router.use(AuthGuard.protect(JwtAuthMode.REQUIRED));

// Apply role guard to administrative operations
const adminRouteGuard = [
  AuthGuard.roleGuard(['hq_admin', 'ADMIN']), // Allow both hq_admin and ADMIN roles
  AuthGuard.companyGuard('companyId') // Enforce company-level access control
];

/**
 * Get all setup steps for a company
 * GET /api/settings/setup
 */
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    const { franchiseId } = req.query;
    const steps = await setupService.getCompanySetupSteps(
      req.user.companyId,
      franchiseId as string | undefined
    );

    return res.status(200).json(steps);
  } catch (error) {
    console.error('Error retrieving setup steps:', error);
    return res.status(500).json({ error: 'Failed to retrieve setup steps' });
  }
});

/**
 * Get setup progress percentage
 * GET /api/settings/setup/progress
 */
router.get('/progress', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    const { franchiseId } = req.query;
    const progress = await setupService.getSetupProgress(
      req.user.companyId,
      franchiseId as string | undefined
    );

    return res.status(200).json({ progress });
  } catch (error) {
    console.error('Error retrieving setup progress:', error);
    return res.status(500).json({ error: 'Failed to retrieve setup progress' });
  }
});

/**
 * Update a setup step status
 * POST /api/settings/setup/step
 * 
 * This endpoint is protected with role-based access control
 * and requires hq_admin or ADMIN role.
 */
router.post('/step', ...adminRouteGuard, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    const { step, status, franchiseId } = req.body;

    if (!step || !status) {
      return res.status(400).json({ error: 'Step and status are required' });
    }

    // Log the update operation for audit purposes
    console.log(`Setup step update - User: ${req.user?.username}, Step: ${step}, Status: ${status}`);

    const result = await setupService.updateSetupStep(
      req.user.companyId,
      step,
      status,
      franchiseId
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error updating setup step:', error);
    return res.status(500).json({ error: 'Failed to update setup step' });
  }
});

/**
 * Check if a specific step is completed
 * GET /api/settings/setup/check/:step
 */
router.get('/check/:step', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    const { step } = req.params;
    const { franchiseId } = req.query;

    if (!step) {
      return res.status(400).json({ error: 'Step parameter is required' });
    }

    const isCompleted = await setupService.isStepComplete(
      req.user.companyId,
      step,
      franchiseId as string | undefined
    );

    return res.status(200).json({ completed: isCompleted });
  } catch (error) {
    console.error('Error checking step completion:', error);
    return res.status(500).json({ error: 'Failed to check step completion' });
  }
});

/**
 * Get onboarding setup details for UI
 * GET /api/settings/setup/onboarding
 */
router.get('/onboarding', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.companyId) {
      return res.status(400).json({ error: 'Company ID is required' });
    }

    const { franchiseId } = req.query;
    
    // Get current steps and their status
    const steps = await setupService.getCompanySetupSteps(
      req.user.companyId,
      franchiseId as string | undefined
    );
    
    // Get overall progress percentage
    const progress = await setupService.getSetupProgress(
      req.user.companyId,
      franchiseId as string | undefined
    );
    
    // Format the response for the onboarding UI
    const onboardingDetails = {
      progress,
      steps: steps.map((step: any) => ({
        id: step.id,
        step: step.step,
        status: step.status,
        completed: step.status === 'completed',
        metadata: step.metadata || {},
        completedAt: step.completedAt
      })),
      lastUpdated: new Date()
    };

    return res.status(200).json(onboardingDetails);
  } catch (error) {
    console.error('Error retrieving onboarding details:', error);
    return res.status(500).json({ error: 'Failed to retrieve onboarding details' });
  }
});

export default router;