/**
 * Reflector Implementation
 * 
 * This is a simplified implementation of NestJS's Reflector class for use in Express applications.
 * It allows storing and retrieving metadata for Express routes, enabling features like role-based
 * access control via decorators.
 */

export class Reflector {
  private metadata: Map<string, any> = new Map();

  /**
   * Get metadata for a given key
   * 
   * This method is overridden by the RolesGuard when used in Express routes
   * to provide dynamic access to metadata.
   * 
   * @param metadataKey The metadata key to retrieve
   * @param target The target object or function
   */
  public get<T = any>(metadataKey: string, target: object | Function): T {
    // This implementation will be overridden in actual use
    // to provide the roles for the current route
    return this.metadata.get(metadataKey) as T;
  }

  /**
   * Set metadata for a given key and target
   * 
   * @param metadataKey The metadata key
   * @param metadataValue The metadata value
   * @param target The target object or function
   */
  public set<T = any>(metadataKey: string, metadataValue: T, target: object | Function): void {
    const key = this.getKeyForTarget(target, metadataKey);
    this.metadata.set(key, metadataValue);
  }

  /**
   * Generate a unique key for the target and metadata key
   */
  private getKeyForTarget(target: object | Function, metadataKey: string): string {
    const targetId = target.constructor?.name || (target as Function).name || 'unknown';
    return `${targetId}_${metadataKey}`;
  }
}