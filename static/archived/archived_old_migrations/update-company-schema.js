/**
 * Script pentru actualizarea schemei de companii - adăugare câmp social_capital
 * 
 * Acest script adaugă un nou câmp social_capital în tabelul companies
 * în baza de date din Drizzle schema.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

async function updateCompanySchema() {
  console.log("Începere actualizare schemă companies...");
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("Nu s-a găsit URL-ul bazei de date în variabilele de mediu!");
    process.exit(1);
  }
  
  // Crearea conexiunii la baza de date
  const sql = postgres(connectionString);
  
  try {
    console.log("Se verifică dacă coloana social_capital există deja...");
    
    // Verifică dacă coloana există deja pentru a evita erori
    const checkColumnExists = await sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'companies'
      AND column_name = 'social_capital';
    `;
    
    if (checkColumnExists.length > 0) {
      console.log("Coloana social_capital există deja, nu este necesară actualizarea.");
      return;
    }
    
    // Adaugă coloana social_capital la tabelul companies
    console.log("Se adaugă coloana social_capital la tabelul companies...");
    await sql`
      ALTER TABLE companies
      ADD COLUMN social_capital DECIMAL(15,2);
    `;
    
    console.log("✅ Coloana social_capital a fost adăugată cu succes!");
  } catch (error) {
    console.error("❌ Eroare la actualizarea schemei:", error);
  } finally {
    // Închide conexiunea la baza de date
    await sql.end();
    console.log("Conexiunea la baza de date a fost închisă.");
  }
}

// Execută funcția de actualizare a schemei
updateCompanySchema()
  .then(() => {
    console.log("Procesul de actualizare a schemei a fost finalizat.");
  })
  .catch((error) => {
    console.error("Eroare la executarea script-ului:", error);
    process.exit(1);
  });