/**
 * License Service for Admin Module
 * 
 * This service manages software licensing and activation, supporting
 * features like license validation, activation/deactivation, and usage tracking.
 */

import { licenses } from '../../../../shared/schema/admin.schema';
import { and, eq, sql } from 'drizzle-orm';
import { Express, Request, Response, Router } from 'express';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { Logger } from '../../../common/logger';
import { AuditService, AuditAction } from '../../../modules/audit/services/audit.service';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import * as os from 'os';
import { DrizzleService } from '../../../common/drizzle/drizzle.service';

/**
 * License status enum
 */
enum LicenseStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  PENDING = 'pending'
}

/**
 * License edition enum
 */
enum LicenseEdition {
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise',
  TRIAL = 'trial'
}

/**
 * License service for the Admin module
 */
export class LicenseService {
  private logger = new Logger('LicenseService');
  private activeLicense: any = null;
  private features: Map<string, boolean> = new Map();
  private maxUsers: number = 0;
  private maxCompanies: number = 1;

  /**
   * Constructor for LicenseService
   * @param db DrizzleService instance
   */
  constructor(private readonly db: DrizzleService) {
    this.loadActiveLicense().catch(err => {
      this.logger.error('Error loading active license:', err);
    });
  }

  /**
   * Load the active license from the database
   */
  private async loadActiveLicense(): Promise<void> {
    try {
      const [license] = await this.db.query(async (db) => {
        return await db.select()
          .from(licenses)
          .where(eq(licenses.status, LicenseStatus.ACTIVE))
          .orderBy(licenses.created_at);
      });
      
      this.activeLicense = license || null;
      
      if (license) {
        this.maxUsers = license.max_activations || 5;
        this.maxCompanies = 1;
        this.features = new Map(Object.entries(license.features || {}));
        this.logger.info(`Active license loaded: ${license.license_key.substring(0, 8)}...`);
      } else {
        this.logger.warn('No active license found. Running in limited mode.');
        this.maxUsers = 2;
        this.maxCompanies = 1;
        this.features = new Map();
      }
    } catch (error) {
      this.logger.error('Error loading active license:', error);
      this.activeLicense = null;
      this.maxUsers = 2;
      this.maxCompanies = 1;
      this.features = new Map();
    }
  }

  /**
   * Get the active license
   * @returns Active license object or null if no active license
   */
  async getActiveLicense() {
    if (!this.activeLicense) {
      await this.loadActiveLicense();
    }
    return this.activeLicense;
  }

  /**
   * Check if a feature is enabled in the current license
   * @param featureKey Feature key to check
   * @returns Boolean indicating if the feature is enabled
   */
  async isFeatureEnabled(featureKey: string): Promise<boolean> {
    if (!this.activeLicense) {
      await this.loadActiveLicense();
    }
    
    // Special case for core features that are always enabled
    if (featureKey.startsWith('core.')) {
      return true;
    }
    
    return this.features.get(featureKey) === true;
  }

  /**
   * Get the maximum number of users allowed by the license
   * @returns Maximum number of users
   */
  async getMaxUsers(): Promise<number> {
    if (!this.activeLicense) {
      await this.loadActiveLicense();
    }
    return this.maxUsers;
  }

  /**
   * Get the maximum number of companies allowed by the license
   * @returns Maximum number of companies
   */
  async getMaxCompanies(): Promise<number> {
    if (!this.activeLicense) {
      await this.loadActiveLicense();
    }
    return this.maxCompanies;
  }

