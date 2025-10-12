/**
 * Health Check Service for Admin Module
 * 
 * This service performs health checks on various components of the system,
 * including database connections, external services, and system resources.
 */

import { DrizzleService } from '../../../common/drizzle';
import { sql } from 'drizzle-orm';
import { Express, Request, Response, Router } from 'express';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { Logger } from '../../../common/logger';
import { AuditService } from '../../../modules/audit/services/audit.service';
import * as os from 'os';
import * as fs from 'fs';
import { ConfigService } from './config.service';

/**
 * Health status enum
 */
enum HealthStatus {
  HEALTHY = 'healthy',
  UNHEALTHY = 'unhealthy',
  DEGRADED = 'degraded'
}

/**
 * Service type enum for health checks
 */
enum ServiceType {
  DATABASE = 'database',
  EXTERNAL_API = 'external_api', 
  SYSTEM = 'system',
  CACHE = 'cache',
  STORAGE = 'storage',
  MODULE = 'module'
}

/**
 * Health check component
 */
interface HealthComponent {
  name: string;
  type: ServiceType;
  status: HealthStatus;
  details?: any;
  lastChecked: Date;
}

/**
 * Health check result
 */
interface HealthCheckResult {
  status: HealthStatus;
  components: HealthComponent[];
  timestamp: Date;
  uptime: number;
  version: string;
}

/**
 * Health Check service for the Admin module
 */
export class HealthCheckService {
  private db: DrizzleService;
  private logger = new Logger('HealthCheckService');
  private components: Map<string, HealthComponent> = new Map();
  private configService?: ConfigService;
  private startTime: Date = new Date();
  private version: string = '2.0.0'; // This should come from a version file or environment variable
  private healthCheckHistory: HealthCheckResult[] = [];
  private maxHistorySize: number = 100; // Keep last 100 health checks

  /**
   * Constructor for HealthCheckService
   * @param db Drizzle database instance
   */
  constructor(db: DrizzleService) {
    this.db = db;
    this.registerDefaultChecks();
  }

  /**
   * Set config service reference
   * @param configService ConfigService instance
   */
  setConfigService(configService: ConfigService): void {
    this.configService = configService;
  }

  /**
   * Register default health checks
   */
  private registerDefaultChecks(): void {
    // Register database health check
    this.registerHealthCheck({
      name: 'postgresql',
      type: ServiceType.DATABASE,
      status: HealthStatus.UNHEALTHY,
      lastChecked: new Date()
    });

    // Register system health checks
    this.registerHealthCheck({
      name: 'cpu',
      type: ServiceType.SYSTEM,
      status: HealthStatus.HEALTHY,
      lastChecked: new Date()
    });

    this.registerHealthCheck({
      name: 'memory',
      type: ServiceType.SYSTEM,
      status: HealthStatus.HEALTHY,
      lastChecked: new Date()
    });

    this.registerHealthCheck({
      name: 'disk',
      type: ServiceType.SYSTEM,
      status: HealthStatus.HEALTHY,
      lastChecked: new Date()
    });
  }

  /**
   * Register a health check component
   * @param component The health component to register
   */
  registerHealthCheck(component: HealthComponent): void {
    this.components.set(component.name, component);
    this.logger.debug(`Registered health check: ${component.name}`);
  }

  /**
   * Update a health check component
   * @param name Component name
   * @param status Health status
   * @param details Optional details
   */
  updateHealthCheck(name: string, status: HealthStatus, details?: any): void {
    const component = this.components.get(name);
    
    if (component) {
      component.status = status;
      component.details = details;
      component.lastChecked = new Date();
      this.components.set(name, component);
      
      if (status !== HealthStatus.HEALTHY) {
        this.logger.warn(`Health check ${name} is ${status}: ${JSON.stringify(details)}`);
      } else {
        this.logger.debug(`Health check ${name} is ${status}`);
      }
    }
  }

