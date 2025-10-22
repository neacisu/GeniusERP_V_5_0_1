/**
 * Integration Clients Index
 * 
 * Exports all integration clients for easy importing
 * and provides a factory function to get the appropriate client.
 */

import { BaseIntegrationClient } from './base-integration.client';
import { PandaDocClient } from './pandadoc.client';
import { AnafEfacturaClient } from './anaf-efactura.client';
import { StripeClient } from './stripe.client';
import { RevolutBusinessClient } from './revolut-business.client';
import { MicrosoftGraphClient } from './microsoft-graph.client';
import { OpenAIClient } from './openai.client';
import { TermeneRoClient } from './termene-ro.client';
import { ShopifyClient, ShopifyIntegrationType } from './shopify.client';
import { ElevenLabsClient } from './elevenlabs.client';
import { SameDayClient } from './sameday.client';
import { IntegrationProvider } from '../schema/integrations.schema';

export {
  BaseIntegrationClient,
  PandaDocClient,
  AnafEfacturaClient,
  StripeClient,
  RevolutBusinessClient,
  MicrosoftGraphClient,
  OpenAIClient,
  TermeneRoClient,
  ShopifyClient,
  ShopifyIntegrationType,
  ElevenLabsClient,
  SameDayClient
};

/**
 * Get the appropriate integration client based on provider
 * 
 * @param provider Integration provider
 * @param companyId Company ID
 * @param franchiseId Optional franchise ID for multi-company setups
 * @returns The integration client instance
 */
export function getIntegrationClient(
  provider: IntegrationProvider | string,
  companyId: string,
  franchiseId?: string
): BaseIntegrationClient {
  switch (provider) {
    // Romanian e-Factura
    case IntegrationProvider.ANAF_EFACTURA:
      return new AnafEfacturaClient(companyId, franchiseId);
    
    // Payments
    case IntegrationProvider.STRIPE:
      return new StripeClient(companyId, franchiseId);
    case IntegrationProvider.REVOLUT_BUSINESS:
      return new RevolutBusinessClient(companyId, franchiseId);
    
    // Document Signing
    case IntegrationProvider.PANDADOC:
      return new PandaDocClient(companyId, franchiseId);
    
    // Email/Messaging
    case IntegrationProvider.MICROSOFT_GRAPH:
      return new MicrosoftGraphClient(companyId, franchiseId);
    
    // eCommerce
    case IntegrationProvider.SHOPIFY_ADMIN:
      return new ShopifyClient(ShopifyIntegrationType.ADMIN, companyId, franchiseId);
    case IntegrationProvider.SHOPIFY_STOREFRONT:
      return new ShopifyClient(ShopifyIntegrationType.STOREFRONT, companyId, franchiseId);
    case IntegrationProvider.SHOPIFY_INBOX:
      return new ShopifyClient(ShopifyIntegrationType.INBOX, companyId, franchiseId);
    
    // Shipping
    case IntegrationProvider.SAMEDAY:
      return new SameDayClient(companyId, franchiseId);
    
    // Company Registry & Validation
    case IntegrationProvider.TERMENE_RO:
      return new TermeneRoClient(companyId, franchiseId);
    
    // AI Integrations
    case IntegrationProvider.OPENAI:
      return new OpenAIClient(companyId, franchiseId);
    case IntegrationProvider.ELEVENLABS:
      return new ElevenLabsClient(companyId, franchiseId);
      
    default:
      throw new Error(`Unsupported integration provider: ${provider}`);
  }
}