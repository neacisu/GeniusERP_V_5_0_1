/**
 * Script pentru adăugarea categoriilor de exemplu în baza de date
 */
import postgres from 'postgres';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';

async function createSampleCategories() {
  console.log('Connecting to database...');
  
  // Conectare directă la baza de date
  const client = postgres(process.env.DATABASE_URL as string, { ssl: true });
  
  // Categorii părinte (nivel 1)
  const rootCategories = [
    { id: uuidv4(), name: 'Electronice', description: 'Produse electronice și electrocasnice', parentId: null },
    { id: uuidv4(), name: 'Mobilă', description: 'Mobilier pentru casă și birou', parentId: null },
    { id: uuidv4(), name: 'Vestimentație', description: 'Haine și accesorii', parentId: null },
    { id: uuidv4(), name: 'Papetărie', description: 'Articole de birou și papetărie', parentId: null },
    { id: uuidv4(), name: 'IT&C', description: 'Echipamente IT și comunicații', parentId: null },
  ];
  
  console.log('Inserting root categories...');
  
  // Adăugare categorii părinte
  for (const category of rootCategories) {
    try {
      // Verifică dacă categoria există deja
      const existingCategory = await client`
        SELECT * FROM inventory_categories 
        WHERE name = ${category.name}
        LIMIT 1
      `;
      
      if (existingCategory.length > 0) {
        console.log(`Category ${category.name} already exists, skipping...`);
        continue;
      }
      
      // Inserare categorie
      await client`
        INSERT INTO inventory_categories (id, name, description, parent_id, created_at, updated_at)
        VALUES (
          ${category.id}, 
          ${category.name}, 
          ${category.description}, 
          ${category.parentId},
          ${new Date()},
          ${new Date()}
        )
      `;
      
      console.log(`Added root category: ${category.name}`);
    } catch (error) {
      console.error(`Error adding category ${category.name}:`, error);
    }
  }
  
  // Categorii nivel 2 (subcategorii)
  const electronicsId = rootCategories[0].id;
  const furnitureId = rootCategories[1].id;
  const clothingId = rootCategories[2].id;
  const stationeryId = rootCategories[3].id;
  const itcId = rootCategories[4].id;
  
  const subCategories = [
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
  
  console.log('Inserting sub-categories...');
  
  // Adăugare subcategorii
  for (const category of subCategories) {
    try {
      // Verifică dacă categoria există deja
      const existingCategory = await client`
        SELECT * FROM inventory_categories 
        WHERE name = ${category.name}
        LIMIT 1
      `;
      
      if (existingCategory.length > 0) {
        console.log(`Sub-category ${category.name} already exists, skipping...`);
        continue;
      }
      
      // Inserare subcategorie
      await client`
        INSERT INTO inventory_categories (id, name, description, parent_id, created_at, updated_at)
        VALUES (
          ${category.id}, 
          ${category.name}, 
          ${category.description}, 
          ${category.parentId},
          ${new Date()},
          ${new Date()}
        )
      `;
      
      console.log(`Added sub-category: ${category.name}`);
    } catch (error) {
      console.error(`Error adding sub-category ${category.name}:`, error);
    }
  }
  
  // Categorii nivel 3
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
  
  console.log('Inserting nested categories...');
  
  // Adăugare categorii nivel 3
  for (const category of nestedCategories) {
    try {
      // Verifică dacă categoria există deja
      const existingCategory = await client`
        SELECT * FROM inventory_categories 
        WHERE name = ${category.name}
        LIMIT 1
      `;
      
      if (existingCategory.length > 0) {
        console.log(`Nested category ${category.name} already exists, skipping...`);
        continue;
      }
      
      // Inserare categorie nivel 3
      await client`
        INSERT INTO inventory_categories (id, name, description, parent_id, created_at, updated_at)
        VALUES (
          ${category.id}, 
          ${category.name}, 
          ${category.description}, 
          ${category.parentId},
          ${new Date()},
          ${new Date()}
        )
      `;
      
      console.log(`Added nested category: ${category.name}`);
    } catch (error) {
      console.error(`Error adding nested category ${category.name}:`, error);
    }
  }
  
  // Verificare numar total de categorii
  const countResult = await client`SELECT COUNT(*) FROM inventory_categories`;
  console.log(`Total categories in database: ${countResult[0].count}`);
  
  // Închidere conexiune
  await client.end();
  console.log('Database connection closed');
}

// Executare
createSampleCategories()
  .then(() => {
    console.log('Sample categories created successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });