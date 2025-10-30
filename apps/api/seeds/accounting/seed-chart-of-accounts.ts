/**
 * Seed pentru Plan de Conturi Românesc (OMFP 1802/2014)
 * Populează: account_classes, account_groups, synthetic_accounts
 * 
 * Structura:
 * - 9 Clase de conturi (1-9)
 * - 71 Grupe de conturi
 * - 781 Conturi sintetice (cu grade 1 și 2)
 */

import * as fs from 'fs';
import * as path from 'path';

export async function seed(db: any) {
  console.log('🌱 Seeding Plan de Conturi Românesc...');
  
  const seedDir = __dirname;
  
  try {
    // 1. Încarcă și inserează Clase de Conturi
    console.log('📊 Loading account classes...');
    const accountClassesPath = path.join(seedDir, 'account-classes.json');
    const accountClassesData = JSON.parse(fs.readFileSync(accountClassesPath, 'utf-8'));
    
    if (accountClassesData && Array.isArray(accountClassesData)) {
      let inserted = 0;
      for (const accountClass of accountClassesData) {
        await db.execute(`
          INSERT INTO account_classes (
            id, code, name, description, default_account_function, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (code) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            default_account_function = EXCLUDED.default_account_function,
            updated_at = EXCLUDED.updated_at
        `, [
          accountClass.id,
          accountClass.code,
          accountClass.name,
          accountClass.description,
          accountClass.default_account_function,
          accountClass.created_at || new Date().toISOString(),
          accountClass.updated_at || new Date().toISOString()
        ]);
        inserted++;
      }
      console.log(`✅ Inserted/updated ${inserted} account classes`);
    }
    
    // 2. Încarcă și inserează Grupe de Conturi
    console.log('📊 Loading account groups...');
    const accountGroupsPath = path.join(seedDir, 'account-groups.json');
    const accountGroupsData = JSON.parse(fs.readFileSync(accountGroupsPath, 'utf-8'));
    
    if (accountGroupsData && Array.isArray(accountGroupsData)) {
      let inserted = 0;
      for (const accountGroup of accountGroupsData) {
        await db.execute(`
          INSERT INTO account_groups (
            id, code, name, description, class_id, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (code) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            class_id = EXCLUDED.class_id,
            updated_at = EXCLUDED.updated_at
        `, [
          accountGroup.id,
          accountGroup.code,
          accountGroup.name,
          accountGroup.description,
          accountGroup.class_id,
          accountGroup.created_at || new Date().toISOString(),
          accountGroup.updated_at || new Date().toISOString()
        ]);
        inserted++;
      }
      console.log(`✅ Inserted/updated ${inserted} account groups`);
    }
    
    // 3. Încarcă și inserează Conturi Sintetice
    console.log('📊 Loading synthetic accounts...');
    const syntheticAccountsPath = path.join(seedDir, 'synthetic-accounts.json');
    const syntheticAccountsData = JSON.parse(fs.readFileSync(syntheticAccountsPath, 'utf-8'));
    
    if (syntheticAccountsData && Array.isArray(syntheticAccountsData)) {
      // Prima trecere: inserează conturile fără parent_id
      let inserted = 0;
      for (const account of syntheticAccountsData) {
        await db.execute(`
          INSERT INTO synthetic_accounts (
            id, code, name, description, account_function, grade, 
            group_id, parent_id, is_active, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          ON CONFLICT (code) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            account_function = EXCLUDED.account_function,
            grade = EXCLUDED.grade,
            group_id = EXCLUDED.group_id,
            parent_id = EXCLUDED.parent_id,
            is_active = EXCLUDED.is_active,
            updated_at = EXCLUDED.updated_at
        `, [
          account.id,
          account.code,
          account.name,
          account.description,
          account.account_function,
          account.grade,
          account.group_id,
          account.parent_id, // poate fi null
          account.is_active !== false, // default true
          account.created_at || new Date().toISOString(),
          account.updated_at || new Date().toISOString()
        ]);
        inserted++;
        
        // Progress indicator pentru volume mari
        if (inserted % 100 === 0) {
          console.log(`   ... ${inserted} conturi procesate`);
        }
      }
      console.log(`✅ Inserted/updated ${inserted} synthetic accounts`);
    }
    
    console.log('🎉 Plan de Conturi seeding completed!');
    console.log('');
    console.log('📈 Summary:');
    console.log(`   - ${accountClassesData?.length || 0} Clase de conturi`);
    console.log(`   - ${accountGroupsData?.length || 0} Grupe de conturi`);
    console.log(`   - ${syntheticAccountsData?.length || 0} Conturi sintetice`);
    
  } catch (error) {
    console.error('❌ Error seeding Plan de Conturi:', error);
    throw error;
  }
}

export default seed;

