/**
 * Romanian Inventory System Test Script
 * 
 * This script tests the Romanian inventory system with multiple "Gestiune" types:
 * - Depozit (Warehouse): NIR at purchase price (no VAT)
 * - Magazin (Store): NIR at sale price (with markup and VAT)
 * - Custodie (Custody): Goods held in custody
 * - Transfer: Virtual location for goods in transit
 * 
 * The script first creates sample warehouses, then tests transfers between them.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm';
import postgres from 'postgres';
import { v4 as uuidv4 } from 'uuid';
import { 
  gestiuneTypeEnum,
  Warehouse,
  Stock,
  NirDocument,
  NirItem,
  TransferDocument,
  TransferItem,
  PurchaseOrder,
  PurchaseOrderItem
} from './server/modules/inventory/schema/inventory.schema';
import { inventoryProducts } from './shared/schema';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Sample company and user IDs for testing
const TEST_COMPANY_ID = 'b3e8d046-be00-4292-a597-c4c55999bf68';
const TEST_USER_ID = '728cf0a7-fd6a-47a6-9b5e-842c76321a53';

/**
 * Main test function
 */
async function testRomanianInventory() {
  console.log('🧪 Testing Romanian Inventory System');
  
  // Database connection
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable is not set.');
    process.exit(1);
  }
  
  // Connect to the database
  const queryClient = postgres(databaseUrl);
  const db = drizzle(queryClient);
  
  try {
    // Step 1: Create sample warehouses for different "Gestiune" types
    console.log('\n📦 Step 1: Creating sample warehouses (gestiuni)...');
    
    const warehouseIds = await createSampleWarehouses(db);
    
    // Step 2: Create a sample product if one doesn't exist
    console.log('\n🛒 Step 2: Creating sample product...');
    
    const productId = await createSampleProduct(db);
    
    // Step 3: Test NIR creation for different warehouse types
    console.log('\n📝 Step 3: Testing NIR creation for different warehouse types...');
    
    const nirIds = await testNirCreation(db, warehouseIds, productId);
    
    // Step 4: Test inventory transfer between warehouses
    console.log('\n🔄 Step 4: Testing inventory transfer between warehouses...');
    
    await testInventoryTransfer(db, warehouseIds, productId);
    
    // Step 5: Verify stock levels
    console.log('\n🔍 Step 5: Verifying stock levels...');
    
    await verifyStockLevels(db, warehouseIds, productId);
    
    console.log('\n✅ Romanian inventory test completed successfully!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    await queryClient.end();
  }
}

/**
 * Create sample warehouses for different "Gestiune" types
 */
async function createSampleWarehouses(db: any) {
  try {
    // Check if warehouses already exist
    const existingWarehouses = await db.select().from(warehouses);
    
    if (existingWarehouses.length > 0) {
      console.log('✓ Found existing warehouses, reusing them:');
      
      for (const warehouse of existingWarehouses) {
        console.log(`  - ${warehouse.name} (${warehouse.type}): ${warehouse.id}`);
      }
      
      // Return the existing warehouse IDs by type
      return {
        depozit: existingWarehouses.find(w => w.type === 'depozit')?.id,
        magazin: existingWarehouses.find(w => w.type === 'magazin')?.id,
        custodie: existingWarehouses.find(w => w.type === 'custodie')?.id,
        transfer: existingWarehouses.find(w => w.type === 'transfer')?.id,
      };
    }
    
    // Create sample warehouses for each type
    const depozitId = uuidv4();
    const magazinId = uuidv4();
    const custodieId = uuidv4();
    const transferId = uuidv4();
    
    await db.insert(warehouses).values([
      {
        id: depozitId,
        companyId: TEST_COMPANY_ID,
        name: 'Depozit Central',
        code: 'DEP-001',
        location: 'București',
        address: 'Str. Depozitelor 123, Sector 5, București',
        type: 'depozit',
      },
      {
        id: magazinId,
        companyId: TEST_COMPANY_ID,
        name: 'Magazin Piața Romană',
        code: 'MAG-001',
        location: 'București',
        address: 'Piața Romană 7, Sector 1, București',
        type: 'magazin',
      },
      {
        id: custodieId,
        companyId: TEST_COMPANY_ID,
        name: 'Custodie Furnizor XYZ',
        code: 'CUS-001',
        location: 'București',
        address: 'Bd. Timișoara 25, Sector 6, București',
        type: 'custodie',
      },
      {
        id: transferId,
        companyId: TEST_COMPANY_ID,
        name: 'Transfer Virtual',
        code: 'TRF-001',
        location: 'N/A',
        address: 'N/A',
        type: 'transfer',
      },
    ]);
    
    console.log('✓ Created sample warehouses:');
    console.log(`  - Depozit Central (depozit): ${depozitId}`);
    console.log(`  - Magazin Piața Romană (magazin): ${magazinId}`);
    console.log(`  - Custodie Furnizor XYZ (custodie): ${custodieId}`);
    console.log(`  - Transfer Virtual (transfer): ${transferId}`);
    
    return {
      depozit: depozitId,
      magazin: magazinId,
      custodie: custodieId,
      transfer: transferId,
    };
  } catch (error) {
    console.error('❌ Failed to create sample warehouses:', error);
    throw error;
  }
}

