/**
 * Collaboration Module Controllers Index
 * 
 * This file exports all controllers with a standardized approach.
 * - Class controllers are exported directly for use in modern code
 * - Factory function creators are exported for legacy compatibility
 */

// Export class-based controllers for direct use
export { TaskController } from './task.controller';
export { NoteController } from './note.controller';
export { ThreadController } from './thread.controller';
export { MessageController } from './message.controller';
export { WatcherController } from './watcher.controller';
export { CommunityController } from './community.controller';
export { ActivityController } from './activity.controller';
export { NotificationController } from './notification.controller';

// Export factory functions for legacy code
export { createNoteController } from './note.controller';
export { createThreadController } from './thread.controller';
export { createMessageController } from './message.controller';
export { createWatcherController } from './watcher.controller';
export { createTaskController, createModernTaskController } from './task.controller';
export { createCommunityController } from './community.controller';
export type { LegacyTaskController } from './task.controller';