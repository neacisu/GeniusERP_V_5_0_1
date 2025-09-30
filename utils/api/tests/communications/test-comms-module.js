/**
 * Test Communications Module Endpoints
 * 
 * This script tests all the endpoints of the communications module
 * using the JWT token we generated.
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Configure dotenv
dotenv.config();

// Configuration
const BASE_URL = 'http://localhost:5000';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIzYmMxOWJhYS1jOGY4LTQ1OTQtYmM5MC1kNGEzNmVkMGYxODQiLCJlbWFpbCI6ImNvbW1zX2FkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6ImFkbWluIiwiY29tcGFueUlkIjoiOTdjNDc5NmEtZmQ5Zi00ZmRmLTgyMmMtMmQ5NTRjNDc2NTBjIiwicm9sZXMiOlsiY29tbXNfYWRtaW4iXSwiaWF0IjoxNzQ0MDg4OTk5LCJleHAiOjE3NDQwOTI1OTl9.v2UhyBGWZ_jthuW-OUH0dIwSmixhoxnIzPRGKNcCkYY';
const COMPANY_ID = '97c4796a-fd9f-4fdf-822c-2d954c47650c';

// Create a configured axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Helper function to run a test
async function runTest(name, testFn) {
  console.log(`\n---- Testing ${name} ----`);
  try {
    await testFn();
    console.log(`✅ ${name} test passed`);
  } catch (error) {
    console.error(`❌ ${name} test failed:`, error.response?.data || error.message);
  }
}

// Test functions for each endpoint
async function testGetThreads() {
  const response = await api.get(`/api/communications/threads?companyId=${COMPANY_ID}`);
  console.log('Threads:', response.data);
  return response.data;
}

async function testGetThread() {
  const threads = await testGetThreads();
  if (threads && threads.length > 0) {
    const threadId = threads[0].id;
    const response = await api.get(`/api/communications/threads/${threadId}?companyId=${COMPANY_ID}`);
    console.log('Thread details:', response.data);
  } else {
    console.log('No threads found to test individual thread endpoint');
  }
}

async function testGetMessages() {
  const response = await api.get(`/api/communications/messages?companyId=${COMPANY_ID}`);
  console.log('Messages:', response.data);
  return response.data;
}

async function testGetMessage() {
  const messages = await testGetMessages();
  if (messages && messages.length > 0) {
    const messageId = messages[0].id;
    const response = await api.get(`/api/communications/messages/${messageId}?companyId=${COMPANY_ID}`);
    console.log('Message details:', response.data);
  } else {
    console.log('No messages found to test individual message endpoint');
  }
}

async function testGetContacts() {
  const response = await api.get(`/api/communications/contacts?companyId=${COMPANY_ID}`);
  console.log('Contacts:', response.data);
  return response.data;
}

async function testGetContact() {
  const contacts = await testGetContacts();
  if (contacts && contacts.length > 0) {
    const contactId = contacts[0].id;
    const response = await api.get(`/api/communications/contacts/${contactId}?companyId=${COMPANY_ID}`);
    console.log('Contact details:', response.data);
  } else {
    console.log('No contacts found to test individual contact endpoint');
  }
}

async function testGetChannelConfigs() {
  const response = await api.get(`/api/communications/channels?companyId=${COMPANY_ID}`);
  console.log('Channel configs:', response.data);
  return response.data;
}

async function testGetChannelConfig() {
  const configs = await testGetChannelConfigs();
  if (configs && configs.length > 0) {
    const configId = configs[0].id;
    const response = await api.get(`/api/communications/channels/${configId}?companyId=${COMPANY_ID}`);
    console.log('Channel config details:', response.data);
  } else {
    console.log('No channel configs found to test individual config endpoint');
  }
}

async function testGetThreadAccess() {
  const response = await api.get(`/api/communications/thread-access?companyId=${COMPANY_ID}`);
  console.log('Thread access entries:', response.data);
  return response.data;
}

async function testGetThreadAccessById() {
  const accessEntries = await testGetThreadAccess();
  if (accessEntries && accessEntries.length > 0) {
    const accessId = accessEntries[0].id;
    const response = await api.get(`/api/communications/thread-access/${accessId}?companyId=${COMPANY_ID}`);
    console.log('Thread access details:', response.data);
  } else {
    console.log('No thread access entries found to test individual access endpoint');
  }
}

async function testGetMessageAccess() {
  const response = await api.get(`/api/communications/message-access?companyId=${COMPANY_ID}`);
  console.log('Message access entries:', response.data);
  return response.data;
}

async function testGetMessageAccessById() {
  const accessEntries = await testGetMessageAccess();
  if (accessEntries && accessEntries.length > 0) {
    const accessId = accessEntries[0].id;
    const response = await api.get(`/api/communications/message-access/${accessId}?companyId=${COMPANY_ID}`);
    console.log('Message access details:', response.data);
  } else {
    console.log('No message access entries found to test individual access endpoint');
  }
}

// Run all tests
async function runAllTests() {
  console.log('Starting Communications Module Tests');
  console.log('===================================');

  // Test thread endpoints
  await runTest('Get all threads', testGetThreads);
  await runTest('Get thread by ID', testGetThread);
  
  // Test message endpoints
  await runTest('Get all messages', testGetMessages);
  await runTest('Get message by ID', testGetMessage);
  
  // Test contact endpoints
  await runTest('Get all contacts', testGetContacts);
  await runTest('Get contact by ID', testGetContact);
  
  // Test channel config endpoints
  await runTest('Get all channel configs', testGetChannelConfigs);
  await runTest('Get channel config by ID', testGetChannelConfig);
  
  // Test thread access endpoints
  await runTest('Get all thread access entries', testGetThreadAccess);
  await runTest('Get thread access by ID', testGetThreadAccessById);
  
  // Test message access endpoints
  await runTest('Get all message access entries', testGetMessageAccess);
  await runTest('Get message access by ID', testGetMessageAccessById);
  
  console.log('\nAll tests completed');
}

// Run all tests
runAllTests();