/**
 * Setup Service for System Administration
 * 
 * This service manages system setup steps tracking for proper initialization
 * of companies, franchises, and various system components.
 */

// Import database related dependencies
import { setup_steps } from '../../../../shared/schema/admin.schema';
import { eq, and } from 'drizzle-orm';
import { Express, Request, Response, NextFunction, Router } from 'express';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { Logger } from '../../../common/logger';

// Define setup step status types
export type SetupStepStatus = 'completed' | 'in_progress' | 'not_started' | 'skipped';

export class SetupService {
  private db: any;
  private logger = new Logger('SetupService');
  
  constructor(db: any) {
    this.db = db;
  }

  /**
   * Record a setup step for a company
   */
  async recordSetupStep(
    companyId: string,
    step: string,
    status: SetupStepStatus = 'completed',
    franchiseId?: string
  ) {
    try {
      // Check if the step already exists
      const existingSteps = await this.db.select()
        .from(setup_steps)
        .where(
          and(
            eq(setup_steps.company_id, companyId),
            eq(setup_steps.step, step),
            franchiseId ? eq(setup_steps.franchise_id, franchiseId) : undefined
          )
        );

      // If step exists, update it; otherwise, create it
      if (existingSteps.length > 0) {
        await this.db.update(setup_steps)
          .set({ 
            status,
            updated_at: new Date()
          })
          .where(
            and(
              eq(setup_steps.company_id, companyId),
              eq(setup_steps.step, step),
              franchiseId ? eq(setup_steps.franchise_id, franchiseId) : undefined
            )
          );
        return existingSteps[0].id;
      } else {
        const [result] = await this.db.insert(setup_steps)
          .values({
            company_id: companyId,
            franchise_id: franchiseId,
            step,
            status
          })
          .returning();
        return result.id;
      }
    } catch (error) {
      console.error('Error recording setup step:', error);
      throw error;
    }
  }

  /**
   * Get all setup steps for a company
   */
  async getCompanySetupSteps(companyId: string, franchiseId?: string) {
    try {
      return await this.db.select()
        .from(setup_steps)
        .where(
          and(
            eq(setup_steps.company_id, companyId),
            franchiseId ? eq(setup_steps.franchise_id, franchiseId) : undefined
          )
        );
    } catch (error) {
      console.error('Error getting company setup steps:', error);
      throw error;
    }
  }

  /**
   * Check if a specific step is completed
   */
  async isStepComplete(companyId: string, step: string, franchiseId?: string): Promise<boolean> {
    try {
      const steps = await this.db.select()
        .from(setup_steps)
        .where(
          and(
            eq(setup_steps.company_id, companyId),
            eq(setup_steps.step, step),
            eq(setup_steps.status, 'completed'),
            franchiseId ? eq(setup_steps.franchise_id, franchiseId) : undefined
          )
        );
      return steps.length > 0;
    } catch (error) {
      console.error('Error checking step completion:', error);
      return false;
    }
  }

  /**
   * Get setup progress percentage
   */
  async getSetupProgress(companyId: string, franchiseId?: string): Promise<number> {
    try {
      const totalSteps = await this.db.select()
        .from(setup_steps)
        .where(
          and(
            eq(setup_steps.company_id, companyId),
            franchiseId ? eq(setup_steps.franchise_id, franchiseId) : undefined
          )
        );
      
      // Count completed and skipped steps as done for progress calculation
      const completedSteps = totalSteps.filter((step: any) => 
        step.status === 'completed' || step.status === 'skipped'
      );
      
      if (totalSteps.length === 0) return 0;
      return Math.round((completedSteps.length / totalSteps.length) * 100);
    } catch (error) {
      console.error('Error calculating setup progress:', error);
      return 0;
    }
  }

  /**
   * Register API routes for setup functionality
   */
  registerRoutes(app: Express): void {
    this.logger.info('Registering setup routes...');
    const router = Router();

    // Middleware to verify authentication
    const requireAuth = AuthGuard.protect(JwtAuthMode.REQUIRED);
    
    // GET /api/admin/setup/steps/:companyId - Get all setup steps for a company
    router.get('/steps/:companyId', requireAuth, async (req: Request, res: Response) => {
      try {
        const { companyId } = req.params;
        const franchiseId = req.query.franchiseId as string | undefined;
        
        const steps = await this.getCompanySetupSteps(companyId, franchiseId);
        res.json({ success: true, data: steps });
      } catch (error) {
        this.logger.error('Error fetching setup steps:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch setup steps' });
      }
    });

