/**
 * External Integrations Module
 * 
 * This module provides external API integrations required for Romanian accounting:
 * - Currency exchange rates (for invoice currency conversion)
 * - Official BNR exchange rates from National Bank of Romania
 * - Local currency conversion service using stored BNR rates
 * - e-Factura system (electronic invoicing system required by ANAF)
 * - ANAF API (Romanian Tax Authority for VAT validation)
 * - PandaDoc document generation and signatures
 * - Payment processors (Stripe, Revolut)
 * - Microsoft Graph API for Office 365 integration
 * - Business intelligence with Termene.ro
 * - AI integrations (OpenAI, ElevenLabs)
 * - Shipping providers (Sameday)
 * - Shopify eCommerce integration
 */

// Export our module
export * from './integrations.module';

// Export our services
export * from './services/exchange-rate.service';
export * from './services/bnr-exchange-rate.service';
export * from './services/currency.service';
export * from './services/e-factura.service';
export * from './services/anaf.service';
export * from './services/integrations.service';

// Export integration clients
export * from './clients';

// Export HTTP client for other modules to use
export { HttpClient, createHttpClient } from '../../shared/libs/http-client';