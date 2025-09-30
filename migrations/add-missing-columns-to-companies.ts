/**
 * Add Missing Columns To Companies Table Migration
 * 
 * Acest script adaugă coloanele care sunt definite în schema companies
 * dar nu există în baza de date.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';

// Încarcă variabilele de mediu
dotenv.config();

/**
 * Adaugă coloanele lipsă la tabela 'companies'
 */
async function addMissingColumnsToCompanies() {
  console.log('Starting migration: Add missing columns to companies table');
  
  // Creează conexiunea la baza de date
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  // Creează clientul SQL
  const sql = postgres(connectionString, { max: 1 });
  const db = drizzle(sql);
  
  try {
    // Verifică și adaugă coloana vat_number
    const checkVatNumberQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'companies' AND column_name = 'vat_number';
    `;
    
    const vatNumberExists = await sql.unsafe(checkVatNumberQuery);
    
    if (vatNumberExists.length === 0) {
      const addVatNumberQuery = `
        ALTER TABLE companies 
        ADD COLUMN vat_number varchar(50);
      `;
      
      await sql.unsafe(addVatNumberQuery);
      console.log('Added vat_number column to companies table');
    } else {
      console.log('Column vat_number already exists');
    }
    
    // Verifică și adaugă coloana postal_code
    const checkPostalCodeQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'companies' AND column_name = 'postal_code';
    `;
    
    const postalCodeExists = await sql.unsafe(checkPostalCodeQuery);
    
    if (postalCodeExists.length === 0) {
      const addPostalCodeQuery = `
        ALTER TABLE companies 
        ADD COLUMN postal_code varchar(20);
      `;
      
      await sql.unsafe(addPostalCodeQuery);
      console.log('Added postal_code column to companies table');
    } else {
      console.log('Column postal_code already exists');
    }
    
    // Verifică și adaugă coloana website
    const checkWebsiteQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'companies' AND column_name = 'website';
    `;
    
    const websiteExists = await sql.unsafe(checkWebsiteQuery);
    
    if (websiteExists.length === 0) {
      const addWebsiteQuery = `
        ALTER TABLE companies 
        ADD COLUMN website varchar(255);
      `;
      
      await sql.unsafe(addWebsiteQuery);
      console.log('Added website column to companies table');
    } else {
      console.log('Column website already exists');
    }
    
    // Verifică și adaugă coloana settings
    const checkSettingsQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'companies' AND column_name = 'settings';
    `;
    
    const settingsExists = await sql.unsafe(checkSettingsQuery);
    
    if (settingsExists.length === 0) {
      const addSettingsQuery = `
        ALTER TABLE companies 
        ADD COLUMN settings text;
      `;
      
      await sql.unsafe(addSettingsQuery);
      console.log('Added settings column to companies table');
    } else {
      console.log('Column settings already exists');
    }
    
    // Verifică și adaugă coloana created_by
    const checkCreatedByQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'companies' AND column_name = 'created_by';
    `;
    
    const createdByExists = await sql.unsafe(checkCreatedByQuery);
    
    if (createdByExists.length === 0) {
      const addCreatedByQuery = `
        ALTER TABLE companies 
        ADD COLUMN created_by uuid;
      `;
      
      await sql.unsafe(addCreatedByQuery);
      console.log('Added created_by column to companies table');
    } else {
      console.log('Column created_by already exists');
    }
    
    // Verifică și adaugă coloana updated_by
    const checkUpdatedByQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'companies' AND column_name = 'updated_by';
    `;
    
    const updatedByExists = await sql.unsafe(checkUpdatedByQuery);
    
    if (updatedByExists.length === 0) {
      const addUpdatedByQuery = `
        ALTER TABLE companies 
        ADD COLUMN updated_by uuid;
      `;
      
      await sql.unsafe(addUpdatedByQuery);
      console.log('Added updated_by column to companies table');
    } else {
      console.log('Column updated_by already exists');
    }
    
    // Verifică și adaugă coloana deleted_at
    const checkDeletedAtQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'companies' AND column_name = 'deleted_at';
    `;
    
    const deletedAtExists = await sql.unsafe(checkDeletedAtQuery);
    
    if (deletedAtExists.length === 0) {
      const addDeletedAtQuery = `
        ALTER TABLE companies 
        ADD COLUMN deleted_at timestamp;
      `;
      
      await sql.unsafe(addDeletedAtQuery);
      console.log('Added deleted_at column to companies table');
    } else {
      console.log('Column deleted_at already exists');
    }
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Execută migrarea
addMissingColumnsToCompanies()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });