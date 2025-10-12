/**
 * JWT User Data Type
 * 
 * Represents the user data stored in the JWT token
 * Must match JwtPayload from shared/types.ts for consistency
 */
export interface JwtUserData {
  id: string;
  username: string;  // Added to match JwtPayload
  email: string;
  role: string;      // Primary role - always present
  roles?: string[];  // Array of all roles
  companyId: string;
  franchiseId?: string | null;
  firstName?: string;
  lastName?: string;
  isVerified?: boolean;
}