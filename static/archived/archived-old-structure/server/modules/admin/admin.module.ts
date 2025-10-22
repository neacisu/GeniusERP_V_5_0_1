/**
 * Admin Module (Integrated Control Center)
 * 
 * This module serves as the centralized control center for the entire system,
 * providing administrative capabilities for managing users, companies, system health,
 * and all other modules.
 */

import { Express } from 'express';
import { Logger } from '../../common/logger';
import { BaseModule } from '../../types/module';
import { DrizzleService } from '../../common/drizzle';
import { UserService } from './services/user.service';
import { RoleService } from './services/role.service';
import { SetupService } from './services/setup.service';
import { HealthCheckService } from './services/health-check.service';
import { ApiKeyService } from './services/api-key.service';
import { ConfigService } from './services/config.service';
import { LicenseService } from './services/license.service';

export class AdminModule implements BaseModule {
  private static instance: AdminModule;
  private logger = new Logger('AdminModule');
  private db!: DrizzleService;
  private initialized = false;

  // Services
  private userService!: UserService;
  private roleService!: RoleService;
  private setupService!: SetupService;
  private healthCheckService!: HealthCheckService;
  private apiKeyService!: ApiKeyService;
  private configService!: ConfigService;
  private licenseService!: LicenseService;

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AdminModule {
    if (!AdminModule.instance) {
      AdminModule.instance = new AdminModule();
    }
    return AdminModule.instance;
  }

  /**
   * Initialize the module with database connection
   */
  public initialize(db: DrizzleService): void {
    if (this.initialized) {
      this.logger.warn('AdminModule already initialized');
      return;
    }

    this.logger.info('Initializing AdminModule...');
    this.db = db;

    // Get raw DB instance for services that need it
    const rawDb = db.getDbInstance();

    // Initialize services
    this.setupService = new SetupService(rawDb);
    this.userService = new UserService(rawDb);
    this.roleService = new RoleService(rawDb);
    this.healthCheckService = new HealthCheckService(this.db);
    this.apiKeyService = new ApiKeyService(rawDb);
    this.configService = new ConfigService(rawDb);
    this.licenseService = new LicenseService(this.db);

    this.initialized = true;
    this.logger.info('AdminModule initialized successfully');
  }

  /**
   * Register routes with the Express application
   */
  public registerRoutes(app: Express): void {
    if (!this.initialized) {
      this.logger.error('Cannot register routes: AdminModule not initialized');
      return;
    }

    this.logger.info('Registering AdminModule routes...');
    
    try {
      // Use dynamic imports instead of require for ES module compatibility
      import('./controllers/admin.controller.js').then(({ registerAdminControllerRoutes }) => {
        registerAdminControllerRoutes(app, this.userService);
        this.logger.info('Admin controller routes registered');
      }).catch(err => {
        this.logger.error('Failed to import admin.controller:', err);
      });
      
      import('./controllers/user.controller.js').then(({ registerUserControllerRoutes }) => {
        registerUserControllerRoutes(app, this.userService);
        this.logger.info('User controller routes registered');
      }).catch(err => {
        this.logger.error('Failed to import user.controller:', err);
      });
      
      // Register new controllers
      import('./controllers/role.controller.js').then(({ registerRoleControllerRoutes }) => {
        registerRoleControllerRoutes(app, this.roleService);
        this.logger.info('Role controller routes registered');
      }).catch(err => {
        this.logger.error('Failed to import role.controller:', err);
      });
      
      import('./controllers/api-key.controller.js').then(({ registerApiKeyControllerRoutes }) => {
        registerApiKeyControllerRoutes(app, this.apiKeyService);
        this.logger.info('API Key controller routes registered');
      }).catch(err => {
        this.logger.error('Failed to import api-key.controller:', err);
      });
      
      import('./controllers/config.controller.js').then(({ registerConfigControllerRoutes }) => {
        registerConfigControllerRoutes(app, this.configService);
        this.logger.info('Config controller routes registered');
      }).catch(err => {
        this.logger.error('Failed to import config.controller:', err);
      });
      
      import('./controllers/health-check.controller.js').then(({ registerHealthCheckControllerRoutes }) => {
        registerHealthCheckControllerRoutes(app, this.healthCheckService);
        this.logger.info('Health Check controller routes registered');
      }).catch(err => {
        this.logger.error('Failed to import health-check.controller:', err);
      });
      
      import('./controllers/license.controller.js').then(({ registerLicenseControllerRoutes }) => {
        registerLicenseControllerRoutes(app, this.licenseService);
        this.logger.info('License controller routes registered');
      }).catch(err => {
        this.logger.error('Failed to import license.controller:', err);
      });
      
      import('./controllers/setup.controller.js').then(({ registerSetupControllerRoutes }) => {
        registerSetupControllerRoutes(app, this.setupService);
        this.logger.info('Setup controller routes registered');
      }).catch(err => {
        this.logger.error('Failed to import setup.controller:', err);
      });
    } catch (error) {
      this.logger.error('Error while registering routes:', error);
    }

    this.logger.info('AdminModule routes registered successfully');
  }

  /**
   * Start any background processes or services
   */
  public start(): void {
    if (!this.initialized) {
      this.logger.error('Cannot start: AdminModule not initialized');
      return;
    }

    this.logger.info('Starting AdminModule services...');
    
    // Start scheduled health checks
    this.healthCheckService.startPeriodicChecks();
    
    this.logger.info('AdminModule services started successfully');
  }

  /**
   * Stop any background processes or services (for graceful shutdown)
   */
  public stop(): void {
    if (!this.initialized) {
      return;
    }

    this.logger.info('Stopping AdminModule services...');
    
    // Stop scheduled health checks
    this.healthCheckService.stopPeriodicChecks();
    
    this.logger.info('AdminModule services stopped successfully');
  }

  /**
   * Get the Setup Service instance
   */
  public getSetupService(): SetupService {
    return this.setupService;
  }

  /**
   * Get the User Service instance
   */
  public getUserService(): UserService {
    return this.userService;
  }

  /**
   * Get the Role Service instance
   */
  public getRoleService(): RoleService {
    return this.roleService;
  }

  /**
   * Get the Health Check Service instance
   */
  public getHealthCheckService(): HealthCheckService {
    return this.healthCheckService;
  }

  /**
   * Get the API Key Service instance
   */
  public getApiKeyService(): ApiKeyService {
    return this.apiKeyService;
  }

  /**
   * Get the Config Service instance
   */
  public getConfigService(): ConfigService {
    return this.configService;
  }

  /**
   * Get the License Service instance
   */
  public getLicenseService(): LicenseService {
    return this.licenseService;
  }
}