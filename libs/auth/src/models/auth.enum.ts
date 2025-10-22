/**
 * Authentication modes for JWT auth system
 */
export enum JwtAuthMode {
  /**
   * Requires a valid JWT token for access
   */
  REQUIRED = 'required',
  
  /**
   * Populates req.user if token exists but doesn't require authentication
   */
  OPTIONAL = 'optional'
}