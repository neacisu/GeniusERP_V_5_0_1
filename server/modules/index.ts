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

export async function initializeModules(app: Express) {
  console.log('Starting minimal module initialization for debugging');
  
  try {
    // Get database connection
    const db = getDrizzle();
    console.log('Database connection established');
    
    // Initialize only essential modules for debugging
    
    // Initialize auth module (core functionality)
    console.log('Initializing Auth module...');
    const authRouter = initAuthModule(app, storage.sessionStore);
    console.log('Auth module initialized');
    
    // Initialize users module (core functionality)
    console.log('Initializing Users module...');
    initUserModule(app);
    console.log('Users module initialized');
    
    // Initialize admin module (core functionality)
    console.log('Initializing Admin module...');
    const adminModuleInfo = initAdminModule(app);
    console.log('Admin module initialized');
    
    // Initialize invoices module
    console.log('Initializing Invoices module...');
    InvoicesModule.register(app);
    console.log('Invoices module initialized');
    
    // Initialize CRM module
    console.log('Initializing CRM module...');
    initCrmModule(app);
    console.log('CRM module initialized');
    
    // Initialize HR module
    console.log('Initializing HR module...');
    initHrModule(app);
    console.log('HR module initialized');
    
    // Initialize E-commerce module
    console.log('Initializing E-Commerce module...');
    ECommerceModule.register(app, drizzleService);
    console.log('E-Commerce module initialized');
    
    // Initialize Integrations module
    console.log('Initializing Integrations module...');
    initializeIntegrationsModule(app);
    console.log('Integrations module initialized');
    
    // Initialize BPM module
    console.log('Initializing BPM module...');
    const bpmModule = BpmModule.getInstance();
    bpmModule.initialize(db);
    bpmModule.registerRoutes(app);
    console.log('BPM module initialized');
    
    // Initialize Collaboration module
    console.log('Initializing Collaboration module...');
    const collabModule = CollabModule.getInstance();
    collabModule.initialize(db);
    collabModule.registerRoutes(app);
    console.log('Collaboration module initialized');
    
    // Initialize AI module
    console.log('Initializing AI module...');
    initAiModule(app, drizzleService);
    console.log('AI module initialized');
    
    // Initialize Settings module
    console.log('Initializing Settings module...');
    const settingsInfo = SettingsModule.registerRoutes(app);
    console.log('Settings module initialized');
    
    // Initialize Marketing module
    console.log('Initializing Marketing module...');
    await MarketingModule.register(app);
    console.log('Marketing module initialized');
    
    // Initialize Sales module
    console.log('Initializing Sales module...');
    initSalesModule(app);
    console.log('Sales module initialized');
    
    // Initialize Accounting module
    console.log('Initializing Accounting module...');
    initAccountingModule(app);
    console.log('Accounting module initialized');
    
    // Initialize Communications module
    console.log('Initializing Communications module...');
    CommsModule.register(app, drizzleService);
    console.log('Communications module initialized');
    
    // Initialize Inventory module
    console.log('Initializing Inventory module...');
    initializeInventoryModule(app);
    console.log('Inventory module initialized');
    
    // Initialize Company module
    console.log('Initializing Company module...');
    initCompanyModule(app, drizzleService);
    console.log('Company module initialized');
    
    console.log("Core modules initialized successfully");
    
    return {
      authRouter
    };
  } catch (error) {
    console.error('Error during module initialization:', error);
    console.log('Continuing with limited functionality');
    
    return {};
  }
}