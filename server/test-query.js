// test-query.js
console.log('Testing invoice queries...');

// Import the DrizzleService
import { DrizzleService } from './common/drizzle/drizzle.service.js';

// Main function
async function testQuery() {
  const drizzle = new DrizzleService();
  
  try {
    // Query to test the JOIN between invoices and invoice_details
    const query = `
      SELECT i.*, 
             d.partner_name as customer_name,
             d.partner_id as customer_id,
             d.partner_fiscal_code as customer_fiscal_code,
             d.payment_method,
             d.payment_due_date as due_date
      FROM invoices i
      LEFT JOIN invoice_details d ON i.id = d.invoice_id
      LIMIT 5
    `;
    
    // Execute the query
    const results = await drizzle.execute(query);
    
    // Log the results
    console.log('Results:');
    console.log(JSON.stringify(results, null, 2));
    
    // Check if there's any customer_name populated
    const hasCustomerNames = results.some(r => r.customer_name);
    console.log('Has customer names:', hasCustomerNames);
    
  } catch (error) {
    console.error('Error executing query:', error);
  }
}

// Run the test
testQuery().catch(console.error);