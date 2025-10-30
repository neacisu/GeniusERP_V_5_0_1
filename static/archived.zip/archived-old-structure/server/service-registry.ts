/**
 * Service Registry
 * 
 * This file provides a registry for application services to simplify
 * dependency injection and service discovery.
 */

/**
 * ServiceRegistry class
 * Stores and retrieves services by name
 */
export class ServiceRegistry {
  private services: Map<string, any>;

  /**
   * Create a new ServiceRegistry
   */
  constructor() {
    this.services = new Map<string, any>();
  }

  /**
   * Register a service
   * @param name Service name
   * @param service Service instance
   */
  registerService<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  /**
   * Get a service by name
   * @param name Service name
   * @returns Service instance or undefined if not found
   */
  getService<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service "${name}" not found in registry`);
    }
    return service as T;
  }

  /**
   * Check if a service exists
   * @param name Service name
   * @returns True if service exists, false otherwise
   */
  hasService(name: string): boolean {
    return this.services.has(name);
  }
}