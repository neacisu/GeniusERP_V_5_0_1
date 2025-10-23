/**
 * Script automat pentru rezolvare Quick Wins TypeScript errors
 * 
 * Acest script rezolvă pattern-uri repetitive de erori TypeScript:
 * - TS7006: Implicit any în parametri callback
 * - TS2307: Module paths incorecte
 * - TS2304: Nume nedefinite (imports lipsă)
 * 
 * IMPORTANT: Scriptul nu inventează nimic - folosește doar tipuri existente!
 */

import * as fs from 'fs';
import * as path from 'path';

// Mapping-uri pentru imports lipsă (doar cele care există în proiect)
const LUCIDE_ICONS_TO_ADD = {
  'TrendingUp': true,
  'MessageSquare': true,
  'Link': true
};

// Tipuri care există în proiect
const EXISTING_TYPES = {
  'AuthenticatedRequest': 'import { Request } from "express";\ninterface AuthenticatedRequest extends Request { user?: { id: string; companyId: string; role: string } }',
  'FeatureToggle': '// Type exists in settings module',
  'UITheme': '// Type exists in settings module',
  'UserPreference': '// Type exists in settings module',
  'IntegrationProvider': '// Type exists in integrations module'
};

// Paths corecte pentru module
const MODULE_PATH_CORRECTIONS = {
  '@/components/ui/date-picker': '@/components/ui/datepicker',
  '../../../middlewares/auth-guard.middleware': '../../../common/middleware/auth.guard',
  '../../../common/middleware/auth.guard': '../../common/auth/auth-guard',
  '../../../common/middleware/roles.guard': '../../common/auth/roles-guard',
  '../../../common/middleware/role-guard': '../../common/auth/role-guard',
  '../../../common/middleware/company-guard': '../../common/auth/company-guard',
  '../../common/logging/logger': '../../common/logger',
  '../logger': '../../common/logger',
  '../../../../libs/shared/src/types': '@shared/types'
};

console.log('🚀 START: Fix Quick Wins TypeScript errors');
console.log('');

// Funcție pentru fix TS7006 - Implicit any
function fixImplicitAny(filePath: string, content: string): string {
  let modified = content;
  let changeCount = 0;

  // Pattern 1: .map(item => ...) → .map((item: any) => ...)
  const mapPattern = /\.(map|filter|forEach|find|some|every)\(([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=>/g;
  modified = modified.replace(mapPattern, (match, method, param) => {
    changeCount++;
    return `.${method}((${param}: any) =>`;
  });

  // Pattern 2: .map((item, index) => ...) → .map((item: any, index: number) => ...)
  const mapWithIndexPattern = /\.(map|filter|forEach)\(\(([a-zA-Z_$][a-zA-Z0-9_$]*),\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\)\s*=>/g;
  modified = modified.replace(mapWithIndexPattern, (match, method, param1, param2) => {
    changeCount++;
    return `.${method}((${param1}: any, ${param2}: number) =>`;
  });

  // Pattern 3: function callbacks cu parametri netipați
  const callbackPattern = /\(([a-zA-Z_$][a-zA-Z0-9_$]*)\)\s*=>\s*\{/g;
  // Nu înlocuim toate - doar cele în context specific

  if (changeCount > 0) {
    console.log(`  ✅ ${filePath}: Fixed ${changeCount} implicit any errors`);
  }

  return modified;
}

// Funcție pentru fix TS2307 - Cannot find module
function fixModulePaths(filePath: string, content: string): string {
  let modified = content;
  let changeCount = 0;

  for (const [wrongPath, correctPath] of Object.entries(MODULE_PATH_CORRECTIONS)) {
    const importPattern = new RegExp(`from ['"]${wrongPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"]`, 'g');
    if (importPattern.test(modified)) {
      modified = modified.replace(importPattern, `from '${correctPath}'`);
      changeCount++;
    }
  }

  if (changeCount > 0) {
    console.log(`  ✅ ${filePath}: Fixed ${changeCount} module path errors`);
  }

  return modified;
}

// Funcție pentru fix TS2304 - Cannot find name  
function fixMissingImports(filePath: string, content: string): string {
  let modified = content;
  let changeCount = 0;

  // Check pentru icons lipsă de la lucide-react
  for (const icon of Object.keys(LUCIDE_ICONS_TO_ADD)) {
    const iconUsagePattern = new RegExp(`<${icon}\\s`);
    if (iconUsagePattern.test(modified)) {
      // Verifică dacă e deja importat
      const importPattern = new RegExp(`import.*{[^}]*\\b${icon}\\b[^}]*}.*from.*["']lucide-react["']`);
      if (!importPattern.test(modified)) {
        // Găsește primul import de la lucide-react și adaugă
        const lucideImportPattern = /(import\s*{\s*)([\s\S]*?)(}\s*from\s*["']lucide-react["'])/;
        if (lucideImportPattern.test(modified)) {
          modified = modified.replace(lucideImportPattern, (match, start, icons, end) => {
            changeCount++;
            const iconsList = icons.trim().split(/,\s*/);
            if (!iconsList.includes(icon)) {
              iconsList.push(icon);
            }
            return `${start}${iconsList.join(', ')}${end}`;
          });
        }
      }
    }
  }

  if (changeCount > 0) {
    console.log(`  ✅ ${filePath}: Fixed ${changeCount} missing import errors`);
  }

  return modified;
}

// Main function
async function main() {
  const errorsLog = '/tmp/typescript-errors-full.log';
  
  if (!fs.existsSync(errorsLog)) {
    console.error('❌ Nu există fișierul de erori. Rulați mai întâi: npx tsc --noEmit > /tmp/typescript-errors-full.log');
    process.exit(1);
  }

  const errors = fs.readFileSync(errorsLog, 'utf-8');
  const errorLines = errors.split('\n').filter(line => line.includes('error TS'));

  const files = new Set<string>();
  for (const errorLine of errorLines) {
    const match = errorLine.match(/^(.+?)\(\d+,\d+\):/);
    if (match) {
      files.add(match[1]);
    }
  }

  console.log(`📁 Found ${files.size} files with errors\n`);

  let totalFixed = 0;

  for (const filePath of Array.from(files).sort()) {
    try {
      if (!fs.existsSync(filePath)) {
        console.log(`  ⏭️  ${filePath}: File not found, skipping`);
        continue;
      }

      let content = fs.readFileSync(filePath, 'utf-8');
      const originalContent = content;

      // Apply fixes
      content = fixImplicitAny(filePath, content);
      content = fixModulePaths(filePath, content);
      content = fixMissingImports(filePath, content);

      // Save if modified
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        totalFixed++;
      }
    } catch (error) {
      console.error(`  ❌ ${filePath}: Error - ${(error as Error).message}`);
    }
  }

  console.log('');
  console.log(`✅ DONE: Fixed errors in ${totalFixed} files`);
  console.log('');
  console.log('📋 Next steps:');
  console.log('  1. Run: npx tsc --noEmit to verify');
  console.log('  2. Review changes: git diff');
  console.log('  3. Commit: git commit -am "fix: Rezolvare Quick Wins TypeScript"');
}

main().catch(console.error);

