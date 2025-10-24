/**
 * User Controller
 * 
 * This controller handles user management operations including user creation,
 * retrieval, updating, and role/permission management.
 */

import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";
import { createModuleLogger } from "@common/logger/loki-logger";

export class UserController {
  private userService: UserService;
  private logger: ReturnType<typeof createModuleLogger>;

  constructor() {
    this.userService = UserService.getInstance();
    this.logger = createModuleLogger("UserController");
  }

  /**
   * Get all users
   */
  async getUsers(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      this.logger.debug("Getting all users");
      const users = await this.userService.getUsers();
      res.json(users);
    } catch (error) {
      this.logger.error("Error getting users:", error);
      next(error);
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;
      this.logger.debug(`Getting user with ID: ${id}`);
      
      // Users can only view their own profile unless they are admins
      if (req.user && id !== req.user.id && req.user.role !== "admin") {
        this.logger.warn(`Unauthorized access attempt to user profile ${id} by user ${req.user.id}`);
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const user = await this.userService.getUser(id);
      
      if (!user) {
        this.logger.warn(`User not found with ID: ${id}`);
        return res.status(404).json({ message: "User not found" });
      }
      
      this.logger.debug(`Retrieved user with ID: ${id}`);
      res.json(user);
    } catch (error) {
      this.logger.error(`Error getting user with ID ${req.params.id}:`, error);
      next(error);
    }
  }

  /**
   * Create a new user
   */
  async createUser(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      this.logger.debug("Creating new user");
      const user = await this.userService.createUser(req.body);
      this.logger.debug(`Created user with ID: ${user.id}`);
      res.status(201).json(user);
    } catch (error) {
      this.logger.error("Error creating user:", error);
      next(error);
    }
  }

  /**
   * Update user
   */
  async updateUser(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;
      this.logger.debug(`Updating user with ID: ${id}`);
      
      // Users can only update their own profile unless they are admins
      if (req.user && id !== req.user.id && req.user.role !== "admin") {
        this.logger.warn(`Unauthorized update attempt to user ${id} by user ${req.user.id}`);
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Non-admins cannot change their role
      if (req.user && id === req.user.id && req.user.role !== "admin" && req.body.role) {
        this.logger.warn(`User ${id} attempted to change their own role`);
        delete req.body.role;
      }
      
      const user = await this.userService.updateUser(id, req.body);
      this.logger.debug(`Updated user with ID: ${id}`);
      res.json(user);
    } catch (error) {
      this.logger.error(`Error updating user with ID ${req.params.id}:`, error);
      next(error);
    }
  }

  /**
   * Get all roles
   */
  async getRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.logger.debug("Getting all roles");
      const companyId = req.query.companyId as string | undefined;
      const roles = await this.userService.getRoles(companyId);
      this.logger.debug(`Retrieved ${roles.length} roles`);
      res.json(roles);
    } catch (error) {
      this.logger.error("Error getting roles:", error);
      next(error);
    }
  }

  /**
   * Get user's roles
   */
  async getUserRoles(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { id } = req.params;
      this.logger.debug(`Getting roles for user ID: ${id}`);
      
      // Users can only view their own roles unless they are admins
      if (req.user && id !== req.user.id && req.user.role !== "admin") {
        this.logger.warn(`Unauthorized access attempt to user roles ${id} by user ${req.user.id}`);
        res.status(403).json({ message: "Forbidden" });
        return;
      }
      
      const roles = await this.userService.getUserRoles(id);
      this.logger.debug(`Retrieved ${roles.length} roles for user ID: ${id}`);
      res.json(roles);
    } catch (error) {
      this.logger.error(`Error getting roles for user ID ${req.params.id}:`, error);
      next(error);
    }
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, roleId } = req.params;
      this.logger.debug(`Assigning role ID: ${roleId} to user ID: ${id}`);
      
      await this.userService.assignRoleToUser(id, roleId);
      this.logger.debug(`Assigned role ID: ${roleId} to user ID: ${id}`);
      res.sendStatus(204);
    } catch (error) {
      this.logger.error(`Error assigning role ID ${req.params.roleId} to user ID ${req.params.id}:`, error);
      next(error);
    }
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, roleId } = req.params;
      this.logger.debug(`Removing role ID: ${roleId} from user ID: ${id}`);
      
      await this.userService.removeRoleFromUser(id, roleId);
      this.logger.debug(`Removed role ID: ${roleId} from user ID: ${id}`);
      res.sendStatus(204);
    } catch (error) {
      this.logger.error(`Error removing role ID ${req.params.roleId} from user ID ${req.params.id}:`, error);
      next(error);
    }
  }

  /**
   * Get all permissions
   */
  async getPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      this.logger.debug("Getting all permissions");
      const permissions = await this.userService.getPermissions();
      this.logger.debug(`Retrieved ${permissions.length} permissions`);
      res.json(permissions);
    } catch (error) {
      this.logger.error("Error getting permissions:", error);
      next(error);
    }
  }

  /**
   * Get role permissions
   */
  async getRolePermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      this.logger.debug(`Getting permissions for role ID: ${id}`);
      
      const permissions = await this.userService.getRolePermissions(id);
      this.logger.debug(`Retrieved ${permissions.length} permissions for role ID: ${id}`);
      res.json(permissions);
    } catch (error) {
      this.logger.error(`Error getting permissions for role ID ${req.params.id}:`, error);
      next(error);
    }
  }
}