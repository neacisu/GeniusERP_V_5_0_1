/**
 * Populate Invoice Database Tables
 * 
 * This script creates sample invoice data including:
 * - invoices
 * - invoice_details
 * - invoice_lines
 */

import pg from 'postgres';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

// Get database connection from environment variable with SSL required
const sql = pg({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  username: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: { rejectUnauthorized: false }, // Allow self-signed certificates
});

// Company ID to use for test data (from real data)
const COMPANY_ID = '7196288d-7314-4512-8b67-2c82449b5465';

// Generate a random date between start and end
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Format a date as timestamp without timezone
function formatTimestamp(date) {
  return date.toISOString().replace('T', ' ').split('.')[0];
}

// Generate a random invoice item
function generateInvoiceItem(invoiceId, index) {
  const products = [
    { name: 'Servicii consultanță IT', price: 450, vat: 19 },
    { name: 'Dezvoltare software personalizat', price: 1200, vat: 19 },
    { name: 'Implementare sistem CRM', price: 3500, vat: 19 },
    { name: 'Servicii hosting', price: 250, vat: 19 },
    { name: 'Licență software ERP', price: 1800, vat: 19 },
    { name: 'Mentenanță anuală', price: 1200, vat: 19 },
    { name: 'Servicii securitate IT', price: 950, vat: 19 },
    { name: 'Suport tehnic (pachet ore)', price: 600, vat: 19 },
    { name: 'Servicii audit IT', price: 1500, vat: 19 },
    { name: 'Servicii de training', price: 800, vat: 19 },
  ];
  
  const product = products[Math.floor(Math.random() * products.length)];
  const quantity = Math.floor(Math.random() * 5) + 1;
  const unitPrice = product.price;
  const vatRate = product.vat;
  
  const totalAmount = quantity * unitPrice * (1 + vatRate/100);
  
  return {
    id: uuidv4(),
    invoice_id: invoiceId,
    product_id: null,
    description: product.name,
    quantity,
    unit_price: unitPrice,
    vat_rate: vatRate,
    total_amount: totalAmount,
  };
}

// Generate a random invoice with details
function generateInvoice(index, customer) {
  const id = uuidv4();
  const createdAt = randomDate(new Date(2024, 0, 1), new Date());
  const createdTimestamp = formatTimestamp(createdAt);
  
  // Invoice number is just an index for now
  const invoiceNumber = index + 1;
  
  // Use 'TEST' series for all invoices to match existing data
  const invoiceSeries = 'TEST';
  
  // Random status
  const statuses = ['draft', 'issued', 'sent', 'canceled'];
  const statusWeights = [0.6, 0.3, 0.07, 0.03]; // More weighted toward draft
  const randomValue = Math.random();
  let statusIndex = 0;
  let cumulativeWeight = statusWeights[0];
  
  while (randomValue > cumulativeWeight && statusIndex < statusWeights.length - 1) {
    statusIndex++;
    cumulativeWeight += statusWeights[statusIndex];
  }
  
  const status = statuses[statusIndex];
  
  // Payment methods based on actual data structure
  const paymentMethods = ['bank_transfer', 'cash', 'card', 'check', 'other'];
  const randomPaymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
  
  // Generate between 1-5 items per invoice
  const itemCount = Math.floor(Math.random() * 5) + 1;
  const items = [];
  
  for (let i = 0; i < itemCount; i++) {
    items.push(generateInvoiceItem(id, i));
  }
  
  // Calculate total amount
  const totalAmount = items.reduce((sum, item) => sum + item.total_amount, 0);
  
  // Generate payment due date (30 days by default)
  const paymentDueDate = new Date(createdAt);
  paymentDueDate.setDate(paymentDueDate.getDate() + 30);
  
  return {
    invoice: {
      id,
      company_id: COMPANY_ID,
      franchise_id: null,
      series: invoiceSeries,
      number: invoiceNumber,
      status,
      total_amount: totalAmount,
      currency: 'RON',
      version: 1,
      created_at: createdTimestamp,
      updated_at: createdTimestamp,
      deleted_at: null,
      is_validated: false,
      validated_at: null,
      validated_by: null,
      ledger_entry_id: null,
    },
    details: {
      id: uuidv4(),
      invoice_id: id,
      partner_id: customer.id,
      partner_name: customer.name,
      partner_fiscal_code: customer.vat_number || customer.cui || 'RO12345678',
      partner_registration_number: customer.registration_number || 'J12/123/2020',
      partner_address: customer.address || 'Str. Exemplu nr. 123',
      partner_city: customer.city || 'București',
      partner_county: null,
      partner_country: 'Romania',
      payment_method: randomPaymentMethod,
      payment_due_days: 30,
      payment_due_date: formatTimestamp(paymentDueDate),
      notes: Math.random() > 0.6 ? 'Factură emisă conform contract de prestări servicii' : null,
      created_at: createdTimestamp,
      updated_at: createdTimestamp,
    },
    items
  };
}

