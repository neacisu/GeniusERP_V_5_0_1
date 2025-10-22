/**
 * HR Settings Migration Script
 * 
 * This script creates the hr_settings table and configures its relations
 */

import drizzleDb from '../common/drizzle/db';
import { hrSettings } from '../modules/hr/schema/settings.schema';

/**
 * Main migration function
 */
async function migrateHrSettings() {
  try {
    console.log('Starting HR settings migration...');
    
    const db = drizzleDb.getDrizzleInstance();
    
    // Push the HR settings schema to the database
    await db.execute(`
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
    
    console.log('✅ HR settings migration completed successfully!');
  } catch (error) {
    console.error('Error migrating HR settings:', error);
    throw error;
  }
}

// Execute migration
migrateHrSettings()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });

export default migrateHrSettings;