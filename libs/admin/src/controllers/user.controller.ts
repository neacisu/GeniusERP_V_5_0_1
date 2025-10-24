/**
 * User Management Controller with @Roles() Decorator
 * 
 * This controller handles user management operations using the @Roles() decorator 
 * for role-based access control.
 */

import { Request, Response, NextFunction } from 'express';
import { createModuleLogger } from "@common/logger/loki-logger";
import { UserService } from '../services/user.service';
import { AuthGuard } from '@geniuserp/auth';
import { JwtAuthMode } from '@geniuserp/auth';
import { RolesGuard } from "@common/guards";
import { Roles } from "@common/decorators";
import { Reflector } from "@common/reflector/reflector";
import { z } from 'zod';

// Create validation schema for user creation
const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  companyId: z.string().uuid('Invalid company ID format').optional().nullable(),
  roleIds: z.array(z.string().uuid('Invalid role ID format')).optional(),
});

// Create logger instance
const logger = createModuleLogger('UserController');

/**
 * User Controller class that uses @Roles() decorator
 */
export class UserController {
  private reflector: Reflector;
  private rolesGuard: RolesGuard;
  
  constructor(private userService: UserService) {
    this.reflector = new Reflector();
    this.rolesGuard = new RolesGuard(this.reflector);
  }
  
  /**
   * Create a middleware function that applies the RolesGuard with specified roles
   */
  private applyRoles(roles: string[]) {
    return [
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      (req: Request, res: Response, next: NextFunction) => {
        // Set roles for this specific route
        this.reflector.get = function<T>(): T {
          return roles as unknown as T;
        };
        // Apply the roles guard
        this.rolesGuard.canActivate(req, res, next);
      }
    ];
  }

