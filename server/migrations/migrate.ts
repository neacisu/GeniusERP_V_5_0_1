import { DrizzleModule } from '../common/drizzle';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ES module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  try {
    console.log('Starting database migrations...');
    
    // Initialize DrizzleModule first
    await DrizzleModule.initialize();
    const drizzle = await DrizzleModule.getService();
    
    // Run migrations from the migrations folder
    const migrationsFolder = path.join(__dirname, 'sql');
    console.log(`Using migrations folder: ${migrationsFolder}`);
    await migrate(drizzle.db, { migrationsFolder });
    
    console.log('Migrations completed successfully ✅');
    
    await DrizzleModule.cleanup();
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();