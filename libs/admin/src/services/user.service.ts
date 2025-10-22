/**
 * User Service for Admin Module
 * 
 * This service handles all user management operations including:
 * - Creating new users with secure password hashing
 * - Updating user details (email, name, password)
 * - Assigning roles and permissions
 * - Integrating with audit trail for user activities
 */

import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, isNull, asc, desc, sql } from 'drizzle-orm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from "@common/logger";
import { users, roles, userRoles } from '../../../../shared/schema/admin.schema';

/**
 * User creation interface
 */
export interface CreateUserParams {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  companyId?: string | null;
  roleIds?: string[];
}

/**
 * User update interface
 */
export interface UpdateUserParams {
  email?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  companyId?: string | null;
}

/**
 * Service for managing users in the system
 */
export class UserService {
  private db: PostgresJsDatabase<any>;
  private logger = new Logger('UserService');
  private readonly SALT_ROUNDS = 10;

  /**
   * Constructor for UserService
   * @param db Drizzle database instance
   */
  constructor(db: PostgresJsDatabase<any>) {
    this.db = db;
    this.logger.debug('UserService initialized');
  }

  /**
   * Create a new user with the provided details
   * @param params User creation parameters
   * @returns Created user record
   */
  async createUser(params: CreateUserParams) {
    try {
      this.logger.debug(`Creating user with email: ${params.email}`);
      
      // Check if user already exists
      const existingUser = await this.findUserByEmail(params.email);
      if (existingUser) {
        throw new Error(`User with email ${params.email} already exists`);
      }
      
      // Hash the password
      const hashedPassword = await this.hashPassword(params.password);
      
      // Create the user
      const now = new Date();
      
      const [newUser] = await this.db.insert(users).values({
        username: params.email.toLowerCase(), // Using email as username
        email: params.email.toLowerCase(),
        first_name: params.firstName || null,
        last_name: params.lastName || null,
        password: hashedPassword,
        company_id: params.companyId || null,
        created_at: now,
        updated_at: now
      }).returning();
      
      // Assign roles if provided
      if (params.roleIds && params.roleIds.length > 0) {
        await this.assignRolesToUser(newUser.id, params.roleIds);
      }
      
      this.logger.info(`User created successfully: ${newUser.email}`);
      return newUser;
    } catch (error) {
      this.logger.error('Failed to create user:', error);
      throw error;
    }
  }

  /**
   * Update an existing user with the provided details
   * @param userId User ID
   * @param updates User updates
   * @returns Updated user record
   */
  async updateUser(userId: string, updates: UpdateUserParams) {
    try {
      this.logger.debug(`Updating user with ID: ${userId}`);
      
      // Prepare update data
      const updateData: any = { updated_at: new Date() };
      
      if (updates.email !== undefined) {
        // Check if the new email already exists for another user
        if (updates.email) {
          const existingUser = await this.findUserByEmail(updates.email);
          if (existingUser && existingUser.id !== userId) {
            throw new Error(`User with email ${updates.email} already exists`);
          }
          updateData.email = updates.email.toLowerCase();
        }
      }
      
      if (updates.firstName !== undefined) updateData.first_name = updates.firstName;
      if (updates.lastName !== undefined) updateData.last_name = updates.lastName;
      if (updates.companyId !== undefined) updateData.company_id = updates.companyId;
      
      // Hash the password if provided
      if (updates.password) {
        updateData.password = await this.hashPassword(updates.password);
      }
      
      // Update the user
      const [updatedUser] = await this.db.update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();
      
      if (!updatedUser) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      this.logger.info(`User ${updatedUser.email} updated successfully`);
      return updatedUser;
    } catch (error) {
      this.logger.error(`Failed to update user with ID ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Find a user by email
   * @param email User email
   * @returns User record or null if not found
   */
  async findUserByEmail(email: string) {
    try {
      this.logger.debug(`Finding user by email: ${email}`);
      
      const [user] = await this.db.select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);
      
      return user || null;
    } catch (error) {
      this.logger.error(`Failed to find user by email ${email}:`, error);
      throw error;
    }
  }

  /**
   * Find a user by ID
   * @param userId User ID
   * @returns User record or null if not found
   */
  async findUserById(userId: string) {
    try {
      this.logger.debug(`Finding user by ID: ${userId}`);
      
      const [user] = await this.db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      return user || null;
    } catch (error) {
      this.logger.error(`Failed to find user by ID ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get users with pagination and filtering
   * @param options Query options
   * @returns Paginated user records
   */
  async getUsers(options: {
    companyId?: string | null;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortDirection?: 'asc' | 'desc';
  } = {}) {
    try {
      this.logger.debug('Getting users with options:', options);
      
      const page = options.page || 1;
      const limit = options.limit || 10;
      const offset = (page - 1) * limit;
      
      // Build query conditions
      const conditions = [];
      
      if (options.companyId !== undefined) {
        if (options.companyId === null) {
          conditions.push(isNull(users.company_id));
        } else {
          conditions.push(eq(users.company_id, options.companyId));
        }
      }
      
      // Create the base query
      const query = this.db.select().from(users);
      
      // Apply conditions if any
      if (conditions.length > 0) {
        query.where(and(...conditions));
      }
      
      // Apply sorting
      const validSortColumns: Record<string, any> = {
        id: users.id,
        username: users.username,
        email: users.email,
        first_name: users.first_name,
        last_name: users.last_name,
        role: users.role,
        company_id: users.company_id,
        created_at: users.created_at,
        updated_at: users.updated_at,
      };
      
      if (options.sortBy && validSortColumns[options.sortBy]) {
        const column = validSortColumns[options.sortBy];
        query.orderBy(options.sortDirection === 'desc' ? desc(column) : asc(column));
      } else {
        query.orderBy(asc(users.email));
      }
      
      // Apply pagination
      query.limit(limit).offset(offset);
      
      // Execute the query
      const result = await query;
      
      // Get total count
      const [{ count: total }] = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(conditions.length > 0 ? and(...conditions) : undefined);
      
      return {
        data: result,
        pagination: {
          page,
          limit,
          total: Number(total),
          totalPages: Math.ceil(Number(total) / limit)
        }
      };
    } catch (error) {
      this.logger.error('Failed to get users:', error);
      throw error;
    }
  }

  /**
   * Delete a user (permanent deletion)
   * @param userId User ID
   * @returns Deleted user record
   */
  async deleteUser(userId: string) {
    try {
      this.logger.debug(`Deleting user with ID: ${userId}`);
      
      // First delete related user roles
      await this.db.delete(userRoles).where(eq(userRoles.user_id, userId));
      
      // Then delete the user
      const [deletedUser] = await this.db.delete(users)
        .where(eq(users.id, userId))
        .returning();
      
      if (!deletedUser) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      this.logger.info(`User ${deletedUser.email} deleted successfully`);
      return deletedUser;
    } catch (error) {
      this.logger.error(`Failed to delete user with ID ${userId}:`, error);
      throw error;
    }
  }


  /**
   * Verify a user's password
   * @param password Plain text password
   * @param hashedPassword Hashed password from the database
   * @returns True if password matches, false otherwise
   */
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Assign roles to a user
   * @param userId User ID
   * @param roleIds Role IDs to assign
   */
  async assignRolesToUser(userId: string, roleIds: string[]) {
    try {
      this.logger.debug(`Assigning roles to user with ID: ${userId}`);
      
      // Validate that user exists
      const user = await this.findUserById(userId);
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      // Validate that roles exist
      for (const roleId of roleIds) {
        const [role] = await this.db.select()
          .from(roles)
          .where(eq(roles.id, roleId))
          .limit(1);
        
        if (!role) {
          throw new Error(`Role with ID ${roleId} not found`);
        }
      }
      
      // Delete existing role assignments
      await this.db.delete(userRoles).where(eq(userRoles.user_id, userId));
      
      // Create new role assignments
      if (roleIds.length > 0) {
        const values = roleIds.map(roleId => ({
          id: uuidv4(),
          user_id: userId,
          role_id: roleId,
          assigned_at: new Date(),
          assigned_by: userId // Using the same user ID as assigned_by for simplicity
        }));
        
        await this.db.insert(userRoles).values(values);
      }
      
      this.logger.info(`Roles assigned to user ${userId} successfully`);
    } catch (error) {
      this.logger.error(`Failed to assign roles to user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Get roles assigned to a user
   * @param userId User ID
   * @returns Array of role records
   */
  async getUserRoles(userId: string) {
    try {
      this.logger.debug(`Getting roles for user with ID: ${userId}`);
      
      // Query for the user roles
      const userRolesResult = await this.db.select({
        role: roles
      }).from(userRoles)
        .leftJoin(roles, eq(userRoles.role_id, roles.id))
        .where(eq(userRoles.user_id, userId));
      
      return userRolesResult.map(item => item.role);
    } catch (error) {
      this.logger.error(`Failed to get roles for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Check if a user has a specific role
   * @param userId User ID
   * @param roleId Role ID or code to check
   * @returns True if user has the role, false otherwise
   */
  async userHasRole(userId: string, roleIdOrCode: string): Promise<boolean> {
    try {
      this.logger.debug(`Checking if user ${userId} has role ${roleIdOrCode}`);
      
      // First try to match by role ID
      const userRoleRecord = await this.db.select()
        .from(userRoles)
        .where(and(
          eq(userRoles.user_id, userId),
          eq(userRoles.role_id, roleIdOrCode)
        ))
        .limit(1);
      
      if (userRoleRecord.length > 0) {
        return true;
      }
      
      // Since there's no 'code' field in the roles table, we can only match by ID
      // If you need to match by name, uncomment the code below
      
      /* 
      // If not found, try to match by role name
      const [role] = await this.db.select()
        .from(roles)
        .where(eq(roles.name, roleIdOrCode))
        .limit(1);
      
      if (role) {
        const userRoleByName = await this.db.select()
          .from(userRoles)
          .where(and(
            eq(userRoles.user_id, userId),
            eq(userRoles.role_id, role.id)
          ))
          .limit(1);
        
        return userRoleByName.length > 0;
      }
      */
      
      return false;
    } catch (error) {
      this.logger.error(`Failed to check if user ${userId} has role ${roleIdOrCode}:`, error);
      throw error;
    }
  }

  /**
   * Change a user's password
   * @param userId User ID
   * @param newPassword New password
   * @returns Updated user
   */
  async changePassword(userId: string, newPassword: string) {
    try {
      this.logger.debug(`Changing password for user with ID: ${userId}`);
      
      const hashedPassword = await this.hashPassword(newPassword);
      
      const [updatedUser] = await this.db.update(users)
        .set({ 
          password: hashedPassword, 
          updated_at: new Date() 
        })
        .where(eq(users.id, userId))
        .returning();
      
      if (!updatedUser) {
        throw new Error(`User with ID ${userId} not found`);
      }
      
      this.logger.info(`Password changed successfully for user ${updatedUser.email}`);
      return updatedUser;
    } catch (error) {
      this.logger.error(`Failed to change password for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Hash a password
   * @param password Password to hash
   * @returns Hashed password
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }
}

// Add aggregation function for SQL count
function count() {
  return sql<number>`count(*)`;
}