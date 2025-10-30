/**
 * Company Module
 * 
 * This module provides functionality for managing companies and their hierarchy.
 */

import { Express } from 'express';
import { DrizzleService } from '../../common/drizzle/drizzle.service';
import { CompanyService } from './services/company.service';
import { CompanyRouter, createCompanyRouter } from './routes';
import { createCompanyController } from './controllers';
import { Logger } from '../../common/logger';
import { registerModule } from '../../common/services/registry';

// Create a logger for the module
const logger = new Logger('CompanyModule');

/**
 * Company Module configuration object
 */
export const CompanyModule = {
  name: 'company',
  displayName: 'Company Management',
  description: 'Manages company information and hierarchy',
  version: '1.0.0',
  initialize: initCompanyModule,
  
  /**
   * Register the module with the application
   * @param app Express application
   * @param drizzleService DrizzleService instance
   * @returns Information about the registered module
   */
  register: (app: Express, drizzleService: DrizzleService) => {
    const moduleInfo = initCompanyModule(app, drizzleService);
    
    // Register module with service registry
    try {
      registerModule('company', {
        name: CompanyModule.name,
        version: CompanyModule.version,
        services: moduleInfo.services,
        permissions: CompanyModule.permissions
      });
      logger.info('Company module registered with service registry');
    } catch (error) {
      logger.warn('Failed to register Company module with service registry', error);
    }
    
    return moduleInfo;
  },
  
  defaultRoles: [
    'company_admin',
    'company_manager',
    'company_viewer'
  ],
  permissions: [
    'company.create',
    'company.read',
    'company.update',
    'company.delete',
    'company.hierarchy.read',
    'company.subsidiaries.manage'
  ],
  routes: [
    {
      path: '/api/companies',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      description: 'Manage company information'
    },
    {
      path: '/api/companies/search',
      methods: ['GET'],
      description: 'Search for companies'
    },
    {
      path: '/api/companies/hierarchy',
      methods: ['GET'],
      description: 'Get company hierarchy'
    }
  ],
  dependencies: ['auth', 'users']
};

/**
 * Initialize the Company module
 * @param app Express application instance
 * @param drizzleService DrizzleService instance
 * @returns Information about the initialized module
 */
export function initCompanyModule(app: Express, drizzleService: DrizzleService) {
  logger.info('Initializing Company module');
  
  try {
    // Initialize services
    const companyService = new CompanyService(drizzleService);
    
    // Initialize controllers
    const companyController = createCompanyController(companyService);
    
    // Initialize and mount routers
    const companyRouter = createCompanyRouter(companyController);
    
    // Mount routes
    if (app) {
      app.use('/api/companies', companyRouter);
    }
    
    logger.info('Company module initialized successfully');
    
    return {
      name: CompanyModule.name,
      version: CompanyModule.version,
      services: {
        companyService
      },
      controllers: {
        companyController
      }
    };
  } catch (error) {
    logger.error('Failed to initialize Company module', error);
    throw new Error('Company module initialization failed');
  }
}