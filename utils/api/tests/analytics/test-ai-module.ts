/**
 * Test AI Module
 * 
 * This script tests the AI module and its components including:
 * - Sales AI services
 * - Inbox AI assistant
 * - Product QA functionality
 */

import express from 'express';
import { DrizzleService } from './server/common/drizzle/drizzle.service';
import { initializeAiModule } from './server/modules/ai/init';
import { SalesAiService } from './server/modules/ai/services/sales-ai.service';
import { InboxAiAssistantService } from './server/modules/ai/services/inbox-ai-assistant.service';
import { ProductQaService } from './server/modules/ai/services/product-qa.service';

/**
 * Test the SalesAI functionality
 * @param salesAiService The SalesAI service instance
 */
async function testSalesAi(salesAiService: SalesAiService) {
  console.log('\n=== Testing SalesAI Service ===');
  
  try {
    // Test lead scoring
    console.log('Testing lead scoring...');
    const leadScoringResult = await salesAiService.scoreLead('lead-123', 'user-456');
    console.log(`Lead score: ${leadScoringResult.score}`);
    console.log(`Top factor: ${leadScoringResult.factors[0].factor} (impact: ${leadScoringResult.factors[0].impact})`);
    console.log(`Recommendation: ${leadScoringResult.recommendation}`);
    
    // Test deal recommendations
    console.log('\nTesting deal recommendations...');
    const dealRecommendations = await salesAiService.generateDealRecommendations('deal-789', 'customer-012', 'user-456');
    console.log(`Number of recommendations: ${dealRecommendations.length}`);
    console.log(`Top recommendation: ${dealRecommendations[0].recommendation}`);
    console.log(`Reasoning: ${dealRecommendations[0].reasoning}`);
    
    // Test deal outcome prediction
    console.log('\nTesting deal outcome prediction...');
    const prediction = await salesAiService.predictDealOutcome('deal-789', 'user-456');
    console.log(`Probability: ${prediction.probability}%`);
    console.log(`Predicted value: ${prediction.predictedValue}`);
    console.log(`Positive factors: ${prediction.factorsIncreasing.join(', ')}`);
    
    console.log('\nSalesAI tests completed successfully');
  } catch (error) {
    console.error('Error testing SalesAI service:', error);
  }
}

/**
 * Test the Inbox AI Assistant functionality
 * @param inboxAiService The Inbox AI Assistant service instance
 */
async function testInboxAi(inboxAiService: InboxAiAssistantService) {
  console.log('\n=== Testing Inbox AI Assistant Service ===');
  
  try {
    // Mock email content
    const messageId = 'msg-123';
    const messageContent = `
      Hello,
      
      I'm interested in renewing our contract for your services. Could you please send me an 
      updated pricing proposal by Friday? I'd also like to schedule a call next week to discuss
      the details further.
      
      Best regards,
      Maria Popescu
      Acme Corporation
    `;
    
    // Test email analysis
    console.log('Testing email analysis...');
    const analysis = await inboxAiService.analyzeEmail(messageId, messageContent, 'user-456');
    console.log(`Sentiment: ${analysis.sentiment} (score: ${analysis.sentimentScore})`);
    console.log(`Key topics: ${analysis.keyTopics.join(', ')}`);
    console.log(`Action items detected: ${analysis.actionItemsDetected ? 'Yes' : 'No'}`);
    if (analysis.actionItems) {
      console.log(`Action items: ${analysis.actionItems.join(', ')}`);
    }
    
    // Test response suggestions
    console.log('\nTesting response suggestions...');
    const suggestions = await inboxAiService.generateResponseSuggestions(messageId, messageContent, analysis, 'user-456');
    console.log(`Number of suggestions: ${suggestions.length}`);
    console.log(`Top suggestion: ${suggestions[0].responseText.substring(0, 100)}...`);
    console.log(`Type: ${suggestions[0].responseType}, Confidence: ${suggestions[0].confidence}`);
    
    console.log('\nInbox AI Assistant tests completed successfully');
  } catch (error) {
    console.error('Error testing Inbox AI Assistant service:', error);
  }
}

/**
 * Test the Product QA functionality
 * @param productQaService The Product QA service instance
 */
async function testProductQa(productQaService: ProductQaService) {
  console.log('\n=== Testing Product QA Service ===');
  
  try {
    // Test product question answering
    console.log('Testing product question answering...');
    const question = 'How does multi-currency support work in GeniusERP for Romanian accounting?';
    const answer = await productQaService.answerProductQuestion(question, 'product-123', 'user-456');
    console.log(`Question: ${question}`);
    console.log(`Answer: ${answer.answer.substring(0, 150)}...`);
    console.log(`Confidence: ${answer.confidence}`);
    console.log(`Sources: ${answer.sources.length}`);
    
    // Test product comparison
    console.log('\nTesting product comparison...');
    const productIds = ['product-101', 'product-102', 'product-103'];
    const comparison = await productQaService.compareProducts(productIds, 'user-456');
    console.log(`Products compared: ${comparison.productNames.join(', ')}`);
    console.log(`Comparison points: ${comparison.comparisonPoints.length}`);
    console.log(`First feature compared: ${comparison.comparisonPoints[0].feature}`);
    
    // Test documentation search
    console.log('\nTesting documentation search...');
    const searchResults = await productQaService.searchProductDocumentation('exchange rates', {}, 'user-456');
    console.log(`Total results: ${searchResults.totalResults}`);
    console.log(`Top result: ${searchResults.results[0].documentTitle}`);
    console.log(`Relevance: ${searchResults.results[0].relevance}`);
    
    console.log('\nProduct QA tests completed successfully');
  } catch (error) {
    console.error('Error testing Product QA service:', error);
  }
}

/**
 * Main test function
 */
async function testAiModule() {
  console.log('=== AI Module Test ===');
  console.log('Initializing services...');
  
  // Create express app for testing
  const app = express();
  
  // Initialize DrizzleService
  const drizzleService = new DrizzleService();
  
  try {
    // Initialize the AI module
    console.log('Initializing AI module...');
    const aiServices = initializeAiModule(app);
    
    // Test each service
    if (aiServices) {
      console.log('AI services initialized successfully');
      
      // Get typed service instances
      const salesAiService = new SalesAiService(drizzleService, { logAudit: async () => ({}) } as any);
      const inboxAiService = new InboxAiAssistantService(drizzleService, { logAudit: async () => ({}) } as any);
      const productQaService = new ProductQaService(drizzleService, { logAudit: async () => ({}) } as any);
      
      // Run tests
      await testSalesAi(salesAiService);
      await testInboxAi(inboxAiService);
      await testProductQa(productQaService);
    } else {
      console.error('Failed to initialize AI services');
    }
  } catch (error) {
    console.error('Error testing AI module:', error);
  }
  
  console.log('\n=== AI Module Test Completed ===');
}

// Run the tests
testAiModule().catch(console.error);