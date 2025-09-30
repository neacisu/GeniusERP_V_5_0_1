/**
 * Test script for Romanian Accounting Note (Notă Contabilă) Service
 * 
 * This test demonstrates the creation and management of Romanian accounting notes
 * with proper audit logging. The notes follow the Romanian double-entry bookkeeping
 * rules where debits must equal credits.
 */

import { NoteContabilService } from './server/modules/accounting/services/note-contabil.service';
import { DrizzleService } from './server/common/drizzle/drizzle.service';
import { AuditService } from './server/modules/audit/services/audit.service';

async function testNoteContabilService() {
  try {
    console.log('Testing Romanian Accounting Note (Notă Contabilă) Service...');
    
    // Create service instances
    const drizzleService = new DrizzleService();
    const auditService = AuditService; // Using static AuditService
    const noteContabilService = new NoteContabilService(drizzleService, auditService);
    
    // Generate test data
    const companyId = '550e8400-e29b-41d4-a716-446655440000';
    const userId = '7c0e9d7a-8d21-4d78-a4f1-098765432100';
    
    // Test 1: Create a valid accounting note
    console.log('\n1. Creating a valid accounting note (debits = credits)...');
    const validNote = {
      date: new Date(),
      description: 'Invoice payment from client',
      entries: [
        {
          accountCode: '5121', // Bank account in RON
          debit: 1190,
          credit: 0,
          description: 'Invoice payment'
        },
        {
          accountCode: '4111', // Client
          debit: 0,
          credit: 1000,
          description: 'Invoice payment'
        },
        {
          accountCode: '4427', // VAT Collected
          debit: 0,
          credit: 190,
          description: 'VAT for invoice payment'
        }
      ],
      companyId,
      userId,
      currencyCode: 'RON'
    };
    
    const createdNote = await noteContabilService.createNote(validNote);
    console.log('✅ Successfully created accounting note:');
    console.log(`   Number: ${createdNote.number}`);
    console.log(`   Description: ${createdNote.description}`);
    console.log(`   Total amount: ${validNote.entries[0].debit} RON`);
    console.log(`   Entries: ${createdNote.entries.length}`);
    
    // Test 2: Try to create an invalid accounting note (debits ≠ credits)
    console.log('\n2. Trying to create an invalid accounting note (debits ≠ credits)...');
    const invalidNote = {
      date: new Date(),
      description: 'Invalid invoice payment',
      entries: [
        {
          accountCode: '5121', // Bank account in RON
          debit: 1000,
          credit: 0,
          description: 'Invoice payment'
        },
        {
          accountCode: '4111', // Client
          debit: 0,
          credit: 900, // Not matching debit
          description: 'Invoice payment'
        }
      ],
      companyId,
      userId
    };
    
    try {
      await noteContabilService.createNote(invalidNote);
      console.log('❌ Error: Invalid note was accepted!');
    } catch (error) {
      console.log('✅ Correctly rejected invalid note with message:');
      console.log(`   ${(error as Error).message.split('\n')[0]}`);
    }
    
    // Test 3: Validate an accounting note
    console.log('\n3. Validating an accounting note...');
    const noteId = createdNote.id;
    const validatedNote = await noteContabilService.validateAndMarkNote(noteId, companyId, userId);
    console.log('✅ Successfully validated accounting note:');
    console.log(`   Number: ${validatedNote.number}`);
    console.log(`   Validated: ${validatedNote.validated ? 'Yes' : 'No'}`);
    console.log(`   Validated By: ${validatedNote.validatedBy}`);
    
    // Test 4: Get an accounting note by ID
    console.log('\n4. Getting an accounting note by ID...');
    const retrievedNote = await noteContabilService.getNoteById(noteId, companyId, userId);
    console.log('✅ Successfully retrieved accounting note:');
    console.log(`   Number: ${retrievedNote.number}`);
    console.log(`   Description: ${retrievedNote.description}`);
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the tests
testNoteContabilService();