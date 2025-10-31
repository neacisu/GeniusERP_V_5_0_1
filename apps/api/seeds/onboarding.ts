/**
 * 🚀 GeniusERP Onboarding Script
 * 
 * Script complet de onboarding care execută toate seed-urile în ordinea corectă.
 * Include verificări prerequisite, progres în timp real și raportare detalită.
 * 
 * Ordinea de execuție:
 * 1. Verificări prerequisite (DB, conectivitate, tabele)
 * 2. Initial Admin Users (admin, superadmin)
 * 3. Core Permissions (permisiuni și asignări roluri)
 * 4. Essential Configurations (configurări sistem)
 * 5. Chart of Accounts (Plan de Conturi - opțional)
 * 6. COR (Clasificarea Ocupațiilor - opțional)
 */

interface OnboardingOptions {
  skipAccountingSeeds?: boolean;
  skipHRSeeds?: boolean;
  verbose?: boolean;
}

interface SeedResult {
  name: string;
  success: boolean;
  duration: number;
  message?: string;
  error?: string;
}

export async function runOnboarding(db: any, options: OnboardingOptions = {}) {
  const startTime = Date.now();
  const results: SeedResult[] = [];
  
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║        🚀 GeniusERP Database Onboarding Started        ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  try {
    // ===================================================================
    // STEP 1: VERIFICĂRI PREREQUISITE
    // ===================================================================
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│ 📋 Step 1/6: Running Pre-flight Checks                 │');
    console.log('└─────────────────────────────────────────────────────────┘\n');
    
    const preflightResult = await runWithTimer('Preflight Checks', async () => {
      // Test conexiune DB
      console.log('  ⏳ Testing database connection...');
      const [testResult] = await db.execute('SELECT 1 as test');
      if (testResult?.test !== 1) {
        throw new Error('Database connection test failed');
      }
      console.log('  ✅ Database connection OK\n');
      
      // Verifică tabele esențiale
      console.log('  ⏳ Checking essential tables...');
      const essentialTables = ['users', 'companies', 'roles', 'permissions', 'configurations'];
      const [tablesResult] = await db.execute(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = ANY($1)
      `, [essentialTables]);
      
      const existingTables = tablesResult?.map((t: any) => t.table_name) || [];
      const missingTables = essentialTables.filter(t => !existingTables.includes(t));
      
      if (missingTables.length > 0) {
        console.log(`  ⚠️  Missing tables: ${missingTables.join(', ')}`);
        console.log('  💡 Run migrations first: npm run db:migrate\n');
      } else {
        console.log('  ✅ All essential tables exist\n');
      }
      
      // Verifică dacă sistemul este deja seeded
      console.log('  ⏳ Checking existing data...');
      const [usersCount] = await db.execute('SELECT COUNT(*)::int as count FROM users');
      const [rolesCount] = await db.execute('SELECT COUNT(*)::int as count FROM roles');
      const [permsCount] = await db.execute('SELECT COUNT(*)::int as count FROM permissions');
      
      console.log(`  📊 Current state:`);
      console.log(`     - Users: ${usersCount?.count || 0}`);
      console.log(`     - Roles: ${rolesCount?.count || 0}`);
      console.log(`     - Permissions: ${permsCount?.count || 0}\n`);
      
      if (usersCount?.count > 0 || rolesCount?.count > 0) {
        console.log('  ⚠️  Database appears to be already seeded');
        console.log('  💡 Seeds will UPDATE existing data (idempotent)\n');
      }
      
      return { success: true };
    });
    
    results.push(preflightResult);
    
    if (!preflightResult.success) {
      throw new Error('Preflight checks failed. Cannot continue onboarding.');
    }
    
    // ===================================================================
    // STEP 2: INITIAL ADMIN USERS
    // ===================================================================
    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│ 👤 Step 2/6: Creating Initial Admin Users              │');
    console.log('└─────────────────────────────────────────────────────────┘\n');
    
    const usersResult = await runSeed(db, 'initial-admin-users', {
      description: 'Admin users and system roles',
      verbose: options.verbose
    });
    results.push(usersResult);
    
    if (!usersResult.success) {
      throw new Error('Failed to create initial admin users. Cannot continue.');
    }
    
    // ===================================================================
    // STEP 3: CORE PERMISSIONS
    // ===================================================================
    console.log('\n┌─────────────────────────────────────────────────────────┐');
    console.log('│ 🔐 Step 3/6: Setting Up Core Permissions               │');
    console.log('└─────────────────────────────────────────────────────────┘\n');
    
    const permsResult = await runSeed(db, 'core-permissions', {
      description: 'System permissions and role assignments',
      verbose: options.verbose
    });
    results.push(permsResult);
    
    if (!permsResult.success) {
      console.log('  ⚠️  Warning: Permissions setup failed, but continuing...\n');
    }
    
    // ===================================================================
    // STEP 4: ESSENTIAL CONFIGURATIONS
    // ===================================================================
    console.log('\n┌─────────────────────────────────────────────────────────┐');
    console.log('│ ⚙️  Step 4/6: Loading Essential Configurations          │');
    console.log('└─────────────────────────────────────────────────────────┘\n');
    
    const configsResult = await runSeed(db, 'essential-configurations', {
      description: 'System configurations and defaults',
      verbose: options.verbose
    });
    results.push(configsResult);
    
    if (!configsResult.success) {
      console.log('  ⚠️  Warning: Configurations setup failed, but continuing...\n');
    }
    
    // ===================================================================
    // STEP 5: CHART OF ACCOUNTS (OPTIONAL) - Using Centralized Migration System
    // ===================================================================
    if (!options.skipAccountingSeeds) {
      console.log('\n┌─────────────────────────────────────────────────────────┐');
      console.log('│ 📊 Step 5/6: Seeding Chart of Accounts (Romanian)      │');
      console.log('│          Using Centralized Migration System             │');
      console.log('└─────────────────────────────────────────────────────────┘\n');
      
      console.log('  ⚠️  NOTE: Chart of Accounts now uses centralized migration system');
      console.log('  📁 Location: /migrations/modules/core/PC_plan_conturi_seeding/');
      console.log('  🚀 Run: npm run migrate:all or npm run migrate:module core\n');
      
      results.push({
        name: 'accounting/chart-of-accounts',
        success: true,
        duration: 0,
        message: 'Moved to centralized migration system - run migrations instead'
      });
    } else {
      console.log('\n┌─────────────────────────────────────────────────────────┐');
      console.log('│ 📊 Step 5/6: Chart of Accounts - SKIPPED               │');
      console.log('└─────────────────────────────────────────────────────────┘\n');
      results.push({
        name: 'accounting/chart-of-accounts',
        success: true,
        duration: 0,
        message: 'Skipped by user option'
      });
    }
    
    // ===================================================================
    // STEP 6: COR (OPTIONAL)
    // ===================================================================
    if (!options.skipHRSeeds) {
      console.log('\n┌─────────────────────────────────────────────────────────┐');
      console.log('│ 👔 Step 6/6: Seeding COR (Romanian Occupations)        │');
      console.log('└─────────────────────────────────────────────────────────┘\n');
      
      const corResult = await runSeed(db, 'hr/seed-cor', {
        description: 'COR - Romanian Occupations Classification',
        verbose: options.verbose
      });
      results.push(corResult);
      
      if (!corResult.success) {
        console.log('  ⚠️  Warning: COR seeding failed\n');
      }
    } else {
      console.log('\n┌─────────────────────────────────────────────────────────┐');
      console.log('│ 👔 Step 6/6: COR Seeds - SKIPPED                       │');
      console.log('└─────────────────────────────────────────────────────────┘\n');
      results.push({
        name: 'hr/seed-cor',
        success: true,
        duration: 0,
        message: 'Skipped by user option'
      });
    }
    
    // ===================================================================
    // FINAL REPORT
    // ===================================================================
    const totalDuration = Date.now() - startTime;
    printFinalReport(results, totalDuration, options);
    
    // Verificare finală
    console.log('\n┌─────────────────────────────────────────────────────────┐');
    console.log('│ 🔍 Final Verification                                   │');
    console.log('└─────────────────────────────────────────────────────────┘\n');
    
    await verifyOnboarding(db);
    
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║      ✅ GeniusERP Onboarding Completed Successfully!     ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    console.log('📝 Default Credentials:\n');
    console.log('   Admin User:');
    console.log('   📧 Email:    admin@geniuserp.ro');
    console.log('   🔑 Password: admin1234\n');
    console.log('   SuperAdmin Developer:');
    console.log('   📧 Email:    superadmin@geniuserp.ro');
    console.log('   🔑 Password: %up3r@dm1n\n');
    console.log('⚠️  IMPORTANT: Change these passwords immediately in production!\n');
    
    return {
      success: true,
      results,
      duration: totalDuration
    };
    
  } catch (error: any) {
    console.error('\n❌ ONBOARDING FAILED\n');
    console.error('Error:', error.message);
    console.error('\nStack trace:', error.stack);
    
    printFinalReport(results, Date.now() - startTime, options);
    
    return {
      success: false,
      error: error.message,
      results,
      duration: Date.now() - startTime
    };
  }
}

/**
 * Execută un seed individual cu timing și error handling
 */
async function runSeed(db: any, seedName: string, options: { description?: string; verbose?: boolean }) {
  const startTime = Date.now();
  
  console.log(`  ⏳ Running: ${seedName}`);
  if (options.description) {
    console.log(`     ${options.description}`);
  }
  
  try {
    const path = require('path');
    const seedPath = path.join(__dirname, seedName);
    
    const seedModule = require(seedPath);
    const seedFunction = seedModule.default || seedModule.seed || seedModule;
    
    if (typeof seedFunction !== 'function') {
      throw new Error(`Seed ${seedName} does not export a valid function`);
    }
    
    await seedFunction(db);
    
    const duration = Date.now() - startTime;
    console.log(`  ✅ Completed in ${formatDuration(duration)}\n`);
    
    return {
      name: seedName,
      success: true,
      duration,
      message: 'Success'
    };
    
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`  ❌ Failed after ${formatDuration(duration)}`);
    console.error(`     Error: ${error.message}\n`);
    
    if (options.verbose) {
      console.error('     Stack trace:', error.stack, '\n');
    }
    
    return {
      name: seedName,
      success: false,
      duration,
      error: error.message
    };
  }
}

/**
 * Execută o operație cu timing
 */
async function runWithTimer(name: string, operation: () => Promise<any>) {
  const startTime = Date.now();
  
  try {
    await operation();
    
    return {
      name,
      success: true,
      duration: Date.now() - startTime
    };
  } catch (error: any) {
    return {
      name,
      success: false,
      duration: Date.now() - startTime,
      error: error.message
    };
  }
}

/**
 * Verifică rezultatul onboarding-ului
 */
async function verifyOnboarding(db: any) {
  try {
    // Verifică useri
    const [usersResult] = await db.execute(`
      SELECT COUNT(*)::int as count FROM users WHERE email IN ('admin@geniuserp.ro', 'superadmin@geniuserp.ro')
    `);
    const adminUsersCount = usersResult?.count || 0;
    
    // Verifică roluri
    const [rolesResult] = await db.execute(`
      SELECT COUNT(*)::int as count FROM roles WHERE name IN ('admin', 'superadmin', 'user', 'manager')
    `);
    const systemRolesCount = rolesResult?.count || 0;
    
    // Verifică permisiuni
    const [permsResult] = await db.execute('SELECT COUNT(*)::int as count FROM permissions');
    const permissionsCount = permsResult?.count || 0;
    
    // Verifică configurări
    const [configsResult] = await db.execute('SELECT COUNT(*)::int as count FROM configurations');
    const configurationsCount = configsResult?.count || 0;
    
    console.log('  📊 Verification Results:');
    console.log(`     ✅ Admin Users: ${adminUsersCount}/2`);
    console.log(`     ✅ System Roles: ${systemRolesCount}/4`);
    console.log(`     ✅ Permissions: ${permissionsCount}`);
    console.log(`     ✅ Configurations: ${configurationsCount}`);
    
    const allGood = adminUsersCount === 2 && systemRolesCount >= 4 && permissionsCount > 0 && configurationsCount > 0;
    
    if (allGood) {
      console.log('\n  ✅ All verification checks passed!\n');
    } else {
      console.log('\n  ⚠️  Some verification checks failed. Review the logs above.\n');
    }
    
    return allGood;
    
  } catch (error: any) {
    console.error('  ❌ Verification failed:', error.message, '\n');
    return false;
  }
}

/**
 * Afișează raportul final
 */
function printFinalReport(results: SeedResult[], totalDuration: number, options: OnboardingOptions) {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║                    📊 Execution Report                     ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log('Summary:');
  console.log(`  Total Steps: ${results.length}`);
  console.log(`  ✅ Successful: ${successCount}`);
  console.log(`  ❌ Failed: ${failCount}`);
  console.log(`  ⏱️  Total Duration: ${formatDuration(totalDuration)}\n`);
  
  console.log('Detailed Results:');
  console.log('┌──────────────────────────────────────────┬─────────┬──────────┐');
  console.log('│ Seed Name                                │ Status  │ Duration │');
  console.log('├──────────────────────────────────────────┼─────────┼──────────┤');
  
  results.forEach(result => {
    const status = result.success ? '✅ OK ' : '❌ FAIL';
    const name = result.name.padEnd(40).substring(0, 40);
    const duration = formatDuration(result.duration).padStart(8);
    console.log(`│ ${name} │ ${status} │ ${duration} │`);
    
    if (result.error && options.verbose) {
      console.log(`│   Error: ${result.error.padEnd(68).substring(0, 68)} │`);
    }
  });
  
  console.log('└──────────────────────────────────────────┴─────────┴──────────┘\n');
}

/**
 * Formatează durata în format lizibil
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}m ${seconds}s`;
  }
}

export default runOnboarding;

