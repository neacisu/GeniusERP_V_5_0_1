/**
 * Test script for ManageWarehouseService
 * 
 * This script tests the functionality of the ManageWarehouseService for creating
 * warehouse locations (gestiuni) in the Romanian multi-gestiune model.
 */

import { manageWarehouseService } from './server/modules/inventory/services/manage-warehouse.service';
import { gestiuneTypeEnum } from './server/modules/inventory/schema/inventory.schema';

// Test company ID (this should exist in your database for the test to work)
const TEST_COMPANY_ID = 'b3e8d046-be00-4292-a597-c4c55999bf68'; // Replace with a valid company ID from your database

/**
 * Main test function
 */
async function testManageWarehouseService() {
  console.log('🧪 Testing ManageWarehouseService...');
  
  try {
    // Create a warehouse of each type
    const createdWarehouses = [];
    
    for (const type of gestiuneTypeEnum.enumValues) {
      console.log(`Creating ${type} warehouse...`);
      
      const warehouse = await manageWarehouseService.create({
        company_id: TEST_COMPANY_ID,
        name: `Test ${type.charAt(0).toUpperCase() + type.slice(1)}`,
        type: type
      });
      
      console.log(`✅ Created ${type} warehouse:`, warehouse.id);
      createdWarehouses.push(warehouse);
    }
    
    // Get warehouses for the company
    console.log('Getting all warehouses for company...');
    const warehouses = await manageWarehouseService.getByCompany(TEST_COMPANY_ID);
    console.log(`✅ Found ${warehouses.length} warehouses`);
    
    // Update one of the warehouses
    if (createdWarehouses.length > 0) {
      const warehouseToUpdate = createdWarehouses[0];
      console.log(`Updating warehouse ${warehouseToUpdate.id}...`);
      
      const updatedWarehouse = await manageWarehouseService.update(warehouseToUpdate.id, {
        name: `${warehouseToUpdate.name} (Updated)`,
        location: 'Bucharest'
      });
      
      console.log(`✅ Updated warehouse:`, updatedWarehouse.id);
      
      // Deactivate one of the warehouses
      console.log(`Deactivating warehouse ${warehouseToUpdate.id}...`);
      const deactivateResult = await manageWarehouseService.deactivate(warehouseToUpdate.id);
      console.log(`✅ Deactivation result:`, deactivateResult.success);
    }
    
    console.log('🧪 Test completed successfully!');
    return { success: true, warehouseCount: warehouses.length };
  } catch (error) {
    console.error('❌ Test failed:', error);
    return { success: false, error: error.message };
  }
}

// Run the test
testManageWarehouseService()
  .then(result => console.log('Test result:', result))
  .catch(error => console.error('Test error:', error));