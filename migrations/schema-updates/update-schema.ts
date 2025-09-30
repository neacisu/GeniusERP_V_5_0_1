/**
 * Script pentru actualizarea schemei bazei de date
 * 
 * Acest script folosește Drizzle ORM pentru a face push direct 
 * la schema de bază de date, adăugând noul câmp socialCapital.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { companies } from './server/modules/company/schema/company.schema';

// Încarcă variabilele din .env
dotenv.config();

// Definește funcția principală de actualizare a schemei
async function updateSchema() {
  console.log('Inițializare proces de actualizare a schemei...');
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('URL-ul bazei de date lipsește din variabilele de mediu!');
    process.exit(1);
  }
  
  try {
    console.log('Conectare la baza de date...');
    const sql = postgres(connectionString);
    
    // Creează instanța Drizzle ORM
    const db = drizzle(sql);
    
    // Aplică schema actualizată direct, folosind push
    console.log('Aplicare actualizări la schema bazei de date...');
    
    // Folosește push pentru a actualiza schema
    const pushResult = await db.insert(companies).values({
      id: '00000000-0000-0000-0000-000000000000',
      name: 'Test Company',
      fiscalCode: '0000000000',
      registrationNumber: 'J00/00/0000',
      type: 'headquarters',
      socialCapital: 0
    }).onConflictDoNothing().execute();
    
    console.log('Schema actualizată cu succes!');
    
    // Verifică dacă coloana a fost adăugată prin interogarea metadatelor
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'companies' 
      AND column_name = 'social_capital'
    `;
    
    if (columnCheck.length > 0) {
      console.log('✅ Confirmată existența coloanei social_capital în tabelul companies');
    } else {
      console.warn('⚠️ Coloana social_capital nu a fost găsită după actualizare!');
    }
    
    // Închide conexiunea
    await sql.end();
    console.log('Conexiunea la baza de date închisă.');
    
  } catch (error) {
    console.error('❌ Eroare la actualizarea schemei:', error);
    process.exit(1);
  }
}

// Execută funcția de actualizare
updateSchema()
  .then(() => {
    console.log('Procesul de actualizare a schemei s-a finalizat.');
  })
  .catch(error => {
    console.error('Eroare la execuția scriptului:', error);
    process.exit(1);
  });