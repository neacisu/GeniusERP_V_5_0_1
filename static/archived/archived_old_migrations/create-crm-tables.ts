/**
 * Script pentru crearea tabelelor ANAF, fără a afecta alte tabele existente
 * Rulează direct SQL pentru crearea tabelei anaf_company_data
 */

import * as dotenv from 'dotenv';
import { getPostgresClient } from './server/common/drizzle/db';
import { sql } from 'drizzle-orm';
import { Logger } from './server/common/logger';

// Încărcam variabilele de mediu
dotenv.config();

const logger = new Logger('CRM-Migration');

async function createAnafTables() {
  const client = getPostgresClient();
  
  try {
    logger.info('Verificarea existenței tabelelor CRM...');
    
    // Verificăm dacă tabela există deja
    const tableExists = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'anaf_company_data'
      );
    `;
    
    if (tableExists[0].exists) {
      logger.info('Tabela anaf_company_data există deja');
      return;
    }
    
    logger.info('Crearea tabelei anaf_company_data...');
    
    // SQL pentru crearea tabelei anaf_company_data
    await client`
      CREATE TABLE "anaf_company_data" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "company_id" UUID,
        "customer_id" UUID,
        
        -- Date generale
        "cui" TEXT NOT NULL,
        "data_interogare" DATE NOT NULL,
        "denumire" TEXT,
        "adresa" TEXT,
        "nr_reg_com" TEXT,
        "telefon" TEXT,
        "fax" TEXT,
        "cod_postal" TEXT,
        "act" TEXT,
        "stare_inregistrare" TEXT,
        "data_inregistrare" DATE,
        "cod_caen" TEXT,
        "iban" TEXT,
        "status_ro_e_factura" BOOLEAN DEFAULT false,
        "organ_fiscal_competent" TEXT,
        "forma_de_proprietate" TEXT,
        "forma_organizare" TEXT,
        "forma_juridica" TEXT,
        
        -- Înregistrare în scop de TVA
        "scp_tva" BOOLEAN DEFAULT false,
        
        -- Ultima perioadă TVA (cea activă)
        "data_inceput_scp_tva" DATE,
        "data_sfarsit_scp_tva" DATE,
        "data_anul_imp_scp_tva" DATE,
        "mesaj_scp_tva" TEXT,
        
        -- Înregistrare TVA la încasare
        "data_inceput_tva_inc" DATE,
        "data_sfarsit_tva_inc" DATE,
        "data_actualizare_tva_inc" DATE,
        "data_publicare_tva_inc" DATE,
        "tip_act_tva_inc" TEXT,
        "status_tva_incasare" BOOLEAN DEFAULT false,
        
        -- Stare inactiv
        "data_inactivare" DATE,
        "data_reactivare" DATE,
        "data_publicare" DATE,
        "data_radiere" DATE,
        "status_inactivi" BOOLEAN DEFAULT false,
        
        -- Split TVA
        "data_inceput_split_tva" DATE,
        "data_anulare_split_tva" DATE,
        "status_split_tva" BOOLEAN DEFAULT false,
        
        -- Adresa sediu social
        "ss_denumire_strada" TEXT,
        "ss_numar_strada" TEXT,
        "ss_denumire_localitate" TEXT,
        "ss_cod_localitate" TEXT,
        "ss_denumire_judet" TEXT,
        "ss_cod_judet" TEXT,
        "ss_cod_judet_auto" TEXT,
        "ss_tara" TEXT,
        "ss_detalii_adresa" TEXT,
        "ss_cod_postal" TEXT,
        
        -- Adresa domiciliu fiscal
        "df_denumire_strada" TEXT,
        "df_numar_strada" TEXT,
        "df_denumire_localitate" TEXT,
        "df_cod_localitate" TEXT,
        "df_denumire_judet" TEXT,
        "df_cod_judet" TEXT,
        "df_cod_judet_auto" TEXT,
        "df_tara" TEXT,
        "df_detalii_adresa" TEXT,
        "df_cod_postal" TEXT,
        
        -- Istoricul tuturor perioadelor de TVA
        "perioade_tva" JSONB DEFAULT '[]'::JSONB,
        
        -- Date și metadate
        "raw_response" JSONB,
        "created_at" TIMESTAMPTZ DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ DEFAULT NOW(),
        "last_checked_at" TIMESTAMPTZ DEFAULT NOW(),
        "created_by" UUID,
        "updated_by" UUID,
        
        -- Flags pentru integrarea cu modulele interne
        "is_additional_info_loaded" BOOLEAN DEFAULT false,
        "is_updated_from_anaf" BOOLEAN DEFAULT true,
        "observatii" TEXT
      );
    `;
    
    // Creare indexi
    await client`CREATE INDEX "anaf_company_cui_idx" ON "anaf_company_data" ("cui");`;
    await client`CREATE INDEX "anaf_company_company_idx" ON "anaf_company_data" ("company_id");`;
    
    logger.info('Tabela anaf_company_data creată cu succes!');
    
  } catch (error) {
    logger.error('Eroare la crearea tabelelor:', error);
    throw error;
  } finally {
    await client.end();
    logger.info('Conexiune închisă');
  }
}

createAnafTables()
  .then(() => {
    console.log('Migrarea s-a încheiat cu succes!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Eroare la migrare:', error);
    process.exit(1);
  });