// Main function to seed the database
async function populateInvoiceTables() {
  console.log('Starting to populate invoice tables...');
  
  try {
    // First, get customer data to use for invoices
    const customers = await sql`
      SELECT id, name, company_id, is_customer, vat_number, registration_number, cui, address, city
      FROM crm_companies 
      WHERE company_id = ${COMPANY_ID} AND is_customer = true
      LIMIT 10
    `;
    
    if (customers.length === 0) {
      console.log('No customers found. Please create some customers first.');
      return;
    }
    
    console.log(`Found ${customers.length} customers for invoicing`);
    
    // Clear existing data
    console.log('Clearing existing invoice data...');
    await sql`DELETE FROM invoice_lines`;
    await sql`DELETE FROM invoice_details`;
    await sql`DELETE FROM invoices`;
    
    // Generate and insert invoices
    const totalInvoices = 20; // Generate 20 sample invoices
    let insertedInvoices = 0;
    
    for (let i = 0; i < totalInvoices; i++) {
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const { invoice, details, items } = generateInvoice(i, customer);
      
      // Insert invoice record
      await sql`
        INSERT INTO invoices (
          id, company_id, franchise_id, series, number, status, 
          total_amount, currency, version, created_at, updated_at, 
          deleted_at, is_validated, validated_at, validated_by, ledger_entry_id
        ) VALUES (
          ${invoice.id}, ${invoice.company_id}, ${invoice.franchise_id}, 
          ${invoice.series}, ${invoice.number}, ${invoice.status}::invoice_status, 
          ${invoice.total_amount}, ${invoice.currency}, ${invoice.version}, 
          ${invoice.created_at}, ${invoice.updated_at}, ${invoice.deleted_at}, 
          ${invoice.is_validated}, ${invoice.validated_at}, 
          ${invoice.validated_by}, ${invoice.ledger_entry_id}
        )
      `;
      
      // Insert invoice details
      await sql`
        INSERT INTO invoice_details (
          id, invoice_id, partner_id, partner_name, partner_fiscal_code, 
          partner_registration_number, partner_address, partner_city, 
          partner_county, partner_country, payment_method, payment_due_days, 
          payment_due_date, notes, created_at, updated_at
        ) VALUES (
          ${details.id}, ${details.invoice_id}, ${details.partner_id}, 
          ${details.partner_name}, ${details.partner_fiscal_code}, 
          ${details.partner_registration_number}, ${details.partner_address}, 
          ${details.partner_city}, ${details.partner_county}, ${details.partner_country}, 
          ${details.payment_method}, ${details.payment_due_days}, 
          ${details.payment_due_date}, ${details.notes}, 
          ${details.created_at}, ${details.updated_at}
        )
      `;
      
      // Insert invoice line items
      for (const item of items) {
        await sql`
          INSERT INTO invoice_lines (
            id, invoice_id, product_id, description, quantity, 
            unit_price, vat_rate, total_amount, created_at, updated_at
          ) VALUES (
            ${item.id}, ${item.invoice_id}, ${item.product_id}, ${item.description}, 
            ${item.quantity}, ${item.unit_price}, ${item.vat_rate}, 
            ${item.total_amount}, ${details.created_at}, ${details.updated_at}
          )
        `;
      }
      
      insertedInvoices++;
      console.log(`Inserted invoice ${insertedInvoices}/${totalInvoices}`);
    }
    
    console.log(`Successfully populated invoice tables with ${insertedInvoices} invoices`);
    
    // Count records in each table to verify
    const invoiceRecordCount = await sql`SELECT COUNT(*) FROM invoices`;
    const detailsCount = await sql`SELECT COUNT(*) FROM invoice_details`;
    const linesCount = await sql`SELECT COUNT(*) FROM invoice_lines`;
    
    console.log(`Database now has:
      - ${invoiceRecordCount[0].count} invoices
      - ${detailsCount[0].count} invoice details records
      - ${linesCount[0].count} invoice line items
    `);
    
  } catch (error) {
    console.error('Error populating invoice tables:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run the population script
populateInvoiceTables()
  .then(() => {
    console.log('Invoice data population completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to populate invoice data:', error);
    process.exit(1);
  });