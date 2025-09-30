/**
 * Test script for Communications Schema
 * 
 * This script tests the Communications schema by creating and querying
 * threads, messages, and contacts, validating that the database schema
 * is properly set up and functioning.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import {
  CommunicationChannel,
  MessageDirection,
  MessageStatus,
  SentimentType
} from './shared/schema/communications.schema';

// Load environment variables
dotenv.config();

// Helper function to generate UUIDs
function generateUUID(): string {
  return uuidv4();
}

async function testCommunicationsSchema() {
  console.log('Testing Communications Schema...');

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const testCompanyId = generateUUID();
  const testUserId = generateUUID();
  const testCustomerId = generateUUID();
  
  try {
    // Create DB connection with SSL enabled
    const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
    
    console.log('Connection established. Testing schema operations using raw SQL...');
    
    // 1. Create a contact profile
    console.log('Creating test contact profile...');
    const contactId = generateUUID();
    await sql`
      INSERT INTO communications_contacts (
        id, company_id, customer_id, email, full_name, phone, preferred_channel, metadata
      ) VALUES (
        ${contactId}, ${testCompanyId}, ${testCustomerId}, 
        'test.customer@example.com', 'Test Customer', '+40721234567', 
        'email', '{"tags": ["vip", "new"]}'
      )
    `;
    
    // 2. Create a channel configuration
    console.log('Creating test channel configuration...');
    const channelConfigId = generateUUID();
    await sql`
      INSERT INTO communications_channel_configs (
        id, company_id, channel, is_active, config
      ) VALUES (
        ${channelConfigId}, ${testCompanyId}, 'email',
        true, '{"smtpServer": "smtp.example.com", "smtpPort": 587, "imapServer": "imap.example.com", "imapPort": 993, "username": "support@company.com"}'
      )
    `;
    
    // 3. Create a message thread
    console.log('Creating test message thread...');
    const threadId = generateUUID();
    await sql`
      INSERT INTO communications_threads (
        id, company_id, subject, channel, external_thread_id, 
        status, last_message_at, assigned_to, customer_id, contact_id, metadata
      ) VALUES (
        ${threadId}, ${testCompanyId}, 'Test Support Request', 
        'email', 'ext-thread-123',
        'new', ${new Date()}, ${testUserId}, 
        ${testCustomerId}, ${contactId}, 
        '{"priority": "high", "category": "support"}'
      )
    `;
    
    // 4. Create inbound message
    console.log('Creating test inbound message...');
    const inboundMessageId = generateUUID();
    await sql`
      INSERT INTO communications_messages (
        id, thread_id, company_id, channel, direction, status,
        from_email, from_name, to_email, to_name, subject,
        body, body_html, sentiment, sentiment_score, external_message_id, metadata
      ) VALUES (
        ${inboundMessageId}, ${threadId}, ${testCompanyId}, 
        'email', 'inbound', 'new',
        'test.customer@example.com', 'Test Customer', 
        'support@company.com', 'Company Support', 
        'Test Support Request',
        'Hello, I need help with my account. Can you assist?',
        '<p>Hello, I need help with my account. Can you assist?</p>',
        'neutral', 0.2, 'ext-msg-123',
        '{"ip": "192.168.1.1", "userAgent": "Mozilla/5.0"}'
      )
    `;
    
    // 5. Create outbound reply message
    console.log('Creating test outbound message...');
    const outboundMessageId = generateUUID();
    await sql`
      INSERT INTO communications_messages (
        id, thread_id, company_id, channel, direction, status,
        from_email, from_name, to_email, to_name, subject,
        body, body_html, sentiment, sentiment_score, external_message_id,
        created_by, updated_by
      ) VALUES (
        ${outboundMessageId}, ${threadId}, ${testCompanyId}, 
        'email', 'outbound', 'new',
        'support@company.com', 'Company Support', 
        'test.customer@example.com', 'Test Customer', 
        'Re: Test Support Request',
        'Hello, I would be happy to help with your account. What specific issue are you experiencing?',
        '<p>Hello, I would be happy to help with your account. What specific issue are you experiencing?</p>',
        'positive', 0.7, 'ext-msg-124',
        ${testUserId}, ${testUserId}
      )
    `;
    
    // 6. Retrieve thread information with message count
    console.log('Retrieving thread with message count...');
    const threadInfo = await sql`
      SELECT t.*, COUNT(m.id) as message_count
      FROM communications_threads t
      LEFT JOIN communications_messages m ON t.id = m.thread_id
      WHERE t.id = ${threadId}
      GROUP BY t.id
    `;
    
    if (!threadInfo || threadInfo.length === 0) {
      throw new Error('Failed to retrieve thread');
    }
    
    console.log(`Retrieved thread: ${threadInfo[0].subject}`);
    console.log(`Found ${threadInfo[0].message_count} messages in thread`);
    
    // 7. Update thread status
    console.log('Updating thread status...');
    await sql`
      UPDATE communications_threads
      SET status = 'responded', updated_at = NOW()
      WHERE id = ${threadId}
    `;
    
    // 8. Verify the update
    const updatedThread = await sql`
      SELECT * FROM communications_threads
      WHERE id = ${threadId}
    `;
    
    if (!updatedThread || updatedThread.length === 0) {
      throw new Error('Failed to retrieve updated thread');
    }
    
    console.log(`Updated thread status: ${updatedThread[0].status}`);
    
    // 9. Create a message access control entry
    console.log('Creating message access control...');
    const messageAccessId = generateUUID();
    await sql`
      INSERT INTO communications_message_access (
        id, message_id, user_id, company_id, can_view, can_reply, can_delete
      ) VALUES (
        ${messageAccessId}, ${inboundMessageId}, ${testUserId}, 
        ${testCompanyId}, true, true, false
      )
    `;
    
    // 10. Create a thread access control entry  
    console.log('Creating thread access control...');
    const threadAccessId = generateUUID();
    await sql`
      INSERT INTO communications_thread_access (
        id, thread_id, user_id, company_id, can_view, can_reply, can_assign, can_delete
      ) VALUES (
        ${threadAccessId}, ${threadId}, ${testUserId}, 
        ${testCompanyId}, true, true, true, false
      )
    `;
    
    // 11. Clean up test data
    console.log('Cleaning up test data...');
    await sql`DELETE FROM communications_message_access WHERE message_id = ${inboundMessageId}`;
    await sql`DELETE FROM communications_thread_access WHERE thread_id = ${threadId}`;
    await sql`DELETE FROM communications_messages WHERE thread_id = ${threadId}`;
    await sql`DELETE FROM communications_threads WHERE id = ${threadId}`;
    await sql`DELETE FROM communications_contacts WHERE id = ${contactId}`;
    await sql`DELETE FROM communications_channel_configs WHERE id = ${channelConfigId}`;
    
    console.log('All test data cleaned up.');
    
    // Success!
    console.log('✅ Communications schema test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    throw error;
  }
}

// Run test
testCommunicationsSchema()
  .then(() => {
    console.log('Test completed successfully.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  });