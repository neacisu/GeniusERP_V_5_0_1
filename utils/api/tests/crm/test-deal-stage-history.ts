/**
 * Test for the fixed field names in DealService and DealStageHistory
 * 
 * This script runs a simple test to verify the column name fixes from 
 * "transitionDate" to "changedAt" in the deal stage history functionality.
 */

import { DrizzleModule } from './server/common/drizzle/index.js';
import { dealStageHistory, deals } from './server/modules/crm/schema/crm.schema.js';
import { eq, desc } from 'drizzle-orm';

async function testDealStageHistory() {
  console.log("Testing field name fix in deal stage history...");
  
  try {
    // Get DB connection
    const drizzleService = DrizzleModule.getService();
    await drizzleService.initialize();
    
    // Use the db property to access the Drizzle ORM instance
    const history = await drizzleService.executeQuery(async (db) => {
      return await db.select()
        .from(dealStageHistory)
        .orderBy(desc(dealStageHistory.changedAt))
        .limit(5);
    });
      
    console.log(`Retrieved ${history.length} stage history records with changedAt field`);
    
    if (history.length > 0) {
      console.log(`Sample record (first 3 fields):`);
      console.log({
        id: history[0].id,
        dealId: history[0].dealId,
        changedAt: history[0].changedAt,
      });
      console.log("Field name fix verified successfully!");
    } else {
      console.log("No history records found. Field names correct but database is empty.");
    }
  } catch (error) {
    console.error("Error:", error);
    
    // If we get a specific column error, that would indicate the fix didn't work
    if (error instanceof Error && error.message.includes("column")) {
      console.error("ERROR: This suggests there's still a column name mismatch!");
    } else {
      console.error("There was a general error, but it doesn't appear to be a column name issue.");
    }
  }
}

testDealStageHistory().catch(console.error);