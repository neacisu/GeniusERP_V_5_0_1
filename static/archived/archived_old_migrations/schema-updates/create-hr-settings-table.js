/**
 * HR Settings Table Creation Script (ES Modules)
 * 
 * This script creates the hr_settings table directly using SQL.
 */

import 'dotenv/config';
import pg from 'pg';
const { Pool } = pg;

async function createHrSettingsTable() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Starting HR settings table creation...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hr_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        company_id UUID NOT NULL REFERENCES companies(id),
        company_name TEXT,
        company_registration_number TEXT,
        fiscal_code TEXT,
        address TEXT,
        city TEXT,
        county TEXT,
        postal_code TEXT,
        country TEXT DEFAULT 'România',
        phone TEXT,
        email TEXT,
        website TEXT,
        contact_person TEXT,
        contact_email TEXT,
        contact_phone TEXT,
        default_probation_period INTEGER DEFAULT 90,
        default_working_hours INTEGER DEFAULT 40,
        default_vacation_days INTEGER DEFAULT 21,
        default_sick_days INTEGER DEFAULT 5,
        default_notice_period INTEGER DEFAULT 30,
        enable_auto_calculate_vacation_days BOOLEAN DEFAULT FALSE,
        enable_auto_calculate_seniority BOOLEAN DEFAULT TRUE,
        enable_contract_notifications BOOLEAN DEFAULT TRUE,
        enable_birthday_notifications BOOLEAN DEFAULT TRUE,
        anaf_integration_enabled BOOLEAN DEFAULT FALSE,
        anaf_api_key TEXT,
        anaf_username TEXT,
        anaf_password TEXT,
        revisal_integration_enabled BOOLEAN DEFAULT FALSE,
        revisal_api_key TEXT,
        sendgrid_enabled BOOLEAN DEFAULT FALSE,
        sendgrid_api_key TEXT,
        stripe_enabled BOOLEAN DEFAULT FALSE,
        stripe_api_key TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(company_id)
      )
    `);
    
    console.log('✅ HR settings table created successfully!');
  } catch (error) {
    console.error('Error creating HR settings table:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Execute function
createHrSettingsTable()
  .then(() => {
    console.log('Migration completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });