import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import { User as SelectUser } from "@shared/schema";
import { JwtPayload } from "@shared/types";
import { storage } from "../../../storage";

const scryptAsync = promisify(scrypt);

// JWT Settings
export const JWT_SECRET = process.env.JWT_SECRET || "geniuserp_auth_jwt_secret";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";

// Log the JWT settings
console.log('[AuthService] JWT_SECRET:', JWT_SECRET.substring(0, 3) + '...' + JWT_SECRET.substring(JWT_SECRET.length - 3));
console.log('[AuthService] JWT_EXPIRES_IN:', JWT_EXPIRES_IN);

export class AuthService {
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
    const payload: JwtPayload = {
      id: user.id,
      username: user.username,
      role: user.role,
      roles: [user.role], // Add roles array for RBAC middleware
      companyId: user.companyId || null
    };
    
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  /**
   * Register a new user
   */
  async registerUser(userData: any) {
    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      throw new Error("Numele de utilizator există deja");
    }

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
    const user = await storage.getUserByUsername(username);
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
    const user = await storage.getUser(payload.id);
    
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