  /**
   * Register a new license
   * @param licenseKey License key to register
   * @param actorId ID of the user registering the license
   * @returns Registered license object
   */
  async registerLicense(licenseKey: string, actorId: string) {
    try {
      this.logger.info('Registering new license');
      
      // In a real implementation, this would validate with a license server
      // For now, we'll just generate a license based on the key
      
      // Simple validation of license key format (in real implementation would be more complex)
      if (!/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(licenseKey)) {
        throw new Error('Invalid license key format');
      }
      
      // Check if this license key is already registered
      const existingLicense = await this.db.query(async (db) => {
        return await db.select()
          .from(licenses)
          .where(eq(licenses.license_key, this.hashLicenseKey(licenseKey)))
          .limit(1);
      });
      
      if (existingLicense.length > 0) {
        throw new Error('This license key is already registered');
      }
      
      // Parse the license key to determine features
      // In a real implementation, this would be validated with a license server
      const edition = this.getLicenseEditionFromKey(licenseKey);
      const maxUsers = this.getMaxUsersForEdition(edition);
      const maxCompanies = this.getMaxCompaniesForEdition(edition);
      const features = this.getFeaturesForEdition(edition);
      
      // Generate expiration date (1 year from now)
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      
      // Create hardware identifier (for license binding)
      const hardwareId = this.generateHardwareId();
      
      // Insert the new license
      const [license] = await this.db.query(async (db) => {
        return await db.insert(licenses)
          .values({
            id: uuidv4(),
            license_key: this.hashLicenseKey(licenseKey),
            key_identifier: this.generateKeyIdentifier(licenseKey),
            edition,
            status: LicenseStatus.ACTIVE,
            registered_at: new Date(),
            activated_at: new Date(),
            expires_at: expiresAt,
            max_users: maxUsers,
            max_companies: maxCompanies,
            features,
            hardware_id: hardwareId,
            registered_by: actorId,
            activated_by: actorId
          })
          .returning();
      });
      
      // Log the audit event
      await AuditService.log({
        userId: actorId,
        companyId: null,
        action: AuditAction.CREATE,
        entity: 'licenses',
        entityId: license.id,
        details: {
          edition,
          keyIdentifier: license.key_identifier,
          event: 'license_registration'
        }
      });
      
      // Set as the active license
      this.activeLicense = license;
      this.maxUsers = maxUsers;
      this.maxCompanies = maxCompanies;
      this.features = new Map(Object.entries(features));
      
      return {
        id: license.id,
        keyIdentifier: license.key_identifier,
        edition: license.edition,
        status: license.status,
        registeredAt: license.registered_at,
        activatedAt: license.activated_at,
        expiresAt: license.expires_at,
        maxUsers: license.max_users,
        maxCompanies: license.max_companies,
        features: license.features
      };
    } catch (error) {
      this.logger.error('Error registering license:', error);
      throw error;
    }
  }

  /**
   * Activate a registered license
   * @param licenseId License ID to activate
   * @param actorId ID of the user activating the license
   * @returns Activated license object
   */
  async activateLicense(licenseId: string, actorId: string) {
    try {
      // Get the license
      const [license] = await this.db.query(async (db) => {
        return await db.select()
          .from(licenses)
          .where(eq(licenses.id, licenseId));
      });
      
      if (!license) {
        throw new Error('License not found');
      }
      
      if (license.status === LicenseStatus.ACTIVE) {
        return {
          id: license.id,
          keyIdentifier: license.key_identifier,
          edition: license.edition,
          status: license.status,
          registeredAt: license.registered_at,
          activatedAt: license.activated_at,
          expiresAt: license.expires_at,
          maxUsers: license.max_users,
          maxCompanies: license.max_companies,
          features: license.features
        };
      }
      
      // Check if license is expired
      if (license.status === LicenseStatus.EXPIRED) {
        throw new Error('Cannot activate expired license');
      }
      
      // Check if license is revoked
      if (license.status === LicenseStatus.REVOKED) {
        throw new Error('Cannot activate revoked license');
      }
      
      // Deactivate any currently active licenses
      await this.db.query(async (db) => {
        await db.update(licenses)
          .set({
            status: LicenseStatus.PENDING,
            updated_at: new Date()
          })
          .where(eq(licenses.status, LicenseStatus.ACTIVE));
      });
      
      // Update the license status
      const [activatedLicense] = await this.db.query(async (db) => {
        return await db.update(licenses)
          .set({
            status: LicenseStatus.ACTIVE,
            activated_at: new Date(),
            activated_by: actorId,
            updated_at: new Date()
          })
          .where(eq(licenses.id, licenseId))
          .returning();
      });
      
      // Log the audit event
      await AuditService.log({
        userId: actorId,
        companyId: null,
        action: AuditAction.UPDATE,
        entity: 'licenses',
        entityId: licenseId,
        details: {
          event: 'license_activation'
        }
      });
      
      // Set as the active license
      this.activeLicense = activatedLicense;
      this.maxUsers = activatedLicense.max_users || 5;
      this.maxCompanies = activatedLicense.max_companies || 1;
      this.features = new Map(Object.entries(activatedLicense.features || {}));
      
      return {
        id: activatedLicense.id,
        keyIdentifier: activatedLicense.key_identifier,
        edition: activatedLicense.edition,
        status: activatedLicense.status,
        registeredAt: activatedLicense.registered_at,
        activatedAt: activatedLicense.activated_at,
        expiresAt: activatedLicense.expires_at,
        maxUsers: activatedLicense.max_users,
        maxCompanies: activatedLicense.max_companies,
        features: activatedLicense.features
      };
    } catch (error) {
      this.logger.error('Error activating license:', error);
      throw error;
    }
  }

