/**
 * JWT Service
 * 
 * This service handles JWT token generation and verification.
 */

import jwt, { Secret } from 'jsonwebtoken';
import { JwtUserData } from '../../../../shared/types';
import { JWT_SECRET } from './auth.service';

// Default expiration time (1 hour)
const DEFAULT_EXPIRATION = '1h';

export class JwtService {
  private readonly secret: Secret;
  private readonly refreshSecret: Secret;

  constructor() {
    // Use the JWT_SECRET from auth.service to ensure consistency throughout the app
    // JWT_SECRET is guaranteed to be a string as we throw an error in auth.service if not set
    this.secret = JWT_SECRET as Secret;
    
    // Get refresh secret from environment, but require it in production
    const refreshSecretEnv = process.env.JWT_REFRESH_SECRET;
    if (!refreshSecretEnv) {
      if (process.env.NODE_ENV === 'production') {
        console.error('[JwtService] ERROR: JWT_REFRESH_SECRET is not set in production environment');
        throw new Error('JWT_REFRESH_SECRET environment variable is required in production');
      } else {
        this.refreshSecret = 'dev-refresh-secret-key' as Secret;
        console.warn('[JwtService] WARNING: Using default refresh secret in development environment');
      }
    } else {
      this.refreshSecret = refreshSecretEnv as Secret;
    }
  }

  /**
   * Generate a JWT token
   * @param payload User data to include in the token
   * @param expiresIn Token expiration time
   * @returns JWT token
   */
  generateToken(payload: JwtUserData, expiresIn = DEFAULT_EXPIRATION): string {
    // Note: We need to use type assertion here because @types/jsonwebtoken has overly strict typing
    // for expiresIn, but the actual library accepts string values like '1h', '7d', etc.
    return jwt.sign(payload, this.secret, { expiresIn } as jwt.SignOptions);
  }

  /**
   * Generate a refresh token
   * @param userId User ID to include in the token
   * @param expiresIn Token expiration time
   * @returns Refresh token
   */
  generateRefreshToken(userId: string, expiresIn = '7d'): string {
    // Note: We need to use type assertion here because @types/jsonwebtoken has overly strict typing
    // for expiresIn, but the actual library accepts string values like '1h', '7d', etc.
    return jwt.sign({ id: userId }, this.refreshSecret, { expiresIn } as jwt.SignOptions);
  }

  /**
   * Verify a JWT token
   * @param token JWT token to verify
   * @returns Decoded token payload or null if invalid
   */
  async verifyToken(token: string): Promise<JwtUserData | null> {
    try {
      // Check blacklist first
      if (await this.isBlacklisted(token)) {
        throw new Error('Token has been revoked');
      }

      const decoded = jwt.verify(token, this.secret) as JwtUserData;

      // Additional validations
      if (!decoded.id || !decoded.roles) {
        throw new Error('Invalid token payload');
      }

      return decoded;
    } catch (error) {
      console.error('JWT verification error:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  /**
   * Verify a refresh token
   * @param token Refresh token to verify
   * @returns User ID from token or null if invalid
   */
  verifyRefreshToken(token: string): { id: string } | null {
    try {
      return jwt.verify(token, this.refreshSecret) as { id: string };
    } catch (error) {
      console.error('Refresh token verification error:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  /**
   * Blacklist a token
   */
  async blacklistToken(token: string): Promise<void> {
    // Store in Redis with expiry matching token
    const decoded = jwt.decode(token) as jwt.JwtPayload | null;
    if (decoded?.exp) {
      const _ttl = decoded.exp - Math.floor(Date.now() / 1000);
      // Uncomment and implement Redis integration when needed
      // await redis.setex(`blacklist:${token}`, _ttl, '1');
      // Token would be blacklisted for ${_ttl} seconds
    }
  }

  /**
   * Check if token is blacklisted
   */
  async isBlacklisted(_token: string): Promise<boolean> {
    // Uncomment and implement Redis integration when needed
    // return !!(await redis.get(`blacklist:${_token}`));
    return false; // Placeholder, always returns false until Redis is implemented
  }
}

// Create a singleton instance
const jwtService = new JwtService();

// Export the instance as default
export default jwtService;