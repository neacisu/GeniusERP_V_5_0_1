
import { UserRole } from '../types';

export class RBACUtils {
  static hasPermission(userRoles: UserRole[], requiredRoles: UserRole[]): boolean {
    if (userRoles.includes(UserRole.ADMIN)) return true;
    return requiredRoles.some(role => userRoles.includes(role));
  }

  static validateAccess(userRoles: UserRole[], requiredRoles: UserRole[]): void {
    if (!this.hasPermission(userRoles, requiredRoles)) {
      throw new Error('Insufficient permissions');
    }
  }
}
