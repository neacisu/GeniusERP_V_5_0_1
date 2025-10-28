/**
 * Endpoint Discovery Script
 * 
 * Acest script parcurge toate fișierele *.routes.ts și extrage endpoint-urile API
 * pentru a crea un inventar complet al aplicației.
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Endpoint {
  method: string;
  path: string;
  file: string;
  middleware: string[];
  hasAuth: boolean;
  hasRateLimit: boolean;
  hasValidation: boolean;
}

interface ModuleEndpoints {
  module: string;
  endpoints: Endpoint[];
}

const projectRoot = path.resolve(__dirname, '../..');

/**
 * Găsește toate fișierele *.routes.ts din proiect
 */
function findRouteFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, dist, etc.
      if (!['node_modules', 'dist', '.git', '.nx', 'coverage'].includes(file)) {
        findRouteFiles(filePath, fileList);
      }
    } else if (file.endsWith('.routes.ts')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Parsează un fișier de rute și extrage endpoint-urile
 */
function parseRouteFile(filePath: string): Endpoint[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const endpoints: Endpoint[] = [];
  
  // Regex patterns pentru identificarea rutelor
  const routePatterns = [
    // router.get('/path', middleware, handler)
    /router\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g,
    // app.get('/path', middleware, handler)
    /app\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g,
  ];

  routePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const method = match[1].toUpperCase();
      const routePath = match[2];
      
      // Extrage linia completă pentru analiză middleware
      const lineStart = content.lastIndexOf('\n', match.index) + 1;
      const lineEnd = content.indexOf('\n', match.index);
      const line = content.substring(lineStart, lineEnd);
      
      // Verifică middleware-uri comune
      const middleware: string[] = [];
      const hasAuth = /AuthGuard|authGuard|requireAuth|protect/.test(line);
      const hasRateLimit = /RateLimiter|rateLimit/.test(line);
      const hasValidation = /validate|schema|zod/.test(line);
      
      if (hasAuth) middleware.push('auth');
      if (hasRateLimit) middleware.push('rateLimit');
      if (hasValidation) middleware.push('validation');
      
      endpoints.push({
        method,
        path: routePath,
        file: path.relative(projectRoot, filePath),
        middleware,
        hasAuth,
        hasRateLimit,
        hasValidation
      });
    }
  });

  return endpoints;
}

/**
 * Grupează endpoint-urile pe module
 */
function groupByModule(allEndpoints: { file: string; endpoints: Endpoint[] }[]): ModuleEndpoints[] {
  const moduleMap = new Map<string, Endpoint[]>();

  allEndpoints.forEach(({ file, endpoints }) => {
    // Extrage numele modulului din calea fișierului
    let moduleName = 'unknown';
    
    if (file.includes('libs/auth')) moduleName = 'Auth';
    else if (file.includes('libs/accounting')) moduleName = 'Accounting';
    else if (file.includes('libs/hr')) moduleName = 'HR';
    else if (file.includes('libs/inventory')) moduleName = 'Inventory';
    else if (file.includes('libs/invoicing')) moduleName = 'Invoicing';
    else if (file.includes('libs/users')) moduleName = 'Users';
    else if (file.includes('libs/crm')) moduleName = 'CRM';
    else if (file.includes('libs/analytics')) moduleName = 'Analytics';
    else if (file.includes('libs/ai')) moduleName = 'AI';
    else if (file.includes('libs/company')) moduleName = 'Companies';
    else if (file.includes('libs/integrations')) moduleName = 'Integrations';
    else if (file.includes('libs/settings')) moduleName = 'Settings';
    else if (file.includes('libs/collab')) moduleName = 'Collaboration';
    else if (file.includes('libs/bpm')) moduleName = 'BPM';
    else if (file.includes('libs/comms')) moduleName = 'Communications';
    else if (file.includes('libs/documents')) moduleName = 'Documents';
    else if (file.includes('libs/ecommerce')) moduleName = 'Ecommerce';
    else if (file.includes('libs/marketing')) moduleName = 'Marketing';
    else if (file.includes('libs/audit')) moduleName = 'Audit';
    else if (file.includes('apps/api')) moduleName = 'API';

    if (!moduleMap.has(moduleName)) {
      moduleMap.set(moduleName, []);
    }
    
    moduleMap.get(moduleName)!.push(...endpoints);
  });

  return Array.from(moduleMap.entries()).map(([module, endpoints]) => ({
    module,
    endpoints
  })).sort((a, b) => a.module.localeCompare(b.module));
}