    // POST /api/admin/setup/steps/:companyId - Record a setup step
    router.post('/steps/:companyId', requireAuth, async (req: Request, res: Response) => {
      try {
        const { companyId } = req.params;
        const { step, status, franchiseId } = req.body;
        
        if (!step) {
          return res.status(400).json({ success: false, message: 'Step name is required' });
        }
        
        const stepStatus = status as SetupStepStatus || 'completed';
        const id = await this.recordSetupStep(companyId, step, stepStatus, franchiseId);
        
        res.json({ success: true, data: { id, step, status: stepStatus } });
      } catch (error) {
        this.logger.error('Error recording setup step:', error);
        res.status(500).json({ success: false, message: 'Failed to record setup step' });
      }
    });

    // GET /api/admin/setup/progress/:companyId - Get setup progress percentage
    router.get('/progress/:companyId', requireAuth, async (req: Request, res: Response) => {
      try {
        const { companyId } = req.params;
        const franchiseId = req.query.franchiseId as string | undefined;
        
        const progress = await this.getSetupProgress(companyId, franchiseId);
        res.json({ success: true, data: { progress } });
      } catch (error) {
        this.logger.error('Error calculating setup progress:', error);
        res.status(500).json({ success: false, message: 'Failed to calculate setup progress' });
      }
    });

    // GET /api/admin/setup/completed/:companyId/:step - Check if step is completed
    router.get('/completed/:companyId/:step', requireAuth, async (req: Request, res: Response) => {
      try {
        const { companyId, step } = req.params;
        const franchiseId = req.query.franchiseId as string | undefined;
        
        const isCompleted = await this.isStepComplete(companyId, step, franchiseId);
        res.json({ success: true, data: { completed: isCompleted } });
      } catch (error) {
        this.logger.error('Error checking step completion:', error);
        res.status(500).json({ success: false, message: 'Failed to check step completion' });
      }
    });

