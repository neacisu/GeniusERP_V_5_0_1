/**
 * GeniusERP Migration System v2.0
 *
 * Sistem centralizat și modular de migrații pentru baza de date.
 * Acest fișier controlează toate migrațiile din aplicație.
 *
 * Structură:
 * - migrations/modules/ - Migrații specifice pentru fiecare modul
 * - migrations/core/ - Migrații pentru tabelele de bază (users, companies, etc.)
 * - migrations/data/ - Migrații pentru date populare
 *
 * Utilizare:
 * npm run migrate:all - Rulează toate migrațiile
 * npm run migrate:module accounting - Rulează doar migrațiile pentru accounting
 * npm run migrate:create account_balances - Creează migrarea pentru account_balances
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES modules equivalent of __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================================
// CONFIGURATION
// ============================================================================

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

const client = postgres(DATABASE_URL, { prepare: false });
const db = drizzle(client);

// ============================================================================
// MIGRATION MODULES
// ============================================================================

/**
 * Lista tuturor modulelor care au migrații
 */
const MIGRATION_MODULES = [
  'core',           // Tabele de bază (users, companies, roles, permissions)
  'accounting',     // Modul contabil (ledger, accounts, balances)
  'inventory',      // Gestionare inventar
  'crm',           // Customer Relationship Management
  'hr',            // Human Resources
  'ecommerce',     // E-commerce
  'analytics',     // Analytics și reporting
  'collaboration', // Colaborare și documente
  'communications', // Comunicații
  'bpm',           // Business Process Management
  'marketing',     // Marketing
  'integrations'   // Integrări externe
] as const;

type MigrationModule = typeof MIGRATION_MODULES[number];

// ============================================================================
// MIGRATION EXECUTOR
// ============================================================================

/**
 * Executor pentru migrații individuale de modul
 */
class MigrationExecutor {
  private module: MigrationModule;

  constructor(module: MigrationModule) {
    this.module = module;
  }

  /**
   * Rulează migrațiile pentru acest modul
   */
  async run(): Promise<void> {
    console.log(`🚀 Starting migrations for module: ${this.module}`);

    try {
      const migrationPath = path.join(__dirname, 'modules', this.module);

      // Rulează migrațiile Drizzle pentru acest modul
      await migrate(db, { migrationsFolder: migrationPath });

      console.log(`✅ Migrations completed for module: ${this.module}`);
    } catch (error) {
      console.error(`❌ Migration failed for module: ${this.module}`, error);
      throw error;
    }
  }

  /**
   * Verifică statusul migrațiilor pentru acest modul
   */
  async status(): Promise<void> {
    console.log(`📊 Checking migration status for module: ${this.module}`);
    // TODO: Implement status checking
  }
}

// ============================================================================
// MAIN MIGRATION CONTROLLER
// ============================================================================

/**
 * Controller principal pentru toate migrațiile
 */
class MigrationController {
  private executors: Map<MigrationModule, MigrationExecutor>;

  constructor() {
    this.executors = new Map();
    MIGRATION_MODULES.forEach(module => {
      this.executors.set(module, new MigrationExecutor(module));
    });
  }

  /**
   * Rulează toate migrațiile pentru toate modulele
   */
  async runAll(): Promise<void> {
    console.log('🎯 Starting ALL migrations for GeniusERP v2.0');

    for (const module of MIGRATION_MODULES) {
      const executor = this.executors.get(module)!;
      await executor.run();
    }

    console.log('🎉 ALL migrations completed successfully!');
  }

  /**
   * Rulează migrațiile pentru un modul specific
   */
  async runModule(module: MigrationModule): Promise<void> {
    const executor = this.executors.get(module);
    if (!executor) {
      throw new Error(`Unknown migration module: ${module}`);
    }

    await executor.run();
  }

  /**
   * Verifică statusul tuturor migrațiilor
   */
  async status(): Promise<void> {
    console.log('📊 Migration Status Report:');

    for (const module of MIGRATION_MODULES) {
      const executor = this.executors.get(module)!;
      await executor.status();
    }
  }

  /**
   * Creează o nouă migrare pentru un modul
   */
  async createMigration(module: MigrationModule, tableName: string): Promise<void> {
    console.log(`📝 Creating migration for table: ${tableName} in module: ${module}`);

    const migrationPath = path.join(__dirname, 'modules', module);
    // Folosim nume descriptive fără timestamp-uri pentru evitare conflicte
    const fileName = `create_${tableName}.ts`;

    // TODO: Generate migration file template
    console.log(`Would create: ${path.join(migrationPath, fileName)}`);
  }
}

// ============================================================================
// CLI INTERFACE
// ============================================================================

/**
 * Interfață CLI pentru migrații
 */
async function main() {
  const args = process.argv.slice(2);
  const controller = new MigrationController();

  if (args.length === 0) {
    console.log(`
🎯 GeniusERP Migration System v2.0

Usage:
  npm run migrate:all              - Run all migrations
  npm run migrate:module <module>  - Run migrations for specific module
  npm run migrate:status           - Check migration status
  npm run migrate:create <module> <table> - Create new migration

Available modules:
${MIGRATION_MODULES.map(m => `  - ${m}`).join('\n')}

Examples:
  npm run migrate:all
  npm run migrate:module accounting
  npm run migrate:create accounting account_balances
`);
    return;
  }

  const command = args[0];

  try {
    switch (command) {
      case 'all':
        await controller.runAll();
        break;

      case 'module':
        const module = args[1] as MigrationModule;
        if (!module) {
          throw new Error('Module name required: npm run migrate:module <module>');
        }
        await controller.runModule(module);
        break;

      case 'status':
        await controller.status();
        break;

      case 'create':
        const createModule = args[1] as MigrationModule;
        const tableName = args[2];
        if (!createModule || !tableName) {
          throw new Error('Module and table name required: npm run migrate:create <module> <table>');
        }
        await controller.createMigration(createModule, tableName);
        break;

      default:
        throw new Error(`Unknown command: ${command}`);
    }
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { MigrationController, MigrationExecutor, MIGRATION_MODULES };
export type { MigrationModule };

// ============================================================================
// CLI EXECUTION
// ============================================================================

// For ES modules, check if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
