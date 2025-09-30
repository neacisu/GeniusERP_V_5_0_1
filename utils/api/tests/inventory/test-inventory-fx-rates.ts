/**
 * Test for Inventory with Exchange Rates
 * 
 * This script demonstrates using exchange rates with inventory operations
 * for multi-currency support.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './server/modules/inventory/schema';
import { sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const {
  warehouses,
  nirDocuments,
  nirItems,
  stocks,
  transferDocuments,
  transferItems
} = schema;

async function testInventoryWithExchangeRates() {
  console.log('🧪 Testing Inventory with Exchange Rates\n');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL environment variable not set');
    process.exit(1);
  }

  const queryClient = postgres(databaseUrl, { max: 1 });
  const db = drizzle(queryClient);

  try {
    // Sample company ID
    const companyId = '2d9fab11-d1f7-42e6-93c3-af45b0c344a0';
    
    // Step 1: Create a record in the fx_rates table if it doesn't exist
    console.log('📊 Step 1: Creating or finding fx_rates for EUR/RON...');
    
    // Check if we already have a EUR/RON exchange rate
    const existingRates = await db.execute(sql`
      SELECT * FROM fx_rates 
      WHERE currency = 'EUR' AND base_currency = 'RON'
      ORDER BY date DESC LIMIT 1
    `);
    
    let exchangeRate;
    let exchangeRateDate;
    
    if (existingRates.length > 0) {
      exchangeRate = existingRates[0].rate;
      exchangeRateDate = existingRates[0].date;
      console.log(`✓ Found existing EUR/RON rate: ${exchangeRate} (${exchangeRateDate})`);
    } else {
      // Insert a sample exchange rate
      const today = new Date();
      exchangeRate = 4.9734; // Sample EUR to RON rate
      exchangeRateDate = today;
      
      await db.execute(sql`
        INSERT INTO fx_rates (id, currency, base_currency, rate, date, source, created_at)
        VALUES (${uuidv4()}, 'EUR', 'RON', ${exchangeRate}, ${today}, 'BNR', ${today})
      `);
      
      console.log(`✓ Created new EUR/RON rate: ${exchangeRate}`);
    }
    
    // Step 2: Get a warehouse from the database or create one if not exists
    console.log('\n📦 Step 2: Finding warehouses for test...');
    
    const warehouseResults = await db.select().from(warehouses).limit(2);
    
    if (warehouseResults.length < 2) {
      console.error('❌ Need at least 2 warehouses in database to run this test');
      return;
    }
    
    const sourceWarehouse = warehouseResults[0];
    const destWarehouse = warehouseResults[1];
    
    console.log(`✓ Using source warehouse: ${sourceWarehouse.name} (${sourceWarehouse.id})`);
    console.log(`✓ Using destination warehouse: ${destWarehouse.name} (${destWarehouse.id})`);
    
    // Step 3: Create a product or find an existing one
    console.log('\n🛒 Step 3: Finding product for test...');
    
    const products = await db.execute(sql`
      SELECT * FROM inventory_products LIMIT 1
    `);
    
    if (products.length === 0) {
      console.error('❌ No products found in the database');
      return;
    }
    
    const product = products[0];
    console.log(`✓ Using product: ${product.name} (${product.id})`);
    
    // Step 4: Create a NIR document with EUR currency
    console.log('\n📝 Step 4: Creating NIR with EUR currency...');
    
    const nirId = uuidv4();
    const nirNumber = `NIR-EUR-${Date.now()}`;
    
    // Using raw SQL for flexibility with the exact fields we need
    await db.execute(sql`
      INSERT INTO nir_documents (
        id, company_id, nir_number, supplier_id, warehouse_id, warehouse_type,
        receipt_date, total_value_no_vat, total_vat, total_value_with_vat,
        currency, exchange_rate, exchange_rate_source, exchange_rate_date
      ) VALUES (
        ${nirId}, ${companyId}, ${nirNumber}, ${uuidv4()}, ${sourceWarehouse.id}, ${sourceWarehouse.type},
        ${new Date().toISOString()}, 100, 19, 119,
        'EUR', ${exchangeRate}, 'BNR', ${new Date(exchangeRateDate).toISOString()}
      )
    `);
    
    console.log(`✓ Created NIR document ${nirNumber} with EUR currency (rate: ${exchangeRate})`);
    
    // Adding an item to the NIR
    const nirItemId = uuidv4();
    const unitPrice = 100; // EUR
    
    await db.execute(sql`
      INSERT INTO nir_items (
        id, nir_id, product_id, quantity, purchase_price, vat_rate, vat_value,
        total_value_no_vat, total_value_with_vat, currency, exchange_rate,
        exchange_rate_source, exchange_rate_date
      ) VALUES (
        ${nirItemId}, ${nirId}, ${product.id}, 1, ${unitPrice}, 19, ${unitPrice * 0.19},
        ${unitPrice}, ${unitPrice * 1.19}, 'EUR', ${exchangeRate},
        'BNR', ${new Date(exchangeRateDate).toISOString()}
      )
    `);
    
    console.log(`✓ Added item to NIR (EUR ${unitPrice})`);
    
    // Calculate RON equivalent values
    const totalValueRon = unitPrice * exchangeRate;
    console.log(`✓ EUR ${unitPrice} = RON ${totalValueRon.toFixed(2)} (using rate: ${exchangeRate})`);
    
    // Step 5: Update stock with values in both currencies
    console.log('\n📊 Step 5: Updating stock with multi-currency information...');
    
    // Check if stock record already exists
    const existingStock = await db.select().from(stocks)
      .where(sql`${stocks.productId} = ${product.id} AND ${stocks.warehouseId} = ${sourceWarehouse.id}`);
    
    if (existingStock.length > 0) {
      await db.execute(sql`
        UPDATE stocks 
        SET quantity = quantity + 1,
            purchase_price = ${unitPrice},
            selling_price = ${unitPrice * 1.3}
        WHERE product_id = ${product.id} AND warehouse_id = ${sourceWarehouse.id}
      `);
      console.log(`✓ Updated existing stock record for ${product.name} in ${sourceWarehouse.name}`);
    } else {
      await db.execute(sql`
        INSERT INTO stocks (
          id, company_id, product_id, warehouse_id, quantity, purchase_price, selling_price
        ) VALUES (
          ${uuidv4()}, ${companyId}, ${product.id}, ${sourceWarehouse.id}, 1, 
          ${unitPrice}, ${unitPrice * 1.3}
        )
      `);
      console.log(`✓ Created new stock record for ${product.name} in ${sourceWarehouse.name}`);
    }
    
    // Step 6: Create a transfer document with currency information
    console.log('\n🔄 Step 6: Creating transfer with currency information...');
    
    const transferId = uuidv4();
    const transferNumber = `TRANSFER-EUR-${Date.now()}`;
    
    await db.execute(sql`
      INSERT INTO transfer_documents (
        id, company_id, transfer_number, source_warehouse_id, destination_warehouse_id,
        transfer_date, total_value, currency, exchange_rate, exchange_rate_source, exchange_rate_date
      ) VALUES (
        ${transferId}, ${companyId}, ${transferNumber}, ${sourceWarehouse.id}, ${destWarehouse.id},
        ${new Date().toISOString()}, ${unitPrice}, 'EUR', ${exchangeRate}, 'BNR', ${new Date(exchangeRateDate).toISOString()}
      )
    `);
    
    console.log(`✓ Created transfer document ${transferNumber} with EUR currency`);
    
    // Adding an item to the transfer
    const transferItemId = uuidv4();
    await db.execute(sql`
      INSERT INTO transfer_items (
        id, transfer_id, product_id, quantity, unit_value, total_value,
        currency, exchange_rate, exchange_rate_source, exchange_rate_date
      ) VALUES (
        ${transferItemId}, ${transferId}, ${product.id}, 1, ${unitPrice}, ${unitPrice},
        'EUR', ${exchangeRate}, 'BNR', ${new Date(exchangeRateDate).toISOString()}
      )
    `);
    
    console.log(`✓ Added item to transfer (EUR ${unitPrice})`);
    
    // Step 7: Verify the created documents and their currency information
    console.log('\n✅ Step 7: Verifying documents with currency information...');
    
    const nirWithCurrency = await db.execute(sql`
      SELECT n.*,
             CAST(n.total_value_with_vat * n.exchange_rate AS DECIMAL(10, 2)) as ron_equivalent
      FROM nir_documents n 
      WHERE n.id = ${nirId}
    `);
    
    console.log('\n📄 NIR Document with currency conversion:');
    console.log(`  - NIR Number: ${nirWithCurrency[0].nir_number}`);
    console.log(`  - Original Value: ${nirWithCurrency[0].total_value_with_vat} ${nirWithCurrency[0].currency}`);
    console.log(`  - Exchange Rate: ${nirWithCurrency[0].exchange_rate} (${nirWithCurrency[0].exchange_rate_source})`);
    console.log(`  - RON Equivalent: ${Number(nirWithCurrency[0].ron_equivalent).toFixed(2)} RON`);
    
    const transferWithCurrency = await db.execute(sql`
      SELECT t.*,
             CAST(t.total_value * t.exchange_rate AS DECIMAL(10, 2)) as ron_equivalent
      FROM transfer_documents t 
      WHERE t.id = ${transferId}
    `);
    
    console.log('\n📄 Transfer Document with currency conversion:');
    console.log(`  - Transfer Number: ${transferWithCurrency[0].transfer_number}`);
    console.log(`  - Original Value: ${transferWithCurrency[0].total_value} ${transferWithCurrency[0].currency}`);
    console.log(`  - Exchange Rate: ${transferWithCurrency[0].exchange_rate} (${transferWithCurrency[0].exchange_rate_source})`);
    console.log(`  - RON Equivalent: ${Number(transferWithCurrency[0].ron_equivalent).toFixed(2)} RON`);
    
    console.log('\n🎉 Successfully tested inventory operations with currency exchange rates!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await queryClient.end();
  }
}

// Run the test
testInventoryWithExchangeRates().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});