  /**
   * Deactivate a license
   * @param licenseId License ID to deactivate
   * @param actorId ID of the user deactivating the license
   * @returns Boolean indicating success
   */
  async deactivateLicense(licenseId: string, actorId: string): Promise<boolean> {
    try {
      // Get the license
      const [license] = await this.db.query(async (db) => {
        return await db.select()
          .from(licenses)
          .where(eq(licenses.id, licenseId));
      });
      
      if (!license) {
        throw new Error('License not found');
      }
      
      if (license.status !== LicenseStatus.ACTIVE) {
        throw new Error('License is not active');
      }
      
      // Update the license status
      await this.db.query(async (db) => {
        await db.update(licenses)
          .set({
            status: LicenseStatus.PENDING,
            updated_at: new Date()
          })
          .where(eq(licenses.id, licenseId));
      });
      
      // Log the audit event
      await AuditService.log({
        userId: actorId,
        companyId: null,
        action: AuditAction.UPDATE,
        entity: 'licenses',
        entityId: licenseId,
        details: {
          event: 'license_deactivation'
        }
      });
      
      // Clear the active license if it was the one deactivated
      if (this.activeLicense && this.activeLicense.id === licenseId) {
        await this.loadActiveLicense();
      }
      
      return true;
    } catch (error) {
      this.logger.error('Error deactivating license:', error);
      throw error;
    }
  }

  /**
   * Get all licenses
   * @returns Array of license objects
   */
  async getAllLicenses() {
    try {
      const result = await this.db.query(async (db) => {
        return await db.select({
          id: licenses.id,
          licenseKey: licenses.license_key,
          edition: licenses.edition,
          status: licenses.status,
          issuedTo: licenses.issued_to,
          issuedEmail: licenses.issued_email,
          maxActivations: licenses.max_activations,
          currentActivations: licenses.current_activations,
          features: licenses.features,
          expiresAt: licenses.expires_at,
          createdAt: licenses.created_at,
          updatedAt: licenses.updated_at
        })
        .from(licenses)
        .orderBy(licenses.created_at);
      });
      
      return result;
    } catch (error) {
      this.logger.error('Error getting all licenses:', error);
      throw error;
    }
  }

  /**
   * Check for expired licenses and update their status
   */
  async checkExpiredLicenses(): Promise<void> {
    try {
      const now = new Date();
      
      // Find expired licenses
      const expiredLicenses = await this.db.query(async (db) => {
        return await db.select()
          .from(licenses)
          .where(
            and(
              eq(licenses.status, LicenseStatus.ACTIVE),
              sql`${licenses.expires_at} < ${now}`
            )
          );
      });
      
      if (expiredLicenses.length === 0) {
        return;
      }
      
      // Update expired licenses
      for (const license of expiredLicenses) {
        await this.db.query(async (db) => {
          await db.update(licenses)
            .set({
              status: LicenseStatus.EXPIRED,
              updated_at: now
            })
            .where(eq(licenses.id, license.id));
        });
        
        this.logger.info(`License ${license.key_identifier} has expired`);
        
        // Log the audit event
        await AuditService.log({
          userId: 'system',
          companyId: null,
          action: AuditAction.UPDATE,
          entity: 'licenses',
          entityId: license.id,
          details: {
            event: 'license_expiration'
          }
        });
      }
      
      // If the active license expired, reload
      const activeExpired = expiredLicenses.some(
        (license: any) => this.activeLicense && license.id === this.activeLicense.id
      );
      
      if (activeExpired) {
        await this.loadActiveLicense();
      }
    } catch (error) {
      this.logger.error('Error checking expired licenses:', error);
    }
  }

  /**
   * Hash a license key for storage
   * @param licenseKey License key to hash
   * @returns Hashed license key
   */
  private hashLicenseKey(licenseKey: string): string {
    return crypto.createHash('sha256').update(licenseKey).digest('hex');
  }

