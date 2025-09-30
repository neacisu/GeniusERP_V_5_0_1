/**
 * Task Service
 * 
 * Service for managing collaboration tasks, assignments, and status tracking.
 */

import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, desc, gte, lte, inArray, isNull, asc } from 'drizzle-orm';
import { 
  collaborationTasks,
  taskAssignmentHistory,
  taskStatusHistory,
  taskWatchers,
  NewCollaborationTask,
  CollaborationTask,
  TaskStatus
} from '../../../../shared/schema/collaboration.schema';
import { randomUUID } from 'crypto';
import { Logger } from '../../../common/logger';

// Create a logger instance for the task service
const logger = new Logger('TaskService');

/**
 * Task Service Class
 * 
 * Manages the lifecycle of collaboration tasks including creation, assignment,
 * status changes, and tracking.
 */
export class TaskService {
  /**
   * Constructor
   * 
   * @param db Drizzle database instance
   */
  constructor(private db: PostgresJsDatabase<any>) {}
  
  /**
   * Create a new task
   * 
   * @param task Task data
   * @param userId User ID creating the task
   * @returns Created task
   */
  async createTask(task: NewCollaborationTask, userId: string): Promise<CollaborationTask> {
    const taskId = task.id || randomUUID();
    const now = new Date();
    
    try {
      // Create the task
      const createdTask = await this.db.insert(collaborationTasks)
        .values({
          ...task,
          id: taskId,
          createdBy: userId,
          updatedBy: userId,
          createdAt: now,
          updatedAt: now
        })
        .returning();
      
      if (createdTask.length === 0) {
        throw new Error('Failed to create task');
      }
      
      // Log initial assignment to assignment history
      await this.db.insert(taskAssignmentHistory)
        .values({
          id: randomUUID(),
          taskId: taskId,
          companyId: task.companyId,
          assignedTo: task.assignedTo,
          assignedBy: userId,
          comments: 'Initial task assignment',
          createdAt: now
        });
      
      // Log initial status to status history
      await this.db.insert(taskStatusHistory)
        .values({
          id: randomUUID(),
          taskId: taskId,
          companyId: task.companyId,
          status: task.status || TaskStatus.PENDING,
          changedBy: userId,
          comments: 'Task created',
          createdAt: now
        });
      
      // Add creator as a watcher
      await this.db.insert(taskWatchers)
        .values({
          id: randomUUID(),
          taskId: taskId,
          companyId: task.companyId,
          userId: userId,
          notificationPreference: { enabled: true, mode: 'all' },
          createdAt: now
        });
      
      return createdTask[0];
    } catch (error) {
      logger.error('Error creating task', { error, taskData: task });
      throw error;
    }
  }
  
  /**
   * Get a task by ID
   * 
   * @param taskId Task ID
   * @param companyId Company ID
   * @returns Task or null if not found
   */
  async getTaskById(taskId: string, companyId: string): Promise<CollaborationTask | null> {
    try {
      const tasks = await this.db.select()
        .from(collaborationTasks)
        .where(and(
          eq(collaborationTasks.id, taskId),
          eq(collaborationTasks.companyId, companyId)
        ));
      
      return tasks.length > 0 ? tasks[0] : null;
    } catch (error) {
      logger.error('Error fetching task by ID', { error, taskId, companyId });
      throw error;
    }
  }
  
