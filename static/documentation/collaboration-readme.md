# Collaboration Module

The Collaboration Module provides comprehensive functionality for internal task management, team collaboration, and tracking activities within the GeniusERP application.

## Overview

The collaboration module focuses on managing tasks, notes, discussion threads, and messages with a robust internal communication system. It allows teams to:

- Create, assign, and track tasks with priorities and statuses
- Add notes to tasks for additional context
- Maintain threaded discussions on various topics
- Enable users to "watch" tasks and receive notifications about changes
- Maintain a complete history of task status changes and assignments

## Components

### 1. Tasks

Core task management capability with:
- Task status tracking (pending, in-progress, completed, blocked, etc.)
- Priority levels (low, medium, high, critical)
- Assignment tracking with history
- Due dates and reminders
- Attachment support
- Related task linking
- Watch capability for notification subscriptions

### 2. Notes

Note-taking functionality providing:
- Task-specific notes
- Rich text content
- Edit history
- User attribution for authorship and edits

### 3. Threads & Messages

Communication features including:
- Discussion threads with titles, tags, and categories
- Messages within threads
- Reply functionality
- Message editing with history
- @mentions for user notifications
- Search capabilities

### 4. Watchers

Task subscription system allowing:
- Users to "watch" specific tasks
- Configurable notification preferences
- Multiple watchers per task
- Automated notifications when task details change

## API Endpoints

The module exposes several RESTful API endpoints:

### Tasks
- `GET /api/collaboration/tasks` - List tasks with filtering
- `GET /api/collaboration/tasks/:id` - Get a specific task
- `POST /api/collaboration/tasks` - Create a task
- `PATCH /api/collaboration/tasks/:id` - Update a task
- `DELETE /api/collaboration/tasks/:id` - Delete a task

### Notes
- `GET /api/collaboration/notes` - List notes with filtering
- `GET /api/collaboration/notes/:id` - Get a specific note
- `POST /api/collaboration/notes` - Create a note
- `PATCH /api/collaboration/notes/:id` - Update a note
- `DELETE /api/collaboration/notes/:id` - Delete a note

### Threads
- `GET /api/collaboration/threads` - List threads with filtering
- `GET /api/collaboration/threads/:id` - Get a specific thread
- `POST /api/collaboration/threads` - Create a thread
- `PATCH /api/collaboration/threads/:id` - Update a thread
- `DELETE /api/collaboration/threads/:id` - Delete a thread

### Messages
- `GET /api/collaboration/messages` - List messages with filtering
- `GET /api/collaboration/messages/:id` - Get a specific message
- `GET /api/collaboration/messages/:id/replies` - Get replies to a message
- `POST /api/collaboration/messages` - Create a message
- `PATCH /api/collaboration/messages/:id` - Update a message
- `DELETE /api/collaboration/messages/:id` - Delete a message

### Watchers
- `GET /api/collaboration/watchers` - List watchers for a task
- `GET /api/collaboration/watchers/watched-tasks` - Get tasks watched by current user
- `GET /api/collaboration/watchers/:taskId/is-watching` - Check if user is watching a task
- `POST /api/collaboration/watchers` - Add current user as watcher
- `POST /api/collaboration/watchers/add-user` - Add another user as watcher
- `PATCH /api/collaboration/watchers/:taskId` - Update notification preferences
- `DELETE /api/collaboration/watchers/:taskId` - Remove user as watcher
- `DELETE /api/collaboration/watchers/:taskId/users/:userId` - Remove specific user as watcher

## Database Schema

The module uses the following Drizzle ORM tables:

- `collaboration_tasks`: Stores task data
- `collaboration_notes`: Contains notes linked to tasks
- `collaboration_threads`: Manages discussion topics
- `collaboration_messages`: Holds messages in threads
- `collaboration_task_assignments`: Tracks task assignments
- `collaboration_task_status_history`: Records status changes
- `collaboration_task_watchers`: Manages task watchers

## Integration with Other Modules

The Collaboration module is designed to integrate seamlessly with:

- **Auth Module**: For user authentication and permission validation
- **Audit Module**: For comprehensive activity logging
- **CRM Module**: To link tasks with customer activities
- **Document Module**: For attaching documents to tasks
- **BPM Module**: For process-driven task creation and management
- **Communications Module**: For unified communication capabilities

## Security

All endpoints implement:
- Authentication requirement via `requireAuth()` middleware
- Company access validation via `requireCompanyAccess()` middleware
- Input validation using Zod schemas
- Proper error handling and user-friendly messages

## Usage Example

```typescript
// Initialize the module
const collabModule = CollabModule.getInstance();
collabModule.initialize(db);
collabModule.registerRoutes(app);
collabModule.start();

// The module is now available through API endpoints
// e.g., /api/collaboration/tasks, /api/collaboration/notes, etc.
```