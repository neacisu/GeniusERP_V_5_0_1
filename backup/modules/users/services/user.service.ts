import { IStorage } from "../../../storage";
import { User, InsertUser, Role, Permission } from "@shared/schema";
import { authService } from "../../auth/services/auth.service";

export class UserService {
  constructor(private storage: IStorage) {}
  
  // User Management
  async getUsers(): Promise<User[]> {
    return this.storage.getUsers();
  }
  
  async getUser(id: string): Promise<User | undefined> {
    return this.storage.getUser(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.storage.getUserByUsername(username);
  }
  
  async createUser(userData: InsertUser): Promise<User> {
    // Hash the password before creating the user
    const hashedPassword = await authService.hashPassword(userData.password);
    
    return this.storage.createUser({
      ...userData,
      password: hashedPassword
    });
  }
  
  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User> {
    // If password is being updated, hash it first
    if (userData.password) {
      userData.password = await authService.hashPassword(userData.password);
    }
    
    return this.storage.updateUser(id, userData);
  }
  
  // Role Management
  async getRoles(companyId?: string): Promise<Role[]> {
    return this.storage.getRoles(companyId);
  }
  
  async getRole(id: string): Promise<Role | undefined> {
    return this.storage.getRole(id);
  }
  
  async getRoleByName(name: string, companyId: string): Promise<Role | undefined> {
    return this.storage.getRoleByName(name, companyId);
  }
  
  // User-Role Management
  async getUserRoles(userId: string): Promise<Role[]> {
    return this.storage.getUserRoles(userId);
  }
  
  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    return this.storage.assignRoleToUser(userId, roleId);
  }
  
  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    return this.storage.removeRoleFromUser(userId, roleId);
  }
  
  // Permission Management
  async getPermissions(): Promise<Permission[]> {
    return this.storage.getPermissions();
  }
  
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    return this.storage.getRolePermissions(roleId);
  }
}