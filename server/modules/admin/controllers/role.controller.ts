/**
 * Role Management Controller
 * 
 * This controller handles all operations related to role management,
 * including creating, retrieving, updating, and deleting roles,
 * as well as assigning permissions to roles.
 */

import { Request, Response } from 'express';
import { Logger } from '../../../common/logger';
import { RoleService } from '../services/role.service';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/constants/auth-mode.enum';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Create validation schema for role creation
const createRoleSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters'),
  description: z.string().optional(),
  permissionIds: z.array(z.string().uuid('Invalid permission ID format')).optional(),
});

// Create validation schema for role update
const updateRoleSchema = z.object({
  name: z.string().min(2, 'Role name must be at least 2 characters').optional(),
  description: z.string().optional(),
  permissionIds: z.array(z.string().uuid('Invalid permission ID format')).optional(),
});

// Create logger instance
const logger = new Logger('RoleController');

/**
 * Register the role controller routes with the Express application
 * @param app Express application
 * @param roleService Role service instance
 */
export function registerRoleControllerRoutes(app: any, roleService: RoleService) {
  const BASE_PATH = '/api/admin/roles';

  /**
   * Get all roles
   * 
   * @route GET /api/admin/roles
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.get(BASE_PATH, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      // Get all roles with optional filtering
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const search = req.query.search as string;

      const roles = await roleService.findRoles(page, limit, search);

      return res.status(200).json({
        success: true,
        data: roles.data,
        pagination: roles.pagination
      });
    } catch (error) {
      logger.error('Error retrieving roles', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });
  
  /**
   * Get roles by company ID
   * 
   * @route GET /api/admin/roles/by-company/:companyId
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   */
  app.get(`${BASE_PATH}/by-company/:companyId`, AuthGuard.protect(JwtAuthMode.REQUIRED), async (req: Request, res: Response) => {
    try {
      const companyId = req.params.companyId;
      
      logger.info(`Getting roles for company ${companyId}`);
      
      // Get roles for specific company
      const roles = await roleService.getRolesByCompany(companyId);
      
      return res.status(200).json({
        success: true,
        data: roles
      });
    } catch (error) {
      logger.error(`Error retrieving roles for company ${req.params.companyId}`, error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Get a role by ID
   * 
   * @route GET /api/admin/roles/:id
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.get(`${BASE_PATH}/:id`, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      const roleId = req.params.id;

      // Get role by ID
      const role = await roleService.getRoleById(roleId);

      if (!role) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      // Get role permissions
      const permissions = await roleService.getRolePermissions(roleId);

      return res.status(200).json({
        success: true,
        data: {
          ...role,
          permissions
        }
      });
    } catch (error) {
      logger.error(`Error retrieving role with ID ${req.params.id}`, error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Create a new role
   * 
   * @route POST /api/admin/roles
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.post(BASE_PATH, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      // Validate request body
      const validationResult = createRoleSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: validationResult.error.issues
        });
      }

      // Create the role
      const roleData = validationResult.data;
      const role = await roleService.createRole({
        name: roleData.name,
        description: roleData.description || '',
        companyId: req.user?.companyId || '', // Required by schema
      });

      // Assign permissions if provided
      if (roleData.permissionIds && roleData.permissionIds.length > 0) {
        await roleService.assignPermissionsToRole(role.id, roleData.permissionIds);
      }

      // Get the created role with permissions
      const createdRole = await roleService.getRoleById(role.id);
      const permissions = await roleService.getRolePermissions(role.id);

      logger.info(`Role created: ${role.name} by user: ${req.user?.id}`);

      return res.status(201).json({
        success: true,
        message: 'Role created successfully',
        data: {
          ...createdRole,
          permissions
        }
      });
    } catch (error: any) {
      logger.error('Error creating role', error);

      // Handle duplicate name error
      if (error.message && error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Update a role
   * 
   * @route PATCH /api/admin/roles/:id
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.patch(`${BASE_PATH}/:id`, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      const roleId = req.params.id;

      // Validate request body
      const validationResult = updateRoleSchema.safeParse(req.body);

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: validationResult.error.issues
        });
      }

      // Check if role exists
      const existingRole = await roleService.getRoleById(roleId);
      if (!existingRole) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      // Prevent updating system roles
      if ((existingRole as any).is_system || (existingRole as any).isSystem) {
        return res.status(403).json({
          success: false,
          message: 'System roles cannot be modified'
        });
      }

      // Update the role
      const roleData = validationResult.data;
      const updatedRole = await roleService.updateRole(roleId, {
        name: roleData.name,
        description: roleData.description,
      }, req.user?.id || 'system'); // actorId required by service

      // Update permissions if provided
      if (roleData.permissionIds !== undefined) {
        await roleService.assignPermissionsToRole(roleId, roleData.permissionIds);
      }

      // Get the updated role with permissions
      const roleWithPermissions = await roleService.getRoleById(roleId);
      const permissions = await roleService.getRolePermissions(roleId);

      logger.info(`Role updated: ${updatedRole.name} by user: ${req.user?.id}`);

      return res.status(200).json({
        success: true,
        message: 'Role updated successfully',
        data: {
          ...roleWithPermissions,
          permissions
        }
      });
    } catch (error: any) {
      logger.error(`Error updating role with ID ${req.params.id}`, error);

      // Handle duplicate name error
      if (error.message && error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Delete a role
   * 
   * @route DELETE /api/admin/roles/:id
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.delete(`${BASE_PATH}/:id`, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      const roleId = req.params.id;

      // Check if role exists
      const existingRole = await roleService.getRoleById(roleId);
      if (!existingRole) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      // Prevent deleting system roles
      if ((existingRole as any).is_system || (existingRole as any).isSystem) {
        return res.status(403).json({
          success: false,
          message: 'System roles cannot be deleted'
        });
      }

      // Check if role is assigned to any users
      const roleUsers = await roleService.getRoleUsers(roleId);
      if (roleUsers.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Cannot delete role that is assigned to users',
          data: {
            userCount: roleUsers.length
          }
        });
      }

      // Delete the role
      await roleService.deleteRole(roleId, req.user?.id || 'system'); // actorId required by service

      logger.info(`Role deleted: ${existingRole.name} by user: ${req.user?.id}`);

      return res.status(200).json({
        success: true,
        message: 'Role deleted successfully'
      });
    } catch (error) {
      logger.error(`Error deleting role with ID ${req.params.id}`, error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Get permissions
   * 
   * @route GET /api/admin/permissions
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.get('/api/admin/permissions', AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      // Creează o conexiune directă la baza de date pentru a obține permisiunile
      const connectionString = process.env.DATABASE_URL;
      if (!connectionString) {
        throw new Error('DATABASE_URL is not set in environment variables');
      }
      const client = postgres(connectionString);
      const db = drizzle(client);
      
      logger.debug('Getting permissions directly from database');
      
      // Execută un query SQL direct pentru a obține permisiunile
      const permissions = await db.execute(
        'SELECT id, name, description, resource, action, created_at, updated_at FROM permissions'
      );
      
      logger.debug(`Retrieved ${permissions.length} permissions`);
      
      // Închide conexiunea
      await client.end();
      
      return res.status(200).json({
        success: true,
        data: permissions
      });
    } catch (error) {
      logger.error('Error retrieving permissions', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Assign permissions to a role
   * 
   * @route POST /api/admin/roles/:id/permissions
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.post(`${BASE_PATH}/:id/permissions`, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      const roleId = req.params.id;
      const { permissionIds } = req.body;

      // Validate permission IDs
      if (!permissionIds || !Array.isArray(permissionIds)) {
        return res.status(400).json({
          success: false,
          message: 'Permission IDs must be provided as an array'
        });
      }

      // Check if role exists
      const existingRole = await roleService.getRoleById(roleId);
      if (!existingRole) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      // Prevent modifying system roles' permissions
      if ((existingRole as any).is_system || (existingRole as any).isSystem) {
        return res.status(403).json({
          success: false,
          message: 'Permissions for system roles cannot be modified'
        });
      }

      // Assign permissions to role
      await roleService.assignPermissionsToRole(roleId, permissionIds);

      // Get updated permissions
      const permissions = await roleService.getRolePermissions(roleId);

      logger.info(`Permissions assigned to role: ${existingRole.name} by user: ${req.user?.id}`);

      return res.status(200).json({
        success: true,
        message: 'Permissions assigned successfully',
        data: permissions
      });
    } catch (error) {
      logger.error(`Error assigning permissions to role with ID ${req.params.id}`, error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * Get users assigned to a role
   * 
   * @route GET /api/admin/roles/:id/users
   * @middleware AuthGuard.protect(JwtAuthMode.REQUIRED) - Requires authentication
   * @middleware AuthGuard.roleGuard(['admin']) - Requires admin role
   */
  app.get(`${BASE_PATH}/:id/users`, AuthGuard.protect(JwtAuthMode.REQUIRED), AuthGuard.roleGuard(['admin']), async (req: Request, res: Response) => {
    try {
      const roleId = req.params.id;

      // Check if role exists
      const existingRole = await roleService.getRoleById(roleId);
      if (!existingRole) {
        return res.status(404).json({
          success: false,
          message: 'Role not found'
        });
      }

      // Get users with this role
      const users = await roleService.getRoleUsers(roleId);

      // Remove password field from user objects
      const sanitizedUsers = users.map((user: any) => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      return res.status(200).json({
        success: true,
        data: sanitizedUsers
      });
    } catch (error) {
      logger.error(`Error retrieving users for role with ID ${req.params.id}`, error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  logger.info('Role controller routes registered');
}