/**
 * Test script for validating the Accounting Schema
 * 
 * This script tests creating and retrieving accounting records using the 
 * Romanian double-entry bookkeeping model.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as sharedSchema from './shared/schema';
import * as accountingSchema from './server/modules/accounting/schema/accounting.schema';
import 'dotenv/config';
import { eq, sql } from 'drizzle-orm';
import { randomUUID } from 'crypto';

// Helper function for UUID generation
function uuidv4() {
  return randomUUID();
}

async function testAccountingSchema() {
  console.log('🧪 Testing Accounting Schema...');
  
  // Connect to the database
  const connectionString = process.env.DATABASE_URL as string;
  const pgClient = postgres(connectionString);
  // For raw SQL queries
  const client = postgres(connectionString, { prepare: false });
  const db = drizzle(pgClient, { schema: {
    ...sharedSchema,
    ...accountingSchema
  }});
  
  // Date handling for PostgreSQL
  const now = new Date();
  const nowISOString = now.toISOString();

  try {
    // Create test company if needed
    console.log('Creating test company if not exists...');
    const testCompany = {
      name: 'Test Accounting Company',
      fiscalCode: 'RO12345678',
      registrationNumber: 'J12/345/2023',
      address: 'Calea Victoriei 100',
      city: 'Bucharest',
      county: 'Sector 1',
      country: 'Romania',
      phone: '+40721234567',
      email: 'accounting@example.com',
      vatPayer: true,
      vatRate: 19
    };
    
    // Check if test company already exists
    const existingCompany = await db.query.companies.findFirst({
      where: (companies, { eq }) => eq(companies.fiscalCode, testCompany.fiscalCode)
    });
    
    let companyId;
    if (existingCompany) {
      console.log('Using existing test company:', existingCompany.name);
      companyId = existingCompany.id;
    } else {
      const insertedCompany = await db.insert(sharedSchema.companies).values(testCompany).returning();
      companyId = insertedCompany[0].id;
      console.log('Created new test company with ID:', companyId);
    }

    // Get the current year and month for fiscal period
    const today = new Date();
    const fiscalYear = today.getFullYear();
    const fiscalMonth = today.getMonth() + 1;

    // Check for existing journal type
    console.log('Checking for existing test journal type...');
    const existingJournalType = await db.query.journalTypes.findFirst({
      where: (journalTypes, { eq, and }) => 
        and(
          eq(journalTypes.companyId, companyId),
          eq(journalTypes.code, 'GENJ')
        )
    });
    
    let journalTypeId;
    if (existingJournalType) {
      console.log('Using existing journal type:', existingJournalType.name);
      journalTypeId = existingJournalType.id;
    } else {
      // Create a journal type
      console.log('Creating a new test journal type...');
      const journalType = {
        companyId,
        code: 'GENJ',
        name: 'General Journal',
        description: 'For general accounting entries',
        isSystemJournal: true,
        isActive: true,
        autoNumberPrefix: 'GJ',
        lastUsedNumber: 0
      };
      
      const insertedJournalType = await db.insert(accountingSchema.journalTypes).values(journalType).returning();
      journalTypeId = insertedJournalType[0].id;
      console.log('Created journal type:', insertedJournalType[0].name);
    }

    // Create a ledger entry (header)
    console.log('Creating a test ledger entry...');
    
    // Format dates as ISO strings to avoid database type issues
    const now = new Date();
    const nowISOString = now.toISOString();
    
    // For this example, we'll create a simple expense entry:
    // Debit: Expenses (Class 6) - 1000 RON
    // Credit: Cash/Bank (Class 5) - 1000 RON
    // Note: For Postgres client, we need to convert Date objects to ISO strings
    
    // Generate a unique document number with timestamp to avoid conflicts
    const timestamp = Date.now();
    const uniqueDocNumber = `EXP${timestamp}`;
    
    const ledgerEntry = {
      companyId,
      transactionDate: nowISOString,
      postingDate: nowISOString,
      documentDate: nowISOString, // This should be just the date part in production
      type: 'EXPENSE',
      documentNumber: uniqueDocNumber,
      documentType: 'EXPENSE',
      description: 'Office supplies expense',
      isPosted: false,
      isDraft: true,
      totalAmount: 1000,
      totalDebit: 1000,
      totalCredit: 1000,
      currency: 'RON',
      fiscalYear,
      fiscalMonth,
      // Add explicit null values for other date fields
      postedAt: null,
      updatedAt: null
    };
    
    // Use raw SQL query with ISO string dates
    const insertLedgerEntrySQL = `
      INSERT INTO accounting_ledger_entries (
        id, company_id, transaction_date, posting_date, document_date,
        type, document_number, document_type, description, is_posted,
        is_draft, total_amount, total_debit, total_credit, currency,
        fiscal_year, fiscal_month
      ) VALUES (
        '${uuidv4()}', '${companyId}', '${nowISOString}', '${nowISOString}', '${nowISOString}',
        'EXPENSE', '${uniqueDocNumber}', 'EXPENSE', 'Office supplies expense', false,
        true, 1000, 1000, 1000, 'RON',
        ${fiscalYear}, ${fiscalMonth}
      ) RETURNING *`;
    
    // Execute raw SQL with postgres client - need to use the raw SQL API
    const ledgerEntryResult = await client.unsafe(insertLedgerEntrySQL);
    const ledgerEntryId = ledgerEntryResult[0].id;
    console.log('Created ledger entry with ID:', ledgerEntryId);

    // Create ledger lines (the actual debit and credit entries)
    console.log('Creating ledger lines...');
    
    // Debit: Expenses (Class 6) - Office Supplies (602)
    const debitLine = {
      ledgerEntryId,
      companyId,
      lineNumber: 1,
      description: 'Office supplies expense',
      accountClass: 6,
      accountGroup: 60,
      accountNumber: '602',
      fullAccountNumber: '602',
      amount: 1000,
      debitAmount: 1000,
      creditAmount: 0,
      currency: 'RON'
    };
    
    // Credit: Cash/Bank (Class 5) - Petty Cash (5311)
    const creditLine = {
      ledgerEntryId,
      companyId,
      lineNumber: 2,
      description: 'Payment from petty cash',
      accountClass: 5,
      accountGroup: 53,
      accountNumber: '5311',
      fullAccountNumber: '5311',
      amount: 1000,
      debitAmount: 0,
      creditAmount: 1000,
      currency: 'RON'
    };
    
    // Insert both lines using raw SQL
    const debitLineSQL = `
      INSERT INTO accounting_ledger_lines (
        id, ledger_entry_id, company_id, line_number, description,
        account_class, account_group, account_number, full_account_number,
        amount, debit_amount, credit_amount, currency
      ) VALUES (
        '${uuidv4()}', '${ledgerEntryId}', '${companyId}', 1, 'Office supplies expense',
        6, 60, '602', '602',
        1000, 1000, 0, 'RON'
      ) RETURNING *`;
    
    const creditLineSQL = `
      INSERT INTO accounting_ledger_lines (
        id, ledger_entry_id, company_id, line_number, description,
        account_class, account_group, account_number, full_account_number,
        amount, debit_amount, credit_amount, currency
      ) VALUES (
        '${uuidv4()}', '${ledgerEntryId}', '${companyId}', 2, 'Payment from petty cash',
        5, 53, '5311', '5311',
        1000, 0, 1000, 'RON'
      ) RETURNING *`;
      
    await client.unsafe(debitLineSQL);
    await client.unsafe(creditLineSQL);
    console.log('Created 2 ledger lines (debit and credit)');

    // Verify entry was created correctly
    console.log('Verifying created entries...');
    
    const retrievedEntry = await db.query.ledgerEntries.findFirst({
      where: (entries, { eq }) => eq(entries.id, ledgerEntryId),
      with: {
        lines: true
      }
    });
    
    if (retrievedEntry) {
      console.log('Successfully retrieved ledger entry:');
      console.log('- Description:', retrievedEntry.description);
      console.log('- Total Amount:', retrievedEntry.totalAmount);
      console.log('- Number of lines:', retrievedEntry.lines.length);
      
      // Check if the entry is balanced (debits = credits)
      const totalDebits = retrievedEntry.lines.reduce((sum, line) => sum + Number(line.debitAmount), 0);
      const totalCredits = retrievedEntry.lines.reduce((sum, line) => sum + Number(line.creditAmount), 0);
      
      console.log('- Total Debits:', totalDebits);
      console.log('- Total Credits:', totalCredits);
      console.log('- Entry is balanced:', totalDebits === totalCredits ? '✅ YES' : '❌ NO');
    } else {
      console.error('Failed to retrieve ledger entry!');
    }

    // Now simulate posting the entry (changing from draft to posted)
    console.log('Posting the ledger entry...');
    
    // Use raw SQL update with ISO string formatted dates
    const updateTime = new Date();
    const updateTimeISOString = updateTime.toISOString();
    
    const updateEntrySQL = `
      UPDATE accounting_ledger_entries
      SET is_posted = true,
          is_draft = false,
          posted_at = '${updateTimeISOString}',
          updated_at = '${updateTimeISOString}'
      WHERE id = '${ledgerEntryId}'
      RETURNING *`;
    
    await client.unsafe(updateEntrySQL);
    
    // Verify posting status
    const postedEntry = await db.query.ledgerEntries.findFirst({
      where: (entries, { eq }) => eq(entries.id, ledgerEntryId)
    });
    
    if (postedEntry) {
      console.log('Entry posting status:', postedEntry.isPosted ? '✅ POSTED' : '❌ STILL DRAFT');
    }

    // Test retrieving accounting data for reporting (e.g., balance by account)
    console.log('Testing retrieval of accounting data...');
    
    // Get sum of debits and credits by account
    const accountBalances = await db
      .select({
        accountClass: accountingSchema.ledgerLines.accountClass,
        accountGroup: accountingSchema.ledgerLines.accountGroup, 
        accountNumber: accountingSchema.ledgerLines.accountNumber,
        accountFullNumber: accountingSchema.ledgerLines.fullAccountNumber,
        totalDebit: sql`sum(${accountingSchema.ledgerLines.debitAmount})`.as('total_debit'),
        totalCredit: sql`sum(${accountingSchema.ledgerLines.creditAmount})`.as('total_credit')
      })
      .from(accountingSchema.ledgerLines)
      .groupBy(
        accountingSchema.ledgerLines.accountClass,
        accountingSchema.ledgerLines.accountGroup,
        accountingSchema.ledgerLines.accountNumber,
        accountingSchema.ledgerLines.fullAccountNumber
      );
    
    console.log('Account balances report:');
    accountBalances.forEach(balance => {
      console.log(`Account ${balance.accountFullNumber} (Class ${balance.accountClass}):
        Debit: ${balance.totalDebit}, Credit: ${balance.totalCredit}, 
        Balance: ${Number(balance.totalDebit) - Number(balance.totalCredit)}`
      );
    });

    console.log('✅ Accounting schema test completed successfully!');
  } catch (error) {
    console.error('❌ Error testing accounting schema:', error);
  } finally {
    // Close database connections
    if (client && typeof client.end === 'function') await client.end();
    if (pgClient && typeof pgClient.end === 'function') await pgClient.end();
  }
}

// Run the test
testAccountingSchema()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  });