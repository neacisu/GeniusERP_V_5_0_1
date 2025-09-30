/**
 * Test script for NIR Service
 * 
 * This script tests the functionality of the NirService for creating NIR documents
 * and updating stock based on Romanian accounting standards.
 */

import { randomUUID } from 'crypto';
import { nirService } from './server/modules/inventory/services/nir.service';
import { nirStatusEnum } from './server/modules/inventory/schema/inventory.schema';

/**
 * Test creating a NIR document
 */
async function testNirService() {
  console.log('🧪 Testing NIR Service...');
  
  try {
    const companyId = 'b3e8d046-be00-4292-a597-c4c55999bf68'; // Using existing company ID
    const warehouseId = '3aff1e36-a9a5-44c4-8d01-28d0c9ee113c'; // Regular warehouse (depozit)
    const productId = 'f406f2a6-c808-40d1-98a9-79c49147b1dd'; // Existing product
    
    // Create a new NIR document
    const nirDoc = await nirService.createNirDocument({
      companyId,
      nirNumber: `NIR-TEST-${Date.now()}`,
      warehouseId,
      warehouseType: 'depozit',
      supplierId: companyId, // Using company as supplier for simplicity
      receiptDate: new Date(),
      status: 'draft',
      totalValueNoVat: 1000,
      totalVat: 190,
      totalValueWithVat: 1190,
      currency: 'RON',
      exchangeRate: 1,
      isCustody: false // Required field according to the schema
    }, [
      {
        productId,
        quantity: 1,
        purchasePrice: 1000,
        vatRate: 19,
        vatValue: 190,
        totalValueNoVat: 1000,
        totalValueWithVat: 1190
      }
    ]);
    
    console.log('✅ NIR document created:', nirDoc.id);
    
    // Get the NIR document and its items
    const { document, items } = await nirService.getNirDocument(nirDoc.id);
    console.log('📝 NIR Document:', document.nirNumber);
    console.log('📦 NIR Items:', items.length);
    
    // Update NIR status
    const updatedNir = await nirService.updateNirStatus(nirDoc.id, 'approved');
    console.log('✅ NIR status updated to:', updatedNir.status);
    
    return { success: true, nirId: nirDoc.id };
  } catch (error) {
    console.error('❌ Error testing NIR service:', error);
    return { success: false, error };
  }
}

// Run the test
testNirService().then((result) => {
  console.log('🧪 Test completed with result:', result);
});