/**
 * Role Service for Admin Module
 * 
 * This service manages roles and permissions for the Admin module,
 * supporting the creation, assignment, and management of user roles.
 */

import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { roles, permissions, rolePermissions } from '../../../../shared/schema';
import { and, eq } from 'drizzle-orm';
import { Express, Request, Response, Router } from 'express';
import { AuthGuard } from '../../../common/middleware/auth-guard';
import { Logger } from '../../../common/logger';
import { AuditService, AuditAction } from '../../../modules/audit/services/audit.service';
import { v4 as uuidv4 } from 'uuid';

/**
 * Role service for the Admin module
 */
export class RoleService {
  private db: PostgresJsDatabase<any>;
  private logger = new Logger('RoleService');

  /**
   * Constructor for RoleService
   * @param db Drizzle database instance
   */
  constructor(db: PostgresJsDatabase<any>) {
    this.db = db;
  }

  /**
   * Create a new role
   * @param roleData Role data including name, description, companyId
   * @returns Created role object
   */
  async createRole(roleData: {
    name: string;
    description?: string;
    companyId: string;
  }) {
    try {
      this.logger.info(`Creating new role: ${roleData.name}`);
      
      // Generate a UUID for the role
      const roleId = uuidv4();
      
      // Insert the role
      const [role] = await this.db.insert(roles).values({
        id: roleId,
        name: roleData.name,
        description: roleData.description || null,
        companyId: roleData.companyId,
      }).returning();
      
      return role;
    } catch (error) {
      this.logger.error('Error creating role:', error);
      throw error;
    }
  }

  /**
   * Get all roles for a company
   * @param companyId Company ID
   * @returns Array of role objects
   */
  async getRolesByCompany(companyId: string) {
    try {
      return await this.db.select().from(roles)
        .where(eq(roles.companyId, companyId));
    } catch (error) {
      this.logger.error(`Error getting roles for company ${companyId}:`, error);
      throw error;
    }
  }

  /**
   * Get a role by ID
   * @param roleId Role ID
   * @returns Role object
   */
  async getRoleById(roleId: string) {
    try {
      const [role] = await this.db.select().from(roles)
        .where(eq(roles.id, roleId));
      
      return role;
    } catch (error) {
      this.logger.error(`Error getting role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Update a role
   * @param roleId Role ID
   * @param updates Fields to update (name, description)
   * @param actorId ID of the user making the change (for audit log)
   * @returns Updated role object
   */
  async updateRole(
    roleId: string,
    updates: Partial<{
      name: string;
      description: string;
    }>,
    actorId: string
  ) {
    try {
      const [role] = await this.db.update(roles)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(roles.id, roleId))
        .returning();
      
      if (!role) {
        throw new Error(`Role with ID ${roleId} not found`);
      }
      
      // Log the audit event
      await AuditService.log({
        userId: actorId,
        companyId: role.companyId,
        action: AuditAction.UPDATE,
        entity: 'roles',
        entityId: roleId,
        details: {
          updates: updates,
        }
      });
      
      return role;
    } catch (error) {
      this.logger.error(`Error updating role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Delete a role
   * @param roleId Role ID
   * @param actorId ID of the user making the change (for audit log)
   * @returns Boolean indicating success
   */
  async deleteRole(roleId: string, actorId: string) {
    try {
      // Get the role first for the audit log
      const role = await this.getRoleById(roleId);
      
      if (!role) {
        throw new Error(`Role with ID ${roleId} not found`);
      }
      
      // Delete role permissions first (foreign key constraint)
      await this.db.delete(rolePermissions)
        .where(eq(rolePermissions.roleId, roleId));
      
      // Delete the role
      await this.db.delete(roles)
        .where(eq(roles.id, roleId));
      
      // Log the audit event
      await AuditService.log({
        userId: actorId,
        companyId: role.companyId,
        action: AuditAction.DELETE,
        entity: 'roles',
        entityId: roleId,
        details: {
          roleName: role.name,
        }
      });
      
      return true;
    } catch (error) {
      this.logger.error(`Error deleting role ${roleId}:`, error);
      throw error;
    }
  }

  /**
   * Register API routes for role management
   * @param app Express application
   */
  registerRoutes(app: Express): void {
    this.logger.info('Registering role management routes...');
    const router = Router();

    // Authentication middleware
    const requireAuth = AuthGuard.requireAuth();
    const requireAdmin = AuthGuard.requireRoles(['admin']);
    
    // GET /api/admin/roles/:companyId - Get roles for a company
    router.get('/roles/:companyId', requireAuth, async (req: Request, res: Response) => {
      try {
        const { companyId } = req.params;
        
        const roles = await this.getRolesByCompany(companyId);
        
        res.json({ success: true, data: roles });
      } catch (error) {
        this.logger.error('Error fetching roles:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch roles' });
      }
    });

    // GET /api/admin/roles/detail/:roleId - Get role details
    router.get('/roles/detail/:roleId', requireAuth, async (req: Request, res: Response) => {
      try {
        const { roleId } = req.params;
        
        const role = await this.getRoleById(roleId);
        
        if (!role) {
          return res.status(404).json({ success: false, message: 'Role not found' });
        }
        
        res.json({ success: true, data: role });
      } catch (error) {
        this.logger.error('Error fetching role details:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch role details' });
      }
    });

    // POST /api/admin/roles - Create a new role
    router.post('/roles', requireAdmin, async (req: Request, res: Response) => {
      try {
        const { name, description, companyId } = req.body;
        
        if (!name || !companyId) {
          return res.status(400).json({
            success: false,
            message: 'Missing required fields (name, companyId)'
          });
        }
        
        const role = await this.createRole({
          name,
          description,
          companyId
        });
        
        res.status(201).json({ success: true, data: role });
      } catch (error) {
        this.logger.error('Error creating role:', error);
        res.status(500).json({ success: false, message: 'Failed to create role' });
      }
    });

    // PUT /api/admin/roles/:roleId - Update a role
    router.put('/roles/:roleId', requireAdmin, async (req: Request, res: Response) => {
      try {
        const { roleId } = req.params;
        const { name, description } = req.body;
        
        // Require at least one field to update
        if (!name && !description) {
          return res.status(400).json({
            success: false,
            message: 'At least one field to update is required'
          });
        }
        
        const role = await this.updateRole(
          roleId,
          { name, description },
          req.user?.id
        );
        
        res.json({ success: true, data: role });
      } catch (error) {
        this.logger.error('Error updating role:', error);
        res.status(500).json({ success: false, message: 'Failed to update role' });
      }
    });

    // DELETE /api/admin/roles/:roleId - Delete a role
    router.delete('/roles/:roleId', requireAdmin, async (req: Request, res: Response) => {
      try {
        const { roleId } = req.params;
        
        await this.deleteRole(roleId, req.user?.id);
        
        res.json({ success: true });
      } catch (error) {
        this.logger.error('Error deleting role:', error);
        res.status(500).json({ success: false, message: 'Failed to delete role' });
      }
    });

    // Mount routes
    app.use('/api/admin', router);
    this.logger.info('Role management routes registered successfully');
  }
}