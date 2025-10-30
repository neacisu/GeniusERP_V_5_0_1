/**
 * Manual migration script for accounting schema updates
 * 
 * Aplică schimbările din 20250107_01_add_journal_sequences_and_fix_periods.sql
 * pentru a nu depinde de drizzle-kit interactive mode
 */

import { getClient } from '../common/drizzle';

async function applyAccountingMigration() {
  console.log('🚀 Aplicare migrație schema accounting...');
  
  const sql = getClient();
  
  try {
    // 1. Creare tabel document_counters
    console.log('📋 Creare tabel document_counters...');
    await sql`
      CREATE TABLE IF NOT EXISTS document_counters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL,
        counter_type TEXT NOT NULL,
        series TEXT NOT NULL,
        year NUMERIC NOT NULL,
        last_number NUMERIC NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        
        UNIQUE(company_id, counter_type, series, year)
      )
    `;
    
    // 2. Creare indexuri pentru performance
    console.log('🔍 Creare indexuri document_counters...');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_document_counters_company_type 
      ON document_counters(company_id, counter_type)
    `;
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_document_counters_series_year 
      ON document_counters(series, year)
    `;
    
    // 3. Actualizare tabel fiscal_periods
    console.log('📅 Actualizare tabel fiscal_periods...');
    
    // Verifică dacă tabelul există
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'fiscal_periods'
      )
    `;
    
    if (tableExists[0].exists) {
      // Adaugă coloanele noi
      await sql`ALTER TABLE fiscal_periods ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open'`;
      await sql`ALTER TABLE fiscal_periods ADD COLUMN IF NOT EXISTS reopened_at TIMESTAMP`;
      await sql`ALTER TABLE fiscal_periods ADD COLUMN IF NOT EXISTS reopened_by UUID`;
      await sql`ALTER TABLE fiscal_periods ADD COLUMN IF NOT EXISTS reopening_reason TEXT`;
      
      // Verifică dacă is_closed este numeric
      const columnInfo = await sql`
        SELECT data_type FROM information_schema.columns
        WHERE table_name = 'fiscal_periods' AND column_name = 'is_closed'
      `;
      
      if (columnInfo.length > 0 && columnInfo[0].data_type === 'numeric') {
        console.log('🔧 Conversie is_closed de la numeric la boolean...');
        
        // Conversie numeric -> boolean
        await sql`ALTER TABLE fiscal_periods ADD COLUMN is_closed_bool BOOLEAN DEFAULT false`;
        await sql`UPDATE fiscal_periods SET is_closed_bool = (is_closed::integer = 1)`;
        await sql`ALTER TABLE fiscal_periods DROP COLUMN is_closed`;
        await sql`ALTER TABLE fiscal_periods RENAME COLUMN is_closed_bool TO is_closed`;
      }
      
      // Adaugă indexuri și constrângeri
      await sql`
        CREATE INDEX IF NOT EXISTS idx_fiscal_periods_company_dates 
        ON fiscal_periods(company_id, start_date, end_date)
      `;
      
      await sql`
        CREATE INDEX IF NOT EXISTS idx_fiscal_periods_status 
        ON fiscal_periods(company_id, status, is_closed)
      `;
      
      // Adaugă constrângerea (fără IF NOT EXISTS care nu e suportată)
      try {
        await sql`
          ALTER TABLE fiscal_periods 
          ADD CONSTRAINT ck_fiscal_periods_status 
          CHECK (status IN ('open', 'soft_close', 'hard_close'))
        `;
      } catch (error: any) {
        if (error.code === '42710') { // Constraint already exists
          console.log('ℹ️ Constrângerea ck_fiscal_periods_status deja există');
        } else {
          throw error;
        }
      }
    } else {
      console.log('⚠️ Tabelul fiscal_periods nu există - se va crea prin schema');
    }
    
    // 4. Actualizare tabel ledger_entries pentru journal_number și date
    console.log('📓 Actualizare tabel ledger_entries...');
    
    const ledgerExists = await sql`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'ledger_entries'
      )
    `;
    
    if (ledgerExists[0].exists) {
      await sql`ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS journal_number TEXT`;
      await sql`ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS entry_date TIMESTAMP`;
      await sql`ALTER TABLE ledger_entries ADD COLUMN IF NOT EXISTS document_date TIMESTAMP`;
      
      // Index pentru căutare
      await sql`
        CREATE INDEX IF NOT EXISTS idx_ledger_entries_journal_number 
        ON ledger_entries(journal_number) WHERE journal_number IS NOT NULL
      `;
      
      await sql`
        CREATE INDEX IF NOT EXISTS idx_ledger_entries_dates 
        ON ledger_entries(entry_date, document_date)
      `;
    } else {
      console.log('⚠️ Tabelul ledger_entries nu există - se va crea prin schema');
    }
    
    // 5. Adaugă comentarii pentru documentare
    await sql`
      COMMENT ON TABLE document_counters IS 
      'Sequential numbering counters for journals and documents - OMFP 2634/2015 compliance'
    `;
    
    if (tableExists[0].exists) {
      await sql`
        COMMENT ON TABLE fiscal_periods IS 
        'Accounting periods with lock status - Romanian accounting standards'
      `;
    }
    
    console.log('✅ Migrația a fost aplicată cu succes!');
    console.log('📊 Schema actualizată conform OMFP 2634/2015');
    
  } catch (error) {
    console.error('❌ Eroare la aplicarea migrației:', error);
    throw error;
  }
}

// Rulează migrația dacă scriptul este apelat direct
const isMain = process.argv[1].endsWith('apply-accounting-migration.ts');
if (isMain) {
  applyAccountingMigration()
    .then(() => {
      console.log('🎉 Migrație completată cu succes!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Eroare critică în migrație:', error);
      process.exit(1);
    });
}

export { applyAccountingMigration };