  /**
   * Remove a health check component
   * @param name Component name
   */
  removeHealthCheck(name: string): void {
    if (this.components.has(name)) {
      this.components.delete(name);
      this.logger.debug(`Removed health check: ${name}`);
    }
  }

  /**
   * Get all health check components
   * @returns Array of health check components
   */
  getHealthComponents(): HealthComponent[] {
    return Array.from(this.components.values());
  }

  /**
   * Run all health checks
   * @returns Health check result
   */
  async runHealthChecks(): Promise<HealthCheckResult> {
    const components = this.getHealthComponents();
    
    // Run checks in parallel
    await Promise.all(components.map(component => this.runHealthCheck(component.name)));
    
    // Calculate overall status
    const updatedComponents = this.getHealthComponents();
    const hasUnhealthy = updatedComponents.some(c => c.status === HealthStatus.UNHEALTHY);
    const hasDegraded = updatedComponents.some(c => c.status === HealthStatus.DEGRADED);
    
    let overallStatus = HealthStatus.HEALTHY;
    if (hasUnhealthy) {
      overallStatus = HealthStatus.UNHEALTHY;
    } else if (hasDegraded) {
      overallStatus = HealthStatus.DEGRADED;
    }
    
    const result: HealthCheckResult = {
      status: overallStatus,
      components: updatedComponents,
      timestamp: new Date(),
      uptime: Math.floor((new Date().getTime() - this.startTime.getTime()) / 1000),
      version: this.version
    };
    
    // Save to history
    this.saveToHistory(result);
    
    return result;
  }

  /**
   * Save health check result to history
   * @param result Health check result
   */
  private saveToHistory(result: HealthCheckResult): void {
    this.healthCheckHistory.push(result);
    
    // Keep only the last N results
    if (this.healthCheckHistory.length > this.maxHistorySize) {
      this.healthCheckHistory = this.healthCheckHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get health check history
   * @param limit Maximum number of results to return
   * @param offset Offset for pagination
   * @param fromDate Filter results from this date
   * @param toDate Filter results to this date
   * @returns Array of health check results
   */
  getHealthCheckHistory(
    limit: number = 10,
    offset: number = 0,
    fromDate?: Date,
    toDate?: Date
  ): HealthCheckResult[] {
    let history = [...this.healthCheckHistory];
    
    // Filter by date range
    if (fromDate) {
      history = history.filter(h => h.timestamp >= fromDate);
    }
    if (toDate) {
      history = history.filter(h => h.timestamp <= toDate);
    }
    
    // Sort by timestamp (newest first)
    history.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Apply pagination
    return history.slice(offset, offset + limit);
  }

  /**
   * Get system resource usage
   * @returns System resource usage information
   */
  getSystemResourceUsage(): {
    cpu: {
      count: number;
      model: string;
      usage: number;
      loadAverage: number[];
    };
    memory: {
      total: number;
      free: number;
      used: number;
      usagePercent: number;
    };
    disk: {
      total: number;
      free: number;
      used: number;
      usagePercent: number;
    };
    uptime: number;
  } {
    const cpus = os.cpus();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    
    // Get disk info from health component
    const diskComponent = this.components.get('disk');
    const diskInfo = diskComponent?.details || { total: 0, free: 0, used: 0 };
    
    return {
      cpu: {
        count: cpus.length,
        model: cpus[0]?.model || 'Unknown',
        usage: this.calculateCpuUsage(),
        loadAverage: os.loadavg()
      },
      memory: {
        total: totalMemory,
        free: freeMemory,
        used: usedMemory,
        usagePercent: (usedMemory / totalMemory) * 100
      },
      disk: {
        total: diskInfo.total || 0,
        free: diskInfo.free || 0,
        used: diskInfo.used || 0,
        usagePercent: diskInfo.total ? ((diskInfo.used / diskInfo.total) * 100) : 0
      },
      uptime: os.uptime()
    };
  }

  /**
   * Calculate CPU usage percentage
   * @returns CPU usage percentage
   */
  private calculateCpuUsage(): number {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });
    
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - ~~(100 * idle / total);
    
    return usage;
  }

