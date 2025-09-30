import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import { User as SelectUser } from "@shared/schema";
import { JwtPayload } from "@shared/types";
import { storage } from "../../../storage";
import { DrizzleService, getDrizzle } from "../../../common/drizzle";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

// JWT Settings
// Pentru mediul de dezvoltare, folosim o valoare prestabilită dacă JWT_SECRET nu este setat
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
export const JWT_SECRET: string = process.env.JWT_SECRET || (isDevelopment ? 'dev_secret_key_for_local_development_only' : '');

if (!JWT_SECRET) {
  console.error('[AuthService] ERROR: JWT_SECRET is not set in environment variables.');
  throw new Error('JWT_SECRET environment variable is required for authentication');
}

export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

// Log the JWT settings more explicitly for debugging
console.log('[AuthService] JWT_SECRET exists and is being used');
console.log('[AuthService] JWT_SECRET masked:', JWT_SECRET.substring(0, 3) + '...' + JWT_SECRET.substring(JWT_SECRET.length - 3));
console.log('[AuthService] JWT_EXPIRES_IN:', JWT_EXPIRES_IN);

export class AuthService {
  private drizzleService: DrizzleService;
  private db: any; // Using any to bypass type checking for now

  constructor() {
    this.drizzleService = new DrizzleService();
    // Get the database instance from the drizzle helper
    this.db = getDrizzle();
  }

  /**
   * Hash password using secure scrypt algorithm
   */
  async hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  }

  /**
   * Compare a supplied password against a stored hashed password
   */
  async comparePasswords(supplied: string, stored: string) {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  }

  /**
   * Generate a JWT token for a user
   */
  generateToken(user: SelectUser): string {
    console.log('[AuthService] User object for token:', user);
    
    // Handle both camelCase and snake_case for companyId
    const companyId = (user as any).companyId || (user as any).company_id;
    
    const payload: any = {
      id: user.id,
      userId: user.id, // Alias pentru compatibilitate cu frontend
      username: user.username,
      role: user.role,
      roles: [user.role],
      companyId: companyId,
      company_id: companyId, // Pentru compatibilitate snake_case
      permissions: (user as any).permissions || [],
      franchiseId: (user as any).franchiseId || null,
      email: user.email || undefined,
      fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || undefined
    };
    
    console.log('[AuthService] Generated token payload:', payload);
    
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  /**
   * Get user by username using DrizzleService
   */
  async getUserByUsername(username: string) {
    try {
      console.log('[AuthService] Getting user by username:', username);
      
      // Use the drizzle auth service if available
      if (this.drizzleService.auth) {
        console.log('[AuthService] Using drizzleService.auth');
        const user = await this.drizzleService.auth.getUserByUsername(username);
        console.log('[AuthService] DrizzleService.auth result:', JSON.stringify(user, null, 2));
        return user;
      }
      
      // Direct database query as fallback
      console.log('[AuthService] Using direct database query');
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);
      
      const user = result.length > 0 ? result[0] : null;
      console.log('[AuthService] Direct query result:', JSON.stringify(user, null, 2));
      return user;
    } catch (error) {
      console.error('Error in getUserByUsername:', error);
      // Fall back to storage for backward compatibility
      console.log('[AuthService] Falling back to storage');
      const user = await storage.getUserByUsername(username);
      console.log('[AuthService] Storage fallback result:', JSON.stringify(user, null, 2));
      return user;
    }
  }

  /**
   * Get user by ID using DrizzleService
   */
  async getUserById(userId: string) {
    try {
      // Use the drizzle auth service if available
      if (this.drizzleService.auth) {
        return await this.drizzleService.auth.getUserById(userId);
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
      return storage.getUser(userId);
    }
  }

  /**
   * Register a new user
   */
  async registerUser(userData: any) {
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
    console.log('[AuthService] User retrieved for authentication:', JSON.stringify(user, null, 2));
    
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