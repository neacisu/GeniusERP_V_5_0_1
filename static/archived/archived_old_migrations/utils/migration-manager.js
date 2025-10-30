/**
 * Unified Migration Manager
 * 
 * This utility provides a centralized way to manage all database migrations
 * for different modules in the application.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { exit } = require('process');

// Default configuration
const config = {
  migrationsDir: path.join(process.cwd(), 'drizzle', 'migrations'),
  schemaDir: path.join(process.cwd(), 'shared', 'schema'),
  dbUrl: process.env.DATABASE_URL,
  dryRun: false,
  verbose: true
};

/**
 * Migration manager for handling database schema migrations
 */
class MigrationManager {
  /**
   * Create a new migration manager
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.config = { ...config, ...options };
    
    // Ensure the migrations directory exists
    if (!fs.existsSync(this.config.migrationsDir)) {
      fs.mkdirSync(this.config.migrationsDir, { recursive: true });
    }
  }

  /**
   * Run drizzle-kit to generate migrations
   * @param {Object} options - Generation options
   * @returns {Object} Result of migration generation
   */
  generateMigrations(options = {}) {
    const {
      migrationName = `migration_${new Date().toISOString().replace(/[:.]/g, '_')}`,
      schemaFile = null,
      out = this.config.migrationsDir,
      dryRun = this.config.dryRun
    } = options;
    
    console.log(`Generating migrations${dryRun ? ' (dry run)' : ''}...`);
    
    // Build schema path argument
    const schemaPath = schemaFile ? 
      path.resolve(schemaFile) : 
      path.join(this.config.schemaDir, 'index.ts');
    
    // Build command arguments
    const args = [
      'drizzle-kit', 'generate:pg',
      '--schema', schemaPath,
      '--out', out
    ];
    
    if (migrationName) {
      args.push('--name', migrationName);
    }
    
    if (dryRun) {
      console.log('Command:', 'npx', args.join(' '));
      return { success: true, dryRun: true };
    }
    
    // Execute command
    if (this.config.verbose) {
      console.log('Running:', 'npx', args.join(' '));
    }
    
    const result = spawnSync('npx', args, { 
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    if (result.status !== 0) {
      console.error('Migration generation failed');
      return { success: false, error: result.error };
    }
    
    console.log('Migration generation successful');
    return { success: true };
  }

  /**
   * Apply migrations to the database
   * @param {Object} options - Migration options
   * @returns {Object} Result of migration application
   */
  applyMigrations(options = {}) {
    const {
      migrationsDir = this.config.migrationsDir,
      dbUrl = this.config.dbUrl,
      dryRun = this.config.dryRun
    } = options;
    
    console.log(`Applying migrations${dryRun ? ' (dry run)' : ''}...`);
    
    if (!dbUrl) {
      console.error('DATABASE_URL environment variable is not set');
      return { success: false, error: 'No database URL provided' };
    }
    
    // Build command arguments
    const args = [
      'drizzle-kit', 'push:pg',
      '--migrations', migrationsDir,
      '--driver', 'pg',
      '--verbose'
    ];
    
    if (dryRun) {
      args.push('--dry-run');
    }
    
    const env = {
      ...process.env,
      DATABASE_URL: dbUrl
    };
    
    // Execute command
    if (this.config.verbose) {
      console.log('Running:', 'npx', args.join(' '));
      console.log('Using database:', dbUrl.replace(/:\/\/[^:]+:[^@]+@/, '://***:***@'));
    }
    
    const result = spawnSync('npx', args, { 
      stdio: 'inherit',
      env
    });
    
    if (result.status !== 0) {
      console.error('Migration application failed');
      return { success: false, error: result.error };
    }
    
    console.log('Migration application successful');
    return { success: true };
  }

  /**
   * Check migration status
   * @param {Object} options - Check options
   * @returns {Object} Result of migration check
   */
  checkMigrations(options = {}) {
    const {
      migrationsDir = this.config.migrationsDir,
      dbUrl = this.config.dbUrl
    } = options;
    
    console.log(`Checking migration status...`);
    
    if (!dbUrl) {
      console.error('DATABASE_URL environment variable is not set');
      return { success: false, error: 'No database URL provided' };
    }
    
    // Build command arguments
    const args = [
      'drizzle-kit', 'check:pg',
      '--migrations', migrationsDir,
      '--driver', 'pg',
      '--verbose'
    ];
    
    const env = {
      ...process.env,
      DATABASE_URL: dbUrl
    };
    
    // Execute command
    if (this.config.verbose) {
      console.log('Running:', 'npx', args.join(' '));
    }
    
    const result = spawnSync('npx', args, { 
      stdio: 'inherit',
      env
    });
    
    if (result.status !== 0) {
      console.error('Migration check failed');
      return { success: false, error: result.error };
    }
    
    console.log('Migration check successful');
    return { success: true };
  }

  /**
   * Drop all tables in the database (DANGEROUS)
   * @param {Object} options - Drop options
   * @returns {Object} Result of drop operation
   */
  dropTables(options = {}) {
    const {
      dbUrl = this.config.dbUrl,
      confirm = false,
      dryRun = this.config.dryRun
    } = options;
    
    console.log('⚠️  WARNING: This will drop all tables in the database!');
    
    if (!confirm) {
      console.error('Operation aborted. Pass confirm=true to proceed');
      return { success: false, error: 'Not confirmed' };
    }
    
    if (dryRun) {
      console.log('Dry run: Would drop all tables in the database');
      return { success: true, dryRun: true };
    }
    
    console.log('Dropping all tables...');
    
    if (!dbUrl) {
      console.error('DATABASE_URL environment variable is not set');
      return { success: false, error: 'No database URL provided' };
    }
    
    // This would be the drop all tables command
    // We're being extra careful by not implementing it
    // If you really need this, you should use a proper tool
    
    console.log('⚠️  Drop tables feature is disabled for safety');
    console.log('Please use a database management tool to drop tables if needed');
    
    return { success: false, error: 'Feature disabled for safety' };
  }

  /**
   * Module migration helper for specific module schemas
   * @param {string} moduleName - Module name
   * @param {string} schemaFile - Schema file path
   * @returns {Object} Module migration helper
   */
  forModule(moduleName, schemaFile) {
    return {
      /**
       * Generate migrations for this module
       * @param {Object} options - Generation options
       * @returns {Object} Result of migration generation
       */
      generateMigrations: (options = {}) => {
        return this.generateMigrations({
          ...options,
          migrationName: `${moduleName}_${options.migrationName || 'update'}`,
          schemaFile
        });
      },
      
      /**
       * Apply migrations for this module
       * @param {Object} options - Migration options
       * @returns {Object} Result of migration application
       */
      applyMigrations: (options = {}) => {
        return this.applyMigrations(options);
      }
    };
  }
}

// Create module-specific migration helpers
const moduleManagers = {
  /**
   * Create a migration manager for a specific module
   * @param {string} moduleName - Module name
   * @param {string} schemaFile - Schema file path relative to repo root
   * @returns {Object} Module migration helper
   */
  create(moduleName, schemaFile) {
    const manager = new MigrationManager();
    return manager.forModule(moduleName, schemaFile);
  },
  
  // Built-in module helpers
  accounting: new MigrationManager().forModule('accounting', 'shared/schema/accounting.ts'),
  admin: new MigrationManager().forModule('admin', 'shared/schema/admin.ts'),
  analytics: new MigrationManager().forModule('analytics', 'shared/schema/analytics.ts'),
  audit: new MigrationManager().forModule('audit', 'shared/schema/audit.ts'),
  auth: new MigrationManager().forModule('auth', 'shared/schema/auth.ts'),
  bpm: new MigrationManager().forModule('bpm', 'shared/schema/bpm.ts'),
  collab: new MigrationManager().forModule('collab', 'shared/schema/collab.ts'),
  comms: new MigrationManager().forModule('comms', 'shared/schema/comms.ts'),
  crm: new MigrationManager().forModule('crm', 'shared/schema/crm.ts'),
  documents: new MigrationManager().forModule('documents', 'shared/schema/documents.ts'),
  ecommerce: new MigrationManager().forModule('ecommerce', 'shared/schema/ecommerce.ts'),
  hr: new MigrationManager().forModule('hr', 'shared/schema/hr.ts'),
  integrations: new MigrationManager().forModule('integrations', 'shared/schema/integrations.ts'),
  inventory: new MigrationManager().forModule('inventory', 'shared/schema/inventory.ts'),
  invoicing: new MigrationManager().forModule('invoicing', 'shared/schema/invoicing.ts'),
  marketing: new MigrationManager().forModule('marketing', 'shared/schema/marketing.ts'),
  sales: new MigrationManager().forModule('sales', 'shared/schema/sales.ts'),
  settings: new MigrationManager().forModule('settings', 'shared/schema/settings.ts')
};

// Export utilities
module.exports = {
  MigrationManager,
  moduleManagers
};

// If run directly from command line
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const manager = new MigrationManager();
  
  if (command === 'generate') {
    const moduleName = args[1];
    const migrationName = args[2] || 'update';
    
    if (!moduleName) {
      console.error('Module name is required');
      console.log('Usage: node migration-manager.js generate <module-name> [migration-name]');
      exit(1);
    }
    
    if (moduleManagers[moduleName]) {
      const result = moduleManagers[moduleName].generateMigrations({ 
        migrationName 
      });
      exit(result.success ? 0 : 1);
    } else {
      console.error(`Module "${moduleName}" not found`);
      exit(1);
    }
    
  } else if (command === 'apply') {
    const result = manager.applyMigrations();
    exit(result.success ? 0 : 1);
    
  } else if (command === 'check') {
    const result = manager.checkMigrations();
    exit(result.success ? 0 : 1);
    
  } else if (command === 'drop') {
    const confirmed = args[1] === '--confirm';
    if (!confirmed) {
      console.error('This operation requires explicit confirmation');
      console.log('Usage: node migration-manager.js drop --confirm');
      exit(1);
    }
    
    const result = manager.dropTables({ confirm: true });
    exit(result.success ? 0 : 1);
    
  } else {
    console.log('Migration Manager Usage:');
    console.log('  node migration-manager.js generate <module-name> [migration-name]');
    console.log('  node migration-manager.js apply');
    console.log('  node migration-manager.js check');
    console.log('  node migration-manager.js drop --confirm');
  }
}