  /**
   * Create a new user
   * @roles admin
   */
  @Roles('admin')
  async createUser(req: Request, res: Response) {
    try {
      // Validate request body
      const validationResult = createUserSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: validationResult.error.issues
        });
      }

      // Create the user
      const userData = validationResult.data;
      const user = await this.userService.createUser({
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        companyId: userData.companyId,
        roleIds: userData.roleIds,
      });

      // Return the created user (excluding password)
      const { password, ...userWithoutPassword } = user;
      
      logger.info(`User created: ${user.email} by admin: ${req.user?.id}`);
      
      return res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: userWithoutPassword
      });
    } catch (error: any) {
      logger.error('Error creating user', error);
      
      // Handle duplicate email error
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
  }

  /**
   * Get a list of users with pagination and filtering
   * @roles admin, manager
   */
  @Roles('admin', 'manager')
  async getUsers(req: Request, res: Response) {
    try {
      // Parse and validate query parameters
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const companyId = req.query.companyId as string | undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortDirection = req.query.sortDirection as 'asc' | 'desc' | undefined;
      
      // Get users
      const result = await this.userService.getUsers({
        page,
        limit,
        companyId: companyId === 'null' ? null : companyId,
        sortBy,
        sortDirection,
      });
      
      // Remove password field from user objects
      const sanitizedUsers = result.data.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      return res.status(200).json({
        success: true,
        data: sanitizedUsers,
        pagination: result.pagination
      });
    } catch (error) {
      logger.error('Error retrieving users', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get a user by ID
   * @roles admin, manager
   */
  @Roles('admin', 'manager')
  async getUserById(req: Request, res: Response) {
    try {
      const userId = req.params.id;
      
      // Get user by ID
      const user = await this.userService.findUserById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      // Get user roles
      const roles = await this.userService.getUserRoles(userId);
      
      return res.status(200).json({
        success: true,
        data: {
          ...userWithoutPassword,
          roles
        }
      });
    } catch (error) {
      logger.error(`Error retrieving user with ID ${req.params.id}`, error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update a user
   * @roles admin
   */
  @Roles('admin')
  async updateUser(req: Request, res: Response) {
    try {
      const userId = req.params.id;
      
      // Check if user exists
      const existingUser = await this.userService.findUserById(userId);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Update user
      const updatedUser = await this.userService.updateUser(userId, req.body);
      
      // If role IDs are provided, update user roles
      if (req.body.roleIds && Array.isArray(req.body.roleIds)) {
        await this.userService.assignRolesToUser(userId, req.body.roleIds);
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      
      logger.info(`User updated: ${updatedUser.email} by admin: ${req.user?.id}`);
      
      return res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: userWithoutPassword
      });
    } catch (error: any) {
      logger.error(`Error updating user with ID ${req.params.id}`, error);
      
      // Handle duplicate email error
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
  }

  /**
   * Delete a user (soft delete)
   * @roles admin
   */
  @Roles('admin')
  async deleteUser(req: Request, res: Response) {
    try {
      const userId = req.params.id;
      
      // Check if user exists
      const existingUser = await this.userService.findUserById(userId);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Prevent self-deletion
      if (userId === req.user?.id) {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete your own account'
        });
      }
      
      // Delete the user
      const deletedUser = await this.userService.deleteUser(userId);
      
      logger.info(`User deleted: ${deletedUser.email} by admin: ${req.user?.id}`);
      
      return res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      logger.error(`Error deleting user with ID ${req.params.id}`, error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Assign roles to a user
   * @roles admin
   */
  @Roles('admin')
  async assignRoles(req: Request, res: Response) {
    try {
      const userId = req.params.id;
      const { roleIds } = req.body;
      
      // Validate role IDs
      if (!roleIds || !Array.isArray(roleIds)) {
        return res.status(400).json({
          success: false,
          message: 'Role IDs must be provided as an array'
        });
      }
      
      // Check if user exists
      const existingUser = await this.userService.findUserById(userId);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Assign roles to user
      await this.userService.assignRolesToUser(userId, roleIds);
      
      // Get updated roles
      const roles = await this.userService.getUserRoles(userId);
      
      logger.info(`Roles assigned to user: ${existingUser.email} by admin: ${req.user?.id}`);
      
      return res.status(200).json({
        success: true,
        message: 'Roles assigned successfully',
        data: roles
      });
    } catch (error) {
      logger.error(`Error assigning roles to user with ID ${req.params.id}`, error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Change a user's password
   * @roles admin
   */
  @Roles('admin')
  async changePassword(req: Request, res: Response) {
    try {
      const userId = req.params.id;
      const { password } = req.body;
      
      // Validate password
      if (!password || typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters'
        });
      }
      
      // Check if user exists
      const existingUser = await this.userService.findUserById(userId);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Change password
      await this.userService.changePassword(userId, password);
      
      logger.info(`Password changed for user: ${existingUser.email} by admin: ${req.user?.id}`);
      
      return res.status(200).json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error(`Error changing password for user with ID ${req.params.id}`, error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  /**
   * Register the user controller routes with the Express application
   * @param app Express application
   */
  registerRoutes(app: any) {
    const BASE_PATH = '/api/admin';
    
    // Create user (admin only)
    app.post(`${BASE_PATH}/users`, 
      ...this.applyRoles(['admin']), 
      this.createUser.bind(this)
    );
    
    // Get users (admin and manager)
    app.get(`${BASE_PATH}/users`, 
      ...this.applyRoles(['admin', 'manager']), 
      this.getUsers.bind(this)
    );
    
    // Get user by ID (admin and manager)
    app.get(`${BASE_PATH}/users/:id`, 
      ...this.applyRoles(['admin', 'manager']), 
      this.getUserById.bind(this)
    );
    
    // Update user (admin only)
    app.patch(`${BASE_PATH}/users/:id`, 
      ...this.applyRoles(['admin']), 
      this.updateUser.bind(this)
    );
    
    // Delete user (admin only)
    app.delete(`${BASE_PATH}/users/:id`, 
      ...this.applyRoles(['admin']), 
      this.deleteUser.bind(this)
    );
    
    // Assign roles (admin only)
    app.post(`${BASE_PATH}/users/:id/roles`, 
      ...this.applyRoles(['admin']), 
      this.assignRoles.bind(this)
    );
    
    // Change password (admin only)
    app.post(`${BASE_PATH}/users/:id/change-password`, 
      ...this.applyRoles(['admin']), 
      this.changePassword.bind(this)
    );
    
    logger.info('User controller routes registered with @Roles() decorator');
  }
}

/**
 * Register user controller routes with Express application
 * @param app Express application
 * @param userService User service instance
 */
export function registerUserControllerRoutes(app: any, userService: UserService) {
  const userController = new UserController(userService);
  userController.registerRoutes(app);
}