/**
 * Debug script for CheckStockLevelsService
 * This script creates minimal test data and checks the checkLevels method
 */
import { getDrizzle } from './server/common/drizzle/drizzle.service';
import { checkStockLevelsService } from './server/modules/inventory/services/check-stock-levels.service';
import { randomUUID } from 'crypto';

// Simple console logger
const log = (message: string) => console.log(message);

async function debugCheckStockLevels() {
  log('Starting debug of CheckStockLevelsService...');
  
  // Create a DB connection
  const db = getDrizzle();
  
  // Generate unique test IDs
  const companyId = randomUUID();
  const warehouseId = randomUUID();
  const productId = randomUUID();
  
  try {
    // Clean up previous test data if any
    log('Cleaning up previous test data...');
    await db.execute(`DELETE FROM stocks WHERE company_id = '${companyId}'`);
    await db.execute(`DELETE FROM warehouses WHERE company_id = '${companyId}'`);
    await db.execute(`DELETE FROM inventory_products WHERE id = '${productId}'`);
    
    // Create one test warehouse
    log('Creating test warehouse...');
    await db.execute(`
      INSERT INTO warehouses (id, name, code, type, is_active, company_id, created_at, updated_at)
      VALUES ('${warehouseId}', 'Debug Warehouse', 'WH-DEBUG', 'depozit', true, '${companyId}', NOW(), NOW())
    `);
    
    // Create one test product with stock alert
    log('Creating test product...');
    await db.execute(`
      INSERT INTO inventory_products (
        id, name, code, description, category_id, unit_id, 
        purchase_price, selling_price, vat_rate, stock_alert, is_active, 
        created_at, updated_at
      )
      VALUES (
        '${productId}', 'Debug Product', 'DBG1001', 'Test product for debugging', 
        NULL, NULL, 10.00, 20.00, 19, 10, true, NOW(), NOW()
      )
    `);
    
    // Create one stock entry with quantity below threshold
    log('Creating test stock entry below threshold...');
    await db.execute(`
      INSERT INTO stocks (
        id, company_id, franchise_id, product_id, warehouse_id, 
        quantity, quantity_reserved, batch_no, expiry_date, 
        purchase_price, selling_price, created_at, updated_at
      )
      VALUES (
        '${randomUUID()}', 
        '${companyId}', 
        NULL, 
        '${productId}', 
        '${warehouseId}', 
        5, 
        0, 
        NULL, 
        NULL,
        10.00,
        20.00,
        NOW(), 
        NOW()
      )
    `);
    
    // Verify the data
    const stockEntry = await db.execute(`
      SELECT 
        s.id, s.product_id, s.warehouse_id, s.quantity, 
        p.name as product_name, p.stock_alert, 
        w.name as warehouse_name
      FROM stocks s
      JOIN inventory_products p ON s.product_id = p.id
      JOIN warehouses w ON s.warehouse_id = w.id
      WHERE s.company_id = '${companyId}'
    `);
    
    log('Test data verified:');
    console.log(stockEntry);
    
    // Now test the checkLevels method
    log('Testing checkLevels method...');
    const result = await checkStockLevelsService.checkLevels(companyId);
    
    log('CheckLevels result:');
    console.log(JSON.stringify(result, null, 2));
    
    // Check if we found any alerts
    if (result.alerts.length > 0) {
      log('✅ Test passed: Found below threshold alerts');
    } else {
      log('❌ Test failed: No alerts found even though quantity is below threshold');
    }
    
    // Clean up
    log('Cleaning up test data...');
    await db.execute(`DELETE FROM stocks WHERE company_id = '${companyId}'`);
    await db.execute(`DELETE FROM warehouses WHERE company_id = '${companyId}'`);
    await db.execute(`DELETE FROM inventory_products WHERE id = '${productId}'`);
    
  } catch (error) {
    log(`❌ Error during debug: ${error}`);
  }
}

// Run the debug function
debugCheckStockLevels().catch(error => {
  console.error('Fatal error:', error);
});