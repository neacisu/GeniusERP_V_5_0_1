/**
 * Seeding Script: Romanian Chart of Accounts Data
 *
 * Acest script populează tabelele account_classes și account_groups
 * cu datele oficiale din Planul de Conturi Român conform OMFP 1802/2014.
 *
 * Datele sunt extrase din baza de date de producție și normalizate
 * pentru a fi conforme cu schema Drizzle (snake_case, valori enum corecte).
 *
 * Utilizare:
 * - Rulează după migrarea tabelelor account_classes și account_groups
 * - Populează datele de bază pentru orice instalare nouă
 * - Asigură consistența datelor între medii
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
        INSERT INTO account_classes (
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
        INSERT INTO account_groups (
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

    // 3. Validation
    console.log('🔍 Validating seeded data...');

    // Check classes count
    const classesCount = await sql`SELECT COUNT(*) as count FROM account_classes`;
    console.log(`📊 Account classes in DB: ${classesCount[0].count}`);

    // Check groups count
    const groupsCount = await sql`SELECT COUNT(*) as count FROM account_groups`;
    console.log(`📊 Account groups in DB: ${groupsCount[0].count}`);

    // Validate relationships
    const orphanedGroups = await sql`
      SELECT ag.code, ag.name
      FROM account_groups ag
      LEFT JOIN account_classes ac ON ag.class_id = ac.id
      WHERE ac.id IS NULL
    `;

    if (orphanedGroups.length > 0) {
      throw new Error(`❌ Found ${orphanedGroups.length} orphaned account groups without valid class references`);
    }

    console.log('✅ All account groups have valid class references');
    console.log('🎉 Romanian Chart of Accounts seeding completed successfully!');

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

  console.log('✅ Seed script loaded successfully');
  console.log('💡 To run seeding, integrate this function into your migration system');
}
