/**
 * Add Parent ID Column To Companies Table Migration
 * 
 * Acest script adaugă coloana 'parent_id' la tabela companies
 * pentru a permite stabilirea relației între companii și francize.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';

// Încarcă variabilele de mediu
dotenv.config();

/**
 * Adaugă coloana 'parent_id' la tabela 'companies'
 */
async function addParentIdColumnToCompanies() {
  console.log('Starting migration: Add parent_id column to companies table');
  
  // Creează conexiunea la baza de date
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  // Creează clientul SQL
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);
  
  try {
    // Verifică dacă coloana există deja
    const checkColumnQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'companies' AND column_name = 'parent_id';
    `;
    
    const columnExists = await sql.unsafe(checkColumnQuery);
    
    if (columnExists.length > 0) {
      console.log('Column parent_id already exists in companies table');
      return;
    }
    
    // Adaugă coloana 'parent_id' la tabela 'companies'
    const addColumnQuery = `
      ALTER TABLE companies 
      ADD COLUMN parent_id uuid REFERENCES companies(id);
    `;
    
    await sql.unsafe(addColumnQuery);
    console.log('Added parent_id column to companies table');
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Execută migrarea
addParentIdColumnToCompanies()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });