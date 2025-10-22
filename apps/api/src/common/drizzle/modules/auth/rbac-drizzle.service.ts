/**
 * RBAC Drizzle Service
 * 
 * Main service for role-based access control operations
 * that aggregates the specialized RBAC services.
 */

import { Logger } from '../../../../common/logger';
import { BaseDrizzleService } from '../core/base-drizzle.service';
import { RoleQueryService } from './roles/role-query.service';
import { RoleMutationService } from './roles/role-mutation.service';
import { UserRoleService } from './roles/user-role.service';
import { PermissionQueryService } from './permissions/permission-query.service';
import { PermissionMutationService } from './permissions/permission-mutation.service';
import { RolePermissionService } from './permissions/role-permission.service';

// Create a logger for the main RBAC service
const logger = new Logger('RbacDrizzleService');

/**
 * Service that provides a unified interface for role-based access control operations
 */
export class RbacDrizzleService extends BaseDrizzleService {
  private roleQueryService: RoleQueryService;
  private roleMutationService: RoleMutationService;
  private userRoleService: UserRoleService;
  private permissionQueryService: PermissionQueryService;
  private permissionMutationService: PermissionMutationService;
  private rolePermissionService: RolePermissionService;
  
  constructor() {
    super();
    this.roleQueryService = new RoleQueryService();
    this.roleMutationService = new RoleMutationService();
    this.userRoleService = new UserRoleService();
    this.permissionQueryService = new PermissionQueryService();
    this.permissionMutationService = new PermissionMutationService();
    this.rolePermissionService = new RolePermissionService();
  }
  
  /**
   * Get all roles, optionally filtered by company ID
   * 
   * @param companyId Optional company ID filter
   * @returns Array of roles
   */
  async getRoles(companyId?: string): Promise<any[]> {
    const context = 'getRoles';
    try {
      logger.debug(`[${context}] Delegating to RoleQueryService`);
      return await this.roleQueryService.getRoles(companyId);
    } catch (error: any) {
      logger.error(`[${context}] Error in RbacDrizzleService wrapper`, error);
      throw error;
    }
  }
  
  /**
   * Get a role by ID
   * 
   * @param roleId Role ID
   * @returns Role object or null if not found
   */
  async getRoleById(roleId: string): Promise<any | null> {
    const context = 'getRoleById';
    try {
      logger.debug(`[${context}] Delegating to RoleQueryService`);
      return await this.roleQueryService.getRoleById(roleId);
    } catch (error: any) {
      logger.error(`[${context}] Error in RbacDrizzleService wrapper`, error);
      throw error;
    }
  }
  
  /**
   * Get a role by name and company ID
   * 
   * @param name Role name
   * @param companyId Company ID
   * @returns Role object or null if not found
   */
  async getRoleByName(name: string, companyId: string): Promise<any | null> {
    const context = 'getRoleByName';
    try {
      logger.debug(`[${context}] Delegating to RoleQueryService`);
      return await this.roleQueryService.getRoleByName(name, companyId);
    } catch (error: any) {
      logger.error(`[${context}] Error in RbacDrizzleService wrapper`, error);
      throw error;
    }
  }
  
  /**
   * Create a new role
   * 
   * @param roleData Role data
   * @returns Created role
   */
  async createRole(roleData: any): Promise<any> {
    const context = 'createRole';
    try {
      logger.debug(`[${context}] Delegating to RoleMutationService`);
      return await this.roleMutationService.createRole(roleData);
    } catch (error: any) {
      logger.error(`[${context}] Error in RbacDrizzleService wrapper`, error);
      throw error;
    }
  }
  
  /**
   * Get all permissions
   * 
   * @returns Array of permissions
   */
  async getPermissions(): Promise<any[]> {
    const context = 'getPermissions';
    try {
      logger.debug(`[${context}] Delegating to PermissionQueryService`);
      return await this.permissionQueryService.getPermissions();
    } catch (error: any) {
      logger.error(`[${context}] Error in RbacDrizzleService wrapper`, error);
      throw error;
    }
  }
  
  /**
   * Get permission by ID
   * 
   * @param permissionId Permission ID
   * @returns Permission object or null if not found
   */
  async getPermissionById(permissionId: string): Promise<any | null> {
    const context = 'getPermissionById';
    try {
      logger.debug(`[${context}] Delegating to PermissionQueryService`);
      return await this.permissionQueryService.getPermissionById(permissionId);
    } catch (error: any) {
      logger.error(`[${context}] Error in RbacDrizzleService wrapper`, error);
      throw error;
    }
  }
  
  /**
   * Get all roles assigned to a user
   * 
   * @param userId User ID
   * @returns Array of roles
   */
  async getUserRoles(userId: string): Promise<any[]> {
    const context = 'getUserRoles';
    try {
      logger.debug(`[${context}] Delegating to RoleQueryService`);
      return await this.roleQueryService.getUserRoles(userId);
    } catch (error: any) {
      logger.error(`[${context}] Error in RbacDrizzleService wrapper`, error);
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
    const context = 'assignRoleToUser';
    try {
      logger.debug(`[${context}] Delegating to UserRoleService`);
      return await this.userRoleService.assignRoleToUser(userId, roleId);
    } catch (error: any) {
      logger.error(`[${context}] Error in RbacDrizzleService wrapper`, error);
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
    const context = 'removeRoleFromUser';
    try {
      logger.debug(`[${context}] Delegating to UserRoleService`);
      return await this.userRoleService.removeRoleFromUser(userId, roleId);
    } catch (error: any) {
      logger.error(`[${context}] Error in RbacDrizzleService wrapper`, error);
      throw error;
    }
  }
  
  /**
   * Get all permissions assigned to a role
   * 
   * @param roleId Role ID
   * @returns Array of permissions
   */
  async getRolePermissions(roleId: string): Promise<any[]> {
    const context = 'getRolePermissions';
    try {
      logger.debug(`[${context}] Delegating to RolePermissionService`);
      return await this.rolePermissionService.getRolePermissions(roleId);
    } catch (error: any) {
      logger.error(`[${context}] Error in RbacDrizzleService wrapper`, error);
      throw error;
    }
  }
  
  /**
   * Assign a permission to a role
   * 
   * @param roleId Role ID
   * @param permissionId Permission ID
   */
  async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    const context = 'assignPermissionToRole';
    try {
      logger.debug(`[${context}] Delegating to RolePermissionService`);
      return await this.rolePermissionService.assignPermissionToRole(roleId, permissionId);
    } catch (error: any) {
      logger.error(`[${context}] Error in RbacDrizzleService wrapper`, error);
      throw error;
    }
  }
  
  /**
   * Remove a permission from a role
   * 
   * @param roleId Role ID
   * @param permissionId Permission ID
   */
  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    const context = 'removePermissionFromRole';
    try {
      logger.debug(`[${context}] Delegating to RolePermissionService`);
      return await this.rolePermissionService.removePermissionFromRole(roleId, permissionId);
    } catch (error: any) {
      logger.error(`[${context}] Error in RbacDrizzleService wrapper`, error);
      throw error;
    }
  }
  
  /**
   * Check if a user has a specific permission
   * 
   * @param userId User ID
   * @param resource Resource name
   * @param action Action name (read, write, etc.)
   * @returns Boolean indicating whether the user has the permission
   */
  async hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const context = 'hasPermission';
    try {
      logger.debug(`[${context}] Delegating to RolePermissionService`);
      return await this.rolePermissionService.hasPermission(userId, resource, action);
    } catch (error: any) {
      logger.error(`[${context}] Error in RbacDrizzleService wrapper`, error);
      // Default to false on error for security
      return false;
    }
  }
}