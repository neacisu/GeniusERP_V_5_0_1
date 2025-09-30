/**
 * Comprehensive Test for All Integration Clients
 * 
 * This script verifies that all integration clients are properly registered and can be instantiated.
 * It also performs a basic validation of each client's structure without attempting to connect
 * to external services (to avoid excessive API calls).
 */

import { v4 as uuidv4 } from 'uuid';
import {
  getIntegrationClient,
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
} from './server/modules/integrations/clients';

import { IntegrationProvider } from './server/modules/integrations/schema/integrations.schema';

/**
 * Test that all integration clients can be instantiated
 */
async function testAllIntegrationClients() {
  console.log('🧪 Testing All Integration Clients');
  console.log('===============================\n');
  
  // Test all provider types to ensure the factory can instantiate them
  const companyId = uuidv4();
  const franchiseId = uuidv4();
  
  // Create an array of all integration providers to test
  const integrationProviders = [
    // Romanian e-Factura
    IntegrationProvider.ANAF_EFACTURA,
    
    // Payments
    IntegrationProvider.STRIPE,
    IntegrationProvider.REVOLUT_BUSINESS,
    
    // Document Signing
    IntegrationProvider.PANDADOC,
    
    // Email/Messaging
    IntegrationProvider.MICROSOFT_GRAPH,
    
    // eCommerce
    IntegrationProvider.SHOPIFY_ADMIN,
    IntegrationProvider.SHOPIFY_STOREFRONT,
    IntegrationProvider.SHOPIFY_INBOX,
    
    // Shipping
    IntegrationProvider.SAMEDAY,
    
    // Company Registry & Validation
    IntegrationProvider.TERMENE_RO,
    
    // AI Integrations
    IntegrationProvider.OPENAI,
    IntegrationProvider.ELEVENLABS
  ];
  
  let successCount = 0;
  let failureCount = 0;
  
  // Test each provider
  for (const provider of integrationProviders) {
    try {
      console.log(`Testing integration client for ${provider}...`);
      
      // Create client instance
      const client = getIntegrationClient(provider, companyId, franchiseId);
      
      // Verify that it's an instance of BaseIntegrationClient
      if (client instanceof BaseIntegrationClient) {
        console.log(`✅ Successfully created client for ${provider}`);
        
        // Verify that the client has the required methods
        const requiredMethods = ['testConnection', 'initialize'];
        const missingMethods = requiredMethods.filter(method => !(method in client));
        
        if (missingMethods.length > 0) {
          console.error(`❌ Client for ${provider} is missing required methods: ${missingMethods.join(', ')}`);
          failureCount++;
        } else {
          console.log(`✅ Client for ${provider} has all required methods`);
          successCount++;
        }
      } else {
        console.error(`❌ Client for ${provider} is not an instance of BaseIntegrationClient`);
        failureCount++;
      }
    } catch (error) {
      console.error(`❌ Failed to create client for ${provider}: ${error instanceof Error ? error.message : String(error)}`);
      failureCount++;
    }
    
    console.log(); // Add blank line between providers
  }
  
  // Test specific client types
  console.log('\nTesting specific client types...\n');
  
  try {
    // Test PandaDoc client
    const pandaDocClient = new PandaDocClient(companyId, franchiseId);
    console.log('✅ Successfully created PandaDocClient directly');
    successCount++;
  } catch (error) {
    console.error(`❌ Failed to create PandaDocClient directly: ${error instanceof Error ? error.message : String(error)}`);
    failureCount++;
  }
  
  try {
    // Test Shopify client with different integration types
    const shopifyAdminClient = new ShopifyClient(ShopifyIntegrationType.ADMIN, companyId, franchiseId);
    console.log('✅ Successfully created ShopifyClient with ADMIN type directly');
    
    const shopifyStorefrontClient = new ShopifyClient(ShopifyIntegrationType.STOREFRONT, companyId, franchiseId);
    console.log('✅ Successfully created ShopifyClient with STOREFRONT type directly');
    
    const shopifyInboxClient = new ShopifyClient(ShopifyIntegrationType.INBOX, companyId, franchiseId);
    console.log('✅ Successfully created ShopifyClient with INBOX type directly');
    
    successCount += 3;
  } catch (error) {
    console.error(`❌ Failed to create ShopifyClient directly: ${error instanceof Error ? error.message : String(error)}`);
    failureCount++;
  }
  
  try {
    // Test ElevenLabs client
    const elevenLabsClient = new ElevenLabsClient(companyId, franchiseId);
    console.log('✅ Successfully created ElevenLabsClient directly');
    successCount++;
  } catch (error) {
    console.error(`❌ Failed to create ElevenLabsClient directly: ${error instanceof Error ? error.message : String(error)}`);
    failureCount++;
  }
  
  // Print summary
  console.log('\n===============================');
  console.log(`✅ Successfully tested ${successCount} integration clients`);
  
  if (failureCount > 0) {
    console.log(`❌ Failed to test ${failureCount} integration clients`);
    process.exit(1);
  } else {
    console.log('🎉 All integration clients tested successfully!');
    process.exit(0);
  }
}

// Run the test
testAllIntegrationClients().catch(error => {
  console.error('❌ Unexpected error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});