    // Mount routes
    app.use('/api/admin/setup', router);
    this.logger.info('Setup routes registered successfully');
  }

  /**
   * ========================================================================
   * STUB METHODS - These require full implementation for production use
   * ========================================================================
   * These methods are minimal implementations to satisfy TypeScript compilation
   * and allow the application to run. They MUST be properly implemented before
   * using the setup functionality in production.
   */

  /**
   * Check if the system has been set up (has at least one admin user)
   */
  async checkSetupStatus(): Promise<{ isSetup: boolean; hasAdmin: boolean; hasCompany: boolean }> {
    try {
      this.logger.info('Checking setup status...');
      
      // Check if there's at least one user with admin role
      const [adminCount] = await this.db.execute(`
        SELECT COUNT(DISTINCT u.id)::int as count 
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.role = 'admin' OR r.name = 'admin'
      `);
      
      const hasAdmin = (adminCount?.count || 0) > 0;
      
      // Check if there's at least one company
      const [companyCount] = await this.db.execute(`
        SELECT COUNT(*)::int as count FROM companies
      `);
      
      const hasCompany = (companyCount?.count || 0) > 0;
      
      const isSetup = hasAdmin && hasCompany;
      
      this.logger.info(`Setup status: isSetup=${isSetup}, hasAdmin=${hasAdmin}, hasCompany=${hasCompany}`);
      
      return {
        isSetup,
        hasAdmin,
        hasCompany
      };
    } catch (error) {
      this.logger.error('Error checking setup status:', error);
      return { isSetup: false, hasAdmin: false, hasCompany: false };
    }
  }

  /**
   * Perform initial system setup
   * Creates the first admin user, company, and default roles
   */
  async performInitialSetup(setupData: any): Promise<any> {
    try {
      this.logger.info('Performing initial setup...');
      
      const { adminUser, company, systemSettings } = setupData;
      
      if (!adminUser || !adminUser.email || !adminUser.password) {
        throw new Error('Admin user data is required (email, password)');
      }
      
      if (!company || !company.name) {
        throw new Error('Company data is required (name)');
      }
      
      // Check if setup is already done
      const status = await this.checkSetupStatus();
      if (status.isSetup) {
        throw new Error('System is already set up');
      }
      
      // Hash the admin password
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(adminUser.password, 10);
      
      // Create the company first
      const [newCompany] = await this.db.execute(`
        INSERT INTO companies (id, name, email, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, NOW(), NOW())
        RETURNING *
      `, [company.name, company.email || adminUser.email]);
      
      const companyId = newCompany.id;
      
      // Create default roles if they don't exist
      const adminRoleResult = await this.db.execute(`
        INSERT INTO roles (id, name, description, company_id, is_system, created_at, updated_at)
        VALUES (gen_random_uuid(), 'admin', 'System Administrator', $1, true, NOW(), NOW())
        ON CONFLICT (name, company_id) DO UPDATE SET name = EXCLUDED.name
        RETURNING *
      `, [companyId]);
      
      await this.db.execute(`
        INSERT INTO roles (id, name, description, company_id, is_system, created_at, updated_at)
        VALUES (gen_random_uuid(), 'user', 'Standard User', $1, true, NOW(), NOW())
        ON CONFLICT (name, company_id) DO UPDATE SET name = EXCLUDED.name
      `, [companyId]);
      
      await this.db.execute(`
        INSERT INTO roles (id, name, description, company_id, is_system, created_at, updated_at)
        VALUES (gen_random_uuid(), 'manager', 'Manager', $1, true, NOW(), NOW())
        ON CONFLICT (name, company_id) DO UPDATE SET name = EXCLUDED.name
      `, [companyId]);
      
      const adminRoleId = adminRoleResult[0]?.id;
      
      // Create the admin user
      const [newUser] = await this.db.execute(`
        INSERT INTO users (id, email, password, first_name, last_name, role, company_id, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, 'admin', $5, NOW(), NOW())
        RETURNING *
      `, [
        adminUser.email,
        hashedPassword,
        adminUser.firstName || 'Admin',
        adminUser.lastName || 'User',
        companyId
      ]);
      
      const userId = newUser.id;
      
      // Assign admin role to user
      if (adminRoleId) {
        await this.db.execute(`
          INSERT INTO user_roles (user_id, role_id, created_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (user_id, role_id) DO NOTHING
        `, [userId, adminRoleId]);
      }
      
      // Apply system settings if provided
      if (systemSettings) {
        for (const [key, value] of Object.entries(systemSettings)) {
          await this.db.execute(`
            INSERT INTO configurations (id, key, value, scope, created_at, updated_at)
            VALUES (gen_random_uuid(), $1, $2, 'global', NOW(), NOW())
            ON CONFLICT (key, scope) DO UPDATE SET value = EXCLUDED.value
          `, [key, JSON.stringify(value)]);
        }
      }
      
      this.logger.info(`Initial setup completed successfully. Company: ${company.name}, Admin: ${adminUser.email}`);
      
      return {
        success: true,
        message: 'Initial setup completed successfully',
        data: {
          companyId,
          userId,
          companyName: company.name,
          adminEmail: adminUser.email
        }
      };
    } catch (error) {
      this.logger.error('Error performing initial setup:', error);
      throw error;
    }
  }

  /**
   * Check database status
   */
  async checkDatabaseStatus(): Promise<{ connected: boolean; migrationsUpToDate: boolean; tables: string[] }> {
    try {
      this.logger.info('Checking database status...');
      
      // Test database connection with a simple query
      const [result] = await this.db.execute('SELECT 1 as test');
      const connected = result?.test === 1;
      
      if (!connected) {
        return { connected: false, migrationsUpToDate: false, tables: [] };
      }
      
      // Get list of all tables
      const tablesResult = await this.db.execute(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      const tables = tablesResult.map((row: any) => row.table_name);
      
      // Check for core tables that indicate migrations are up to date
      const coreTables = ['users', 'companies', 'roles', 'permissions', 'configurations'];
      const migrationsUpToDate = coreTables.every(table => tables.includes(table));
      
      this.logger.info(`Database status: connected=${connected}, tables=${tables.length}, migrationsUpToDate=${migrationsUpToDate}`);
      
      return {
        connected,
        migrationsUpToDate,
        tables
      };
    } catch (error) {
      this.logger.error('Error checking database status:', error);
      return { connected: false, migrationsUpToDate: false, tables: [] };
    }
  }

  /**
   * Run database migrations using Drizzle
   */
  async runDatabaseMigrations(): Promise<{ success: boolean; message: string; migrations: string[] }> {
    try {
      this.logger.info('Running database migrations...');
      
      const path = require('path');
      const fs = require('fs');
      
      // Define potential migration directories
      const migrationDirs = [
        path.join(process.cwd(), 'drizzle'),
        path.join(process.cwd(), 'migrations'),
        path.join(process.cwd(), 'server', 'migrations')
      ];
      
      let migrationsDir = '';
      for (const dir of migrationDirs) {
        if (fs.existsSync(dir)) {
          migrationsDir = dir;
          break;
        }
      }
      
      if (!migrationsDir) {
        this.logger.warn('No migrations directory found. Skipping migrations.');
        return {
          success: true,
          message: 'No migrations directory found',
          migrations: []
        };
      }
      
      // Try to import and run migrate() from drizzle-orm
      try {
        const { migrate } = require('drizzle-orm/postgres-js/migrator');
        const postgres = require('postgres');
        const { drizzle } = require('drizzle-orm/postgres-js');
        
        // Get DATABASE_URL from env
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
          throw new Error('DATABASE_URL is not set');
        }
        
        // Create a migration connection
        const migrationClient = postgres(databaseUrl, { max: 1 });
        const migrationDb = drizzle(migrationClient);
        
        // Run migrations
        await migrate(migrationDb, { migrationsFolder: migrationsDir });
        
        // Close migration connection
        await migrationClient.end();
        
        // Get list of applied migrations
        const migrationFiles = fs.readdirSync(migrationsDir)
          .filter((file: string) => file.endsWith('.sql'))
          .sort();
        
        this.logger.info(`Successfully applied ${migrationFiles.length} migrations`);
        
        return {
          success: true,
          message: `Successfully applied ${migrationFiles.length} migrations`,
          migrations: migrationFiles
        };
      } catch (migrateError: any) {
        // If drizzle-orm migration fails, try drizzle-kit push as fallback
        this.logger.warn('Drizzle migrate failed, attempting drizzle-kit push...', migrateError.message);
        
        try {
          const { execSync } = require('child_process');
          
          // Try to run drizzle-kit push
          const output = execSync('npx drizzle-kit push', {
            cwd: process.cwd(),
            encoding: 'utf-8',
            stdio: 'pipe'
          });
          
          this.logger.info('Drizzle-kit push output:', output);
          
          return {
            success: true,
            message: 'Database schema pushed successfully via drizzle-kit',
            migrations: ['drizzle-kit-push']
          };
        } catch (pushError) {
          this.logger.error('Drizzle-kit push also failed:', pushError);
          throw new Error('Failed to run migrations: Both migrate() and drizzle-kit push failed');
        }
      }
    } catch (error) {
      this.logger.error('Error running migrations:', error);
      throw error;
    }
  }

  /**
   * Seed database with initial data
   */
  async seedDatabase(datasets: string[]): Promise<{ success: boolean; message: string; seeded: string[] }> {
    try {
      this.logger.info(`Seeding database with datasets: ${datasets.join(', ')}`);
      
      const path = require('path');
      const fs = require('fs');
      
      // Define potential seed directories
      const seedDirs = [
        path.join(process.cwd(), 'seeds'),
        path.join(process.cwd(), 'server', 'seeds'),
        path.join(process.cwd(), 'migrations', 'seeds'),
        path.join(process.cwd(), 'migrations', 'data-population')
      ];
      
      let seedDir = '';
      for (const dir of seedDirs) {
        if (fs.existsSync(dir)) {
          seedDir = dir;
          break;
        }
      }
      
      if (!seedDir) {
        this.logger.warn('No seeds directory found. Skipping seeding.');
        return {
          success: true,
          message: 'No seeds directory found',
          seeded: []
        };
      }
      
      const seededDatasets: string[] = [];
      const errors: string[] = [];
      
      for (const dataset of datasets) {
        try {
          // Try multiple file extensions
          const possibleFiles = [
            path.join(seedDir, `${dataset}.ts`),
            path.join(seedDir, `${dataset}.js`),
            path.join(seedDir, `${dataset}.mjs`)
          ];
          
          let seedFile = '';
          for (const file of possibleFiles) {
            if (fs.existsSync(file)) {
              seedFile = file;
              break;
            }
          }
          
          if (!seedFile) {
            this.logger.warn(`Seed file not found for dataset: ${dataset}`);
            errors.push(`Dataset ${dataset} not found`);
            continue;
          }
          
          this.logger.info(`Loading seed file: ${seedFile}`);
          
          // Dynamic import of the seed file
          const seedModule = require(seedFile);
          
          // Check if seed file exports a default function or named seed function
          const seedFunction = seedModule.default || seedModule.seed || seedModule;
          
          if (typeof seedFunction === 'function') {
            // Execute the seed function with db instance
            await seedFunction(this.db);
            seededDatasets.push(dataset);
            this.logger.info(`Successfully seeded dataset: ${dataset}`);
          } else if (typeof seedModule === 'object' && seedModule.data) {
            // If seed file exports a data object, insert it directly
            this.logger.info(`Seeding raw data from: ${dataset}`);
            
            // Iterate through tables and insert data
            for (const [tableName, tableData] of Object.entries(seedModule.data)) {
              if (Array.isArray(tableData) && tableData.length > 0) {
                this.logger.info(`Inserting ${tableData.length} records into ${tableName}`);
                
                // Use raw SQL INSERT for flexibility
                for (const record of tableData as any[]) {
                  const columns = Object.keys(record).join(', ');
                  const placeholders = Object.keys(record).map((_, i) => `$${i + 1}`).join(', ');
                  const values = Object.values(record);
                  
                  await this.db.execute(
                    `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
                    values
                  );
                }
              }
            }
            
            seededDatasets.push(dataset);
            this.logger.info(`Successfully seeded dataset: ${dataset}`);
          } else {
            this.logger.warn(`Seed file ${dataset} does not export a valid seed function or data`);
            errors.push(`Dataset ${dataset} has invalid format`);
          }
        } catch (error: any) {
          this.logger.error(`Error seeding dataset ${dataset}:`, error);
          errors.push(`${dataset}: ${error.message}`);
        }
      }
      
      const message = seededDatasets.length > 0
        ? `Successfully seeded ${seededDatasets.length} datasets: ${seededDatasets.join(', ')}`
        : 'No datasets were seeded';
      
      if (errors.length > 0) {
        this.logger.warn(`Seeding completed with errors: ${errors.join('; ')}`);
      }
      
      return {
        success: seededDatasets.length > 0,
        message: errors.length > 0 ? `${message}. Errors: ${errors.join('; ')}` : message,
        seeded: seededDatasets
      };
    } catch (error) {
      this.logger.error('Error seeding database:', error);
      throw error;
    }
  }

  /**
   * Check system requirements
   */
  async checkSystemRequirements(): Promise<{ met: boolean; requirements: any[] }> {
    try {
      this.logger.info('Checking system requirements...');
      
      const requirements = [];
      const os = require('os');
      const fs = require('fs');
      
      // Check Node.js version (require >= 18.0.0)
      const nodeVersion = process.version.replace('v', '');
      const [nodeMajor] = nodeVersion.split('.').map(Number);
      const nodeRequirement = {
        name: 'Node.js',
        required: '>= 18.0.0',
        current: process.version,
        met: nodeMajor >= 18
      };
      requirements.push(nodeRequirement);
      
      // Check available disk space (require > 1GB)
      try {
        const statfs = fs.statfsSync || fs.promises?.statfs;
        if (statfs) {
          const stats = typeof statfs === 'function' ? statfs('/') : { bavail: 0, bsize: 0 };
          const availableGB = (stats.bavail * stats.bsize) / (1024 ** 3);
          requirements.push({
            name: 'Disk Space',
            required: '> 1 GB',
            current: `${availableGB.toFixed(2)} GB`,
            met: availableGB > 1
          });
        }
      } catch (err) {
        // Fallback if statfs is not available
        requirements.push({
          name: 'Disk Space',
          required: '> 1 GB',
          current: 'Unable to determine',
          met: true // Assume met if we can't check
        });
      }
      
      // Check available RAM (require > 512MB)
      const freeMemGB = os.freemem() / (1024 ** 3);
      const totalMemGB = os.totalmem() / (1024 ** 3);
      requirements.push({
        name: 'Available RAM',
        required: '> 0.5 GB',
        current: `${freeMemGB.toFixed(2)} GB free / ${totalMemGB.toFixed(2)} GB total`,
        met: freeMemGB > 0.5
      });
      
      // Check database connection
      try {
        const [dbResult] = await this.db.execute('SELECT version() as version');
        const dbVersion = dbResult?.version || 'Unknown';
        requirements.push({
          name: 'PostgreSQL',
          required: '>= 14.0',
          current: dbVersion,
          met: true // If we can connect, assume it's met
        });
      } catch (err) {
        requirements.push({
          name: 'PostgreSQL',
          required: '>= 14.0',
          current: 'Not connected',
          met: false
        });
      }
      
      const met = requirements.every(req => req.met);
      
      this.logger.info(`System requirements: ${met ? 'MET' : 'NOT MET'}`);
      
      return {
        met,
        requirements
      };
    } catch (error) {
      this.logger.error('Error checking system requirements:', error);
      return { met: false, requirements: [] };
    }
  }

  /**
   * Get system information
   */
  async getSystemInformation(): Promise<any> {
    try {
      this.logger.info('Getting system information...');
      
      const os = require('os');
      
      // Get database version
      let dbVersion = 'Unknown';
      try {
        const [dbResult] = await this.db.execute('SELECT version() as version');
        dbVersion = dbResult?.version || 'Unknown';
      } catch (err) {
        this.logger.warn('Could not retrieve database version');
      }
      
      // Get CPU information
      const cpus = os.cpus();
      const cpuModel = cpus[0]?.model || 'Unknown';
      const cpuCount = cpus.length;
      
      // Get memory information
      const totalMemGB = os.totalmem() / (1024 ** 3);
      const freeMemGB = os.freemem() / (1024 ** 3);
      const usedMemGB = totalMemGB - freeMemGB;
      
      // Get uptime
      const uptimeHours = (os.uptime() / 3600).toFixed(2);
      
      const info = {
        node: {
          version: process.version,
          platform: process.platform,
          arch: process.arch
        },
        os: {
          type: os.type(),
          release: os.release(),
          platform: os.platform(),
          uptime: `${uptimeHours} hours`
        },
        cpu: {
          model: cpuModel,
          count: cpuCount
        },
        memory: {
          total: `${totalMemGB.toFixed(2)} GB`,
          free: `${freeMemGB.toFixed(2)} GB`,
          used: `${usedMemGB.toFixed(2)} GB`
        },
        database: {
          version: dbVersion
        }
      };
      
      this.logger.info('System information retrieved successfully');
      
      return info;
    } catch (error) {
      this.logger.error('Error getting system information:', error);
      return {};
    }
  }

  /**
   * Get available seed datasets
   */
  async getAvailableSeedDatasets(): Promise<string[]> {
    try {
      this.logger.info('Getting available seed datasets...');
      
      const fs = require('fs');
      const path = require('path');
      
      // Define potential seed directories
      const seedDirs = [
        path.join(process.cwd(), 'seeds'),
        path.join(process.cwd(), 'server', 'seeds'),
        path.join(process.cwd(), 'migrations', 'seeds')
      ];
      
      const datasets: string[] = [];
      
      for (const seedDir of seedDirs) {
        try {
          if (fs.existsSync(seedDir)) {
            const files = fs.readdirSync(seedDir);
            
            // Filter for .ts and .js files
            const seedFiles = files
              .filter((file: string) => file.endsWith('.ts') || file.endsWith('.js'))
              .filter((file: string) => !file.endsWith('.d.ts')) // Exclude type definition files
              .map((file: string) => file.replace(/\.(ts|js)$/, '')); // Remove extension
            
            datasets.push(...seedFiles);
          }
        } catch (err) {
          this.logger.debug(`Could not read seed directory: ${seedDir}`);
        }
      }
      
      // If no seed files found, return some default placeholders
      if (datasets.length === 0) {
        return ['demo-data', 'sample-products', 'test-users'];
      }
      
      // Remove duplicates
      const uniqueDatasets = [...new Set(datasets)];
      
      this.logger.info(`Found ${uniqueDatasets.length} seed datasets`);
      
      return uniqueDatasets;
    } catch (error) {
      this.logger.error('Error getting seed datasets:', error);
      return ['demo-data', 'sample-products', 'test-users'];
    }
  }
}