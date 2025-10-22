/**
 * Communications Module Controllers Index
 * 
 * This file exports all controllers with a standardized approach.
 * - Class controllers are exported directly for use in modern code
 * - Factory function creators are exported for legacy compatibility
 */

// Export class-based controllers for direct use
export { MessagesController } from './messages.controller';

// Export factory functions for legacy code
export { createMessagesController } from './messages.controller';