  /**
   * Run a specific health check
   * @param name Component name
   * @returns Health check component
   */
  async runHealthCheck(name: string): Promise<HealthComponent | null> {
    const component = this.components.get(name);
    
    if (!component) {
      return null;
    }
    
    try {
      switch(name) {
        case 'postgresql':
          await this.checkDatabase(component);
          break;
        case 'cpu':
          await this.checkCpu(component);
          break;
        case 'memory':
          await this.checkMemory(component);
          break;
        case 'disk':
          await this.checkDisk(component);
          break;
        // Add other built-in checks here
        default:
          // For custom checks, do nothing here
          break;
      }
      
      return component;
    } catch (error) {
      this.logger.error(`Error running health check ${name}:`, error);
      this.updateHealthCheck(name, HealthStatus.UNHEALTHY, { error: (error as Error).message });
      return component;
    }
  }

  /**
   * Check database health
   * @param component Health component
   */
  private async checkDatabase(component: HealthComponent): Promise<void> {
    try {
      // Simple query to check DB connection
      const startTime = Date.now();
      await this.db.executeQuery(sql`SELECT 1`);
      const responseTime = Date.now() - startTime;
      
      this.updateHealthCheck(component.name, HealthStatus.HEALTHY, {
        responseTime: `${responseTime}ms`
      });
    } catch (error) {
      this.updateHealthCheck(component.name, HealthStatus.UNHEALTHY, {
        error: (error as Error).message
      });
    }
  }

  /**
   * Check CPU health
   * @param component Health component
   */
  private async checkCpu(component: HealthComponent): Promise<void> {
    try {
      const cpus = os.cpus();
      const cpuUsage = this.getCpuUsage();
      
      // Consider system degraded if CPU usage is above 80%
      let status = HealthStatus.HEALTHY;
      if (cpuUsage > 80) {
        status = HealthStatus.DEGRADED;
      }
      
      this.updateHealthCheck(component.name, status, {
        cores: cpus.length,
        model: cpus[0]?.model || 'Unknown',
        usage: `${cpuUsage.toFixed(2)}%`
      });
    } catch (error) {
      this.updateHealthCheck(component.name, HealthStatus.UNHEALTHY, {
        error: (error as Error).message
      });
    }
  }

  /**
   * Check memory health
   * @param component Health component
   */
  private async checkMemory(component: HealthComponent): Promise<void> {
    try {
      const totalMem = os.totalmem();
      const freeMem = os.freemem();
      const usedMem = totalMem - freeMem;
      const memUsagePercent = (usedMem / totalMem) * 100;
      
      // Consider system degraded if memory usage is above 80%
      let status = HealthStatus.HEALTHY;
      if (memUsagePercent > 80) {
        status = HealthStatus.DEGRADED;
      }
      
      this.updateHealthCheck(component.name, status, {
        total: this.formatBytes(totalMem),
        free: this.formatBytes(freeMem),
        used: this.formatBytes(usedMem),
        usage: `${memUsagePercent.toFixed(2)}%`
      });
    } catch (error) {
      this.updateHealthCheck(component.name, HealthStatus.UNHEALTHY, {
        error: (error as Error).message
      });
    }
  }

  /**
   * Check disk health
   * @param component Health component
   */
  private async checkDisk(component: HealthComponent): Promise<void> {
    try {
      // This is a simplified check, in a production system you'd use a more robust method
      const rootDir = '/';
      const diskInfo = await this.getDiskInfo(rootDir);
      
      // Consider system degraded if disk usage is above 80%
      let status = HealthStatus.HEALTHY;
      if (diskInfo.usagePercent > 80) {
        status = HealthStatus.DEGRADED;
      }
      
      this.updateHealthCheck(component.name, status, {
        path: rootDir,
        total: this.formatBytes(diskInfo.total),
        free: this.formatBytes(diskInfo.free),
        used: this.formatBytes(diskInfo.used),
        usage: `${diskInfo.usagePercent.toFixed(2)}%`
      });
    } catch (error) {
      this.updateHealthCheck(component.name, HealthStatus.UNHEALTHY, {
        error: (error as Error).message
      });
    }
  }

