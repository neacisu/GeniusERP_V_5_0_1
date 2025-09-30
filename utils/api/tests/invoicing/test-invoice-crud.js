/**
 * Invoice System Test
 * 
 * This script tests the Romanian invoice system's CRUD operations.
 */

const axios = require('axios');
const API_URL = 'http://localhost:3000/api/invoices';

// JWT token for authentication (replace with a valid token from your system)
let token = '';

// Test invoice data
const sampleInvoice = {
  invoice: {
    series: 'FACT',
    totalAmount: '1234.56',
    currency: 'RON',
  },
  details: {
    partnerName: 'Test SRL',
    partnerFiscalCode: 'RO12345678',
    partnerRegistrationNumber: 'J12/345/2020',
    partnerAddress: 'Strada Test, Nr. 123',
    partnerCity: 'Bucharest',
    partnerCounty: 'Sector 1',
    partnerCountry: 'Romania',
    paymentMethod: 'Bank Transfer',
    paymentDueDays: 30,
    notes: 'Test invoice for CRUD operations',
  },
  lines: [
    {
      description: 'Software development services',
      quantity: '1',
      unitPrice: '1000.00',
      vatRate: 19,
      totalAmount: '1000.00',
    },
    {
      description: 'Website hosting - 1 month',
      quantity: '1',
      unitPrice: '37.00',
      vatRate: 19,
      totalAmount: '37.00',
    },
    {
      description: 'Technical support - 2 hours',
      quantity: '2',
      unitPrice: '98.78',
      vatRate: 19,
      totalAmount: '197.56',
    },
  ],
};

// Store created invoice ID for later operations
let createdInvoiceId = '';

// Execute tests in sequence
async function runTests() {
  console.log('Starting invoice system tests...');
  console.log('--------------------------------------');
  
  // Get the token with proper permissions from server
  try {
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'admin', // Replace with your username
      password: 'admin', // Replace with your password
    });
    
    token = loginResponse.data.token;
    console.log('✅ Authentication successful, token obtained');
  } catch (error) {
    console.error('❌ Authentication failed:', error.response?.data || error.message);
    return;
  }
  
  // Create a draft invoice
  try {
    const headers = { Authorization: `Bearer ${token}` };
    const response = await axios.post(API_URL, sampleInvoice, { headers });
    
    createdInvoiceId = response.data.id;
    console.log(`✅ CREATED: Draft invoice created with ID: ${createdInvoiceId}`);
    console.log(`   Status: ${response.data.status}`);
    console.log(`   Series: ${response.data.series}`);
    console.log(`   Total: ${response.data.totalAmount} ${response.data.currency}`);
  } catch (error) {
    console.error('❌ Failed to create invoice:', error.response?.data || error.message);
    return;
  }
  
  // Get all invoices
  try {
    const headers = { Authorization: `Bearer ${token}` };
    const response = await axios.get(API_URL, { headers });
    
    console.log(`✅ READ: Retrieved ${response.data.length} invoices`);
  } catch (error) {
    console.error('❌ Failed to get invoices:', error.response?.data || error.message);
  }
  
  // Get created invoice by ID
  try {
    const headers = { Authorization: `Bearer ${token}` };
    const response = await axios.get(`${API_URL}/${createdInvoiceId}`, { headers });
    
    console.log(`✅ READ: Retrieved invoice by ID: ${response.data.id}`);
    console.log(`   Series: ${response.data.series}`);
  } catch (error) {
    console.error('❌ Failed to get invoice by ID:', error.response?.data || error.message);
  }
  
  // Update invoice (only possible for draft invoices)
  try {
    const headers = { Authorization: `Bearer ${token}` };
    const update = { currency: 'EUR', totalAmount: '1234.56' };
    const response = await axios.put(`${API_URL}/${createdInvoiceId}`, update, { headers });
    
    console.log(`✅ UPDATED: Invoice ${response.data.id}`);
    console.log(`   New currency: ${response.data.currency}`);
  } catch (error) {
    console.error('❌ Failed to update invoice:', error.response?.data || error.message);
  }
  
  // Change invoice status to issued (assigns a number)
  try {
    const headers = { Authorization: `Bearer ${token}` };
    const response = await axios.patch(
      `${API_URL}/${createdInvoiceId}/status`, 
      { status: 'issued' }, 
      { headers }
    );
    
    console.log(`✅ STATUS CHANGE: Invoice ${response.data.id}`);
    console.log(`   New status: ${response.data.status}`);
    console.log(`   Invoice number: ${response.data.number}`);
  } catch (error) {
    console.error('❌ Failed to change invoice status:', error.response?.data || error.message);
  }
  
  // Change invoice status to sent
  try {
    const headers = { Authorization: `Bearer ${token}` };
    const response = await axios.patch(
      `${API_URL}/${createdInvoiceId}/status`, 
      { status: 'sent' }, 
      { headers }
    );
    
    console.log(`✅ STATUS CHANGE: Invoice ${response.data.id}`);
    console.log(`   New status: ${response.data.status}`);
  } catch (error) {
    console.error('❌ Failed to change invoice status:', error.response?.data || error.message);
  }
  
  // Attempt to delete a sent invoice (should fail)
  try {
    const headers = { Authorization: `Bearer ${token}` };
    await axios.delete(`${API_URL}/${createdInvoiceId}`, { headers });
    
    console.log(`Deleted invoice ${createdInvoiceId} (unexpected success)`);
  } catch (error) {
    console.log(`✅ DELETE PREVENTION: Cannot delete sent invoice (expected)`);
    console.log(`   Error: ${error.response?.data?.message || error.message}`);
  }
  
  // Change invoice status to canceled
  try {
    const headers = { Authorization: `Bearer ${token}` };
    const response = await axios.patch(
      `${API_URL}/${createdInvoiceId}/status`, 
      { status: 'canceled' }, 
      { headers }
    );
    
    console.log(`✅ STATUS CHANGE: Invoice ${response.data.id}`);
    console.log(`   New status: ${response.data.status}`);
  } catch (error) {
    console.error('❌ Failed to change invoice status:', error.response?.data || error.message);
  }
  
  // Get the next invoice number for the series
  try {
    const headers = { Authorization: `Bearer ${token}` };
    const response = await axios.get(`${API_URL}/next-number/FACT`, { headers });
    
    console.log(`✅ SERIES: Next invoice number for series FACT: ${response.data.nextNumber}`);
  } catch (error) {
    console.error('❌ Failed to get next invoice number:', error.response?.data || error.message);
  }
  
  console.log('--------------------------------------');
  console.log('Invoice system tests completed');
}

runTests().catch(error => {
  console.error('An error occurred during testing:', error);
});