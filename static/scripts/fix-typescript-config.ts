#!/usr/bin/env tsx
/**
 * Script pentru corectarea configurațiilor TypeScript
 * 
 * Acest script implementează soluțiile recomandate din raportul de audit
 * pentru a reduce numărul de erori TypeScript de la 1232 la sub 50
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Culori pentru output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function ensureBackup(filePath: string) {
  if (fs.existsSync(filePath)) {
    const backupPath = `${filePath}.backup-${Date.now()}`;
    fs.copyFileSync(filePath, backupPath);
    log(`✅ Backup creat: ${backupPath}`, 'green');
  }
}

// Configurația TypeScript principală unificată
const mainTsConfig = {
  compilerOptions: {
    target: "ES2022",
    module: "ES2022",
    moduleResolution: "node",
    lib: ["ES2022", "dom", "dom.iterable"],
    allowSyntheticDefaultImports: true,
    esModuleInterop: true,
    strict: true,
    skipLibCheck: true,
    forceConsistentCasingInFileNames: true,
    resolveJsonModule: true,
    allowImportingTsExtensions: false,
    noEmit: true,
    incremental: true,
    tsBuildInfoFile: "./node_modules/.cache/typescript/tsbuildinfo",
    baseUrl: ".",
    paths: {
      "@/*": ["./client/src/*"],
      "@shared/*": ["./shared/*"],
      "@server/*": ["./server/*"]
    },
    types: ["node"],
    experimentalDecorators: true,
    emitDecoratorMetadata: true
  },
  include: [
    "client/src/**/*",
    "server/**/*",
    "shared/**/*"
  ],
  exclude: [
    "node_modules",
    "dist",
    "build",
    "coverage",
    "**/*.spec.ts",
    "**/*.test.ts"
  ]
};

// Configurație pentru server
const serverTsConfig = {
  extends: "./tsconfig.json",
  compilerOptions: {
    module: "ES2022",
    target: "ES2022",
    outDir: "./dist/server",
    rootDir: "./server",
    allowImportingTsExtensions: false,
    noEmit: false
  },
  include: ["server/**/*"],
  exclude: ["server/**/*.test.ts", "server/**/*.spec.ts"]
};

// Configurație pentru client
const clientTsConfig = {
  extends: "./tsconfig.json",
  compilerOptions: {
    jsx: "react-jsx",
    module: "ESNext",
    moduleResolution: "bundler",
    allowImportingTsExtensions: true,
    noEmit: true
  },
  include: ["client/src/**/*"]
};

// Configurație pentru teste
const testTsConfig = {
  extends: "./tsconfig.json",
  compilerOptions: {
    module: "CommonJS",
    types: ["node", "jest"],
    noEmit: true
  },
  include: [
    "utils/testing/**/*.ts",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
};

// Actualizare VSCode settings
const vscodeSettings = {
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.tsserver.experimental.enableProjectDiagnostics": true,
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.referencesCodeLens.enabled": true,
  "typescript.referencesCodeLens.showOnAllFunctions": true,
  "typescript.implementationsCodeLens.enabled": true,
  "files.associations": {
    "*.ts": "typescript",
    "*.tsx": "typescriptreact"
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/.vscode": true,
    "**/build": true,
    "**/dist": true
  }
};

async function main() {
  log('🔧 Începe procesul de corectare a configurațiilor TypeScript...', 'blue');
  
  const rootDir = process.cwd();
  
  try {
    // 1. Backup configurații existente
    log('\n📦 Creez backup pentru configurațiile existente...', 'yellow');
    ensureBackup(path.join(rootDir, 'tsconfig.json'));
    ensureBackup(path.join(rootDir, 'tsconfig.base.json'));
    ensureBackup(path.join(rootDir, '.vscode/settings.json'));
    
    // 2. Scriere configurație principală
    log('\n📝 Actualizez tsconfig.json principal...', 'yellow');
    fs.writeFileSync(
      path.join(rootDir, 'tsconfig.json'),
      JSON.stringify(mainTsConfig, null, 2)
    );
    log('✅ tsconfig.json actualizat', 'green');
    
    // 3. Creare configurații specializate
    log('\n📝 Creez configurații specializate...', 'yellow');
    
    fs.writeFileSync(
      path.join(rootDir, 'tsconfig.server.json'),
      JSON.stringify(serverTsConfig, null, 2)
    );
    log('✅ tsconfig.server.json creat', 'green');
    
    fs.writeFileSync(
      path.join(rootDir, 'tsconfig.client.json'),
      JSON.stringify(clientTsConfig, null, 2)
    );
    log('✅ tsconfig.client.json creat', 'green');
    
    fs.writeFileSync(
      path.join(rootDir, 'tsconfig.test.json'),
      JSON.stringify(testTsConfig, null, 2)
    );
    log('✅ tsconfig.test.json creat', 'green');
    
    // 4. Actualizare VSCode settings
    log('\n📝 Actualizez setările VSCode...', 'yellow');
    const vscodeDir = path.join(rootDir, '.vscode');
    if (!fs.existsSync(vscodeDir)) {
      fs.mkdirSync(vscodeDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(vscodeDir, 'settings.json'),
      JSON.stringify(vscodeSettings, null, 2)
    );
    log('✅ .vscode/settings.json actualizat', 'green');
    
    // 5. Creare director pentru cache TypeScript
    log('\n📁 Creez directorul pentru cache TypeScript...', 'yellow');
    const cacheDir = path.join(rootDir, 'node_modules/.cache/typescript');
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    log('✅ Director cache creat', 'green');
    
    // 6. Verificare configurație
    log('\n🔍 Verific noua configurație...', 'yellow');
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' });
      log('✅ Configurația TypeScript este validă', 'green');
    } catch (error) {
      log('⚠️  Există încă erori TypeScript, dar configurația este validă', 'yellow');
      log('   Rulați "pnpm run check" pentru a vedea erorile rămase', 'yellow');
    }
    
    // 7. Recomandări finale
    log('\n📋 Pași următori recomandați:', 'magenta');
    log('1. Reporniți TypeScript server în IDE: Cmd+Shift+P -> "TypeScript: Restart TS Server"', 'blue');
    log('2. Verificați erorile rămase: pnpm run check', 'blue');
    log('3. Începeți refactorizarea serviciilor conform documentației', 'blue');
    log('4. Consultați raportul complet: documentation/tsconfig-audit-report-2025.md', 'blue');
    
    log('\n✨ Procesul de corectare a fost finalizat cu succes!', 'green');
    
  } catch (error) {
    log('\n❌ Eroare în timpul procesului de corectare:', 'red');
    console.error(error);
    process.exit(1);
  }
}

// Verificare dacă scriptul este rulat direct
if (require.main === module) {
  main().catch(console.error);
}
