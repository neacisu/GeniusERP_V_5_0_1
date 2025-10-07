/**
 * Database Audit Script
 * 
 * This script connects to the database and extracts the complete structure:
 * - All tables
 * - All columns with types
 * - All enums
 * - All indexes
 * - All constraints
 */

import { db } from '../server/db.js';
import { sql } from 'drizzle-orm';
import * as fs from 'fs';
import * as path from 'path';

interface TableInfo {
  tableName: string;
  columns: ColumnInfo[];
  indexes: IndexInfo[];
  constraints: ConstraintInfo[];
}

interface ColumnInfo {
  columnName: string;
  dataType: string;
  isNullable: string;
  columnDefault: string | null;
  characterMaximumLength: number | null;
  numericPrecision: number | null;
  numericScale: number | null;
}

interface IndexInfo {
  indexName: string;
  indexType: string;
  columnNames: string[];
  isUnique: boolean;
}

interface ConstraintInfo {
  constraintName: string;
  constraintType: string;
  columnNames: string[];
}

interface EnumInfo {
  enumName: string;
  enumValues: string[];
}

async function getAllTables(): Promise<string[]> {
  const result: any = await db.execute(sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  
  // postgres-js returns array directly, not { rows: [...] }
  const rows = Array.isArray(result) ? result : [];
  return rows.map((row: any) => row.table_name);
}

async function getTableColumns(tableName: string): Promise<ColumnInfo[]> {
  const result: any = await db.execute(sql.raw(`
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default,
      character_maximum_length,
      numeric_precision,
      numeric_scale
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = '${tableName}'
    ORDER BY ordinal_position
  `));
  
  // postgres-js returns array directly
  const rows = Array.isArray(result) ? result : [];
  return rows.map((row: any) => ({
    columnName: row.column_name,
    dataType: row.data_type,
    isNullable: row.is_nullable,
    columnDefault: row.column_default,
    characterMaximumLength: row.character_maximum_length,
    numericPrecision: row.numeric_precision,
    numericScale: row.numeric_scale,
  }));
}

async function getTableIndexes(tableName: string): Promise<IndexInfo[]> {
  const result: any = await db.execute(sql.raw(`
    SELECT
      i.relname as index_name,
      am.amname as index_type,
      array_agg(a.attname ORDER BY a.attnum) as column_names,
      ix.indisunique as is_unique
    FROM pg_class t
    JOIN pg_index ix ON t.oid = ix.indrelid
    JOIN pg_class i ON i.oid = ix.indexrelid
    JOIN pg_am am ON i.relam = am.oid
    JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
    WHERE t.relkind = 'r'
    AND t.relname = '${tableName}'
    AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    GROUP BY i.relname, am.amname, ix.indisunique
    ORDER BY i.relname
  `));
  
  // postgres-js returns array directly
  const rows = Array.isArray(result) ? result : [];
  return rows.map((row: any) => ({
    indexName: row.index_name,
    indexType: row.index_type,
    columnNames: row.column_names,
    isUnique: row.is_unique,
  }));
}

async function getTableConstraints(tableName: string): Promise<ConstraintInfo[]> {
  const result: any = await db.execute(sql.raw(`
    SELECT
      tc.constraint_name,
      tc.constraint_type,
      array_agg(kcu.column_name) as column_names
    FROM information_schema.table_constraints tc
    LEFT JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
      AND tc.table_name = kcu.table_name
    WHERE tc.table_schema = 'public'
    AND tc.table_name = '${tableName}'
    GROUP BY tc.constraint_name, tc.constraint_type
    ORDER BY tc.constraint_name
  `));
  
  // postgres-js returns array directly
  const rows = Array.isArray(result) ? result : [];
  return rows.map((row: any) => ({
    constraintName: row.constraint_name,
    constraintType: row.constraint_type,
    columnNames: row.column_names,
  }));
}

async function getAllEnums(): Promise<EnumInfo[]> {
  const result: any = await db.execute(sql`
    SELECT 
      t.typname as enum_name,
      array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    GROUP BY t.typname
    ORDER BY t.typname
  `);
  
  // postgres-js returns array directly
  const rows = Array.isArray(result) ? result : [];
  return rows.map((row: any) => ({
    enumName: row.enum_name,
    enumValues: row.enum_values,
  }));
}

async function getRowCounts(): Promise<Map<string, number>> {
  const tables = await getAllTables();
  const counts = new Map<string, number>();
  
  console.log('  Counting rows for each table...');
  for (const table of tables) {
    try {
      const result: any = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM "${table}"`));
      // postgres-js returns array directly
      const rows = Array.isArray(result) ? result : [];
      if (rows.length > 0 && rows[0]) {
        const countValue = rows[0].count || rows[0].COUNT || 0;
        counts.set(table, parseInt(String(countValue)));
      } else {
        counts.set(table, 0);
      }
    } catch (error) {
      console.error(`  ⚠️  Error counting ${table}:`, error instanceof Error ? error.message : 'Unknown error');
      counts.set(table, -1); // Error getting count
    }
  }
  
  return counts;
}

async function auditDatabase() {
  console.log('🔍 Starting database audit...\n');
  
  try {
    // Get all tables
    console.log('📋 Extracting table list...');
    const tables = await getAllTables();
    console.log(`✅ Found ${tables.length} tables\n`);
    
    // Get all enums
    console.log('🔢 Extracting enums...');
    const enums = await getAllEnums();
    console.log(`✅ Found ${enums.length} enums\n`);
    
    // Get row counts
    console.log('📊 Counting rows...');
    const rowCounts = await getRowCounts();
    console.log(`✅ Row counts retrieved\n`);
    
    // Get detailed info for each table
    console.log('📝 Extracting detailed table information...');
    const tableInfos: TableInfo[] = [];
    
    for (const tableName of tables) {
      console.log(`  - Processing ${tableName}...`);
      const columns = await getTableColumns(tableName);
      const indexes = await getTableIndexes(tableName);
      const constraints = await getTableConstraints(tableName);
      
      tableInfos.push({
        tableName,
        columns,
        indexes,
        constraints,
      });
    }
    
    console.log(`✅ All tables processed\n`);
    
    // Generate audit report
    console.log('📄 Generating audit report...');
    
    const report = {
      auditDate: new Date().toISOString(),
      totalTables: tables.length,
      totalEnums: enums.length,
      enums: enums,
      tables: tableInfos,
      rowCounts: Object.fromEntries(rowCounts),
    };
    
    // Save to file
    const outputPath = path.join(process.cwd(), 'db-audit-report.json');
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`✅ Audit report saved to: ${outputPath}\n`);
    
    // Generate summary
    console.log('📊 === DATABASE AUDIT SUMMARY ===\n');
    console.log(`Total Tables: ${tables.length}`);
    console.log(`Total Enums: ${enums.length}\n`);
    
    console.log('Tables with data:');
    const tablesWithData = Array.from(rowCounts.entries())
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);
    
    if (tablesWithData.length === 0) {
      console.log('  ⚠️  No tables contain data!');
    } else {
      tablesWithData.forEach(([table, count]) => {
        console.log(`  ✅ ${table}: ${count} rows`);
      });
    }
    
    console.log('\nEmpty tables:');
    const emptyTables = Array.from(rowCounts.entries())
      .filter(([_, count]) => count === 0)
      .map(([table, _]) => table);
    
    if (emptyTables.length === 0) {
      console.log('  ✅ All tables have data');
    } else {
      emptyTables.forEach(table => {
        console.log(`  ⚠️  ${table}`);
      });
    }
    
    console.log('\n✅ Database audit complete!');
    
  } catch (error) {
    console.error('❌ Error during audit:', error);
    throw error;
  }
}

// Run the audit
auditDatabase()
  .then(() => {
    console.log('\n✅ Audit script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Audit script failed:', error);
    process.exit(1);
  });