  /**
   * Get all tasks for a company
   * 
   * @param companyId Company ID
   * @param options Query options (limit, offset, sort, filter)
   * @returns List of tasks
   */
  async getTasks(companyId: string, options: {
    limit?: number;
    offset?: number;
    status?: TaskStatus[];
    assignedTo?: string;
    priority?: string[];
    dueStart?: Date;
    dueEnd?: Date;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<{ tasks: CollaborationTask[]; total: number }> {
    try {
      const {
        limit = 20,
        offset = 0,
        status,
        assignedTo,
        priority,
        dueStart,
        dueEnd,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;
      
      // Build query conditions
      let query = this.db.select()
        .from(collaborationTasks)
        .where(eq(collaborationTasks.companyId, companyId));
      
      // Apply filters
      if (status && status.length > 0) {
        query = query.where(inArray(collaborationTasks.status, status));
      }
      
      if (assignedTo) {
        query = query.where(eq(collaborationTasks.assignedTo, assignedTo));
      }
      
      if (priority && priority.length > 0) {
        query = query.where(inArray(collaborationTasks.priority, priority));
      }
      
      if (dueStart) {
        query = query.where(gte(collaborationTasks.dueDate, dueStart));
      }
      
      if (dueEnd) {
        query = query.where(lte(collaborationTasks.dueDate, dueEnd));
      }
      
      // Count total matching records
      const totalQuery = this.db.select({ count: this.db.fn.count() })
        .from(collaborationTasks)
        .where(eq(collaborationTasks.companyId, companyId));
      
      // Apply sorting
      if (sortOrder === 'asc') {
        query = query.orderBy(asc(collaborationTasks[sortBy]));
      } else {
        query = query.orderBy(desc(collaborationTasks[sortBy]));
      }
      
      // Apply pagination
      query = query.limit(limit).offset(offset);
      
      // Execute queries
      const [tasks, totalResult] = await Promise.all([
        query,
        totalQuery
      ]);
      
      const total = Number(totalResult[0]?.count || 0);
      
      return { tasks, total };
    } catch (error) {
      logger.error('Error fetching tasks', { error, companyId, options });
      throw error;
    }
  }
  
  /**
   * Update a task
   * 
   * @param taskId Task ID
   * @param companyId Company ID
   * @param updates Task updates
   * @param userId User ID making the update
   * @returns Updated task
   */
  async updateTask(
    taskId: string,
    companyId: string,
    updates: Partial<NewCollaborationTask>,
    userId: string
  ): Promise<CollaborationTask> {
    try {
      // Get current task
      const currentTask = await this.getTaskById(taskId, companyId);
      
      if (!currentTask) {
        throw new Error(`Task not found: ${taskId}`);
      }
      
      // Track status change if status is being updated
      if (updates.status && updates.status !== currentTask.status) {
        await this.db.insert(taskStatusHistory)
          .values({
            id: randomUUID(),
            taskId,
            companyId,
            status: updates.status,
            previousStatus: currentTask.status,
            changedBy: userId,
            comments: updates.status === TaskStatus.COMPLETED ? 'Task completed' : `Status changed to ${updates.status}`,
            createdAt: new Date()
          });
      }
      
      // Track assignment change if assignedTo is being updated
      if (updates.assignedTo && updates.assignedTo !== currentTask.assignedTo) {
        await this.db.insert(taskAssignmentHistory)
          .values({
            id: randomUUID(),
            taskId,
            companyId,
            assignedTo: updates.assignedTo,
            assignedBy: userId,
            assignedFrom: currentTask.assignedTo,
            createdAt: new Date()
          });
      }
      
      // Update the task
      const updatedTasks = await this.db.update(collaborationTasks)
        .set({
          ...updates,
          updatedAt: new Date(),
          updatedBy: userId
        })
        .where(and(
          eq(collaborationTasks.id, taskId),
          eq(collaborationTasks.companyId, companyId)
        ))
        .returning();
      
      if (updatedTasks.length === 0) {
        throw new Error(`Failed to update task: ${taskId}`);
      }
      
      return updatedTasks[0];
    } catch (error) {
      logger.error('Error updating task', { error, taskId, companyId, updates });
      throw error;
    }
  }
  
  /**
   * Delete a task
   * 
   * @param taskId Task ID
   * @param companyId Company ID
   * @returns True if deleted
   */
  async deleteTask(taskId: string, companyId: string): Promise<boolean> {
    try {
      // Delete related records first (cascading must be handled manually)
      await Promise.all([
        this.db.delete(taskAssignmentHistory).where(and(
          eq(taskAssignmentHistory.taskId, taskId),
          eq(taskAssignmentHistory.companyId, companyId)
        )),
        this.db.delete(taskStatusHistory).where(and(
          eq(taskStatusHistory.taskId, taskId),
          eq(taskStatusHistory.companyId, companyId)
        )),
        this.db.delete(taskWatchers).where(and(
          eq(taskWatchers.taskId, taskId),
          eq(taskWatchers.companyId, companyId)
        ))
      ]);
      
      // Delete the task
      const result = await this.db.delete(collaborationTasks)
        .where(and(
          eq(collaborationTasks.id, taskId),
          eq(collaborationTasks.companyId, companyId)
        ))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      logger.error('Error deleting task', { error, taskId, companyId });
      throw error;
    }
  }
  
  /**
   * Get task assignment history
   * 
   * @param taskId Task ID
   * @param companyId Company ID
   * @returns Assignment history entries
   */
  async getTaskAssignmentHistory(taskId: string, companyId: string) {
    try {
      return await this.db.select()
        .from(taskAssignmentHistory)
        .where(and(
          eq(taskAssignmentHistory.taskId, taskId),
          eq(taskAssignmentHistory.companyId, companyId)
        ))
        .orderBy(desc(taskAssignmentHistory.createdAt));
    } catch (error) {
      logger.error('Error fetching task assignment history', { error, taskId, companyId });
      throw error;
    }
  }
  
  /**
   * Get task status history
   * 
   * @param taskId Task ID
   * @param companyId Company ID
   * @returns Status history entries
   */
  async getTaskStatusHistory(taskId: string, companyId: string) {
    try {
      return await this.db.select()
        .from(taskStatusHistory)
        .where(and(
          eq(taskStatusHistory.taskId, taskId),
          eq(taskStatusHistory.companyId, companyId)
        ))
        .orderBy(desc(taskStatusHistory.createdAt));
    } catch (error) {
      logger.error('Error fetching task status history', { error, taskId, companyId });
      throw error;
    }
  }
}