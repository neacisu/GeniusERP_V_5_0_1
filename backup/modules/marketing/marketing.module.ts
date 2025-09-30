/**
 * Marketing Module
 * 
 * This module provides comprehensive marketing campaign management capabilities
 * with multi-channel integration and unified communications.
 */

import { Router } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { Logger } from '../../common/logger';
import { initialize } from './init';

// Import service modules
import { CampaignService } from './services/campaign.service';
import { SegmentService } from './services/segment.service';
import { TemplateService } from './services/template.service';

// Import route modules
import { campaignRoutes } from './routes/campaign.routes';
import { segmentRoutes } from './routes/segment.routes';
import { templateRoutes } from './routes/template.routes';

/**
 * The MarketingModule provides campaign management functionality and integrates with
 * the Communications module to deliver multi-channel marketing campaigns.
 */
export class MarketingModule {
  private static _instance: MarketingModule;
  private _campaignService: CampaignService;
  private _segmentService: SegmentService;
  private _templateService: TemplateService;
  private _router: Router;
  private _logger: Logger;
  private _initialized: boolean = false;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this._logger = new Logger('MarketingModule');
    this._router = Router();
  }

  /**
   * Get the singleton instance of MarketingModule
   */
  public static getInstance(): MarketingModule {
    if (!MarketingModule._instance) {
      MarketingModule._instance = new MarketingModule();
    }
    return MarketingModule._instance;
  }

  /**
   * Initialize the Marketing module
   * This should be called once at application startup
   */
  public async initialize(): Promise<void> {
    if (this._initialized) {
      this._logger.warn('Marketing module already initialized');
      return;
    }

    try {
      this._logger.info('Initializing Marketing module...');
      
      // Initialize services
      await initialize();
      
      this._campaignService = new CampaignService();
      this._segmentService = new SegmentService();
      this._templateService = new TemplateService();
      
      // Set up routes
      this._router.use('/campaigns', campaignRoutes);
      this._router.use('/segments', segmentRoutes);
      this._router.use('/templates', templateRoutes);
      
      this._initialized = true;
      this._logger.info('Marketing module initialized successfully');
    } catch (error) {
      this._logger.error('Failed to initialize Marketing module', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Get the Express router for this module
   */
  public getRouter(): Router {
    if (!this._initialized) {
      this._logger.warn('Attempted to get router before initialization');
    }
    return this._router;
  }

  /**
   * Get the campaign service instance
   */
  public getCampaignService(): CampaignService {
    return this._campaignService;
  }

  /**
   * Get the segment service instance
   */
  public getSegmentService(): SegmentService {
    return this._segmentService;
  }

  /**
   * Get the template service instance
   */
  public getTemplateService(): TemplateService {
    return this._templateService;
  }

  /**
   * Register the Marketing module with the application
   * @param app The Express application instance
   * @param basePath The base path for the module routes
   */
  public static async register(app: any, basePath: string = '/api/marketing'): Promise<void> {
    const instance = MarketingModule.getInstance();
    await instance.initialize();
    app.use(basePath, instance.getRouter());
  }
}