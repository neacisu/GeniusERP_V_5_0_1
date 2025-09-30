/**
 * Integrations Module
 * 
 * This module encapsulates all external system integrations including:
 * - ANAF e-Factura
 * - Shopify
 * - Stripe
 * - PandaDoc
 * - Revolut Business
 * - Microsoft Graph
 * - Termene.ro
 * - Sameday
 * - ElevenLabs
 * - OpenAI
 * 
 * The module manages authentication tokens, connection state,
 * synchronization logic, and provides reusable services
 * across the entire ERP system.
 */

import { Express } from 'express';
import { getDrizzle } from '../../common/drizzle';
import { IntegrationsService } from './services/integrations.service';
import { bnrExchangeRateService } from './services/bnr-exchange-rate.service';
import { CurrencyService } from './services/currency.service';
import { anafService } from './services/anaf.service';
import { eFacturaService } from './services/e-factura.service';
import { exchangeRateService } from './services/exchange-rate.service';
import integrationsRoutes from './routes';
import publicRoutes from './routes/public.routes';

// Import all integration clients
import * as integrationClients from './clients';

// Service instances
let integrationsService: IntegrationsService;

/**
 * Initialize the Integrations Module
 * @param app Express application instance
 * @returns Module exports
 */

export function initializeIntegrationsModule(app: Express) {
  console.log('🌐 Initializing Integrations Module...');
  
  // Create service instances
  integrationsService = new IntegrationsService();
  
  // Initialize BNR exchange rate service with scheduled updates
  bnrExchangeRateService.initialize();
  
  // Mount the public routes BEFORE the authenticated routes 
  // to ensure they are accessible without authentication
  app.use('/api', publicRoutes);
  console.log('🌍 Registered public exchange rate routes at /api/exchange-rates/bnr/*');
  
  // Mount the protected integrations routes on the app
  app.use('/api/integrations', integrationsRoutes);
  
  console.log(`📊 Loaded ${Object.keys(integrationClients).length} integration clients`);
  console.log('🔌 Registered integrations routes at /api/integrations');
  
  return {
    // Export services for use by other modules
    integrationsService,
    bnrExchangeRateService,
    CurrencyService,
    anafService,
    eFacturaService,
    exchangeRateService,
    // Export integration clients
    integrationClients
  };
}

export class IntegrationsModule {
  /**
   * Get the IntegrationsService instance
   * @returns IntegrationsService
   */
  static getIntegrationsService(): IntegrationsService {
    if (!integrationsService) {
      integrationsService = new IntegrationsService();
    }
    return integrationsService;
  }
  
  /**
   * Get all available integration clients
   * @returns Object containing all integration clients
   */
  static getIntegrationClients() {
    return integrationClients;
  }
  
  /**
   * Get a specific integration client by name
   * @param name Client name (e.g., 'AnafEFacturaClient', 'PandaDocClient')
   * @returns Integration client or undefined if not found
   */
  static getIntegrationClient(name: string) {
    return integrationClients[name as keyof typeof integrationClients];
  }
}