  /**
   * Generate a key identifier from a license key
   * This creates a partial representation of the key that can be displayed without
   * revealing the full license key
   * @param licenseKey Full license key
   * @returns Partial key identifier
   */
  private generateKeyIdentifier(licenseKey: string): string {
    // Use the first 5 characters and last 5 characters with asterisks in between
    const parts = licenseKey.split('-');
    return `${parts[0]}-****-****-${parts[3]}`;
  }

  /**
   * Generate a hardware identifier for the current system
   * @returns Hardware identifier string
   */
  private generateHardwareId(): string {
    try {
      const networkInterfaces = os.networkInterfaces();
      const cpus = os.cpus();
      const platform = os.platform();
      const totalMem = os.totalmem();
      
      // Concatenate various hardware information
      const hwInfo = [
        platform,
        totalMem.toString(),
        cpus.length.toString(),
        cpus[0]?.model || '',
        // Get MAC address from the first non-internal interface
        Object.values(networkInterfaces)
          .flat()
          .filter(iface => iface && !iface.internal && iface.mac !== '00:00:00:00:00:00')
          .map(iface => iface?.mac)
          .filter(Boolean)
          .shift() || 'unknown'
      ].join('-');
      
      // Create a hash of the hardware info
      return crypto.createHash('sha256').update(hwInfo).digest('hex');
    } catch (error) {
      this.logger.error('Error generating hardware ID:', error);
      // Fallback to a random ID if hardware detection fails
      return crypto.randomBytes(32).toString('hex');
    }
  }

  /**
   * Get license edition from key
   * In a real implementation, this would be validated with a license server
   * @param licenseKey License key
   * @returns License edition
   */
  private getLicenseEditionFromKey(licenseKey: string): LicenseEdition {
    // Simple edition detection based on first character of the key
    // In a real implementation, this would be validated with a license server
    const firstChar = licenseKey.charAt(0);
    
    if (firstChar === 'E') {
      return LicenseEdition.ENTERPRISE;
    } else if (firstChar === 'P') {
      return LicenseEdition.PROFESSIONAL;
    } else if (firstChar === 'T') {
      return LicenseEdition.TRIAL;
    } else {
      return LicenseEdition.BASIC;
    }
  }

  /**
   * Get maximum users for a license edition
   * @param edition License edition
   * @returns Maximum number of users
   */
  private getMaxUsersForEdition(edition: LicenseEdition): number {
    switch (edition) {
      case LicenseEdition.ENTERPRISE:
        return 1000;
      case LicenseEdition.PROFESSIONAL:
        return 100;
      case LicenseEdition.TRIAL:
        return 10;
      case LicenseEdition.BASIC:
      default:
        return 5;
    }
  }

  /**
   * Get maximum companies for a license edition
   * @param edition License edition
   * @returns Maximum number of companies
   */
  private getMaxCompaniesForEdition(edition: LicenseEdition): number {
    switch (edition) {
      case LicenseEdition.ENTERPRISE:
        return 100;
      case LicenseEdition.PROFESSIONAL:
        return 10;
      case LicenseEdition.TRIAL:
        return 2;
      case LicenseEdition.BASIC:
      default:
        return 1;
    }
  }

  /**
   * Get features for a license edition
   * @param edition License edition
   * @returns Features object
   */
  private getFeaturesForEdition(edition: LicenseEdition): Record<string, boolean> {
    // Define features available for each edition
    const baseFeatures = {
      'core.users': true,
      'core.companies': true,
      'core.documents': true,
      'module.accounting': true,
      'module.inventory': true,
      'api.basic': true
    };
    
    const professionalFeatures = {
      ...baseFeatures,
      'module.ecommerce': true,
      'module.crm': true,
      'module.hr': true,
      'api.advanced': true,
      'feature.customization': true,
      'feature.import_export': true
    };
    
    const enterpriseFeatures = {
      ...professionalFeatures,
      'module.business_intelligence': true,
      'module.predictive_analytics': true,
      'feature.white_label': true,
      'feature.advanced_security': true,
      'feature.multi_branch': true,
      'api.enterprise': true
    };
    
    const trialFeatures = {
      ...professionalFeatures,
      'module.business_intelligence': true,
      'feature.advanced_security': true
    };
    
    switch (edition) {
      case LicenseEdition.ENTERPRISE:
        return enterpriseFeatures;
      case LicenseEdition.PROFESSIONAL:
        return professionalFeatures;
      case LicenseEdition.TRIAL:
        return trialFeatures;
      case LicenseEdition.BASIC:
      default:
        return baseFeatures;
    }
  }

