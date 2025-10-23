import jwt, { SignOptions, Secret } from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User as SelectUser } from "../../../shared/src/schema";
import { JwtPayload } from "../../../shared/src/types";
import { storage } from "../../../../apps/api/src/storage";
import { DrizzleService, getDrizzle } from "@common/drizzle";
import { users } from "../../../shared/src/schema";
import { eq } from "drizzle-orm";
import { log } from "../../../../apps/api/src/vite";

// JWT Settings
// Pentru mediul de dezvoltare, folosim o valoare prestabilită dacă JWT_SECRET nu este setat
const isDevelopment = process.env['NODE_ENV'] === 'development' || !process.env['NODE_ENV'];
export const JWT_SECRET: Secret = process.env['JWT_SECRET'] || (isDevelopment ? 'dev_secret_key_for_local_development_only' : '');

if (!JWT_SECRET) {
  console.error('[AuthService] ERROR: JWT_SECRET is not set in environment variables.');
  throw new Error('JWT_SECRET environment variable is required for authentication');
}

export const JWT_EXPIRES_IN: string = process.env['JWT_EXPIRES_IN'] || "24h";

// Log the JWT settings for debugging
log('JWT_SECRET exists and is being used', 'auth-service');
log(`JWT_SECRET masked: ${JWT_SECRET.substring(0, 3)}...${JWT_SECRET.substring(JWT_SECRET.length - 3)}`, 'auth-service');
log(`JWT_EXPIRES_IN: ${JWT_EXPIRES_IN}`, 'auth-service');

export class AuthService {
  private drizzleService: DrizzleService;
  private db: ReturnType<typeof getDrizzle>;

  constructor() {
    this.drizzleService = new DrizzleService();
    // Get the database instance from the drizzle helper
    this.db = getDrizzle();
  }

  /**
   * Hash password using secure bcrypt algorithm
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare a supplied password against a stored hashed password (bcrypt)
   */
  async comparePasswords(supplied: string, stored: string): Promise<boolean> {
    return await bcrypt.compare(supplied, stored);
  }

  /**
   * Generate a JWT token for a user
   */
  generateToken(user: SelectUser): string {
    log(`User object for token: ${JSON.stringify(user)}`, 'auth-service');
    
    // Handle both camelCase and snake_case for companyId - type safe access
    const userWithExtras = user as SelectUser & { 
      companyId?: string | null; 
      company_id?: string | null;
      permissions?: string[];
      franchiseId?: string | null;
    };
    const companyId = userWithExtras.companyId || userWithExtras.company_id;
    
    const payload: JwtPayload = {
      id: user.id,
      userId: user.id, // Alias pentru compatibilitate cu frontend
      username: user.username,
      role: user.role,
      roles: [user.role],
      companyId: companyId ?? null,
      company_id: companyId ?? null, // Pentru compatibilitate snake_case
      permissions: userWithExtras.permissions || [],
      franchiseId: userWithExtras.franchiseId || null,
      email: user.email || undefined,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined
    };
    
    log(`Generated token payload: ${JSON.stringify(payload)}`, 'auth-service');
    
    // Note: Using type assertion for SignOptions because @types/jsonwebtoken has overly strict typing
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as SignOptions);
  }

  /**
   * Get user by username using DrizzleService
   */
  async getUserByUsername(username: string): Promise<SelectUser | null> {
    try {
      log(`Getting user by username: ${username}`, 'auth-service');
      
      // Use the drizzle auth service if available
      if (this.drizzleService.auth) {
        log('Using drizzleService.auth', 'auth-service');
        const user = await this.drizzleService.auth.getUserByUsername(username);
        log(`DrizzleService.auth result: ${JSON.stringify(user, null, 2)}`, 'auth-service');
        return user as unknown as SelectUser;
      }
      
      // Direct database query as fallback
      log('Using direct database query', 'auth-service');
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);
      
      const user = result.length > 0 ? result[0] : null;
      log(`Direct query result: ${JSON.stringify(user, null, 2)}`, 'auth-service');
      return user;
    } catch (error) {
      console.error('Error in getUserByUsername:', error);
      // Fall back to storage for backward compatibility
      log('Falling back to storage', 'auth-service');
      const user = await storage.getUserByUsername(username);
      log(`Storage fallback result: ${JSON.stringify(user, null, 2)}`, 'auth-service');
      return user ?? null;
    }
  }

  /**
   * Get user by ID using DrizzleService
   */
  async getUserById(userId: string): Promise<SelectUser | null> {
    try {
      // Use the drizzle auth service if available
      if (this.drizzleService.auth) {
        return await this.drizzleService.auth.getUserById(userId) as unknown as SelectUser;
      }
      
      // Direct database query as fallback
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error in getUserById:', error);
      // Fall back to storage for backward compatibility
      const storageUser = await storage.getUser(userId);
      return storageUser ?? null;
    }
  }

  /**
   * Register a new user
   */
  async registerUser(userData: {
    username: string;
    password: string;
    email: string;
    firstName: string;
    lastName: string;
    role?: string;
    companyId?: string;
  }) {
    const existingUser = await this.getUserByUsername(userData.username);
    if (existingUser) {
      throw new Error("Numele de utilizator există deja");
    }

    // Continue using storage.createUser for now as it handles complex logic
    // This would need to be migrated to DrizzleService in a separate task
    const user = await storage.createUser({
      ...userData,
      password: await this.hashPassword(userData.password),
    });

    const token = this.generateToken(user);
    return { ...user, token };
  }

  /**
   * Authenticate a user by username and password
   */
  async authenticateUser(username: string, password: string) {
    const user = await this.getUserByUsername(username);
    log(`User retrieved for authentication: ${JSON.stringify(user, null, 2)}`, 'auth-service');
    
    if (!user || !(await this.comparePasswords(password, user.password))) {
      throw new Error("Nume de utilizator sau parolă incorecte");
    }
    
    const token = this.generateToken(user);
    return { ...user, token };
  }

  /**
   * Verify JWT token and return user if valid
   */
  async verifyToken(token: string) {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    const user = await this.getUserById(payload.id);
    
    if (!user) {
      throw new Error("User not found");
    }
    
    // Ensure the user object has the roles array for RBAC
    return {
      ...user,
      roles: [user.role]
    };
  }
}

export const authService = new AuthService();