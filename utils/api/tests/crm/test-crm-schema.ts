/**
 * CRM Schema Test
 * 
 * This script tests the CRM module schema by creating sample
 * customers, contacts, pipelines, stages and deals to verify
 * the database structure works correctly.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import path from 'path';
import * as schema from './shared/schema';
import { sql } from 'drizzle-orm';
import {
  customers,
  contacts,
  pipelines,
  pipelineStages,
  deals,
  dealStageHistory,
  activities,
  tags,
  customerTags,
  revenueForecasts,
  salesQuotas
} from './server/modules/crm/schema/crm.schema';
import { randomUUID } from 'crypto';

dotenv.config();

async function testCrmSchema() {
  // Initialize database connection
  if (!process.env.DATABASE_URL) {
    console.error('No DATABASE_URL environment variable found');
    process.exit(1);
  }

  const queryClient = postgres(process.env.DATABASE_URL, { ssl: 'require', max: 1 });
  const db = drizzle(queryClient, { schema });

  try {
    console.log('🔍 Testing CRM Schema with Kanban-based sales pipeline');
    
    // Get or create test company
    console.log('🏢 Getting/creating test company');
    let testCompanyId: string;
    
    const existingCompanies = await db.select({
      id: schema.companies.id,
      name: schema.companies.name
    })
    .from(schema.companies)
    .limit(1);
    
    if (existingCompanies.length > 0) {
      testCompanyId = existingCompanies[0].id;
      console.log(`✅ Using existing company: ${existingCompanies[0].name} (${testCompanyId})`);
    } else {
      const companyInsert = await db.insert(schema.companies).values({
        name: 'Test Company SRL',
        fiscalCode: 'RO12345678',
        registrationNumber: 'J40/1234/2025',
        address: 'Strada Exemplu 123',
        city: 'București',
        county: 'Sector 1',
        country: 'Romania',
        phone: '0712345678',
        email: 'contact@testcompany.ro',
        vatPayer: true,
        vatRate: 19
      }).returning();
      
      testCompanyId = companyInsert[0].id;
      console.log(`✅ Created test company: ${companyInsert[0].name} (${testCompanyId})`);
    }
    
    // Get or create test user
    console.log('👤 Getting/creating test user');
    let testUserId: string;
    
    const existingUsers = await db.select({
      id: schema.users.id,
      username: schema.users.username
    })
    .from(schema.users)
    .limit(1);
    
    if (existingUsers.length > 0) {
      testUserId = existingUsers[0].id;
      console.log(`✅ Using existing user: ${existingUsers[0].username} (${testUserId})`);
    } else {
      const userInsert = await db.insert(schema.users).values({
        username: 'testuser',
        password: '$2b$10$qPXvxw8te3cMj3HJtP4pKO1d/jE2AyQ0VHzYrOtiUUM80xUXTN3nq', // hashed 'password'
        email: 'testuser@testcompany.ro',
        firstName: 'Test',
        lastName: 'User',
        role: 'admin',
        companyId: testCompanyId
      }).returning();
      
      testUserId = userInsert[0].id;
      console.log(`✅ Created test user: ${userInsert[0].username} (${testUserId})`);
    }
    
    // 1. Create a test customer
    console.log('👥 Creating test customer');
    const customerInsert = await db.insert(customers).values({
      companyId: testCompanyId,
      name: 'Acme Corporation',
      email: 'contact@acme.ro',
      phone: '0723456789',
      address: 'Strada Principală 10',
      city: 'Cluj-Napoca',
      county: 'Cluj',
      type: 'lead',
      segment: 'Enterprise',
      industry: 'Manufacturing',
      source: 'Website',
      leadScore: 85,
      leadStatus: 'Qualified',
      leadQualificationDate: new Date(),
      ownerId: testUserId,
      fiscalCode: 'RO87654321',
      registrationNumber: 'J12/1234/2020',
      vatPayer: true,
      notes: 'High-potential lead for our new product line'
    }).returning();
    
    const customerId = customerInsert[0].id;
    console.log(`✅ Customer created: ${customerInsert[0].name} (${customerId})`);
    
    // 2. Create contacts associated with the customer
    console.log('📞 Creating contacts for the customer');
    const primaryContactInsert = await db.insert(contacts).values({
      customerId,
      companyId: testCompanyId,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@acme.ro',
      phone: '0721234567',
      title: 'CEO',
      department: 'Management',
      decisionMaker: true,
      influenceLevel: 10,
      preferredContactMethod: 'email',
      notes: 'Primary decision maker'
    }).returning();
    
    await db.insert(contacts).values({
      customerId,
      companyId: testCompanyId,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@acme.ro',
      phone: '0723456789',
      title: 'CTO',
      department: 'Technology',
      decisionMaker: true,
      influenceLevel: 8,
      preferredContactMethod: 'phone',
      notes: 'Technical decision maker'
    });
    
    console.log(`✅ Created 2 contacts for customer ${customerId}`);
    
    // 3. Create a sales pipeline
    console.log('🔄 Creating sales pipeline');
    const pipelineInsert = await db.insert(pipelines).values({
      companyId: testCompanyId,
      name: 'Enterprise Sales Process',
      description: 'Standard sales pipeline for enterprise customers',
      isDefault: true,
      displayOrder: 1,
      targetDealSize: '50000',
      targetConversionRate: '0.25',
      targetCycleTimeDays: 60,
      createdBy: testUserId
    }).returning();
    
    const pipelineId = pipelineInsert[0].id;
    console.log(`✅ Pipeline created: ${pipelineInsert[0].name} (${pipelineId})`);
    
    // 4. Create pipeline stages
    console.log('📋 Creating pipeline stages');
    const stageValues = [
      {
        pipelineId,
        companyId: testCompanyId,
        name: 'Lead',
        description: 'Initial contact with potential customer',
        probability: '0.10',
        expectedDuration: 7,
        displayOrder: 1,
        color: '#E3F2FD',
        stageType: 'qualification'
      },
      {
        pipelineId,
        companyId: testCompanyId,
        name: 'Qualified',
        description: 'Lead has been qualified with BANT criteria',
        probability: '0.30',
        expectedDuration: 14,
        displayOrder: 2,
        color: '#C8E6C9',
        stageType: 'qualification'
      },
      {
        pipelineId,
        companyId: testCompanyId,
        name: 'Proposal',
        description: 'Proposal has been sent to customer',
        probability: '0.50',
        expectedDuration: 21,
        displayOrder: 3,
        color: '#FFF9C4',
        stageType: 'proposal'
      },
      {
        pipelineId,
        companyId: testCompanyId,
        name: 'Negotiation',
        description: 'Negotiating final terms',
        probability: '0.80',
        expectedDuration: 14,
        displayOrder: 4,
        color: '#FFCCBC',
        stageType: 'negotiation'
      },
      {
        pipelineId,
        companyId: testCompanyId,
        name: 'Won',
        description: 'Deal successfully closed',
        probability: '1.00',
        expectedDuration: 1,
        displayOrder: 5,
        color: '#CCFF90',
        stageType: 'closed_won'
      },
      {
        pipelineId,
        companyId: testCompanyId,
        name: 'Lost',
        description: 'Deal was lost',
        probability: '0.00',
        expectedDuration: 1,
        displayOrder: 6,
        color: '#FFCDD2',
        stageType: 'closed_lost'
      }
    ];
    
    const stageInsert = await db.insert(pipelineStages).values(stageValues).returning({
      id: pipelineStages.id,
      name: pipelineStages.name
    });
    
    console.log(`✅ Created ${stageInsert.length} pipeline stages`);
    const firstStageId = stageInsert.find(stage => stage.name === 'Lead')?.id || stageInsert[0].id;
    
    // 5. Create a deal
    console.log('💼 Creating test deal');
    const dealInsert = await db.insert(deals).values({
      companyId: testCompanyId,
      customerId,
      pipelineId,
      stageId: firstStageId,
      // Include both name and title to satisfy database constraints
      name: 'Enterprise License Upgrade',
      title: 'Enterprise License Upgrade',
      description: 'Upgrade to enterprise tier with extended support',
      amount: '75000',
      currency: 'RON',
      probability: '0.30',
      expectedCloseDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 45 days from now as YYYY-MM-DD
      dealType: 'New Business',
      priority: 'high',
      source: 'Website',
      ownerId: testUserId,
      healthScore: 85,
      status: 'open',
      products: JSON.stringify([
        { name: 'Enterprise License', quantity: 1, unitPrice: 50000 },
        { name: 'Premium Support', quantity: 1, unitPrice: 25000 }
      ])
    }).returning();
    
    const dealId = dealInsert[0].id;
    console.log(`✅ Deal created: ${dealInsert[0].title} (${dealId})`);
    
    // 6. Create deal stage history
    console.log('📊 Creating deal stage history');
    const stageHistoryInsert = await db.insert(dealStageHistory).values({
      dealId,
      companyId: testCompanyId,
      toStageId: firstStageId,
      changedAt: new Date(),
      changedBy: testUserId,
      notes: 'Initial stage'
    }).returning();
    
    console.log(`✅ Created deal stage history record (${stageHistoryInsert[0].id})`);
    
    // 7. Create an activity
    console.log('📅 Creating activities for the deal');
    // Insert activities one by one to avoid type issues
    const activity1 = await db.insert(activities).values({
      companyId: testCompanyId,
      dealId,
      customerId,
      contactId: primaryContactInsert[0].id,
      type: 'meeting',
      subject: 'Initial discovery call',
      description: 'Discuss requirements and pain points',
      scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      duration: 60,
      status: 'pending',
      priority: 'high',
      assignedTo: testUserId,
      createdBy: testUserId,
      reminderDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000) // 1 day from now
    }).returning({ id: activities.id, type: activities.type, subject: activities.subject });
    
    const activity2 = await db.insert(activities).values({
      companyId: testCompanyId,
      dealId,
      customerId,
      type: 'task',
      subject: 'Prepare proposal',
      description: 'Draft initial proposal based on discovery call',
      scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      status: 'pending',
      priority: 'medium',
      assignedTo: testUserId,
      createdBy: testUserId
    }).returning({ id: activities.id, type: activities.type, subject: activities.subject });
    
    const activitiesInsert = [...activity1, ...activity2];
    
    console.log(`✅ Created ${activitiesInsert.length} activities`);
    
    // 8. Create tags
    console.log('🏷️ Creating tags');
    const tagsInsert = await db.insert(tags).values([
      {
        companyId: testCompanyId,
        name: 'High Value',
        color: '#FF5722',
        category: 'Deal Size'
      },
      {
        companyId: testCompanyId,
        name: 'Strategic',
        color: '#3F51B5',
        category: 'Importance'
      }
    ]).returning();
    
    console.log(`✅ Created ${tagsInsert.length} tags`);
    
    // 9. Associate tags with customer
    console.log('🔄 Creating customer-tag associations');
    await db.insert(customerTags).values([
      {
        customerId,
        tagId: tagsInsert[0].id,
        companyId: testCompanyId
      },
      {
        customerId,
        tagId: tagsInsert[1].id,
        companyId: testCompanyId
      }
    ]);
    
    console.log(`✅ Associated 2 tags with customer ${customerId}`);
    
    // 10. Create revenue forecast
    console.log('📈 Creating revenue forecast');
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    
    await db.insert(revenueForecasts).values({
      companyId: testCompanyId,
      year,
      month,
      pipeline: '250000',
      weighted: '102500',
      bestCase: '175000',
      commit: '75000',
      closed: '50000',
      forecastAccuracy: '0.85',
      currency: 'RON',
      calculatedBy: testUserId
    });
    
    console.log(`✅ Created revenue forecast for ${year}-${month}`);
    
    // 11. Create sales quota
    console.log('🎯 Creating sales quota');
    await db.insert(salesQuotas).values({
      companyId: testCompanyId,
      year,
      month,
      userId: testUserId,
      targetAmount: '100000',
      actualAmount: '75000',
      targetDeals: 5,
      actualDeals: 3,
      currency: 'RON',
      createdBy: testUserId
    });
    
    console.log(`✅ Created sales quota for ${year}-${month}`);
    
    console.log('\n✅✅✅ CRM schema verification completed successfully ✅✅✅');
    console.log('All tables and relationships are working properly.');
    
    // Do a count of all tables to verify data was inserted
    const countQueries = await Promise.all([
      db.select({ count: sql`count(*)` }).from(customers),
      db.select({ count: sql`count(*)` }).from(contacts),
      db.select({ count: sql`count(*)` }).from(pipelines),
      db.select({ count: sql`count(*)` }).from(pipelineStages),
      db.select({ count: sql`count(*)` }).from(deals),
      db.select({ count: sql`count(*)` }).from(dealStageHistory),
      db.select({ count: sql`count(*)` }).from(activities),
      db.select({ count: sql`count(*)` }).from(tags),
      db.select({ count: sql`count(*)` }).from(customerTags),
      db.select({ count: sql`count(*)` }).from(revenueForecasts),
      db.select({ count: sql`count(*)` }).from(salesQuotas)
    ]);
    
    console.log('\n📊 CRM Data Summary:');
    console.log(`Customers: ${countQueries[0][0].count}`);
    console.log(`Contacts: ${countQueries[1][0].count}`);
    console.log(`Pipelines: ${countQueries[2][0].count}`);
    console.log(`Pipeline Stages: ${countQueries[3][0].count}`);
    console.log(`Deals: ${countQueries[4][0].count}`);
    console.log(`Deal Stage History: ${countQueries[5][0].count}`);
    console.log(`Activities: ${countQueries[6][0].count}`);
    console.log(`Tags: ${countQueries[7][0].count}`);
    console.log(`Customer Tags: ${countQueries[8][0].count}`);
    console.log(`Revenue Forecasts: ${countQueries[9][0].count}`);
    console.log(`Sales Quotas: ${countQueries[10][0].count}`);
    
  } catch (error) {
    console.error('❌ Error testing CRM schema:', error);
  } finally {
    await queryClient.end();
  }
}

testCrmSchema().catch(console.error);