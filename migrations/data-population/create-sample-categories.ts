/**
 * Create Sample Categories Script
 * 
 * This script inserts sample product categories into the database
 * to demonstrate the category management functionality.
 */

import { DrizzleService } from './server/common/drizzle';
import { inventoryCategories } from './shared/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, sql } from 'drizzle-orm';

// Define sample categories structure
const sampleCategories = [
  // Root categories
  { id: uuidv4(), name: 'Electronice', description: 'Produse electronice și electrocasnice', parentId: null },
  { id: uuidv4(), name: 'Mobilă', description: 'Mobilier pentru casă și birou', parentId: null },
  { id: uuidv4(), name: 'Vestimentație', description: 'Haine și accesorii', parentId: null },
  { id: uuidv4(), name: 'Papetărie', description: 'Articole de birou și papetărie', parentId: null },
  { id: uuidv4(), name: 'IT&C', description: 'Echipamente IT și comunicații', parentId: null },
];

// Define sub-categories (will be populated after parent categories are created)
let subCategories: any[] = [];

// Create and insert the sample categories
async function createSampleCategories() {
  try {
    console.log('Creating sample categories...');
    
    // Create drizzle service
    const drizzleService = new DrizzleService();
    
    // Insert root categories
    for (const category of sampleCategories) {
      try {
        console.log(`Creating category: ${category.name}`);
        
        // Check if category already exists
        const existingCategory = await drizzleService.executeQuery(
          sql`SELECT * FROM inventory_categories WHERE name = ${category.name} LIMIT 1`
        );
        
        if (existingCategory && existingCategory.length > 0) {
          console.log(`Category ${category.name} already exists, skipping...`);
          continue;
        }
        
        // Insert the category
        await drizzleService.insert(inventoryCategories).values({
          id: category.id,
          name: category.name,
          description: category.description,
          parentId: category.parentId,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        });
        
        console.log(`Created category: ${category.name}`);
      } catch (error) {
        console.error(`Error creating category ${category.name}:`, error);
      }
    }
    
    // Now build sub-categories based on the created parent categories
    const electronicsId = sampleCategories[0].id;
    const furnitureId = sampleCategories[1].id;
    const clothingId = sampleCategories[2].id;
    const stationeryId = sampleCategories[3].id;
    const itcId = sampleCategories[4].id;
    
    subCategories = [
      // Electronics sub-categories
      { id: uuidv4(), name: 'Telefoane', description: 'Telefoane mobile și accesorii', parentId: electronicsId },
      { id: uuidv4(), name: 'Televizoare', description: 'Televizoare și accesorii', parentId: electronicsId },
      { id: uuidv4(), name: 'Electrocasnice mari', description: 'Frigidere, mașini de spălat, etc.', parentId: electronicsId },
      { id: uuidv4(), name: 'Electrocasnice mici', description: 'Mixere, blendere, prăjitoare de pâine, etc.', parentId: electronicsId },
      
      // Furniture sub-categories
      { id: uuidv4(), name: 'Mobilă living', description: 'Canapele, fotolii, biblioteci', parentId: furnitureId },
      { id: uuidv4(), name: 'Mobilă birou', description: 'Birouri, scaune de birou, corpuri de birou', parentId: furnitureId },
      { id: uuidv4(), name: 'Mobilă dormitor', description: 'Paturi, noptiere, dulapuri', parentId: furnitureId },
      { id: uuidv4(), name: 'Mobilă bucătărie', description: 'Mese, scaune, corpuri de bucătărie', parentId: furnitureId },
      
      // Clothing sub-categories
      { id: uuidv4(), name: 'Bărbați', description: 'Haine și accesorii pentru bărbați', parentId: clothingId },
      { id: uuidv4(), name: 'Femei', description: 'Haine și accesorii pentru femei', parentId: clothingId },
      { id: uuidv4(), name: 'Copii', description: 'Haine și accesorii pentru copii', parentId: clothingId },
      { id: uuidv4(), name: 'Încălțăminte', description: 'Încălțăminte pentru toate vârstele', parentId: clothingId },
      
      // Stationery sub-categories
      { id: uuidv4(), name: 'Rechizite', description: 'Caiete, pixuri, creioane', parentId: stationeryId },
      { id: uuidv4(), name: 'Articole birou', description: 'Perforatoare, capsatoare, bibliorafturi', parentId: stationeryId },
      { id: uuidv4(), name: 'Hârtie', description: 'Hârtie pentru imprimantă, hârtie colorată', parentId: stationeryId },
      
      // IT&C sub-categories
      { id: uuidv4(), name: 'Laptopuri', description: 'Laptopuri și accesorii', parentId: itcId },
      { id: uuidv4(), name: 'Calculatoare', description: 'Calculatoare desktop și componente', parentId: itcId },
      { id: uuidv4(), name: 'Periferice', description: 'Tastaturi, mouse-uri, monitoare', parentId: itcId },
      { id: uuidv4(), name: 'Imprimante', description: 'Imprimante și consumabile', parentId: itcId },
      { id: uuidv4(), name: 'Rețelistică', description: 'Routere, switch-uri, cabluri', parentId: itcId },
    ];
    
    // Insert sub-categories
    for (const category of subCategories) {
      try {
        console.log(`Creating sub-category: ${category.name}`);
        
        // Check if category already exists
        const existingCategory = await drizzleService.executeQuery(
          sql`SELECT * FROM inventory_categories WHERE name = ${category.name} LIMIT 1`
        );
        
        if (existingCategory && existingCategory.length > 0) {
          console.log(`Sub-category ${category.name} already exists, skipping...`);
          continue;
        }
        
        // Insert the category
        await drizzleService.insert(inventoryCategories).values({
          id: category.id,
          name: category.name,
          description: category.description,
          parentId: category.parentId,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        });
        
        console.log(`Created sub-category: ${category.name}`);
      } catch (error) {
        console.error(`Error creating sub-category ${category.name}:`, error);
      }
    }
    
    // Add level 3 categories (children of sub-categories)
    const phoneId = subCategories[0].id;  // Telefoane
    const tvId = subCategories[1].id;     // Televizoare
    const laptopId = subCategories[16].id; // Laptopuri
    
    const nestedCategories = [
      // Telefoane sub-categories
      { id: uuidv4(), name: 'Smartphone', description: 'Telefoane inteligente', parentId: phoneId },
      { id: uuidv4(), name: 'Telefoane clasice', description: 'Telefoane mobile clasice', parentId: phoneId },
      { id: uuidv4(), name: 'Accesorii telefoane', description: 'Huse, folii, încărcătoare', parentId: phoneId },
      
      // Televizoare sub-categories
      { id: uuidv4(), name: 'LED', description: 'Televizoare LED', parentId: tvId },
      { id: uuidv4(), name: 'OLED', description: 'Televizoare OLED', parentId: tvId },
      { id: uuidv4(), name: 'Smart TV', description: 'Televizoare Smart', parentId: tvId },
      
      // Laptopuri sub-categories
      { id: uuidv4(), name: 'Laptopuri business', description: 'Laptopuri pentru uz profesional', parentId: laptopId },
      { id: uuidv4(), name: 'Laptopuri gaming', description: 'Laptopuri pentru jocuri', parentId: laptopId },
      { id: uuidv4(), name: 'Ultrabook', description: 'Laptopuri subțiri și ușoare', parentId: laptopId },
    ];
    
    // Insert nested categories
    for (const category of nestedCategories) {
      try {
        console.log(`Creating nested category: ${category.name}`);
        
        // Check if category already exists
        const existingCategory = await drizzleService.executeQuery(
          sql`SELECT * FROM inventory_categories WHERE name = ${category.name} LIMIT 1`
        );
        
        if (existingCategory && existingCategory.length > 0) {
          console.log(`Nested category ${category.name} already exists, skipping...`);
          continue;
        }
        
        // Insert the category
        await drizzleService.insert(inventoryCategories).values({
          id: category.id,
          name: category.name,
          description: category.description,
          parentId: category.parentId,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true
        });
        
        console.log(`Created nested category: ${category.name}`);
      } catch (error) {
        console.error(`Error creating nested category ${category.name}:`, error);
      }
    }
    
    console.log('Sample categories created successfully!');
    
    // Query to verify the categories were created
    const countResult = await drizzleService.executeQuery(
      sql`SELECT COUNT(*) FROM inventory_categories`
    );
    
    console.log(`Total categories in database: ${countResult[0].count}`);
    
  } catch (error) {
    console.error('Error creating sample categories:', error);
  }
}

// Execute the function
createSampleCategories()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });