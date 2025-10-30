import { Express } from "express";
import { storage } from "../storage";
import { initAuthModule } from "./auth";
import { initUserModule } from "./users";
import { initAdminModule } from "./admin";
import { getDrizzle } from '../common/drizzle';
import { drizzleService } from '../common/drizzle/drizzle.service.instance';
import { InvoicesModule } from "./invoicing/invoices.module";
import { initCrmModule } from "./crm/crm.module";
import { initHrModule } from "./hr/init";
import { ECommerceModule } from "./ecommerce/ecommerce.module";
import { initializeIntegrationsModule } from "./integrations/integrations.module";
import { BpmModule } from "./bpm/bpm.module";
import { CollabModule } from "./collab/collab.module";
import { initAiModule } from "./ai/ai.module";
import { SettingsModule } from "./settings/settings.module";
import { MarketingModule } from "./marketing/marketing.module";
import { initSalesModule } from "./sales/sales.module";
import { initAccountingModule } from "./accounting";
import { CommsModule } from "./comms/comms.module";
import { initializeInventoryModule } from "./inventory";
import { initCompanyModule } from "./company/company.module";
import { createModuleLogger } from '../common/logger/loki-logger';

const moduleLogger = createModuleLogger('modules');

export async function initializeModules(app: Express) {
  moduleLogger.info('Starting minimal module initialization for debugging');
  
  try {
    // Get database connection
    const db = getDrizzle();
    moduleLogger.info('Database connection established');
    
    // Initialize only essential modules for debugging
    
    // Initialize auth module (core functionality)
    moduleLogger.info('Initializing Auth module...');
    const authRouter = initAuthModule(app, storage.sessionStore);
    moduleLogger.info('Auth module initialized');
    
    // Initialize users module (core functionality)
    moduleLogger.info('Initializing Users module...');
    initUserModule(app);
    moduleLogger.info('Users module initialized');
    
    // Initialize admin module (core functionality)
    moduleLogger.info('Initializing Admin module...');
    const adminModuleInfo = initAdminModule(app);
    moduleLogger.info('Admin module initialized');
    
    moduleLogger.info('✅ Core modules loaded successfully');
    
    // Initialize invoices module
    moduleLogger.info('Initializing Invoices module...');
    InvoicesModule.register(app);
    moduleLogger.info('Invoices module initialized');
    
    // Initialize CRM module
    moduleLogger.info('Initializing CRM module...');
    initCrmModule(app);
    moduleLogger.info('CRM module initialized');
    
    // Initialize HR module
    moduleLogger.info('Initializing HR module...');
    initHrModule(app);
    moduleLogger.info('HR module initialized');
    
    // Initialize E-commerce module
    moduleLogger.info('Initializing E-Commerce module...');
    ECommerceModule.register(app, drizzleService);
    moduleLogger.info('E-Commerce module initialized');
    
    // Initialize Integrations module
    moduleLogger.info('Initializing Integrations module...');
    initializeIntegrationsModule(app);
    moduleLogger.info('Integrations module initialized');
    
    // Initialize BPM module
    moduleLogger.info('Initializing BPM module...');
    const bpmModule = BpmModule.getInstance();
    bpmModule.initialize(db);
    bpmModule.registerRoutes(app);
    moduleLogger.info('BPM module initialized');
    
    // Initialize Collaboration module
    moduleLogger.info('Initializing Collaboration module...');
    const collabModule = CollabModule.getInstance();
    collabModule.initialize(db);
    collabModule.registerRoutes(app);
    moduleLogger.info('Collaboration module initialized');
    
    // Initialize AI module
    moduleLogger.info('Initializing AI module...');
    initAiModule(app, drizzleService);
    moduleLogger.info('AI module initialized');
    
    // Initialize Settings module
    moduleLogger.info('Initializing Settings module...');
    const settingsInfo = SettingsModule.registerRoutes(app);
    moduleLogger.info('Settings module initialized');
    
    // Initialize Marketing module
    moduleLogger.info('Initializing Marketing module...');
    await MarketingModule.register(app);
    moduleLogger.info('Marketing module initialized');
    
    // Initialize Sales module
    moduleLogger.info('Initializing Sales module...');
    initSalesModule(app);
    moduleLogger.info('Sales module initialized');
    
    // Initialize Accounting module
    moduleLogger.info('Initializing Accounting module...');
    initAccountingModule(app);
    moduleLogger.info('Accounting module initialized');
    
    // Initialize Communications module
    moduleLogger.info('Initializing Communications module...');
    CommsModule.register(app, drizzleService);
    moduleLogger.info('Communications module initialized');
    
    // Initialize Inventory module
    moduleLogger.info('Initializing Inventory module...');
    initializeInventoryModule(app);
    moduleLogger.info('Inventory module initialized');
    
    // Initialize Company module
    moduleLogger.info('Initializing Company module...');
    initCompanyModule(app, drizzleService);
    moduleLogger.info('Company module initialized');
    
    moduleLogger.info("Core modules initialized successfully");
    
    return {
      authRouter
    };
  } catch (error) {
    moduleLogger.error('Error during module initialization', error as Error);
    moduleLogger.warn('Continuing with limited functionality');
    
    return {};
  }
}