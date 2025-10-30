/**
 * Add Type Column To Companies Table Migration
 * 
 * Acest script adaugă coloana 'type' la tabela companies
 * pentru a permite identificarea francizelor.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import dotenv from 'dotenv';
import { CompanyType } from '../server/modules/company/schema/company.schema';

// Încarcă variabilele de mediu
dotenv.config();

/**
 * Adaugă coloana 'type' la tabela 'companies'
 */
async function addTypeColumnToCompanies() {
  console.log('Starting migration: Add type column to companies table');
  
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
      WHERE table_name = 'companies' AND column_name = 'type';
    `;
    
    const columnExists = await sql.unsafe(checkColumnQuery);
    
    if (columnExists.length > 0) {
      console.log('Column type already exists in companies table');
      return;
    }
    
    // Creează tipul enum pentru type dacă nu există
    const createEnumTypeQuery = `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'company_type') THEN
          CREATE TYPE company_type AS ENUM (${Object.values(CompanyType).map(type => `'${type}'`).join(', ')});
        END IF;
      END
      $$;
    `;
    
    await sql.unsafe(createEnumTypeQuery);
    console.log('Created company_type enum type if not exists');
    
    // Adaugă coloana 'type' la tabela 'companies'
    const addColumnQuery = `
      ALTER TABLE companies 
      ADD COLUMN IF NOT EXISTS type company_type DEFAULT '${CompanyType.HEADQUARTERS}';
    `;
    
    await sql.unsafe(addColumnQuery);
    console.log('Added type column to companies table');
    
    // Actualizează valorile existente
    const updateFranchisesQuery = `
      UPDATE companies
      SET type = '${CompanyType.FRANCHISE}'
      WHERE parent_id IS NOT NULL;
    `;
    
    await sql.unsafe(updateFranchisesQuery);
    console.log('Updated franchise records');
    
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Execută migrarea
addTypeColumnToCompanies()
  .then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });