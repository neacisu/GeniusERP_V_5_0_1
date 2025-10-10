/**
 * User Service
 * 
 * This service handles operations related to user management, authentication, roles and permissions.
 * It provides methods for retrieving, creating, and updating users and their related data.
 */

import { DrizzleService } from "../../../common/drizzle/drizzle.service";
import { User, InsertUser, Role, Permission } from "@shared/schema";
import { authService } from "../../auth/services/auth.service";
import { users, roles, permissions, userRoles, rolePermissions } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { Logger } from "../../../common/logger";

export class UserService {
  private drizzle: DrizzleService;
  private logger: Logger;
  private static instance: UserService;

  constructor(drizzleService?: DrizzleService) {
    this.logger = new Logger("UserService");
    this.drizzle = drizzleService || new DrizzleService();
  }

  /**
   * Get the singleton instance of UserService
   */
  public static getInstance(drizzleService?: DrizzleService): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService(drizzleService);
    }
    return UserService.instance;
  }
  
  // User Management
  
  /**
   * Get all users
   * 
   * @returns Array of users
   */
  async getUsers(): Promise<User[]> {
    try {
      this.logger.debug("Getting all users");
      
      const result = await this.drizzle.query(async (db) => {
        return await db.select().from(users);
      });
      
      this.logger.debug(`Retrieved ${result.length} users`);
      return result;
    } catch (error) {
      this.logger.error("Error getting users:", error);
      throw error;
    }
  }
  
  /**
   * Get a user by ID
   * 
   * @param id User ID
   * @returns The user or undefined if not found
   */
  async getUser(id: string): Promise<User | undefined> {
    try {
      this.logger.debug(`Getting user with ID: ${id}`);
      
      const result = await this.drizzle.query(async (db) => {
        return await db.select()
          .from(users)
          .where(eq(users.id, id))
          .limit(1);
      });
      
      const user = result.length > 0 ? result[0] : undefined;
      this.logger.debug(user ? "User found" : "User not found");
      
      return user;
    } catch (error) {
      this.logger.error(`Error getting user with ID ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Get a user by username
   * 
   * @param username Username
   * @returns The user or undefined if not found
   */
  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      this.logger.debug(`Getting user with username: ${username}`);
      
      const result = await this.drizzle.query(async (db) => {
        return await db.select()
          .from(users)
          .where(eq(users.username, username))
          .limit(1);
      });
      
      const user = result.length > 0 ? result[0] : undefined;
      this.logger.debug(user ? "User found" : "User not found");
      
      return user;
    } catch (error) {
      this.logger.error(`Error getting user with username ${username}:`, error);
      throw error;
    }
  }
  
  /**
   * Create a new user
   * 
   * @param userData User data to create
   * @returns The created user
   */
  async createUser(userData: InsertUser): Promise<User> {
    try {
      this.logger.debug(`Creating new user with username: ${userData.username}`);
      
      // Hash the password before creating the user
      const hashedPassword = await authService.hashPassword(userData.password);
      
      const user = {
        ...userData,
        password: hashedPassword
      };
      
      const result = await this.drizzle.query(async (db) => {
        return await db.insert(users).values(user).returning();
      });
      
      this.logger.debug(`Created user with ID: ${result[0].id}`);
      return result[0];
    } catch (error) {
      this.logger.error(`Error creating user with username ${userData.username}:`, error);
      throw error;
    }
  }
  
  /**
   * Update a user
   * 
   * @param id User ID
   * @param userData User data to update
   * @returns The updated user
   */
  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User> {
    try {
      this.logger.debug(`Updating user with ID: ${id}`);
      
      // If password is being updated, hash it first
      if (userData.password) {
        userData.password = await authService.hashPassword(userData.password);
      }
      
      // Set the updatedAt timestamp
      const updateData = {
        ...userData,
        updatedAt: new Date()
      };
      
      const result = await this.drizzle.query(async (db) => {
        return await db.update(users)
          .set(updateData)
          .where(eq(users.id, id))
          .returning();
      });
      
      this.logger.debug(`Updated user with ID: ${id}`);
      return result[0];
    } catch (error) {
      this.logger.error(`Error updating user with ID ${id}:`, error);
      throw error;
    }
  }
  
  // Role Management
  
  /**
   * Get all roles, optionally filtered by company
   * 
   * @param companyId Optional company ID to filter roles
   * @returns Array of roles
   */
  async getRoles(companyId?: string): Promise<Role[]> {
    try {
      this.logger.debug(companyId 
        ? `Getting roles for company ID: ${companyId}` 
        : "Getting all roles");
      
      const result = await this.drizzle.query(async (db) => {
        let query = db.select().from(roles);
        
        if (companyId) {
          query = query.where(eq(roles.companyId, companyId));
        }
        
        return await query;
      });
      
      this.logger.debug(`Retrieved ${result.length} roles`);
      return result;
    } catch (error) {
      this.logger.error("Error getting roles:", error);
      throw error;
    }
  }
  
  /**
   * Get a role by ID
   * 
   * @param id Role ID
   * @returns The role or undefined if not found
   */
  async getRole(id: string): Promise<Role | undefined> {
    try {
      this.logger.debug(`Getting role with ID: ${id}`);
      
      const result = await this.drizzle.query(async (db) => {
        return await db.select()
          .from(roles)
          .where(eq(roles.id, id))
          .limit(1);
      });
      
      const role = result.length > 0 ? result[0] : undefined;
      this.logger.debug(role ? "Role found" : "Role not found");
      
      return role;
    } catch (error) {
      this.logger.error(`Error getting role with ID ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Get a role by name and company ID
   * 
   * @param name Role name
   * @param companyId Company ID
   * @returns The role or undefined if not found
   */
  async getRoleByName(name: string, companyId: string): Promise<Role | undefined> {
    try {
      this.logger.debug(`Getting role with name: ${name} for company: ${companyId}`);
      
      const result = await this.drizzle.query(async (db) => {
        return await db.select()
          .from(roles)
          .where(and(
            eq(roles.name, name),
            eq(roles.companyId, companyId)
          ))
          .limit(1);
      });
      
      const role = result.length > 0 ? result[0] : undefined;
      this.logger.debug(role ? "Role found" : "Role not found");
      
      return role;
    } catch (error) {
      this.logger.error(`Error getting role with name ${name}:`, error);
      throw error;
    }
  }
  
  // User-Role Management
  
  /**
   * Get all roles for a user
   * 
   * @param userId User ID
   * @returns Array of roles
   */
  async getUserRoles(userId: string): Promise<Role[]> {
    try {
      this.logger.debug(`Getting roles for user ID: ${userId}`);
      
      const result = await this.drizzle.query(async (db) => {
        return await db.select({
            role: roles
          })
          .from(userRoles)
          .innerJoin(roles, eq(userRoles.roleId, roles.id))
          .where(eq(userRoles.userId, userId));
      });
      
      const userRolesArray = result.map((r: any) => r.role);
      this.logger.debug(`Retrieved ${userRolesArray.length} roles for user ID: ${userId}`);
      
      return userRolesArray;
    } catch (error) {
      this.logger.error(`Error getting roles for user ID ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Assign a role to a user
   * 
   * @param userId User ID
   * @param roleId Role ID
   */
  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    try {
      this.logger.debug(`Assigning role ID: ${roleId} to user ID: ${userId}`);
      
      await this.drizzle.query(async (db) => {
        return await db.insert(userRoles)
          .values({
            userId,
            roleId
          })
          .onConflictDoNothing();
      });
      
      this.logger.debug(`Assigned role ID: ${roleId} to user ID: ${userId}`);
    } catch (error) {
      this.logger.error(`Error assigning role ID ${roleId} to user ID ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Remove a role from a user
   * 
   * @param userId User ID
   * @param roleId Role ID
   */
  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    try {
      this.logger.debug(`Removing role ID: ${roleId} from user ID: ${userId}`);
      
      await this.drizzle.query(async (db) => {
        return await db.delete(userRoles)
          .where(and(
            eq(userRoles.userId, userId),
            eq(userRoles.roleId, roleId)
          ));
      });
      
      this.logger.debug(`Removed role ID: ${roleId} from user ID: ${userId}`);
    } catch (error) {
      this.logger.error(`Error removing role ID ${roleId} from user ID ${userId}:`, error);
      throw error;
    }
  }
  
  // Permission Management
  
  /**
   * Get all permissions
   * 
   * @returns Array of permissions
   */
  async getPermissions(): Promise<Permission[]> {
    try {
      this.logger.debug("Getting all permissions");
      
      const result = await this.drizzle.query(async (db) => {
        return await db.select().from(permissions);
      });
      
      this.logger.debug(`Retrieved ${result.length} permissions`);
      return result;
    } catch (error) {
      this.logger.error("Error getting permissions:", error);
      throw error;
    }
  }
  
  /**
   * Get all permissions for a role
   * 
   * @param roleId Role ID
   * @returns Array of permissions
   */
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    try {
      this.logger.debug(`Getting permissions for role ID: ${roleId}`);
      
      const result = await this.drizzle.query(async (db) => {
        return await db.select({
            permission: permissions
          })
          .from(rolePermissions)
          .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
          .where(eq(rolePermissions.roleId, roleId));
      });
      
      const rolePermissionsArray = result.map((r: any) => r.permission);
      this.logger.debug(`Retrieved ${rolePermissionsArray.length} permissions for role ID: ${roleId}`);
      
      return rolePermissionsArray;
    } catch (error) {
      this.logger.error(`Error getting permissions for role ID ${roleId}:`, error);
      throw error;
    }
  }
}