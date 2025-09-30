/**
 * Financial Data Tables Creation Script
 * 
 * Acest script creează tabelele necesare pentru stocarea datelor financiare
 * obținute de la ANAF folosind Drizzle ORM.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import dotenv from 'dotenv';
import { financialData, financialDataErrors, financialDataJobs, financialDataIndexes } from './server/modules/crm/schema/financial-data.schema';

dotenv.config();

async function createFinancialDataTables() {
  console.log('🏦 Crearea tabelelor pentru datele financiare ANAF...');

  // Verificăm existența variabilei de mediu DATABASE_URL
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ Variabila de mediu DATABASE_URL nu este definită!');
    process.exit(1);
  }

  // Conectare la baza de date
  const client = postgres(dbUrl);
  const db = drizzle(client);

  try {
    // Creare tabele folosind schema Drizzle
    console.log('📊 Crearea tabelului financial_data...');
    await db.execute(` 
      CREATE TABLE IF NOT EXISTS financial_data (
        id SERIAL PRIMARY KEY,
        cui VARCHAR(20) NOT NULL,
        company_id VARCHAR(36) NOT NULL,
        fiscal_year INTEGER NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        caen_code INTEGER NOT NULL,
        caen_description VARCHAR(255) NOT NULL,
        indicators JSONB NOT NULL,
        fetched_at TIMESTAMP NOT NULL DEFAULT NOW(),
        is_processed BOOLEAN NOT NULL DEFAULT TRUE,
        processing_errors VARCHAR(500),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_by VARCHAR(36),
        updated_by VARCHAR(36)
      )
    `);

    console.log('📊 Crearea tabelului financial_data_jobs...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS financial_data_jobs (
        id SERIAL PRIMARY KEY,
        cui VARCHAR(20) NOT NULL,
        company_id VARCHAR(36) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        start_year INTEGER NOT NULL,
        end_year INTEGER NOT NULL,
        current_year INTEGER,
        progress INTEGER NOT NULL DEFAULT 0,
        total_years INTEGER NOT NULL,
        last_processed_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_by VARCHAR(36)
      )
    `);

    console.log('📊 Crearea tabelului financial_data_errors...');
    await db.execute(`
      CREATE TABLE IF NOT EXISTS financial_data_errors (
        id SERIAL PRIMARY KEY,
        cui VARCHAR(20) NOT NULL,
        fiscal_year INTEGER NOT NULL,
        error_message TEXT NOT NULL,
        retry_count INTEGER NOT NULL DEFAULT 0,
        last_attempt_at TIMESTAMP NOT NULL DEFAULT NOW(),
        is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Crearea indecșilor pentru performanță
    console.log('📈 Crearea indecșilor pentru performanță optimă...');
    for (const indexQuery of financialDataIndexes) {
      await db.execute(indexQuery);
    }

    console.log('✅ Tabelele pentru datele financiare ANAF au fost create cu succes!');
  } catch (error) {
    console.error('❌ Eroare la crearea tabelelor:', error);
  } finally {
    // Închidere conexiune la final
    await client.end();
  }
}

// Executare script
createFinancialDataTables()
  .then(() => {
    console.log('✅ Migrarea tabelelor pentru datele financiare s-a finalizat cu succes!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Eroare la migrarea tabelelor:', error);
    process.exit(1);
  });