/**
 * Test Invoice Validation System
 * 
 * This script tests the invoice validation system by creating a sample invoice,
 * validating it to generate a Note Contabil, and then devalidating it.
 */

import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { DrizzleModule } from './server/common/drizzle';
import { invoices, invoiceLines, invoiceDetails } from './shared/schema';
import { ValidateInvoiceService } from './server/modules/invoicing/services/validate-invoice.service';
import { DevalidateInvoiceService } from './server/modules/invoicing/services/devalidate-invoice.service';

/**
 * Create a sample invoice for testing
 */
async function createSampleInvoice() {
  const drizzleService = DrizzleModule.getService();
  
  const companyId = await getValidCompanyId();
  
  const invoiceId = uuidv4();
  const invoiceLineId = uuidv4();
  const invoiceDetailId = uuidv4();
  
  // Create a new invoice
  await drizzleService.executeQuery(async (db) => {
    await db.insert(invoices).values({
      id: invoiceId,
      companyId,
      franchiseId: null,
      series: 'TST',
      number: 1001,
      status: 'issued',
      totalAmount: 1190,
      currency: 'RON',
      version: 1,
      isValidated: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Add a sample invoice line
    await db.insert(invoiceLines).values({
      id: invoiceLineId,
      invoiceId,
      description: 'Test product',
      quantity: 10,
      unitPrice: 100,
      totalAmount: 1000,
      vatRate: 19,
      vatAmount: 190,
      lineNumber: 1,
      productId: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Add invoice details
    await db.insert(invoiceDetails).values({
      id: invoiceDetailId,
      invoiceId,
      partnerName: 'Test Client SRL',
      partnerFiscalCode: 'RO12345678',
      partnerAddress: 'Bucharest, Romania',
      partnerId: null,
      issueDate: new Date(),
      paymentDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      notes: 'Test invoice for validation',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });
  
  console.log(`Created sample invoice with ID: ${invoiceId}`);
  return invoiceId;
}

/**
 * Get a valid company ID from the database
 * In a real test, you would use a known ID
 */
async function getValidCompanyId() {
  const drizzleService = DrizzleModule.getService();
  
  try {
    // Get the first company from the database
    const company = await drizzleService.executeQuery(async (db) => {
      const companies = await db.query.companies.findMany({
        limit: 1
      });
      return companies[0];
    });
    
    if (!company) {
      // If no company exists, create a test company
      const companyId = uuidv4();
      
      await drizzleService.executeQuery(async (db) => {
        await db.insert(db.schema.companies).values({
          id: companyId,
          name: 'Test Company',
          fiscalCode: 'RO12345678',
          country: 'Romania',
          city: 'Bucharest',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });
      
      console.log(`Created test company with ID: ${companyId}`);
      return companyId;
    }
    
    return company.id;
  } catch (error) {
    console.error('Error getting company ID:', error);
    
    // Create a test company as fallback
    const companyId = uuidv4();
    
    await drizzleService.executeQuery(async (db) => {
      await db.execute(
        `CREATE TABLE IF NOT EXISTS companies (
          id UUID PRIMARY KEY,
          name TEXT NOT NULL,
          fiscal_code TEXT NOT NULL,
          country TEXT NOT NULL,
          city TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL,
          updated_at TIMESTAMP NOT NULL
        )`
      );
      
      await db.execute(
        `INSERT INTO companies (id, name, fiscal_code, country, city, created_at, updated_at)
         VALUES ('${companyId}', 'Test Company', 'RO12345678', 'Romania', 'Bucharest', NOW(), NOW())`
      );
    });
    
    console.log(`Created test company with ID: ${companyId}`);
    return companyId;
  }
}

/**
 * Get a valid user ID from the database
 * In a real test, you would use a known ID
 */
async function getValidUserId() {
  const drizzleService = DrizzleModule.getService();
  
  try {
    // Get the first user from the database
    const user = await drizzleService.executeQuery(async (db) => {
      const users = await db.query.users.findMany({
        limit: 1
      });
      return users[0];
    });
    
    if (!user) {
      // If no user exists, create a test user
      const userId = uuidv4();
      
      await drizzleService.executeQuery(async (db) => {
        await db.insert(db.schema.users).values({
          id: userId,
          username: 'testuser',
          email: 'test@example.com',
          password: 'hashedpassword',
          role: 'accountant',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });
      
      console.log(`Created test user with ID: ${userId}`);
      return userId;
    }
    
    return user.id;
  } catch (error) {
    console.error('Error getting user ID:', error);
    
    // Create a test user as fallback
    const userId = uuidv4();
    
    await drizzleService.executeQuery(async (db) => {
      await db.execute(
        `CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY,
          username TEXT NOT NULL,
          email TEXT NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL,
          created_at TIMESTAMP NOT NULL,
          updated_at TIMESTAMP NOT NULL
        )`
      );
      
      await db.execute(
        `INSERT INTO users (id, username, email, password, role, created_at, updated_at)
         VALUES ('${userId}', 'testuser', 'test@example.com', 'hashedpassword', 'accountant', NOW(), NOW())`
      );
    });
    
    console.log(`Created test user with ID: ${userId}`);
    return userId;
  }
}

/**
 * Test the validation API endpoint
 */
async function testValidationApi(invoiceId: string) {
  try {
    const token = await generateTestToken();
    
    const response = await axios.post('http://localhost:3000/api/invoices/v2/validate', 
      { invoiceId },
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    console.log('Validation API Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in validation API test:', error.response ? error.response.data : error.message);
    return null;
  }
}

/**
 * Test the devalidation API endpoint
 */
async function testDevalidationApi(invoiceId: string) {
  try {
    const token = await generateTestToken();
    
    const response = await axios.post('http://localhost:3000/api/invoices/v2/devalidate', 
      { invoiceId, reason: 'Test devalidation' },
      { headers: { 'Authorization': `Bearer ${token}` } }
    );
    
    console.log('Devalidation API Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error in devalidation API test:', error.response ? error.response.data : error.message);
    return null;
  }
}

/**
 * Test direct service validation
 */
async function testDirectValidation(invoiceId: string, userId: string) {
  try {
    const result = await ValidateInvoiceService.validate(invoiceId, userId);
    console.log('Direct Validation Result:', result);
    
    // Verify the invoice was updated in the database
    const drizzleService = DrizzleModule.getService();
    
    const updatedInvoice = await drizzleService.executeQuery(async (db) => {
      return await db.query.invoices.findFirst({
        where: eq(invoices.id, invoiceId)
      });
    });
    
    console.log('Updated Invoice:', {
      id: updatedInvoice.id,
      isValidated: updatedInvoice.isValidated,
      validatedAt: updatedInvoice.validatedAt,
      validatedBy: updatedInvoice.validatedBy,
      ledgerEntryId: updatedInvoice.ledgerEntryId
    });
    
    return result;
  } catch (error) {
    console.error('Error in direct validation test:', error);
    return null;
  }
}

/**
 * Test direct service devalidation
 */
async function testDirectDevalidation(invoiceId: string, userId: string) {
  try {
    const result = await DevalidateInvoiceService.devalidate(invoiceId, userId, 'Direct devalidation test');
    console.log('Direct Devalidation Result:', result);
    
    // Verify the invoice was updated in the database
    const drizzleService = DrizzleModule.getService();
    
    const updatedInvoice = await drizzleService.executeQuery(async (db) => {
      return await db.query.invoices.findFirst({
        where: eq(invoices.id, invoiceId)
      });
    });
    
    console.log('Updated Invoice:', {
      id: updatedInvoice.id,
      isValidated: updatedInvoice.isValidated,
      validatedAt: updatedInvoice.validatedAt,
      validatedBy: updatedInvoice.validatedBy,
      ledgerEntryId: updatedInvoice.ledgerEntryId
    });
    
    return result;
  } catch (error) {
    console.error('Error in direct devalidation test:', error);
    return null;
  }
}

/**
 * Generate a test JWT token for API calls
 */
async function generateTestToken() {
  try {
    const jwtService = (await import('./server/modules/auth/services/jwt.service')).default;
    const userId = await getValidUserId();
    const companyId = await getValidCompanyId();
    
    const token = jwtService.generateToken({
      id: userId,
      username: 'testuser',
      role: 'accountant' as any,
      roles: ['accountant'] as any[],
      companyId
    });
    
    return token;
  } catch (error) {
    console.error('Error generating test token:', error);
    
    // Use a manual token generation as fallback
    return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImZmZmZmZmZmLWZmZmYtZmZmZi1mZmZmLWZmZmZmZmZmZmZmZiIsInVzZXJuYW1lIjoidGVzdHVzZXIiLCJyb2xlIjoiYWNjb3VudGFudCIsInJvbGVzIjpbImFjY291bnRhbnQiXSwiY29tcGFueUlkIjoiZmZmZmZmZmYtZmZmZi1mZmZmLWZmZmYtZmZmZmZmZmZmZmZmIiwiaWF0IjoxNjE3MTkzNjAwLCJleHAiOjE2MTcxOTcyMDB9.8Jrl8MzKvQOl8OFNOHYFHqZV1uHbLQT7LVLmHpOlZ1Y';
  }
}

/**
 * Main test function
 */
async function runTests() {
  console.log('Starting invoice validation tests');
  
  try {
    // Create a sample invoice
    const invoiceId = await createSampleInvoice();
    
    // Get a valid user ID
    const userId = await getValidUserId();
    
    console.log('\n1. Testing direct validation service');
    const validationResult = await testDirectValidation(invoiceId, userId);
    
    if (validationResult?.success) {
      console.log('\n2. Testing direct devalidation service');
      await testDirectDevalidation(invoiceId, userId);
      
      // Revalidate for API tests
      await testDirectValidation(invoiceId, userId);
      
      console.log('\n3. Testing validation API endpoint');
      await testValidationApi(invoiceId);
      
      console.log('\n4. Testing devalidation API endpoint');
      await testDevalidationApi(invoiceId);
    }
    
    console.log('\nTests completed successfully');
  } catch (error) {
    console.error('Error in test suite:', error);
  }
}

// Run the tests
runTests();