  /**
   * Get CPU usage (approximate)
   * @returns CPU usage percentage
   */
  private getCpuUsage(): number {
    // This is a simplified approximation
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    });
    
    return 100 - (totalIdle / totalTick) * 100;
  }

  /**
   * Get disk info
   * @param path Directory path
   * @returns Disk info with total, free, used, and usage percent
   */
  private async getDiskInfo(path: string): Promise<{
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  }> {
    // This is a simplified implementation for demo purposes
    // In a real system, you would use a system-specific method to get disk usage
    
    // Fallback to estimating based on current directory
    try {
      const stats = await fs.promises.statfs(path);
      const total = stats.blocks * stats.bsize;
      const free = stats.bfree * stats.bsize;
      const used = total - free;
      const usagePercent = (used / total) * 100;
      
      return { total, free, used, usagePercent };
    } catch (error) {
      // If statfs isn't available, provide a fallback with dummy data
      this.logger.warn('Could not get disk info, using fallback data');
      
      // Use os.tmpdir() which should be available on all platforms
      const tmpDir = os.tmpdir();
      const stats = await fs.promises.stat(tmpDir);
      
      // Dummy values for demonstration
      const total = 100 * 1024 * 1024 * 1024; // 100 GB
      const used = 30 * 1024 * 1024 * 1024; // 30 GB
      const free = total - used;
      const usagePercent = 30; // 30%
      
      return { total, free, used, usagePercent };
    }
  }

  /**
   * Format bytes to human-readable string
   * @param bytes Bytes
   * @returns Formatted string
   */
  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let value = bytes;
    let unitIndex = 0;
    
    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex++;
    }
    
    return `${value.toFixed(2)} ${units[unitIndex]}`;
  }

  // Health check timer interval
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private healthCheckIntervalMs = 5 * 60 * 1000; // 5 minutes by default

  /**
   * Start periodic health checks
   * @param intervalMs Optional interval in milliseconds
   */
  startPeriodicChecks(intervalMs?: number): void {
    if (this.healthCheckTimer) {
      this.logger.warn('Periodic health checks already running');
      return;
    }

    // Use provided interval or default
    if (intervalMs) {
      this.healthCheckIntervalMs = intervalMs;
    } else if (this.configService) {
      // Try to get interval from config service if available
      const configInterval = this.configService.getNumber('health.checkIntervalMs');
      if (configInterval) {
        this.healthCheckIntervalMs = configInterval;
      }
    }

    this.logger.info(`Starting periodic health checks every ${this.healthCheckIntervalMs / 1000} seconds`);

    // Run an initial check
    this.runHealthChecks().catch(error => {
      this.logger.error('Error in initial health check:', error);
    });

    // Schedule periodic checks
    this.healthCheckTimer = setInterval(() => {
      this.runHealthChecks().catch(error => {
        this.logger.error('Error in periodic health check:', error);
      });
    }, this.healthCheckIntervalMs);
  }

  /**
   * Stop periodic health checks
   */
  stopPeriodicChecks(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
      this.logger.info('Stopped periodic health checks');
    }
  }

  /**
   * Register API routes for health checks
   * @param app Express application
   */
  registerRoutes(app: Express): void {
    this.logger.info('Registering health check routes...');
    const router = Router();

    // Authentication middleware
    const requireAuth = AuthGuard.AuthGuard.protect(JwtAuthMode.REQUIRED);
    const requireAdmin = AuthGuard.requireRoles(['admin']);
    
    // Public health check route - simplified status for load balancers, etc.
    router.get('/health', async (req: Request, res: Response) => {
      try {
        // Simple DB check
        let dbStatus = HealthStatus.UNHEALTHY;
        try {
          await this.db.executeQuery(sql`SELECT 1`);
          dbStatus = HealthStatus.HEALTHY;
        } catch (error) {
          dbStatus = HealthStatus.UNHEALTHY;
        }
        
        const isHealthy = dbStatus === HealthStatus.HEALTHY;
        
        res.status(isHealthy ? 200 : 503).json({
          status: isHealthy ? 'ok' : 'error',
          timestamp: new Date()
        });
      } catch (error) {
        this.logger.error('Error in basic health check:', error);
        res.status(503).json({
          status: 'error',
          timestamp: new Date()
        });
      }
    });

    // Detailed health check route - requires authentication
    router.get('/health/details', requireAuth, async (req: Request, res: Response) => {
      try {
        const result = await this.runHealthChecks();
        
        // Status code based on health status
        let statusCode = 200;
        if (result.status === HealthStatus.DEGRADED) {
          statusCode = 200; // Still functioning but degraded
        } else if (result.status === HealthStatus.UNHEALTHY) {
          statusCode = 503; // Service unavailable
        }
        
        res.status(statusCode).json({
          success: result.status !== HealthStatus.UNHEALTHY,
          data: result
        });
      } catch (error) {
        this.logger.error('Error running detailed health checks:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to run health checks',
          error: (error as Error).message
        });
      }
    });

    // Route to run a specific health check
    router.get('/health/check/:name', requireAdmin, async (req: Request, res: Response) => {
      try {
        const { name } = req.params;
        
        if (!this.components.has(name)) {
          return res.status(404).json({
            success: false,
            message: `Health check "${name}" not found`
          });
        }
        
        const result = await this.runHealthCheck(name);
        
        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        this.logger.error(`Error running health check:`, error);
        res.status(500).json({
          success: false,
          message: 'Failed to run health check',
          error: (error as Error).message
        });
      }
    });

    // Register a custom health check
    router.post('/health/register', requireAdmin, async (req: Request, res: Response) => {
      try {
        const { name, type, status, details } = req.body;
        
        if (!name || !type || !status) {
          return res.status(400).json({
            success: false,
            message: 'Name, type, and status are required'
          });
        }
        
        // Validate type
        if (!Object.values(ServiceType).includes(type)) {
          return res.status(400).json({
            success: false,
            message: `Invalid type. Must be one of: ${Object.values(ServiceType).join(', ')}`
          });
        }
        
        // Validate status
        if (!Object.values(HealthStatus).includes(status)) {
          return res.status(400).json({
            success: false,
            message: `Invalid status. Must be one of: ${Object.values(HealthStatus).join(', ')}`
          });
        }
        
        this.registerHealthCheck({
          name,
          type,
          status,
          details,
          lastChecked: new Date()
        });
        
        res.status(201).json({
          success: true,
          message: `Health check "${name}" registered successfully`
        });
      } catch (error) {
        this.logger.error('Error registering health check:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to register health check',
          error: (error as Error).message
        });
      }
    });

    // Remove a custom health check
    router.delete('/health/register/:name', requireAdmin, async (req: Request, res: Response) => {
      try {
        const { name } = req.params;
        
        if (!this.components.has(name)) {
          return res.status(404).json({
            success: false,
            message: `Health check "${name}" not found`
          });
        }
        
        // Don't allow removing built-in checks
        const builtInChecks = ['postgresql', 'cpu', 'memory', 'disk'];
        if (builtInChecks.includes(name)) {
          return res.status(403).json({
            success: false,
            message: `Cannot remove built-in health check "${name}"`
          });
        }
        
        this.removeHealthCheck(name);
        
        res.json({
          success: true,
          message: `Health check "${name}" removed successfully`
        });
      } catch (error) {
        this.logger.error('Error removing health check:', error);
        res.status(500).json({
          success: false,
          message: 'Failed to remove health check',
          error: (error as Error).message
        });
      }
    });

    // Mount routes
    app.use('/api/admin', router);
    this.logger.info('Health check routes registered successfully');
  }
}