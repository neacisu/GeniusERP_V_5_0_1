/**
 * Create Financial Data Tables Script
 * 
 * Acest script creează tabelele necesare pentru stocarea datelor financiare
 * obținute de la ANAF, inclusiv istoricul indicatorilor financiari din bilanțuri.
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

// Obține directorul curent în ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Calea către scriptul TypeScript de migrare
const migrationScriptPath = path.join(
  __dirname, 
  'server', 
  'modules',
  'crm',
  'migrations',
  'create-financial-data-tables.ts'
);

console.log('📊 Inițiez crearea tabelelor de date financiare ANAF...');
console.log(`🔍 Folosesc scriptul de migrare: ${migrationScriptPath}`);

// Execută scriptul folosind ts-node
const migrationProcess = spawn('npx', ['ts-node', migrationScriptPath], {
  stdio: 'inherit', // Afișează output-ul direct în consolă
  shell: true
});

migrationProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Procesul de creare a tabelelor s-a finalizat cu succes!');
  } else {
    console.error(`❌ Procesul de creare a tabelelor a eșuat cu codul: ${code}`);
    process.exit(1);
  }
});

migrationProcess.on('error', (err) => {
  console.error(`❌ Eroare la pornirea procesului: ${err.message}`);
  process.exit(1);
});