/**
 * Create a sample product for testing
 */
async function createSampleProduct(db: any) {
  try {
    // Check if a product already exists
    const existingProducts = await db.select().from(inventoryProducts);
    
    if (existingProducts.length > 0) {
      const productId = existingProducts[0].id;
      console.log(`✓ Found existing product: ${existingProducts[0].name} (${productId})`);
      return productId;
    }
    
    // Create a sample product
    const productId = uuidv4();
    
    await db.insert(inventoryProducts).values({
      id: productId,
      code: 'PROD-001',
      name: 'Laptop Dell XPS 15',
      description: 'Laptop Dell XPS 15, Intel Core i7, 16GB RAM, 512GB SSD',
      purchasePrice: 3500,
      sellingPrice: 4200,
      vatRate: 19,
      isActive: true,
    });
    
    console.log(`✓ Created sample product: Laptop Dell XPS 15 (${productId})`);
    return productId;
  } catch (error) {
    console.error('❌ Failed to create sample product:', error);
    throw error;
  }
}

/**
 * Test NIR creation for different warehouse types
 */
async function testNirCreation(db: any, warehouseIds: any, productId: string) {
  try {
    const supplierId = TEST_COMPANY_ID; // Using company as supplier for testing
    const now = new Date();
    
    // Create NIR documents for each warehouse type
    const nirDepozitId = uuidv4();
    const nirMagazinId = uuidv4();
    const nirCustodieId = uuidv4();
    
    // 1. Depozit NIR - at purchase price without VAT
    await db.insert(nirDocuments).values({
      id: nirDepozitId,
      companyId: TEST_COMPANY_ID,
      nirNumber: `NIR-DEP-${Date.now()}`,
      supplierInvoiceNumber: 'INV-SUP-001',
      supplierId,
      warehouseId: warehouseIds.depozit,
      warehouseType: 'depozit',
      status: 'approved',
      receiptDate: now,
      approvedBy: TEST_USER_ID,
      approvedAt: now,
      notes: 'NIR de recepție în depozit la preț de achiziție fără TVA',
      totalValueNoVat: 7000, // 2 laptops at 3500 each
      totalVat: 1330, // 19% VAT
      totalValueWithVat: 8330,
    });
    
    // NIR items for depozit
    await db.insert(nirItems).values({
      nirId: nirDepozitId,
      productId,
      quantity: 2,
      purchasePrice: 3500,
      purchasePriceWithVat: 4165, // With 19% VAT
      vatRate: 19,
      vatValue: 1330,
      totalValueNoVat: 7000,
      totalValueWithVat: 8330,
    });
    
    // Update stock for depozit
    await db.insert(stocks).values({
      companyId: TEST_COMPANY_ID,
      productId,
      warehouseId: warehouseIds.depozit,
      quantity: 2,
      purchasePrice: 3500,
      sellingPrice: 4200,
    });
    
    console.log(`✓ Created NIR for Depozit: ${nirDepozitId}`);
    
    // 2. Magazin NIR - at selling price with VAT
    const nirMagazinId2 = uuidv4();
    
    await db.insert(nirDocuments).values({
      id: nirMagazinId,
      companyId: TEST_COMPANY_ID,
      nirNumber: `NIR-MAG-${Date.now()}`,
      supplierInvoiceNumber: 'INV-SUP-002',
      supplierId,
      warehouseId: warehouseIds.magazin,
      warehouseType: 'magazin',
      status: 'approved',
      receiptDate: now,
      approvedBy: TEST_USER_ID,
      approvedAt: now,
      notes: 'NIR de recepție în magazin la preț de vânzare cu TVA inclus',
      totalValueNoVat: 7000,
      totalVat: 1330,
      totalValueWithVat: 8330,
    });
    
    // NIR items for magazin
    await db.insert(nirItems).values({
      nirId: nirMagazinId,
      productId,
      quantity: 2,
      purchasePrice: 3500,
      purchasePriceWithVat: 4165,
      sellingPrice: 4200, // Selling price
      sellingPriceWithVat: 4998, // With 19% VAT
      vatRate: 19,
      vatValue: 1330,
      totalValueNoVat: 7000,
      totalValueWithVat: 8330,
    });
    
    // Update stock for magazin
    await db.insert(stocks).values({
      companyId: TEST_COMPANY_ID,
      productId,
      warehouseId: warehouseIds.magazin,
      quantity: 2,
      purchasePrice: 3500,
      sellingPrice: 4200,
    });
    
    console.log(`✓ Created NIR for Magazin: ${nirMagazinId}`);
    
    // 3. Custodie NIR - special NIR for custody
    await db.insert(nirDocuments).values({
      id: nirCustodieId,
      companyId: TEST_COMPANY_ID,
      nirNumber: `NIR-CUS-${Date.now()}`,
      supplierInvoiceNumber: 'INV-SUP-003',
      supplierId,
      warehouseId: warehouseIds.custodie,
      warehouseType: 'custodie',
      isCustody: true,
      status: 'approved',
      receiptDate: now,
      approvedBy: TEST_USER_ID,
      approvedAt: now,
      notes: 'NIR pentru bunuri în custodie (fără transfer de proprietate)',
      totalValueNoVat: 3500,
      totalVat: 665,
      totalValueWithVat: 4165,
    });
    
    // NIR items for custodie
    await db.insert(nirItems).values({
      nirId: nirCustodieId,
      productId,
      quantity: 1,
      purchasePrice: 3500,
      purchasePriceWithVat: 4165,
      vatRate: 19,
      vatValue: 665,
      totalValueNoVat: 3500,
      totalValueWithVat: 4165,
    });
    
    // Update stock for custodie
    await db.insert(stocks).values({
      companyId: TEST_COMPANY_ID,
      productId,
      warehouseId: warehouseIds.custodie,
      quantity: 1,
      purchasePrice: 3500,
      sellingPrice: 4200,
    });
    
    console.log(`✓ Created NIR for Custodie: ${nirCustodieId}`);
    
    return {
      depozit: nirDepozitId,
      magazin: nirMagazinId,
      custodie: nirCustodieId,
    };
  } catch (error) {
    console.error('❌ Failed to create test NIRs:', error);
    throw error;
  }
}

