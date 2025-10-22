/**
 * Authentication modes supported by the AuthGuard
 * This enum provides a standardized way to specify different authentication behaviors
 */
export enum JwtAuthMode {
  /**
   * JWT authentication is required
   * Request will be rejected if no valid token is provided
   */
  REQUIRED = 'required',
  
  /**
   * JWT authentication is optional
   * Request will proceed even if no token is provided, but token will be validated if present
   */
  OPTIONAL = 'optional',
  
  /**
   * No JWT authentication is performed
   * This is equivalent to a public endpoint
   */
  NONE = 'none'
}