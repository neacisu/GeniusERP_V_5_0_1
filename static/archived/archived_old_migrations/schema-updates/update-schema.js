import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log("Connecting to database...");
  const client = postgres(process.env.DATABASE_URL);

  try {
    console.log("Adding 'price_includes_vat' column to inventory_products table...");
    await client.unsafe(`
      ALTER TABLE inventory_products 
      ADD COLUMN IF NOT EXISTS price_includes_vat BOOLEAN DEFAULT TRUE
    `);
    console.log("Successfully added 'price_includes_vat' column!");
  } catch (error) {
    console.error("Error updating the schema:", error);
  } finally {
    console.log("Closing database connection...");
    await client.end();
    console.log("Done!");
  }
}

main().catch(console.error);