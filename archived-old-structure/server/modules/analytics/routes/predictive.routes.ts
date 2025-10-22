/**
 * Predictive Analytics Routes
 * 
 * This module defines the API routes for predictive analytics functionality including
 * forecasting, trend analysis, and machine learning model management.
 */

import express, { Response, NextFunction } from 'express';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth';
import { PredictiveService } from '../services/predictive.service';
import { hasPredictiveAnalyticsAccess } from '../analytics.roles';

const router = express.Router();

/**
 * Authentication middleware with role check for predictive analytics
 * Allows ADMIN, COMPANY_ADMIN, DATA_SCIENTIST, and other specialized roles
 */
const predictiveRoleGuard = (req: any, res: Response, next: NextFunction) => {
  // Make sure user is authenticated
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'You must be logged in to access Predictive Analytics features' 
    });
  }

  // Check if user has predictive analytics access
  if (!hasPredictiveAnalyticsAccess(req.user.roles)) {
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'You do not have permission to access Predictive Analytics features' 
    });
  }

  next();
};

/**
 * @route GET /api/analytics/predictive/models
 * @desc Get all predictive models for a company
 * @access Private (requires authentication + predictive analytics role)
 */
router.get(
  '/models',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  predictiveRoleGuard,
  async (req: any, res: Response) => {
    try {
      const companyId = req.user.companyId;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const type = req.query.type as string;

      const models = await req.services.predictiveService.getPredictiveModels(
        companyId,
        {
          page,
          limit,
          type
        }
      );

      return res.status(200).json({
        models,
        pagination: {
          page,
          limit,
          totalModels: models.length
        }
      });
    } catch (error) {
      console.error('Error fetching predictive models:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while fetching predictive models' 
      });
    }
  }
);

/**
 * @route POST /api/analytics/predictive/models
 * @desc Create a new predictive model
 * @access Private (requires authentication + predictive analytics role)
 */
router.post(
  '/models',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  predictiveRoleGuard,
  async (req: any, res: Response) => {
    try {
      const modelData = {
        ...req.body,
        companyId: req.user.companyId,
        createdBy: req.user.id
      };

      const model = await req.services.predictiveService.createPredictiveModel(modelData);

      return res.status(201).json({ model });
    } catch (error) {
      console.error('Error creating predictive model:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while creating the predictive model' 
      });
    }
  }
);

/**
 * @route GET /api/analytics/predictive/models/:id
 * @desc Get a specific predictive model by ID
 * @access Private (requires authentication + predictive analytics role)
 */
router.get(
  '/models/:id',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  predictiveRoleGuard,
  async (req: any, res: Response) => {
    try {
      const modelId = req.params.id;
      const companyId = req.user.companyId;

      const model = await req.services.predictiveService.getPredictiveModelById(modelId, companyId);

      if (!model) {
        return res.status(404).json({ 
          error: 'Not Found', 
          message: 'Predictive model not found' 
        });
      }

      return res.status(200).json({ model });
    } catch (error) {
      console.error('Error fetching predictive model:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while fetching the predictive model' 
      });
    }
  }
);

/**
 * @route PUT /api/analytics/predictive/models/:id
 * @desc Update a predictive model
 * @access Private (requires authentication + predictive analytics role)
 */
router.put(
  '/models/:id',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  predictiveRoleGuard,
  async (req: any, res: Response) => {
    try {
      const modelId = req.params.id;
      const companyId = req.user.companyId;
      const userId = req.user.id;

      // Get the model to verify ownership
      const model = await req.services.predictiveService.getPredictiveModelById(modelId, companyId);

      if (!model) {
        return res.status(404).json({ 
          error: 'Not Found', 
          message: 'Predictive model not found' 
        });
      }

      const updatedModel = await req.services.predictiveService.updatePredictiveModel(
        modelId,
        companyId,
        userId,
        req.body
      );

      return res.status(200).json({ model: updatedModel });
    } catch (error) {
      console.error('Error updating predictive model:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while updating the predictive model' 
      });
    }
  }
);

/**
 * @route DELETE /api/analytics/predictive/models/:id
 * @desc Delete a predictive model
 * @access Private (requires authentication + predictive analytics role)
 */
router.delete(
  '/models/:id',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  predictiveRoleGuard,
  async (req: any, res: Response) => {
    try {
      const modelId = req.params.id;
      const companyId = req.user.companyId;

      // Get the model to verify ownership
      const model = await req.services.predictiveService.getPredictiveModelById(modelId, companyId);

      if (!model) {
        return res.status(404).json({ 
          error: 'Not Found', 
          message: 'Predictive model not found' 
        });
      }

      await req.services.predictiveService.deletePredictiveModel(modelId, companyId);

      return res.status(204).send();
    } catch (error) {
      console.error('Error deleting predictive model:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while deleting the predictive model' 
      });
    }
  }
);

/**
 * @route POST /api/analytics/predictive/models/:id/train
 * @desc Train a predictive model
 * @access Private (requires authentication + predictive analytics role)
 */
router.post(
  '/models/:id/train',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  predictiveRoleGuard,
  async (req: any, res: Response) => {
    try {
      const modelId = req.params.id;
      const companyId = req.user.companyId;
      const userId = req.user.id;
      const trainingParams = req.body.parameters || {};

      // Get the model to verify ownership
      const model = await req.services.predictiveService.getPredictiveModelById(modelId, companyId);

      if (!model) {
        return res.status(404).json({ 
          error: 'Not Found', 
          message: 'Predictive model not found' 
        });
      }

      const trainingResult = await req.services.predictiveService.trainPredictiveModel(
        modelId,
        companyId,
        userId,
        trainingParams
      );

      return res.status(200).json({ trainingResult });
    } catch (error) {
      console.error('Error training predictive model:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while training the predictive model' 
      });
    }
  }
);

/**
 * @route POST /api/analytics/predictive/models/:id/predict
 * @desc Make predictions using a model
 * @access Private (requires authentication + predictive analytics role)
 */
router.post(
  '/models/:id/predict',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  predictiveRoleGuard,
  async (req: any, res: Response) => {
    try {
      const modelId = req.params.id;
      const companyId = req.user.companyId;
      const inputData = req.body.data || {};

      // Get the model to verify ownership
      const model = await req.services.predictiveService.getPredictiveModelById(modelId, companyId);

      if (!model) {
        return res.status(404).json({ 
          error: 'Not Found', 
          message: 'Predictive model not found' 
        });
      }

      const prediction = await req.services.predictiveService.makePrediction(
        modelId,
        companyId,
        inputData
      );

      return res.status(200).json({ prediction });
    } catch (error) {
      console.error('Error making prediction:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while making prediction' 
      });
    }
  }
);

/**
 * @route GET /api/analytics/predictive/scenarios
 * @desc Get all predictive scenarios for a company
 * @access Private (requires authentication + predictive analytics role)
 */
router.get(
  '/scenarios',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  predictiveRoleGuard,
  async (req: any, res: Response) => {
    try {
      const companyId = req.user.companyId;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const type = req.query.type as string;

      const scenarios = await req.services.predictiveService.getPredictiveScenarios(
        companyId,
        {
          page,
          limit,
          type
        }
      );

      return res.status(200).json({
        scenarios,
        pagination: {
          page,
          limit,
          totalScenarios: scenarios.length
        }
      });
    } catch (error) {
      console.error('Error fetching predictive scenarios:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while fetching predictive scenarios' 
      });
    }
  }
);

/**
 * @route POST /api/analytics/predictive/scenarios
 * @desc Create a new predictive scenario
 * @access Private (requires authentication + predictive analytics role)
 */
router.post(
  '/scenarios',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  predictiveRoleGuard,
  async (req: any, res: Response) => {
    try {
      const scenarioData = {
        ...req.body,
        companyId: req.user.companyId,
        createdBy: req.user.id
      };

      const scenario = await req.services.predictiveService.createPredictiveScenario(scenarioData);

      return res.status(201).json({ scenario });
    } catch (error) {
      console.error('Error creating predictive scenario:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while creating the predictive scenario' 
      });
    }
  }
);

/**
 * @route GET /api/analytics/predictive/scenarios/:id
 * @desc Get a specific predictive scenario by ID
 * @access Private (requires authentication + predictive analytics role)
 */
router.get(
  '/scenarios/:id',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  predictiveRoleGuard,
  async (req: any, res: Response) => {
    try {
      const scenarioId = req.params.id;
      const companyId = req.user.companyId;

      const scenario = await req.services.predictiveService.getPredictiveScenarioById(scenarioId, companyId);

      if (!scenario) {
        return res.status(404).json({ 
          error: 'Not Found', 
          message: 'Predictive scenario not found' 
        });
      }

      // Get scenario results
      const results = await req.services.predictiveService.getScenarioResults(scenarioId);

      return res.status(200).json({ 
        scenario,
        results
      });
    } catch (error) {
      console.error('Error fetching predictive scenario:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while fetching the predictive scenario' 
      });
    }
  }
);

/**
 * @route POST /api/analytics/predictive/scenarios/:id/run
 * @desc Run a predictive scenario
 * @access Private (requires authentication + predictive analytics role)
 */
router.post(
  '/scenarios/:id/run',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  predictiveRoleGuard,
  async (req: any, res: Response) => {
    try {
      const scenarioId = req.params.id;
      const companyId = req.user.companyId;
      const userId = req.user.id;
      const parameters = req.body.parameters || {};

      // Get the scenario to verify ownership
      const scenario = await req.services.predictiveService.getPredictiveScenarioById(scenarioId, companyId);

      if (!scenario) {
        return res.status(404).json({ 
          error: 'Not Found', 
          message: 'Predictive scenario not found' 
        });
      }

      const runResult = await req.services.predictiveService.runPredictiveScenario(
        scenarioId,
        companyId,
        userId,
        parameters
      );

      return res.status(200).json({ result: runResult });
    } catch (error) {
      console.error('Error running predictive scenario:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while running the predictive scenario' 
      });
    }
  }
);

/**
 * @route GET /api/analytics/predictive/inventory-forecast
 * @desc Get inventory forecast
 * @access Private (requires authentication + predictive analytics role)
 */
router.get(
  '/inventory-forecast',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  predictiveRoleGuard,
  async (req: any, res: Response) => {
    try {
      const companyId = req.user.companyId;
      const productId = req.query.productId as string;
      const warehouseId = req.query.warehouseId as string;
      const period = req.query.period as string || '30d';

      const forecast = await req.services.predictiveService.getInventoryForecast(
        companyId,
        productId,
        warehouseId,
        period
      );

      return res.status(200).json({ forecast });
    } catch (error) {
      console.error('Error generating inventory forecast:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while generating inventory forecast' 
      });
    }
  }
);

/**
 * @route GET /api/analytics/predictive/sales-forecast
 * @desc Get sales forecast
 * @access Private (requires authentication + predictive analytics role)
 */
router.get(
  '/sales-forecast',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  predictiveRoleGuard,
  async (req: any, res: Response) => {
    try {
      const companyId = req.user.companyId;
      const productId = req.query.productId as string;
      const period = req.query.period as string || '30d';

      const forecast = await req.services.predictiveService.getSalesForecast(
        companyId,
        productId,
        period
      );

      return res.status(200).json({ forecast });
    } catch (error) {
      console.error('Error generating sales forecast:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while generating sales forecast' 
      });
    }
  }
);

/**
 * @route GET /api/analytics/predictive/purchase-recommendations
 * @desc Get purchase recommendations
 * @access Private (requires authentication + predictive analytics role)
 */
router.get(
  '/purchase-recommendations',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  predictiveRoleGuard,
  async (req: any, res: Response) => {
    try {
      const companyId = req.user.companyId;
      const warehouseId = req.query.warehouseId as string;

      const recommendations = await req.services.predictiveService.getPurchaseRecommendations(
        companyId,
        warehouseId
      );

      return res.status(200).json({ recommendations });
    } catch (error) {
      console.error('Error generating purchase recommendations:', error);
      return res.status(500).json({ 
        error: 'Internal Server Error', 
        message: 'An error occurred while generating purchase recommendations' 
      });
    }
  }
);

/**
 * Setup Predictive Analytics Routes
 * 
 * @param db Database instance
 * @returns Express router with predictive analytics routes
 */
export function setupPredictiveRoutes(db?: any) {
  return router;
}

export default router;