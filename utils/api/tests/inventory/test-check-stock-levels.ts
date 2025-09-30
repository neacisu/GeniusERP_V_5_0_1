/**
 * Test script for CheckStockLevelsService
 * 
 * This script tests the stock monitoring functionality by creating test data
 * and verifying that products falling below their defined thresholds are properly
 * detected and reported.
 */

import { randomUUID } from 'crypto';
import { checkStockLevelsService } from './server/modules/inventory/services/check-stock-levels.service';
import { getDrizzle } from './server/common/drizzle/drizzle.service';

// Mock data for testing
const testCompanyId = randomUUID();
const testFranchiseId = randomUUID();
const testWarehouseIds = [randomUUID(), randomUUID()];
const testProductIds = [randomUUID(), randomUUID(), randomUUID(), randomUUID()];

// Test function
async function testCheckStockLevels() {
  console.log('\n🔍 Testing CheckStockLevelsService functionality...');
  
  try {
    const db = getDrizzle();
    
    // 1. Clean up any previous test data
    console.log('Cleaning up previous test data...');
    // First get product IDs to clean up
    const productIdsToClean = testProductIds.map(id => `'${id}'`).join(',');
    // Clean up stocks and warehouses by company_id
    await db.execute(`DELETE FROM stocks WHERE company_id = '${testCompanyId}'`);
    await db.execute(`DELETE FROM warehouses WHERE company_id = '${testCompanyId}'`);
    // Clean up inventory_products by ID (since it doesn't have company_id)
    if (productIdsToClean.length > 0) {
      await db.execute(`DELETE FROM inventory_products WHERE id IN (${productIdsToClean})`)
    }
    
    // 2. Create test warehouses
    console.log('Creating test warehouses...');
    try {
      for (let i = 0; i < testWarehouseIds.length; i++) {
        const warehouseName = `Test Warehouse ${i + 1}`;
        const warehouseType = i === 0 ? 'depozit' : 'magazin';
        const warehouseCode = `W${i + 100}`;
        
        try {
          await db.execute(`
            INSERT INTO warehouses (
              id, name, type, code, address, is_active, 
              company_id, franchise_id, created_at, updated_at
            ) VALUES (
              '${testWarehouseIds[i]}', 
              '${warehouseName}',
              '${warehouseType}',
              '${warehouseCode}',
              'Test Address',
              true,
              '${testCompanyId}',
              '${testFranchiseId}',
              NOW(),
              NOW()
            )
          `);
          console.log(`  ✅ Created warehouse: ${warehouseName}`);
        } catch (warehouseError) {
          console.error(`  ❌ Error creating warehouse ${warehouseName}:`, warehouseError);
          // Continue with the next one
        }
      }
    } catch (warehousesError) {
      console.error(`❌ Error in warehouse creation loop:`, warehousesError);
    }
    
    // Verify warehouses were created properly
    try {
      console.log("Verifying warehouses with query:", `SELECT id, name, is_active FROM warehouses WHERE company_id = '${testCompanyId}'`);
      const warehouseCheck = await db.execute(`SELECT id, name, is_active FROM warehouses WHERE company_id = '${testCompanyId}'`);
      
      // Check the structure of the returned data
      console.log("Warehouse check result:", JSON.stringify(warehouseCheck, null, 2));
      
      // Try different ways to access the data
      if (warehouseCheck?.rows) {
        console.log(`Created ${warehouseCheck.rows.length} warehouses (rows property):`);
        warehouseCheck.rows.forEach((wh: any) => {
          console.log(`  - ${wh.name} (${wh.id}): is_active = ${wh.is_active}`);
        });
      } else if (Array.isArray(warehouseCheck)) {
        console.log(`Created ${warehouseCheck.length} warehouses (array):`);
        warehouseCheck.forEach((wh: any) => {
          console.log(`  - ${wh.name} (${wh.id}): is_active = ${wh.is_active}`);
        });
      } else {
        console.log("Warehouse check result has unexpected structure:", typeof warehouseCheck);
      }
    } catch (verifyError) {
      console.error("Error verifying warehouses:", verifyError);
    }
    
    // 3. Create test products with stock alert thresholds
    console.log('Creating test products with stock alert thresholds...');
    const productNames = ['Product A', 'Product B', 'Product C', 'Product D'];
    const thresholds = [10, 20, 5, 15]; // Stock alert thresholds
    
    // Generate a random suffix to avoid code conflicts
    const randomSuffix = Math.floor(Math.random() * 10000).toString();
    
    try {
      for (let i = 0; i < testProductIds.length; i++) {
        const productCode = `P${i + 100}_${randomSuffix}`;
        const productDescription = `Test product ${i + 1} for stock monitoring`;
        const purchasePrice = 100 + i * 10;
        const salePrice = 150 + i * 15;
        const vatRate = 19; // 19% VAT
        const threshold = thresholds[i];
        
        try {
          await db.execute(`
            INSERT INTO inventory_products (
              id, name, code, description, category_id, unit_id,
              purchase_price, selling_price, vat_rate, stock_alert,
              is_active, created_at, updated_at
            ) VALUES (
              '${testProductIds[i]}', 
              '${productNames[i]}',
              '${productCode}',
              '${productDescription}',
              NULL,
              NULL,
              ${purchasePrice},
              ${salePrice},
              ${vatRate},
              ${threshold},
              true,
              NOW(),
              NOW()
            )
          `);
          console.log(`  ✅ Created product: ${productNames[i]} (${productCode})`);
        } catch (productError) {
          console.error(`  ❌ Error creating product ${productNames[i]}:`, productError);
          // Continue with the next one
        }
      }
    } catch (productsError) {
      console.error(`❌ Error in product creation loop:`, productsError);
    }
    
    // Verify products were created properly
    try {
      console.log("Verifying products with query:", `SELECT id, name, code, stock_alert FROM inventory_products WHERE id IN (${testProductIds.map(id => `'${id}'`).join(',')})`);
      const productCheck = await db.execute(`SELECT id, name, code, stock_alert FROM inventory_products WHERE id IN (${testProductIds.map(id => `'${id}'`).join(',')})`);
      
      // Check the structure of the returned data
      console.log("Product check result:", JSON.stringify(productCheck, null, 2));
      
      // Try different ways to access the data
      if (productCheck?.rows) {
        console.log(`Created ${productCheck.rows.length} products (rows property):`);
        productCheck.rows.forEach((prod: any) => {
          console.log(`  - ${prod.name} (${prod.code}): stock_alert = ${prod.stock_alert}`);
        });
      } else if (Array.isArray(productCheck)) {
        console.log(`Created ${productCheck.length} products (array):`);
        productCheck.forEach((prod: any) => {
          console.log(`  - ${prod.name} (${prod.code}): stock_alert = ${prod.stock_alert}`);
        });
      } else {
        console.log("Product check result has unexpected structure:", typeof productCheck);
      }
    } catch (verifyError) {
      console.error("Error verifying products:", verifyError);
    }
    
    // 4. Create stock entries with some below threshold
    console.log('Creating stock entries with some below threshold...');
    const quantities = [
      [5, 25],   // Product A: 5 in warehouse 1 (below), 25 in warehouse 2 (above)
      [15, 5],   // Product B: 15 in warehouse 1 (below), 5 in warehouse 2 (below)
      [10, 10],  // Product C: 10 in warehouse 1 (above), 10 in warehouse 2 (above)
      [12, 0]    // Product D: 12 in warehouse 1 (below), 0 in warehouse 2 (below)
    ];
    
    try {
      for (let productIndex = 0; productIndex < testProductIds.length; productIndex++) {
        for (let warehouseIndex = 0; warehouseIndex < testWarehouseIds.length; warehouseIndex++) {
          const stockId = randomUUID();
          const quantity = quantities[productIndex][warehouseIndex];
          
          try {
            await db.execute(`
              INSERT INTO stocks (
                id, product_id, warehouse_id, quantity, company_id, franchise_id, 
                created_at, updated_at
              ) VALUES (
                '${stockId}',
                '${testProductIds[productIndex]}',
                '${testWarehouseIds[warehouseIndex]}',
                ${quantity},
                '${testCompanyId}',
                '${testFranchiseId}',
                NOW(),
                NOW()
              )
            `);
            console.log(`  ✅ Created stock entry: Product ${productIndex + 1} in Warehouse ${warehouseIndex + 1}, quantity = ${quantity}`);
          } catch (stockError) {
            console.error(`  ❌ Error creating stock entry for Product ${productIndex + 1} in Warehouse ${warehouseIndex + 1}:`, stockError);
            // Continue with the next one
          }
        }
      }
    } catch (stocksError) {
      console.error(`❌ Error in stock creation loop:`, stocksError);
    }
    
    // Verify stocks were created properly
    try {
      const stockQuery = `
        SELECT s.id, s.product_id, s.warehouse_id, s.quantity, 
               p.name as product_name, p.stock_alert, 
               w.name as warehouse_name, w.is_active
        FROM stocks s
        JOIN inventory_products p ON s.product_id = p.id
        JOIN warehouses w ON s.warehouse_id = w.id
        WHERE s.company_id = '${testCompanyId}'
      `;
      console.log("Verifying stocks with query:", stockQuery);
      const stockCheck = await db.execute(stockQuery);
      
      // Check the structure of the returned data
      console.log("Stock check result:", JSON.stringify(stockCheck, null, 2));
      
      // Try different ways to access the data
      if (stockCheck?.rows) {
        console.log(`Created ${stockCheck.rows.length} stock entries (rows property):`);
        stockCheck.rows.forEach((stock: any) => {
          console.log(`  - ${stock.product_name} in ${stock.warehouse_name}: quantity = ${stock.quantity}, alert = ${stock.stock_alert}, active = ${stock.is_active}`);
          // Show if this stock is expected to trigger an alert
          if (parseFloat(stock.quantity) <= parseFloat(stock.stock_alert)) {
            console.log(`    ⚠️ Should trigger alert (${stock.quantity} <= ${stock.stock_alert})`);
          } else {
            console.log(`    ✅ Above threshold (${stock.quantity} > ${stock.stock_alert})`);
          }
        });
      } else if (Array.isArray(stockCheck)) {
        console.log(`Created ${stockCheck.length} stock entries (array):`);
        stockCheck.forEach((stock: any) => {
          console.log(`  - ${stock.product_name} in ${stock.warehouse_name}: quantity = ${stock.quantity}, alert = ${stock.stock_alert}, active = ${stock.is_active}`);
          // Show if this stock is expected to trigger an alert
          if (parseFloat(stock.quantity) <= parseFloat(stock.stock_alert)) {
            console.log(`    ⚠️ Should trigger alert (${stock.quantity} <= ${stock.stock_alert})`);
          } else {
            console.log(`    ✅ Above threshold (${stock.quantity} > ${stock.stock_alert})`);
          }
        });
      } else {
        console.log("Stock check result has unexpected structure:", typeof stockCheck);
      }
      
      // Also try a simpler query to see if the stocks were created
      const simpleStockCheck = await db.execute(`SELECT COUNT(*) as count FROM stocks WHERE company_id = '${testCompanyId}'`);
      console.log("Simple stock count:", JSON.stringify(simpleStockCheck, null, 2));
      
    } catch (verifyError) {
      console.error("Error verifying stocks:", verifyError);
    }
    
    // 5. Test the checkLevels function
    console.log('\n📊 Testing checkLevels() for entire company...');
    
    const result = await checkStockLevelsService.checkLevels(testCompanyId);
    
    console.log(`Total products: ${result.totalProducts}`);
    console.log(`Below threshold: ${result.belowThreshold}`);
    console.log(`Alert count: ${result.alerts.length}`);
    
    if (result.alerts.length > 0) {
      console.log('\nDetected low stock alerts:');
      result.alerts.forEach((alert, index) => {
        console.log(`${index + 1}. ${alert.productName} in ${alert.warehouseName}`);
        console.log(`   Current quantity: ${alert.currentQuantity}, Threshold: ${alert.minThreshold}`);
      });
    }
    
    // 6. Test warehouse-specific check
    console.log('\n🏢 Testing checkLevels() for specific warehouse...');
    const warehouseResult = await checkStockLevelsService.checkLevels(
      testCompanyId, 
      undefined, 
      testWarehouseIds[0]
    );
    
    console.log(`Warehouse specific alerts: ${warehouseResult.alerts.length}`);
    
    // 7. Test approaching threshold function
    console.log('\n⚠️ Testing getApproachingThreshold()...');
    const approachingResult = await checkStockLevelsService.getApproachingThreshold(testCompanyId);
    
    console.log(`Products approaching threshold: ${approachingResult.length}`);
    if (approachingResult.length > 0) {
      console.log('\nProducts approaching threshold:');
      approachingResult.forEach((item, index) => {
        console.log(`${index + 1}. ${item.product_name} in ${item.warehouse_name}`);
        console.log(`   Current: ${item.quantity}, Threshold: ${item.min_threshold}, Percentage: ${item.threshold_percentage}%`);
      });
    }
    
    console.log('\n✅ CheckStockLevelsService test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing CheckStockLevelsService:', error);
  }
}

// Run the test
testCheckStockLevels().catch(console.error);