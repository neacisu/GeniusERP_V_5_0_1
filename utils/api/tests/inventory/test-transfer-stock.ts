/**
 * Test TransferStockService
 * 
 * This script tests the functionality of the TransferStockService, which handles
 * stock transfers between warehouses.
 */

import { transferStockService } from './server/modules/inventory/services/transfer-stock.service';
import { manageWarehouseService } from './server/modules/inventory/services/manage-warehouse.service';
import { getDrizzle } from './server/common/drizzle/drizzle.service';
import { randomUUID } from 'crypto';

const TEST_COMPANY_ID = 'b3e8d046-be00-4292-a597-c4c55999bf68';

/**
 * Create test warehouses, products, and stock data
 */
async function setupTestData() {
  console.log('🔧 Setting up test data...');
  
  try {
    const db = getDrizzle();
    
    // Create source warehouse
    const sourceWarehouse = await manageWarehouseService.create({
      company_id: TEST_COMPANY_ID,
      name: 'Test Source Warehouse',
      type: 'depozit'
    });
    
    console.log(`✓ Created source warehouse: ${sourceWarehouse.id}`);
    
    // Create destination warehouse
    const destWarehouse = await manageWarehouseService.create({
      company_id: TEST_COMPANY_ID,
      name: 'Test Destination Warehouse',
      type: 'magazin'
    });
    
    console.log(`✓ Created destination warehouse: ${destWarehouse.id}`);
    
    // Create test product
    const productId = randomUUID();
    await db.execute(`
      INSERT INTO inventory_products (
        id, name, code, description, purchase_price, selling_price, created_at, updated_at
      ) VALUES (
        '${productId}',
        'Test Transfer Product',
        'TP-${Date.now()}',
        'Product for testing stock transfers',
        10.00,
        15.00,
        NOW(),
        NOW()
      )
    `);
    
    console.log(`✓ Created test product: ${productId}`);
    
    // Create initial stock in source warehouse
    const stockId = randomUUID();
    await db.execute(`
      INSERT INTO stocks (
        id, company_id, product_id, warehouse_id, quantity, purchase_price, selling_price
      ) VALUES (
        '${stockId}',
        '${TEST_COMPANY_ID}',
        '${productId}',
        '${sourceWarehouse.id}',
        100,
        10.00,
        15.00
      )
    `);
    
    console.log(`✓ Created initial stock (100 units) in source warehouse: ${stockId}`);
    
    return {
      sourceWarehouseId: sourceWarehouse.id,
      destWarehouseId: destWarehouse.id,
      productId,
      stockId
    };
  } catch (error: any) {
    console.error('❌ Error setting up test data:', error);
    throw error;
  }
}

/**
 * Test the transferStock method
 */
async function testTransferStock(testData: any) {
  console.log('\n🧪 Testing transferStock method...');
  
  try {
    // Transfer 25 units from source to destination
    const transferResult = await transferStockService.transferStock({
      companyId: TEST_COMPANY_ID,
      sourceStockId: testData.stockId,
      destinationWarehouseId: testData.destWarehouseId,
      quantity: 25,
      notes: 'Test transfer'
    });
    
    console.log(`✓ Successfully transferred stock: ${transferResult.transfer.id}`);
    console.log(`  - Quantity: 25 units`);
    console.log(`  - Source stock remaining: ${transferResult.sourceStock.quantity} units`);
    console.log(`  - Destination stock: ${transferResult.destinationStock.quantity} units`);
    
    // Verify the transfer document was created
    const transferDoc = await transferStockService.getTransferById(transferResult.transfer.id);
    
    if (transferDoc) {
      console.log('✓ Transfer document found');
      console.log(`  - Transfer number: ${transferDoc.transfer_number}`);
      console.log(`  - Status: ${transferDoc.status}`);
      console.log(`  - Items: ${transferDoc.items.length}`);
    } else {
      console.error('❌ Transfer document not found');
    }
    
    // Test updating the transfer status
    const userId = randomUUID();
    const updatedTransfer = await transferStockService.updateTransferStatus(
      transferResult.transfer.id, 
      'received', 
      userId
    );
    
    console.log('✓ Updated transfer status to:', updatedTransfer.status);
    
    return transferResult;
  } catch (error: any) {
    console.error('❌ Error testing transferStock:', error);
    throw error;
  }
}

/**
 * Test fetching transfers for a company
 */
async function testGetTransfersByCompany(companyId: string) {
  console.log('\n🧪 Testing getTransfersByCompany method...');
  
  try {
    const transfers = await transferStockService.getTransfersByCompany(companyId);
    
    console.log(`✓ Found ${transfers.length} transfers for company ${companyId}`);
    
    if (transfers.length > 0) {
      transfers.forEach((transfer, index) => {
        console.log(`  ${index + 1}. ${transfer.transfer_number} (${transfer.status})`);
        console.log(`     From: ${transfer.source_warehouse_name} To: ${transfer.destination_warehouse_name}`);
      });
    }
    
    return transfers;
  } catch (error: any) {
    console.error('❌ Error testing getTransfersByCompany:', error);
    throw error;
  }
}

/**
 * Clean up test data
 */
async function cleanupTestData(testData: any) {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    const db = getDrizzle();
    
    // Delete transfer items first
    await db.execute(`DELETE FROM transfer_items WHERE transfer_id IN (
      SELECT id FROM transfer_documents WHERE company_id = '${TEST_COMPANY_ID}'
    )`);
    console.log('✓ Deleted transfer items');
    
    // Now delete the transfer documents
    await db.execute(`DELETE FROM transfer_documents WHERE company_id = '${TEST_COMPANY_ID}'`);
    console.log('✓ Deleted transfer documents');
    
    // Delete stock
    await db.execute(`DELETE FROM stocks WHERE company_id = '${TEST_COMPANY_ID}'`);
    console.log('✓ Deleted stock records');
    
    // Delete product
    await db.execute(`DELETE FROM inventory_products WHERE id = '${testData.productId}'`);
    console.log('✓ Deleted test product');
    
    // Delete warehouses
    await db.execute(`DELETE FROM warehouses WHERE id IN ('${testData.sourceWarehouseId}', '${testData.destWarehouseId}')`);
    console.log('✓ Deleted test warehouses');
    
    console.log('✅ All test data cleaned up');
  } catch (error: any) {
    console.error('❌ Error cleaning up test data:', error);
  }
}

/**
 * Main test function
 */
async function main() {
  console.log('🚀 Starting TransferStockService test...');
  
  let testData;
  try {
    // Setup test data
    testData = await setupTestData();
    
    // Run test stock transfer
    await testTransferStock(testData);
    
    // Run test for getting transfers
    await testGetTransfersByCompany(TEST_COMPANY_ID);
    
    console.log('\n✅ All tests completed successfully');
  } catch (error: any) {
    console.error('\n❌ Test failed:', error);
  } finally {
    // Clean up test data
    if (testData) {
      await cleanupTestData(testData);
    }
  }
}

// Run the tests
main()
  .then(() => {
    console.log('Tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test script failed:', error);
    process.exit(1);
  });