/**
 * Generează raport Markdown
 */
function generateMarkdownReport(modules: ModuleEndpoints[]): string {
  let report = `# Inventar Endpoint-uri API - GeniusERP\n\n`;
  report += `**Data generării:** ${new Date().toISOString()}\n\n`;
  
  // Sumar
  const totalEndpoints = modules.reduce((sum, m) => sum + m.endpoints.length, 0);
  const authProtected = modules.reduce((sum, m) => 
    sum + m.endpoints.filter(e => e.hasAuth).length, 0);
  const rateLimited = modules.reduce((sum, m) => 
    sum + m.endpoints.filter(e => e.hasRateLimit).length, 0);
  
  report += `## Sumar Executiv\n\n`;
  report += `- **Total Endpoint-uri:** ${totalEndpoints}\n`;
  report += `- **Protejate cu Autentificare:** ${authProtected} (${Math.round(authProtected/totalEndpoints*100)}%)\n`;
  report += `- **Cu Rate Limiting:** ${rateLimited} (${Math.round(rateLimited/totalEndpoints*100)}%)\n`;
  report += `- **Module:** ${modules.length}\n\n`;
  
  // Tabel sumar module
  report += `## Module\n\n`;
  report += `| Modul | Endpoint-uri | Auth | Rate Limit |\n`;
  report += `|-------|--------------|------|------------|\n`;
  
  modules.forEach(m => {
    const auth = m.endpoints.filter(e => e.hasAuth).length;
    const rl = m.endpoints.filter(e => e.hasRateLimit).length;
    report += `| ${m.module} | ${m.endpoints.length} | ${auth} | ${rl} |\n`;
  });
  
  report += `\n---\n\n`;
  
  // Detalii per modul
  modules.forEach(m => {
    report += `## Modul: ${m.module}\n\n`;
    report += `**Total endpoint-uri:** ${m.endpoints.length}\n\n`;
    
    if (m.endpoints.length > 0) {
      report += `| Metodă | Endpoint | Auth | Rate Limit | Fișier |\n`;
      report += `|--------|----------|------|------------|--------|\n`;
      
      m.endpoints.forEach(e => {
        const auth = e.hasAuth ? '✅' : '❌';
        const rl = e.hasRateLimit ? '✅' : '❌';
        const file = e.file.split('/').pop() || e.file;
        report += `| ${e.method} | ${e.path} | ${auth} | ${rl} | ${file} |\n`;
      });
      
      report += `\n`;
    }
    
    report += `\n`;
  });
  
  return report;
}

/**
 * Generează raport JSON pentru processing automat
 */
function generateJsonReport(modules: ModuleEndpoints[]): string {
  return JSON.stringify({
    generatedAt: new Date().toISOString(),
    summary: {
      totalEndpoints: modules.reduce((sum, m) => sum + m.endpoints.length, 0),
      totalModules: modules.length,
      authProtected: modules.reduce((sum, m) => 
        sum + m.endpoints.filter(e => e.hasAuth).length, 0),
      rateLimited: modules.reduce((sum, m) => 
        sum + m.endpoints.filter(e => e.hasRateLimit).length, 0)
    },
    modules
  }, null, 2);
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Căutare fișiere de rute...');
  const routeFiles = findRouteFiles(path.join(projectRoot, 'libs'));
  console.log(`✅ Găsite ${routeFiles.length} fișiere de rute\n`);

  console.log('📊 Parsare endpoint-uri...');
  const allEndpoints = routeFiles.map(file => ({
    file,
    endpoints: parseRouteFile(file)
  })).filter(item => item.endpoints.length > 0);
  
  const modules = groupByModule(allEndpoints);
  console.log(`✅ Procesate ${modules.length} module\n`);

  // Generează rapoarte
  console.log('📝 Generare rapoarte...');
  const markdownReport = generateMarkdownReport(modules);
  const jsonReport = generateJsonReport(modules);

  // Salvează rapoartele
  const outputDir = path.join(projectRoot, 'static/documentation/security');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(outputDir, 'endpoint-inventory.md'),
    markdownReport
  );
  
  fs.writeFileSync(
    path.join(outputDir, 'endpoint-inventory.json'),
    jsonReport
  );

  console.log('✅ Rapoarte generate:');
  console.log(`   - ${path.join(outputDir, 'endpoint-inventory.md')}`);
  console.log(`   - ${path.join(outputDir, 'endpoint-inventory.json')}`);
  console.log('\n🎉 Proces finalizat cu succes!');
}

// Rulează scriptul
main().catch(console.error);

