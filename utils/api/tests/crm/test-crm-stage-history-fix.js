/**
 * Test script for verifying the fix of transitionDate → changedAt rename in deal stage history
 */

import { DrizzleService } from './server/common/drizzle/drizzle.service.js';
import { randomUUID } from 'crypto';
import { and, eq, desc } from 'drizzle-orm';

async function testDealStageHistoryFix() {
  try {
    console.log("Testing deal stage history field name fix...");
    const dbService = new DrizzleService();
    
    // Import schema with proper names
    const { deals, pipelineStages, dealStageHistory } = await import('./server/modules/crm/schema/crm.schema.js');
    
    // Get a sample deal for testing
    const allDeals = await dbService.select().from(deals).limit(1);
    
    if (allDeals.length === 0) {
      console.log("No deals found for testing. Creating a test deal...");
      // Create a test entry - this is just for testing the field names
      const testCompanyId = randomUUID();
      const testPipelineId = randomUUID();
      const testStageId = randomUUID();
      const testDealId = randomUUID();
      const testUserId = randomUUID();
      
      // For a real test, you would create proper pipeline and stage first
      // This is just to test the field name change
      await dbService.insert(dealStageHistory).values({
        id: randomUUID(),
        dealId: testDealId,
        companyId: testCompanyId,
        fromStageId: testStageId,
        toStageId: testStageId,
        changedAt: new Date(),
        changedBy: testUserId,
        notes: "Testing stage history with fixed field names"
      });
      
      console.log("Created test stage history with proper field names");
    } else {
      const dealId = allDeals[0].id;
      console.log(`Found deal ID ${dealId} for testing`);
      
      // Create a stage history entry using the correct field names
      await dbService.insert(dealStageHistory).values({
        id: randomUUID(),
        dealId: dealId,
        companyId: allDeals[0].companyId,
        fromStageId: allDeals[0].stageId,
        toStageId: allDeals[0].stageId, 
        changedAt: new Date(),
        changedBy: allDeals[0].ownerId,
        notes: "Testing stage history with fixed field names"
      });
      
      // Retrieve the stage history to verify it worked
      const history = await dbService.select()
        .from(dealStageHistory)
        .where(eq(dealStageHistory.dealId, dealId))
        .orderBy(desc(dealStageHistory.changedAt));
      
      console.log(`Retrieved ${history.length} stage history records`);
      
      if (history.length > 0) {
        // Print the first entry to verify the structure
        console.log("Most recent stage history entry:");
        console.log({
          id: history[0].id,
          dealId: history[0].dealId,
          changedAt: history[0].changedAt,
          fromStageId: history[0].fromStageId,
          toStageId: history[0].toStageId,
          notes: history[0].notes
        });
        console.log("Field name fix verified: changedAt and changedBy are now correctly used");
      }
    }
    
  } catch (error) {
    console.error("Error testing deal stage history fix:", error);
  }
}

testDealStageHistoryFix();