/**
 * Script pentru adăugarea coloanei social_capital în tabelul companies
 * 
 * Această abordare utilizează SQL direct pentru a adăuga coloana, fiind
 * mai robustă față de diferențele dintre schema ORM și schema reală din baza de date.
 */

import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Încarcă variabilele din .env
dotenv.config();

// Funcția principală
async function addSocialCapitalColumn() {
  console.log('Inițializare adăugare coloană social_capital...');
  
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('URL-ul bazei de date lipsește din variabilele de mediu!');
    process.exit(1);
  }
  
  // Creează conexiunea la baza de date
  const sql = postgres(connectionString);
  
  try {
    // Verifică dacă coloana există deja
    console.log('Se verifică dacă coloana există deja...');
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'companies' 
      AND column_name = 'social_capital'
    `;
    
    if (columnCheck.length > 0) {
      console.log('Coloana social_capital există deja în tabelul companies.');
      return;
    }
    
    // Adaugă coloana social_capital
    console.log('Se adaugă coloana social_capital...');
    await sql`
      ALTER TABLE companies 
      ADD COLUMN social_capital DECIMAL(15,2)
    `;
    
    console.log('✅ Coloana social_capital a fost adăugată cu succes!');
    
    // Verifică după adăugare
    const verifyColumn = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'companies' 
      AND column_name = 'social_capital'
    `;
    
    if (verifyColumn.length > 0) {
      console.log('✅ Confirmată existența coloanei social_capital în baza de date.');
    } else {
      console.warn('⚠️ Coloana nu a fost găsită după adăugare!');
    }
    
  } catch (error) {
    console.error('❌ Eroare la adăugarea coloanei:', error);
  } finally {
    // Închide conexiunea
    await sql.end();
    console.log('Conexiunea la baza de date a fost închisă.');
  }
}

// Execută funcția
addSocialCapitalColumn()
  .then(() => {
    console.log('Procesul de adăugare a coloanei s-a finalizat.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Eroare la execuția scriptului:', error);
    process.exit(1);
  });