/**
 * Seed pentru Clasificarea Ocupațiilor din România (COR)
 * Populează: cor_major_groups, cor_submajor_groups, cor_minor_groups, cor_subminor_groups, cor_occupations
 * 
 * Structura:
 * - 9 Grupe Majore (1 cifră)
 * - Grupe Sub-Majore (2 cifre)
 * - Grupe Minore (3 cifre)
 * - Grupe Sub-Minore (4 cifre)
 * - 4247 Ocupații (6 cifre)
 */

import * as fs from 'fs';
import * as path from 'path';

export async function seed(db: any) {
  console.log('🌱 Seeding COR (Clasificarea Ocupațiilor din România)...');
  
  const seedDir = __dirname;
  
  try {
    // 1. Încarcă și inserează Grupe Majore COR
    console.log('👔 Loading COR major groups...');
    const majorGroupsPath = path.join(seedDir, 'cor-major-groups.json');
    const majorGroupsData = JSON.parse(fs.readFileSync(majorGroupsPath, 'utf-8'));
    
    if (majorGroupsData && Array.isArray(majorGroupsData)) {
      let inserted = 0;
      for (const group of majorGroupsData) {
        await db.execute(`
          INSERT INTO cor_major_groups (
            id, code, name, description, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (code) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            updated_at = EXCLUDED.updated_at
        `, [
          group.id,
          group.code,
          group.name,
          group.description,
          group.created_at || new Date().toISOString(),
          group.updated_at || new Date().toISOString()
        ]);
        inserted++;
      }
      console.log(`✅ Inserted/updated ${inserted} COR major groups`);
    }
    
    // 2. Încarcă și inserează Grupe Sub-Majore COR
    console.log('👔 Loading COR submajor groups...');
    const submajorGroupsPath = path.join(seedDir, 'cor-submajor-groups.json');
    const submajorGroupsData = JSON.parse(fs.readFileSync(submajorGroupsPath, 'utf-8'));
    
    if (submajorGroupsData && Array.isArray(submajorGroupsData)) {
      let inserted = 0;
      for (const group of submajorGroupsData) {
        await db.execute(`
          INSERT INTO cor_submajor_groups (
            id, code, name, description, major_group_id, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (code) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            major_group_id = EXCLUDED.major_group_id,
            updated_at = EXCLUDED.updated_at
        `, [
          group.id,
          group.code,
          group.name,
          group.description,
          group.major_group_id,
          group.created_at || new Date().toISOString(),
          group.updated_at || new Date().toISOString()
        ]);
        inserted++;
      }
      console.log(`✅ Inserted/updated ${inserted} COR submajor groups`);
    }
    
    // 3. Încarcă și inserează Grupe Minore COR
    console.log('👔 Loading COR minor groups...');
    const minorGroupsPath = path.join(seedDir, 'cor-minor-groups.json');
    const minorGroupsData = JSON.parse(fs.readFileSync(minorGroupsPath, 'utf-8'));
    
    if (minorGroupsData && Array.isArray(minorGroupsData)) {
      let inserted = 0;
      for (const group of minorGroupsData) {
        await db.execute(`
          INSERT INTO cor_minor_groups (
            id, code, name, description, submajor_group_id, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (code) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            submajor_group_id = EXCLUDED.submajor_group_id,
            updated_at = EXCLUDED.updated_at
        `, [
          group.id,
          group.code,
          group.name,
          group.description,
          group.submajor_group_id,
          group.created_at || new Date().toISOString(),
          group.updated_at || new Date().toISOString()
        ]);
        inserted++;
      }
      console.log(`✅ Inserted/updated ${inserted} COR minor groups`);
    }
    
    // 4. Încarcă și inserează Grupe Sub-Minore COR
    console.log('👔 Loading COR subminor groups...');
    const subminorGroupsPath = path.join(seedDir, 'cor-subminor-groups.json');
    const subminorGroupsData = JSON.parse(fs.readFileSync(subminorGroupsPath, 'utf-8'));
    
    if (subminorGroupsData && Array.isArray(subminorGroupsData)) {
      let inserted = 0;
      for (const group of subminorGroupsData) {
        await db.execute(`
          INSERT INTO cor_subminor_groups (
            id, code, name, description, minor_group_id, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (code) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            minor_group_id = EXCLUDED.minor_group_id,
            updated_at = EXCLUDED.updated_at
        `, [
          group.id,
          group.code,
          group.name,
          group.description,
          group.minor_group_id,
          group.created_at || new Date().toISOString(),
          group.updated_at || new Date().toISOString()
        ]);
        inserted++;
      }
      console.log(`✅ Inserted/updated ${inserted} COR subminor groups`);
    }
    
    // 5. Încarcă și inserează Ocupații COR
    console.log('👔 Loading COR occupations (this may take a while - 4247 occupations)...');
    const occupationsPath = path.join(seedDir, 'cor-occupations.json');
    const occupationsData = JSON.parse(fs.readFileSync(occupationsPath, 'utf-8'));
    
    if (occupationsData && Array.isArray(occupationsData)) {
      let inserted = 0;
      for (const occupation of occupationsData) {
        await db.execute(`
          INSERT INTO cor_occupations (
            id, code, name, description, subminor_group_id, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (code) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            subminor_group_id = EXCLUDED.subminor_group_id,
            updated_at = EXCLUDED.updated_at
        `, [
          occupation.id,
          occupation.code,
          occupation.name,
          occupation.description,
          occupation.subminor_group_id,
          occupation.created_at || new Date().toISOString(),
          occupation.updated_at || new Date().toISOString()
        ]);
        inserted++;
        
        // Progress indicator pentru volume mari
        if (inserted % 500 === 0) {
          console.log(`   ... ${inserted} ocupații procesate`);
        }
      }
      console.log(`✅ Inserted/updated ${inserted} COR occupations`);
    }
    
    console.log('🎉 COR seeding completed!');
    console.log('');
    console.log('📈 Summary:');
    console.log(`   - ${majorGroupsData?.length || 0} Grupe Majore`);
    console.log(`   - ${submajorGroupsData?.length || 0} Grupe Sub-Majore`);
    console.log(`   - ${minorGroupsData?.length || 0} Grupe Minore`);
    console.log(`   - ${subminorGroupsData?.length || 0} Grupe Sub-Minore`);
    console.log(`   - ${occupationsData?.length || 0} Ocupații`);
    
  } catch (error) {
    console.error('❌ Error seeding COR:', error);
    throw error;
  }
}

export default seed;

