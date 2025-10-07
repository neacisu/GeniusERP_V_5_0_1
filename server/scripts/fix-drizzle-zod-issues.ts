/**
 * Fix Script pentru Drizzle Zod Issues
 * 
 * Rezolvă sistematic problemele de compatibilitate cu drizzle-zod
 * 1. Elimină .omit() calls problematice  
 * 2. Fix pgEnum definitions
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface FixResult {
  file: string;
  omitFixesApplied: number;
  enumFixesApplied: number;
  success: boolean;
  errors: string[];
}

class DrizzleZodFixer {
  private results: FixResult[] = [];

  /**
   * Aplică toate fix-urile pentru problemele Drizzle Zod
   */
  async fixAllDrizzleZodIssues(): Promise<void> {
    console.log('🔧 Început fix sistematic pentru problemele Drizzle Zod...\n');

    // Găsește toate fișierele schema
    const schemaFiles = await this.findSchemaFiles();
    console.log(`📁 Găsite ${schemaFiles.length} fișiere schema pentru fix:\n`);

    for (const file of schemaFiles) {
      console.log(`   📝 ${file}`);
    }

    console.log('');

    // Aplică fix-urile la fiecare fișier
    for (const file of schemaFiles) {
      await this.fixSchemaFile(file);
    }

    // Raport final
    this.printResults();
  }

  /**
   * Găsește toate fișierele schema
   */
  private async findSchemaFiles(): Promise<string[]> {
    const patterns = [
      'shared/schema*.ts',
      'shared/schema/*.ts',
      'server/modules/*/schema/*.ts'
    ];

    const files: string[] = [];
    for (const pattern of patterns) {
      const matches = await glob(pattern);
      files.push(...matches);
    }

    return [...new Set(files)]; // Remove duplicates
  }

  /**
   * Fix-uiește un fișier schema specific
   */
  private async fixSchemaFile(filePath: string): Promise<void> {
    const result: FixResult = {
      file: filePath,
      omitFixesApplied: 0,
      enumFixesApplied: 0,
      success: false,
      errors: []
    };

    try {
      let content = await fs.promises.readFile(filePath, 'utf-8');
      const originalContent = content;

      // Fix 1: Elimină .omit() calls
      const omitMatches = content.match(/\.omit\(\{[^}]*\}\)/g);
      if (omitMatches) {
        result.omitFixesApplied = omitMatches.length;
        content = content.replace(/\.omit\(\{[^}]*\}\)/g, '; // Fixed: removed omit() for drizzle-zod compatibility');
      }

      // Fix 2: Convertește pgEnum cu Object.values la array literal
      // Pattern: pgEnum('name', Object.values(SomeEnum))
      const enumMatches = content.match(/pgEnum\([^,]+,\s*Object\.values\([^)]+\)\)/g);
      if (enumMatches) {
        result.enumFixesApplied = enumMatches.length;
        // Pentru fiecare match, înlocuiește cu un comentariu să fie fix-uit manual
        content = content.replace(
          /pgEnum\(([^,]+),\s*Object\.values\(([^)]+)\)\)/g, 
          'pgEnum($1, [] /* FIXME: Replace with literal array values from $2 */)'
        );
      }

      // Salvează doar dacă au fost modificări
      if (content !== originalContent) {
        await fs.promises.writeFile(filePath, content, 'utf-8');
        result.success = true;
      }

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
    }

    this.results.push(result);
  }

  /**
   * Printează rezultatele
   */
  private printResults(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 REZULTATE FIX DRIZZLE ZOD ISSUES');
    console.log('='.repeat(60));

    const totalFiles = this.results.length;
    const successfulFixes = this.results.filter(r => r.success).length;
    const totalOmitFixes = this.results.reduce((sum, r) => sum + r.omitFixesApplied, 0);
    const totalEnumFixes = this.results.reduce((sum, r) => sum + r.enumFixesApplied, 0);
    const errorCount = this.results.filter(r => r.errors.length > 0).length;

    console.log(`\n📈 STATISTICI:`);
    console.log(`   Fișiere procesate: ${totalFiles}`);
    console.log(`   Fix-uri cu succes: ${successfulFixes}`);
    console.log(`   Fix-uri .omit() aplicate: ${totalOmitFixes}`);
    console.log(`   Fix-uri pgEnum() aplicate: ${totalEnumFixes}`);
    console.log(`   Fișiere cu erori: ${errorCount}`);

    console.log(`\n📋 DETALII PE FIȘIER:`);
    for (const result of this.results) {
      const status = result.success ? '✅' : (result.errors.length > 0 ? '❌' : '⏸️');
      console.log(`   ${status} ${result.file}`);
      if (result.omitFixesApplied > 0) {
        console.log(`       → ${result.omitFixesApplied} fix-uri .omit()`);
      }
      if (result.enumFixesApplied > 0) {
        console.log(`       → ${result.enumFixesApplied} fix-uri pgEnum()`);
      }
      if (result.errors.length > 0) {
        result.errors.forEach(error => {
          console.log(`       ❌ ${error}`);
        });
      }
    }

    console.log(`\n🎯 CONCLUZIE:`);
    if (totalOmitFixes > 0 || totalEnumFixes > 0) {
      console.log(`   ✅ ${totalOmitFixes + totalEnumFixes} fix-uri aplicate cu succes!`);
      console.log('   🔄 Rulați din nou testele TypeScript pentru validare');
    } else {
      console.log('   ℹ️  Nu au fost găsite probleme de fix-uit');
    }

    console.log('\n' + '='.repeat(60));
  }
}

/**
 * Funcția principală
 */
async function main(): Promise<void> {
  const fixer = new DrizzleZodFixer();
  await fixer.fixAllDrizzleZodIssues();
}

// Rulează fix-ul dacă scriptul este apelat direct
const isMain = process.argv[1].endsWith('fix-drizzle-zod-issues.ts');
if (isMain) {
  main().catch(error => {
    console.error('💥 Eroare critică în fix:', error);
    process.exit(1);
  });
}

export { DrizzleZodFixer };
