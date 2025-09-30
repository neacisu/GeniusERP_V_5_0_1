/**
 * JWT User Data Type
 * 
 * Represents the user data stored in the JWT token
 */
export interface JwtUserData {
  id: string;
  email: string;
  companyId: string;
  roles?: string[];
  franchiseId?: string | null;
  firstName?: string;
  lastName?: string;
  isVerified?: boolean;
}