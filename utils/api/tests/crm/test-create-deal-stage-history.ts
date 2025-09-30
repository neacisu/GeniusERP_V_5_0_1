/**
 * Test for creating and retrieving deal stage history
 * 
 * This script creates a deal stage history record and verifies it can be retrieved
 * using the correct field name (changedAt).
 */

import { DrizzleModule } from './server/common/drizzle/index.js';
import { dealStageHistory, deals, pipelineStages, pipelines } from './server/modules/crm/schema/crm.schema.js';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

async function testCreateAndRetrieveDealStageHistory() {
  console.log("Testing deal stage history creation and retrieval...");
  
  try {
    // Get DB connection
    const drizzleService = DrizzleModule.getService();
    await drizzleService.initialize();
    
    // Create test data
    const companyId = randomUUID();
    const userId = randomUUID();
    const stageFromId = randomUUID();
    const stageToId = randomUUID();
    const dealId = randomUUID();
    const historyId = randomUUID();
    
    // Insert test deal stage history record
    await drizzleService.executeQuery(async (db) => {
      return await db.insert(dealStageHistory).values({
        id: historyId,
        dealId: dealId,
        fromStageId: stageFromId,
        toStageId: stageToId,
        changedAt: new Date(),
        changedBy: userId,
        companyId: companyId,
        notes: 'Testing stage history with changedAt field',
        timeInStage: 3
      });
    });
    
    console.log("Inserted test deal stage history record.");
    
    // Retrieve the test record
    const history = await drizzleService.executeQuery(async (db) => {
      return await db.select()
        .from(dealStageHistory)
        .where(eq(dealStageHistory.id, historyId))
        .limit(1);
    });
    
    console.log(`Retrieved ${history.length} stage history record(s) with changedAt field`);
    
    if (history.length > 0) {
      console.log(`Sample record (key fields):`);
      console.log({
        id: history[0].id,
        dealId: history[0].dealId,
        changedAt: history[0].changedAt,
        notes: history[0].notes
      });
      console.log("Field name and data creation/retrieval verified successfully!");
    } else {
      console.log("Failed to retrieve the newly created record.");
    }
  } catch (error) {
    console.error("Error:", error);
    
    // If we get a specific column error, that would indicate the fix didn't work
    if (error instanceof Error && error.message.includes("column")) {
      console.error("ERROR: This suggests there's still a column name mismatch!");
    } else {
      console.error("There was a general error, but it doesn't appear to be a column name issue.");
    }
  } finally {
    // Close the database connection
    try {
      await DrizzleModule.cleanup();
      console.log("Database connection closed.");
    } catch (cleanupError) {
      console.error("Error closing database connection:", cleanupError);
    }
  }
}

testCreateAndRetrieveDealStageHistory().catch(console.error);