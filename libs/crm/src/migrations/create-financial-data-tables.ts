/**
 * Script pentru crearea tabelelor de date financiare ANAF în baza de date
 * 
 * Acest script creează tabelele necesare pentru stocarea datelor financiare
 * obținute de la ANAF, inclusiv indicatori financiari, job-uri de procesare și erori.
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import {
  financialData, 
  financialDataJobs, 
  financialDataErrors,
  financialDataIndexes
} from '../schema/financial-data.schema';

dotenv.config();

// Funcție pentru crearea tabelelor direct folosind SQL
async function createFinancialDataTables() {
  try {
    // Conectare la baza de date folosind string-ul de conexiune din mediu
    const connectionString = process.env.DATABASE_URL || '';
    if (!connectionString) {
      throw new Error('DATABASE_URL nu este definit în variabilele de mediu');
    }

    console.log('🔄 Conectare la baza de date PostgreSQL...');
    
    // Client SQL pentru migrări
    const client = postgres(connectionString, { max: 1 });
    
    console.log('✅ Conectare reușită, creez tabelele de date financiare ANAF...');

    // Verifică existența tabelelor înainte de creare pentru a evita erorile
    const tableExists = async (tableName: string): Promise<boolean> => {
      const result = await client`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public'
          AND table_name = ${tableName}
        )
      `;
      return result[0]?.exists || false;
    };

    // SQL pentru crearea tabelului financial_data_errors
    const createErrorsTableSQL = `
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
    `;

    // SQL pentru crearea tabelului financial_data
    const createFinancialDataTableSQL = `
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
    `;

    // SQL pentru crearea tabelului financial_data_jobs
    const createJobsTableSQL = `
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
    `;

    // Creare tabel financial_data_errors dacă nu există
    if (!(await tableExists('financial_data_errors'))) {
      console.log('📊 Creare tabel financial_data_errors...');
      await client.unsafe(createErrorsTableSQL);
      console.log('✅ Tabel financial_data_errors creat cu succes');
    } else {
      console.log('ℹ️ Tabelul financial_data_errors există deja');
    }
    
    // Creare tabel financial_data dacă nu există
    if (!(await tableExists('financial_data'))) {
      console.log('📊 Creare tabel financial_data...');
      await client.unsafe(createFinancialDataTableSQL);
      console.log('✅ Tabel financial_data creat cu succes');
    } else {
      console.log('ℹ️ Tabelul financial_data există deja');
    }
    
    // Creare tabel financial_data_jobs dacă nu există
    if (!(await tableExists('financial_data_jobs'))) {
      console.log('📊 Creare tabel financial_data_jobs...');
      await client.unsafe(createJobsTableSQL);
      console.log('✅ Tabel financial_data_jobs creat cu succes');
    } else {
      console.log('ℹ️ Tabelul financial_data_jobs există deja');
    }
    
    // Creare indecși pentru performanță
    console.log('📊 Creare indecși pentru tabele...');
    for (const indexSql of financialDataIndexes) {
      try {
        await client.unsafe(indexSql);
        console.log(`✅ Index creat: ${indexSql.substring(0, 60)}...`);
      } catch (error: any) {
        if (error.message.includes('already exists')) {
          console.log(`ℹ️ Index există deja: ${indexSql.substring(0, 60)}...`);
        } else {
          console.error(`❌ Eroare la crearea indexului: ${error.message}`);
        }
      }
    }
    
    console.log('🏁 Toate tabelele și indecșii de date financiare ANAF au fost create cu succes!');
    
    // Închide conexiunile la baza de date
    await client.end();
    
  } catch (error: any) {
    console.error(`❌ Eroare la crearea tabelelor: ${error.message}`);
    process.exit(1);
  }
}

// Execută funcția de creare a tabelelor
createFinancialDataTables();