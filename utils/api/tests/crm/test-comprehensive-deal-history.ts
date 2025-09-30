/**
 * Comprehensive test for Deal Stage History
 * 
 * This script creates the necessary related records (company, pipeline, stages, deal)
 * and then creates and retrieves a deal stage history record to verify 
 * the field name fix for changedAt.
 */

import { DrizzleModule } from './server/common/drizzle/index.js';
import { 
  dealStageHistory, 
  deals, 
  pipelineStages, 
  pipelines
} from './server/modules/crm/schema/crm.schema.js';
import { companies, users } from './shared/schema.js';
import { eq, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

async function testDealStageHistoryComprehensive() {
  console.log("Starting comprehensive deal stage history test...");
  
  try {
    // Get DB connection
    const drizzleService = DrizzleModule.getService();
    await drizzleService.initialize();
    
    // Create test IDs
    const companyId = randomUUID();
    const userId = randomUUID();
    const pipelineId = randomUUID();
    const stageFromId = randomUUID();
    const stageToId = randomUUID();
    const dealId = randomUUID();
    const historyId = randomUUID();
    
    console.log("Creating test company...");
    // Insert test company
    const randomFiscalCode = `RO${Math.floor(Math.random() * 100000000)}`;
    console.log(`Using random fiscal code: ${randomFiscalCode}`);
    
    await drizzleService.executeQuery(async (db) => {
      return await db.insert(companies).values({
        id: companyId,
        name: "Test Company",
        fiscalCode: randomFiscalCode,
        registrationNumber: "J12/345/2023",
        address: "Test Address",
        city: "Bucharest",
        county: "Bucharest",
        country: "Romania",
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
    
    console.log("Creating test user...");
    // Insert test user with random username and email
    const randomUsername = `test_user_${Math.floor(Math.random() * 1000000)}`;
    const randomEmail = `test${Math.floor(Math.random() * 1000000)}@example.com`;
    console.log(`Using random username: ${randomUsername}`);
    console.log(`Using random email: ${randomEmail}`);
    
    await drizzleService.executeQuery(async (db) => {
      return await db.insert(users).values({
        id: userId,
        username: randomUsername,
        email: randomEmail,
        password: "dummy_hash",
        firstName: "Test",
        lastName: "User",
        role: "user",
        companyId: companyId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });
    
    console.log("Creating test pipeline...");
    // Insert test pipeline
    await drizzleService.executeQuery(async (db) => {
      return await db.insert(pipelines).values({
        id: pipelineId,
        companyId: companyId,
        name: "Test Pipeline",
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userId
      });
    });
    
    console.log("Creating test pipeline stages...");
    // Insert test stages
    await drizzleService.executeQuery(async (db) => {
      return await db.insert(pipelineStages).values([
        {
          id: stageFromId,
          companyId: companyId,
          pipelineId: pipelineId,
          name: "From Stage",
          position: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: stageToId,
          companyId: companyId,
          pipelineId: pipelineId,
          name: "To Stage",
          position: 1,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    });
    
    console.log("Creating test deal...");
    // Insert test deal
    await drizzleService.executeQuery(async (db) => {
      return await db.insert(deals).values({
        id: dealId,
        companyId: companyId,
        pipelineId: pipelineId,
        stageId: stageFromId,
        name: "Test Deal", // Added the required name field
        title: "Test Deal",
        amount: 1000,
        currency: "RON",
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "open",
        ownerId: userId
      });
    });
    
    console.log("Creating deal stage history record...");
    // Insert test deal stage history record
    await drizzleService.executeQuery(async (db) => {
      return await db.insert(dealStageHistory).values({
        id: historyId,
        dealId: dealId,
        companyId: companyId,
        fromStageId: stageFromId,
        toStageId: stageToId,
        changedAt: new Date(),
        changedBy: userId,
        timeInStage: 3,
        notes: "Testing stage history with changedAt field"
      });
    });
    
    console.log("Retrieving deal stage history record...");
    // Retrieve the test record
    const history = await drizzleService.executeQuery(async (db) => {
      return await db.select()
        .from(dealStageHistory)
        .where(eq(dealStageHistory.id, historyId))
        .limit(1);
    });
    
    console.log(`Retrieved ${history.length} stage history record(s)`);
    
    if (history.length > 0) {
      console.log("Stage history record retrieved successfully!");
      console.log("Key fields:");
      console.log({
        id: history[0].id,
        dealId: history[0].dealId,
        fromStageId: history[0].fromStageId,
        toStageId: history[0].toStageId,
        changedAt: history[0].changedAt,
        notes: history[0].notes,
        timeInStage: history[0].timeInStage
      });
      console.log("Field name fix for changedAt verified successfully!");
    } else {
      console.log("Failed to retrieve the stage history record.");
    }
  } catch (error) {
    console.error("Error:", error);
    
    if (error instanceof Error && error.message.includes("column")) {
      console.error("ERROR: This suggests there's a column name mismatch!");
    } else {
      console.error("There was a general error, but it doesn't appear to be a column name issue.");
    }
  } finally {
    // Clean up resources
    try {
      await DrizzleModule.cleanup();
      console.log("Database connection closed.");
    } catch (cleanupError) {
      console.error("Error closing database connection:", cleanupError);
    }
  }
}

testDealStageHistoryComprehensive().catch(console.error);