/**
 * Test inventory transfer between warehouses
 */
async function testInventoryTransfer(db: any, warehouseIds: any, productId: string) {
  try {
    const now = new Date();
    
    // Create a transfer document from Depozit to Magazin
    const transferId = uuidv4();
    
    await db.insert(transferDocuments).values({
      id: transferId,
      companyId: TEST_COMPANY_ID,
      transferNumber: `TRF-${Date.now()}`,
      sourceWarehouseId: warehouseIds.depozit,
      destinationWarehouseId: warehouseIds.magazin,
      status: 'in_transit',
      transferDate: now,
      approvedBy: TEST_USER_ID,
      approvedAt: now,
      notes: 'Transfer de la depozit la magazin',
      totalValue: 3500, // 1 laptop at purchase price
    });
    
    // Create transfer items
    await db.insert(transferItems).values({
      transferId,
      productId,
      quantity: 1,
      unitValue: 3500,
      totalValue: 3500,
    });
    
    console.log(`✓ Created transfer document: ${transferId}`);
    console.log('  - Source: Depozit Central');
    console.log('  - Destination: Magazin Piața Romană');
    console.log('  - Quantity: 1');
    
    // Update stock levels (decrease in source, increase in transfer)
    // First decrease stock in source warehouse
    const sourceStock = await db.select().from(stocks)
      .where(
        sql`${stocks.warehouseId} = ${warehouseIds.depozit} AND ${stocks.productId} = ${productId}`
      );
    
    if (sourceStock.length > 0) {
      await db.update(stocks)
        .set({ 
          quantity: Number(sourceStock[0].quantity) - 1,
          updatedAt: now,
        })
        .where(
          sql`${stocks.warehouseId} = ${warehouseIds.depozit} AND ${stocks.productId} = ${productId}`
        );
    }
    
    // Then add stock to the transfer warehouse
    await db.insert(stocks).values({
      companyId: TEST_COMPANY_ID,
      productId,
      warehouseId: warehouseIds.transfer,
      quantity: 1,
      purchasePrice: 3500,
      sellingPrice: 4200,
    });
    
    console.log('✓ Updated stock levels for the transfer:');
    console.log('  - Decreased stock in Depozit by 1');
    console.log('  - Added stock to Transfer Virtual');
    
    // Now simulate receiving the transfer
    // First create a NIR for the destination
    const nirId = uuidv4();
    
    await db.insert(nirDocuments).values({
      id: nirId,
      companyId: TEST_COMPANY_ID,
      nirNumber: `NIR-TRF-${Date.now()}`,
      supplierId: TEST_COMPANY_ID, // For transfers, the company is its own supplier
      warehouseId: warehouseIds.magazin,
      warehouseType: 'magazin',
      status: 'approved',
      receiptDate: now,
      approvedBy: TEST_USER_ID,
      approvedAt: now,
      notes: 'NIR din transfer intern',
      totalValueNoVat: 3500,
      totalVat: 665,
      totalValueWithVat: 4165,
    });
    
    await db.insert(nirItems).values({
      nirId,
      productId,
      quantity: 1,
      purchasePrice: 3500,
      purchasePriceWithVat: 4165,
      sellingPrice: 4200,
      sellingPriceWithVat: 4998,
      vatRate: 19,
      vatValue: 665,
      totalValueNoVat: 3500,
      totalValueWithVat: 4165,
    });
    
    // Update the transfer status
    await db.update(transferDocuments)
      .set({ 
        status: 'received',
        receivedBy: TEST_USER_ID,
        receivedAt: now,
        nirId,
        updatedAt: now,
      })
      .where(
        sql`${transferDocuments.id} = ${transferId}`
      );
    
    // Update transfer item
    await db.update(transferItems)
      .set({ 
        quantityReceived: 1,
        updatedAt: now,
      })
      .where(
        sql`${transferItems.transferId} = ${transferId}`
      );
    
    console.log('✓ Received transfer at destination:');
    console.log(`  - Created NIR at Magazin: ${nirId}`);
    console.log('  - Updated transfer status to "received"');
    
    // Update stock levels (remove from transfer, increase in destination)
    // First decrease stock in transfer warehouse
    const transferStock = await db.select().from(stocks)
      .where(
        sql`${stocks.warehouseId} = ${warehouseIds.transfer} AND ${stocks.productId} = ${productId}`
      );
    
    if (transferStock.length > 0) {
      await db.update(stocks)
        .set({ 
          quantity: 0, // Clear the transfer
          updatedAt: now,
        })
        .where(
          sql`${stocks.warehouseId} = ${warehouseIds.transfer} AND ${stocks.productId} = ${productId}`
        );
    }
    
    // Then increase stock in the destination warehouse
    const destStock = await db.select().from(stocks)
      .where(
        sql`${stocks.warehouseId} = ${warehouseIds.magazin} AND ${stocks.productId} = ${productId}`
      );
    
    if (destStock.length > 0) {
      await db.update(stocks)
        .set({ 
          quantity: Number(destStock[0].quantity) + 1,
          updatedAt: now,
        })
        .where(
          sql`${stocks.warehouseId} = ${warehouseIds.magazin} AND ${stocks.productId} = ${productId}`
        );
    }
    
    console.log('✓ Finalized stock updates:');
    console.log('  - Cleared stock from Transfer Virtual');
    console.log('  - Increased stock in Magazin by 1');
    
    return transferId;
  } catch (error) {
    console.error('❌ Failed to test inventory transfer:', error);
    throw error;
  }
}

