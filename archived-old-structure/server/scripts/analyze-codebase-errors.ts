/**
 * Analiză completă a erorilor TypeScript din codebase
 * 
 * Generează un raport detaliat cu toate erorile organizate pe module și severitate
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface TypeScriptError {
  file: string;
  line: number;
  column: number;
  errorCode: string;
  severity: 'error' | 'warning';
  message: string;
  module: string;
  category: string;
}

interface ErrorStats {
  totalErrors: number;
  byModule: Record<string, number>;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  byErrorCode: Record<string, number>;
}

class CodebaseAnalyzer {
  private errors: TypeScriptError[] = [];
  private stats: ErrorStats = {
    totalErrors: 0,
    byModule: {},
    byCategory: {},
    bySeverity: {},
    byErrorCode: {}
  };

  /**
   * Rulează analiza TypeScript
   */
  async runTypeScriptAnalysis(): Promise<void> {
    console.log('🔍 Început analiză TypeScript pe întreg codebase-ul...\n');

    return new Promise((resolve, reject) => {
      // Rulez tsc cu opțiuni pentru erori detaliate
      const tsc = spawn('npx', [
        'tsc',
        '--noEmit',
        '--pretty', 'false',
        '--skipLibCheck',
        '--project', './tsconfig.json'
      ], {
        stdio: ['inherit', 'pipe', 'pipe'],
        cwd: process.cwd()
      });

      let stdout = '';
      let stderr = '';

      tsc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      tsc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      tsc.on('close', (code) => {
        // Parsează erorile din output
        this.parseTypeScriptErrors(stderr);
        this.calculateStats();
        resolve();
      });

      tsc.on('error', (error) => {
        console.error('❌ Eroare la rularea tsc:', error);
        reject(error);
      });
    });
  }

  /**
   * Parsează erorile TypeScript din output
   */
  private parseTypeScriptErrors(output: string): void {
    const lines = output.split('\n');
    
    for (const line of lines) {
      if (line.trim() === '') continue;

      // Pattern pentru erori TypeScript: file(line,column): error TScode: message
      const errorMatch = line.match(/^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(TS\d+):\s+(.+)$/);
      
      if (errorMatch) {
        const [, filePath, lineNum, colNum, severity, errorCode, message] = errorMatch;
        
        // Skip fișierele backup și temporare
        if (filePath.includes('.backup.') || filePath.includes('.tmp.') || filePath.includes('node_modules')) {
          continue;
        }

        const error: TypeScriptError = {
          file: filePath,
          line: parseInt(lineNum),
          column: parseInt(colNum),
          errorCode,
          severity: severity as 'error' | 'warning',
          message,
          module: this.extractModule(filePath),
          category: this.categorizeError(errorCode, message)
        };

        this.errors.push(error);
      }
    }
  }

  /**
   * Extrage numele modulului din calea fișierului
   */
  private extractModule(filePath: string): string {
    if (filePath.startsWith('client/')) {
      const parts = filePath.split('/');
      if (parts.length > 3 && parts[2] === 'modules') {
        return `client/${parts[3]}`;
      }
      return 'client/common';
    } else if (filePath.startsWith('server/')) {
      const parts = filePath.split('/');
      if (parts.length > 2 && parts[1] === 'modules') {
        return `server/${parts[2]}`;
      } else if (parts.length > 2) {
        return `server/${parts[1]}`;
      }
      return 'server/common';
    } else if (filePath.startsWith('shared/')) {
      return 'shared';
    }
    
    return 'unknown';
  }

  /**
   * Categorizează eroarea după tip
   */
  private categorizeError(errorCode: string, message: string): string {
    const categories: Record<string, string> = {
      'TS2307': 'Import Errors',
      'TS2339': 'Property Errors', 
      'TS2304': 'Name/Variable Errors',
      'TS2322': 'Type Assignment Errors',
      'TS2769': 'Function Call Errors',
      'TS2554': 'Argument Count Errors',
      'TS1192': 'Module Import Errors',
      'TS1259': 'Import Flag Errors',
      'TS2551': 'Property Access Errors',
      'TS2515': 'Abstract Class Errors',
      'TS2420': 'Interface Implementation Errors',
      'TS1128': 'Syntax Errors',
      'TS1109': 'Expression Errors',
      'TS1472': 'Try-Catch Errors',
      'TS1005': 'Token Expected Errors',
      'TS2740': 'Type Compatibility Errors',
      'TS2344': 'Type Constraint Errors',
      'TS2802': 'Iterator Errors'
    };

    return categories[errorCode] || 'Other Errors';
  }

  /**
   * Calculează statistici
   */
  private calculateStats(): void {
    this.stats.totalErrors = this.errors.length;

    for (const error of this.errors) {
      // By module
      this.stats.byModule[error.module] = (this.stats.byModule[error.module] || 0) + 1;
      
      // By category  
      this.stats.byCategory[error.category] = (this.stats.byCategory[error.category] || 0) + 1;
      
      // By severity
      this.stats.bySeverity[error.severity] = (this.stats.bySeverity[error.severity] || 0) + 1;
      
      // By error code
      this.stats.byErrorCode[error.errorCode] = (this.stats.byErrorCode[error.errorCode] || 0) + 1;
    }
  }

  /**
   * Generează raportul final
   */
  generateReport(): void {
    console.log('=' .repeat(80));
    console.log('📊 RAPORT COMPLET ERORI TYPESCRIPT - GENIUSERP CODEBASE');
    console.log('=' .repeat(80));

    // Statistici generale
    console.log(`\n📈 STATISTICI GENERALE:`);
    console.log(`   Total erori găsite: ${this.stats.totalErrors}`);
    console.log(`   Erori: ${this.stats.bySeverity.error || 0}`);
    console.log(`   Warnings: ${this.stats.bySeverity.warning || 0}`);

    // Top module cu cele mai multe erori
    console.log(`\n🏢 ERORI PE MODULE (Top 10):`);
    const topModules = Object.entries(this.stats.byModule)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    topModules.forEach(([module, count], index) => {
      console.log(`   ${index + 1}. ${module.padEnd(25)}: ${count} erori`);
    });

    // Top categorii de erori
    console.log(`\n🏷️ CATEGORII DE ERORI (Top 10):`);
    const topCategories = Object.entries(this.stats.byCategory)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    topCategories.forEach(([category, count], index) => {
      console.log(`   ${index + 1}. ${category.padEnd(25)}: ${count} erori`);
    });

    // Top coduri de erori
    console.log(`\n🔢 CODURI DE ERORI (Top 10):`);
    const topCodes = Object.entries(this.stats.byErrorCode)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);

    topCodes.forEach(([code, count], index) => {
      console.log(`   ${index + 1}. ${code.padEnd(10)}: ${count} erori`);
    });

    // Erori critice
    console.log(`\n🚨 ERORI CRITICE (Sample):`);
    const criticalErrors = this.errors
      .filter(e => e.severity === 'error')
      .slice(0, 10);

    criticalErrors.forEach((error, index) => {
      console.log(`\n${index + 1}. ${error.file}:${error.line}`);
      console.log(`   Cod: ${error.errorCode}`);
      console.log(`   Categorie: ${error.category}`);
      console.log(`   Mesaj: ${error.message}`);
    });

    // Recomandări
    console.log(`\n💡 RECOMANDĂRI PENTRU REZOLVARE:`);
    
    if (this.stats.byCategory['Import Errors'] > 0) {
      console.log(`   🔧 Import Errors (${this.stats.byCategory['Import Errors']}): Verificați path-urile și dependințele`);
    }
    
    if (this.stats.byCategory['Type Assignment Errors'] > 0) {
      console.log(`   🔧 Type Assignment (${this.stats.byCategory['Type Assignment Errors']}): Verificați tipurile de date`);
    }
    
    if (this.stats.byCategory['Property Errors'] > 0) {
      console.log(`   🔧 Property Errors (${this.stats.byCategory['Property Errors']}): Verificați interface-urile și proprietățile`);
    }

    // Concluzia
    console.log(`\n🎯 CONCLUZIE:`);
    if (this.stats.totalErrors === 0) {
      console.log('   ✅ CODEBASE PERFECT - Nicio eroare TypeScript!');
    } else if (this.stats.totalErrors < 10) {
      console.log('   ⚠️ CODEBASE BUN - Erori minore care pot fi rezolvate ușor');
    } else if (this.stats.totalErrors < 50) {
      console.log('   ⚠️ CODEBASE DECENT - Necesită atenție pentru rezolvarea erorilor');
    } else {
      console.log('   ❌ CODEBASE PROBLEMATIC - Multe erori care necesită refactoring');
    }

    console.log('=' .repeat(80));
  }

  /**
   * Salvează raportul în fișier
   */
  async saveReportToFile(): Promise<void> {
    const reportData = {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      errors: this.errors.slice(0, 100), // Limitez la primele 100 pentru dimensiune
      summary: {
        totalErrors: this.stats.totalErrors,
        topModules: Object.entries(this.stats.byModule)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5),
        topCategories: Object.entries(this.stats.byCategory)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
      }
    };

    const reportPath = path.join(process.cwd(), 'typescript-error-report.json');
    await fs.promises.writeFile(reportPath, JSON.stringify(reportData, null, 2));
    
    console.log(`\n📝 Raport salvat în: ${reportPath}`);
  }
}

/**
 * Funcția principală
 */
async function main(): Promise<void> {
  const analyzer = new CodebaseAnalyzer();
  
  try {
    await analyzer.runTypeScriptAnalysis();
    analyzer.generateReport();
    await analyzer.saveReportToFile();
  } catch (error) {
    console.error('❌ Eroare în analiză:', error);
    process.exit(1);
  }
}

// Rulează analiza dacă scriptul este apelat direct
const isMain = process.argv[1].endsWith('analyze-codebase-errors.ts');
if (isMain) {
  main().catch(error => {
    console.error('💥 Eroare critică:', error);
    process.exit(1);
  });
}

export { CodebaseAnalyzer };