  /**
   * Register API routes for license management
   * @param app Express application
   */
  registerRoutes(app: Express): void {
    this.logger.info('Registering license management routes...');
    const router = Router();

    // Authentication middleware
    const requireAuth = AuthGuard.AuthGuard.protect(JwtAuthMode.REQUIRED);
    const requireAdmin = AuthGuard.requireRoles(['admin']);
    
    // GET /api/admin/licenses - Get all licenses
    router.get('/licenses', requireAdmin, async (req: Request, res: Response) => {
      try {
        const licenses = await this.getAllLicenses();
        
        res.json({ success: true, data: licenses });
      } catch (error) {
        this.logger.error('Error getting licenses:', error);
        res.status(500).json({ success: false, message: 'Failed to get licenses' });
      }
    });

    // GET /api/admin/licenses/active - Get the active license
    router.get('/licenses/active', requireAuth, async (req: Request, res: Response) => {
      try {
        const license = await this.getActiveLicense();
        
        if (!license) {
          return res.json({
            success: true,
            data: {
              status: 'none',
              edition: 'free',
              maxUsers: 2,
              maxCompanies: 1,
              features: {}
            }
          });
        }
        
        res.json({
          success: true,
          data: {
            id: license.id,
            keyIdentifier: license.key_identifier,
            edition: license.edition,
            status: license.status,
            registeredAt: license.registered_at,
            activatedAt: license.activated_at,
            expiresAt: license.expires_at,
            maxUsers: license.max_users,
            maxCompanies: license.max_companies,
            features: license.features
          }
        });
      } catch (error) {
        this.logger.error('Error getting active license:', error);
        res.status(500).json({ success: false, message: 'Failed to get active license' });
      }
    });

    // POST /api/admin/licenses/register - Register a new license
    router.post('/licenses/register', requireAdmin, async (req: Request, res: Response) => {
      try {
        const { licenseKey } = req.body;
        
        if (!licenseKey) {
          return res.status(400).json({
            success: false,
            message: 'License key is required'
          });
        }
        
        const license = await this.registerLicense(licenseKey, req.user?.id);
        
        res.status(201).json({
          success: true,
          data: license,
          message: 'License registered and activated successfully'
        });
      } catch (error) {
        this.logger.error('Error registering license:', error);
        res.status(400).json({
          success: false,
          message: `Failed to register license: ${(error as Error).message}`
        });
      }
    });

    // POST /api/admin/licenses/:licenseId/activate - Activate a license
    router.post('/licenses/:licenseId/activate', requireAdmin, async (req: Request, res: Response) => {
      try {
        const { licenseId } = req.params;
        
        const license = await this.activateLicense(licenseId, req.user?.id);
        
        res.json({
          success: true,
          data: license,
          message: 'License activated successfully'
        });
      } catch (error) {
        this.logger.error('Error activating license:', error);
        res.status(400).json({
          success: false,
          message: `Failed to activate license: ${(error as Error).message}`
        });
      }
    });

    // POST /api/admin/licenses/:licenseId/deactivate - Deactivate a license
    router.post('/licenses/:licenseId/deactivate', requireAdmin, async (req: Request, res: Response) => {
      try {
        const { licenseId } = req.params;
        
        await this.deactivateLicense(licenseId, req.user?.id);
        
        res.json({
          success: true,
          message: 'License deactivated successfully'
        });
      } catch (error) {
        this.logger.error('Error deactivating license:', error);
        res.status(400).json({
          success: false,
          message: `Failed to deactivate license: ${(error as Error).message}`
        });
      }
    });

    // GET /api/admin/licenses/check-features - Check if features are enabled
    router.get('/licenses/check-features', requireAuth, async (req: Request, res: Response) => {
      try {
        const { features } = req.query;
        
        if (!features) {
          return res.status(400).json({
            success: false,
            message: 'Features parameter is required'
          });
        }
        
        const featureList = (features as string).split(',');
        const results: Record<string, boolean> = {};
        
        for (const feature of featureList) {
          results[feature] = await this.isFeatureEnabled(feature);
        }
        
        res.json({
          success: true,
          data: results
        });
      } catch (error) {
        this.logger.error('Error checking features:', error);
        res.status(500).json({ success: false, message: 'Failed to check features' });
      }
    });

    // Mount routes
    app.use('/api/admin', router);
    this.logger.info('License management routes registered successfully');
  }
}