/**
 * Application Error Class
 * 
 * Custom error class for consistent error handling across the application.
 */

export class AppError extends Error {
  code: string;
  status: number;
  details?: any;

  constructor(code: string, message: string, status: number = 500, details?: any) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
    
    // Set the prototype explicitly for better error handling with instanceof
    Object.setPrototypeOf(this, AppError.prototype);
  }
}