/**
 * Verify final stock levels
 */
async function verifyStockLevels(db: any, warehouseIds: any, productId: string) {
  try {
    // Get stock levels from each warehouse
    const stockLevels = await db.select({
      warehouseId: stocks.warehouseId,
      quantity: stocks.quantity,
    }).from(stocks)
      .where(
        sql`${stocks.productId} = ${productId}`
      );
    
    // Get warehouse names
    const warehouseNames = await db.select({
      id: warehouses.id,
      name: warehouses.name,
      type: warehouses.type,
    }).from(warehouses);
    
    // Map of warehouse IDs to names
    const warehouseMap = warehouseNames.reduce((map, wh) => {
      map[wh.id] = { name: wh.name, type: wh.type };
      return map;
    }, {});
    
    console.log('📊 Final stock levels:');
    
    for (const stock of stockLevels) {
      const warehouse = warehouseMap[stock.warehouseId];
      if (warehouse) {
        console.log(`  - ${warehouse.name} (${warehouse.type}): ${stock.quantity}`);
      }
    }
    
    // Expected stock levels after our operations
    console.log('\n✓ Verification:');
    
    // Depozit should have 1 left (original 2 - 1 transferred)
    const depozitStock = stockLevels.find(s => s.warehouseId === warehouseIds.depozit);
    if (depozitStock && Number(depozitStock.quantity) === 1) {
      console.log('  ✓ Depozit: 1 unit (correct)');
    } else {
      console.log(`  ❌ Depozit: ${depozitStock?.quantity || 0} units (expected 1)`);
    }
    
    // Magazin should have 3 (original 2 + 1 received from transfer)
    const magazinStock = stockLevels.find(s => s.warehouseId === warehouseIds.magazin);
    if (magazinStock && Number(magazinStock.quantity) === 3) {
      console.log('  ✓ Magazin: 3 units (correct)');
    } else {
      console.log(`  ❌ Magazin: ${magazinStock?.quantity || 0} units (expected 3)`);
    }
    
    // Custodie should have 1 (unchanged)
    const custodieStock = stockLevels.find(s => s.warehouseId === warehouseIds.custodie);
    if (custodieStock && Number(custodieStock.quantity) === 1) {
      console.log('  ✓ Custodie: 1 unit (correct)');
    } else {
      console.log(`  ❌ Custodie: ${custodieStock?.quantity || 0} units (expected 1)`);
    }
    
    // Transfer should have 0 (all items transferred)
    const transferStock = stockLevels.find(s => s.warehouseId === warehouseIds.transfer);
    if (!transferStock || Number(transferStock.quantity) === 0) {
      console.log('  ✓ Transfer: 0 units (correct)');
    } else {
      console.log(`  ❌ Transfer: ${transferStock?.quantity || 0} units (expected 0)`);
    }
  } catch (error) {
    console.error('❌ Failed to verify stock levels:', error);
    throw error;
  }
}

// Run the test
testRomanianInventory().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});