/**
 * Seeding Script: Romanian Chart of Accounts Data
 *
 * Acest script populează tabelele PC_account_classes, PC_account_groups și PC_synthetic_accounts
 * cu datele oficiale din Planul de Conturi Român conform OMFP 1802/2014.
 *
 * Datele sunt extrase din baza de date de producție și normalizate
 * pentru a fi conforme cu schema Drizzle (snake_case, valori enum corecte).
 *
 * Utilizare:
 * - Rulează după migrarea tabelelor PC_account_classes, PC_account_groups și PC_synthetic_accounts
 * - Populează datele de bază pentru orice instalare nouă
 * - Asigură consistența datelor între medii
 *
 * Date:
 * - 9 clase de conturi (1-9)
 * - 67 grupe de conturi (10-98)
 * - 781 conturi sintetice (grad 1 și 2)
 */

import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const seedRomanianChartOfAccounts = async (db: any) => {
  console.log('🌱 Seeding Romanian Chart of Accounts data...');

  try {
    // 1. Seed Account Classes
    console.log('📊 Seeding account classes...');
    const classesPath = path.join(__dirname, 'account_classes.json');
    const classesData = JSON.parse(fs.readFileSync(classesPath, 'utf8'));

    for (const accountClass of classesData) {
      await sql`
        INSERT INTO PC_account_classes (
          id, code, name, description, default_account_function, created_at, updated_at
        ) VALUES (
          ${accountClass.id}::uuid,
          ${accountClass.code},
          ${accountClass.name},
          ${accountClass.description},
          ${accountClass.default_account_function},
          ${accountClass.created_at}::timestamp,
          ${accountClass.updated_at}::timestamp
        )
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          default_account_function = EXCLUDED.default_account_function,
          updated_at = EXCLUDED.updated_at
      `;
    }

    console.log(`✅ Seeded ${classesData.length} account classes`);

    // 2. Seed Account Groups
    console.log('📊 Seeding account groups...');
    const groupsPath = path.join(__dirname, 'account_groups.json');
    const groupsData = JSON.parse(fs.readFileSync(groupsPath, 'utf8'));

    for (const accountGroup of groupsData) {
      await sql`
        INSERT INTO PC_account_groups (
          id, code, name, description, class_id, created_at, updated_at
        ) VALUES (
          ${accountGroup.id}::uuid,
          ${accountGroup.code},
          ${accountGroup.name},
          ${accountGroup.description},
          ${accountGroup.class_id}::uuid,
          ${accountGroup.created_at}::timestamp,
          ${accountGroup.updated_at}::timestamp
        )
        ON CONFLICT (code) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          class_id = EXCLUDED.class_id,
          updated_at = EXCLUDED.updated_at
      `;
    }

    console.log(`✅ Seeded ${groupsData.length} account groups`);

    // 3. Seed Synthetic Accounts
    console.log('📊 Seeding synthetic accounts...');
    const syntheticPath = path.join(__dirname, 'synthetic_accounts.json');
    const syntheticData = JSON.parse(fs.readFileSync(syntheticPath, 'utf8'));

    let successCount = 0;
    let skipCount = 0;

    for (const syntheticAccount of syntheticData) {
      try {
        await sql`
          INSERT INTO PC_synthetic_accounts (
            id, code, name, description, account_function, grade, 
            group_id, parent_id, is_active, created_at, updated_at
          ) VALUES (
            ${syntheticAccount.id}::uuid,
            ${syntheticAccount.code},
            ${syntheticAccount.name},
            ${syntheticAccount.description},
            ${syntheticAccount.account_function},
            ${syntheticAccount.grade},
            ${syntheticAccount.group_id}::uuid,
            ${syntheticAccount.parent_id ? syntheticAccount.parent_id + '::uuid' : null},
            ${syntheticAccount.is_active},
            ${syntheticAccount.created_at}::timestamp,
            ${syntheticAccount.updated_at}::timestamp
          )
          ON CONFLICT (code) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            account_function = EXCLUDED.account_function,
            grade = EXCLUDED.grade,
            group_id = EXCLUDED.group_id,
            parent_id = EXCLUDED.parent_id,
            is_active = EXCLUDED.is_active,
            updated_at = EXCLUDED.updated_at
        `;
        successCount++;
      } catch (error) {
        console.warn(`⚠️  Skipping account ${syntheticAccount.code}: ${error.message}`);
        skipCount++;
      }
    }

    console.log(`✅ Seeded ${successCount} synthetic accounts (${skipCount} skipped)`);

    // 4. Validation
    console.log('🔍 Validating seeded data...');

    // Check classes count
    const classesCount = await sql`SELECT COUNT(*) as count FROM PC_account_classes`;
    console.log(`📊 Account classes in DB: ${classesCount[0].count}`);

    // Check groups count
    const groupsCount = await sql`SELECT COUNT(*) as count FROM PC_account_groups`;
    console.log(`📊 Account groups in DB: ${groupsCount[0].count}`);

    // Check synthetic accounts count
    const syntheticCount = await sql`SELECT COUNT(*) as count FROM PC_synthetic_accounts`;
    console.log(`📊 Synthetic accounts in DB: ${syntheticCount[0].count}`);

    // Validate relationships: groups → classes
    const orphanedGroups = await sql`
      SELECT ag.code, ag.name
      FROM PC_account_groups ag
      LEFT JOIN PC_account_classes ac ON ag.class_id = ac.id
      WHERE ac.id IS NULL
    `;

    if (orphanedGroups.length > 0) {
      throw new Error(`❌ Found ${orphanedGroups.length} orphaned account groups without valid class references`);
    }

    console.log('✅ All account groups have valid class references');

    // Validate relationships: synthetic accounts → groups
    const orphanedSynthetic = await sql`
      SELECT sa.code, sa.name
      FROM PC_synthetic_accounts sa
      LEFT JOIN PC_account_groups ag ON sa.group_id = ag.id
      WHERE ag.id IS NULL
    `;

    if (orphanedSynthetic.length > 0) {
      throw new Error(`❌ Found ${orphanedSynthetic.length} synthetic accounts without valid group references`);
    }

    console.log('✅ All synthetic accounts have valid group references');

    // Validate grade 2 accounts have valid parents
    const invalidGrade2 = await sql`
      SELECT sa.code, sa.name
      FROM PC_synthetic_accounts sa
      WHERE sa.grade = 2 AND sa.parent_id IS NULL
    `;

    if (invalidGrade2.length > 0) {
      console.warn(`⚠️  Warning: Found ${invalidGrade2.length} grade 2 accounts without parent_id`);
    } else {
      console.log('✅ All grade 2 accounts have valid parent references');
    }

    console.log('🎉 Romanian Chart of Accounts seeding completed successfully!');
    console.log(`📊 Summary: ${classesCount[0].count} classes, ${groupsCount[0].count} groups, ${syntheticCount[0].count} synthetic accounts`);

  } catch (error) {
    console.error('❌ Error seeding Romanian Chart of Accounts:', error);
    throw error;
  }
};

// For standalone execution
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 Running Romanian Chart of Accounts seeding...');

  // This would need proper database connection setup
  // For now, just show that the script loads correctly
  console.log('📁 Seed files found:');
  console.log('- account_classes.json:', fs.existsSync(path.join(__dirname, 'account_classes.json')));
  console.log('- account_groups.json:', fs.existsSync(path.join(__dirname, 'account_groups.json')));
  console.log('- synthetic_accounts.json:', fs.existsSync(path.join(__dirname, 'synthetic_accounts.json')));

  console.log('✅ Seed script loaded successfully');
  console.log('💡 To run seeding, integrate this function into your migration system');
}
