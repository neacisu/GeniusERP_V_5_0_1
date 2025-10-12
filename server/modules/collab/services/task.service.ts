/**
 * Task Service
 * 
 * Service for managing collaboration tasks, assignments, and status tracking.
 */

import { eq, and, desc, gte, lte, inArray, isNull, asc, sql } from 'drizzle-orm';
import { 
  collaborationTasks,
  taskAssignmentHistory,
  taskStatusHistory,
  taskWatchers,
  NewCollaborationTask,
  CollaborationTask,
  TaskStatus,
  TaskType,
  TaskPriority
} from '../../../../shared/schema/collaboration.schema';
import { randomUUID } from 'crypto';
import { Logger } from '../../../common/logger';
import { DrizzleService } from '../../../common/drizzle/drizzle.service';

/**
 * Task Service Class
 * 
 * Manages the lifecycle of collaboration tasks including creation, assignment,
 * status changes, and tracking.
 */
export class TaskService {
  private _logger: Logger;
  
  /**
   * Constructor
   * 
   * @param drizzleService Drizzle service for database operations
   */
  constructor(private drizzleService: DrizzleService) {
    this._logger = new Logger('TaskService');
  }
  
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
      // Use a transaction to ensure all operations succeed or fail together
      return await this.drizzleService.transaction(async (tx) => {
        // Create the task
        const createdTask = await tx.insert(collaborationTasks)
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
        await tx.insert(taskAssignmentHistory)
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
        await tx.insert(taskStatusHistory)
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
        await tx.insert(taskWatchers)
          .values({
            id: randomUUID(),
            taskId: taskId,
            companyId: task.companyId,
            userId: userId,
            notificationPreference: { enabled: true, mode: 'all' },
            createdAt: now
          });
        
        return createdTask[0];
      });
    } catch (error) {
      this._logger.error(`Error creating task for company ${task.companyId}`, { error });
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
  async getTaskById(taskId: string, companyId?: string): Promise<CollaborationTask | null> {
    try {
      this._logger.info(`Fetching task by ID ${taskId}${companyId ? ` for company ${companyId}` : ''}`);
      
      let whereCondition;
      
      if (companyId) {
        whereCondition = and(
          eq(collaborationTasks.id, taskId),
          eq(collaborationTasks.companyId, companyId)
        );
      } else {
        whereCondition = eq(collaborationTasks.id, taskId);
      }
      
      const tasks = await this.drizzleService.query(db => db.select()
        .from(collaborationTasks)
        .where(whereCondition)
      );
      
      return tasks.length > 0 ? tasks[0] : null;
    } catch (error) {
      this._logger.error(`Error fetching task by ID ${taskId}${companyId ? ` for company ${companyId}` : ''}`, { error });
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
      this._logger.info(`Fetching tasks for company ${companyId}`);
      
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
      
      // Build conditions for the query
      const conditions = [eq(collaborationTasks.companyId, companyId)];
      
      // Add filter conditions
      if (status && status.length > 0) {
        conditions.push(inArray(collaborationTasks.status, status));
      }
      
      if (assignedTo) {
        conditions.push(eq(collaborationTasks.assignedTo, assignedTo));
      }
      
      if (priority && priority.length > 0) {
        const priorityEnums = priority.filter(p => 
          Object.values(TaskPriority).includes(p as any)
        ) as TaskPriority[];
        
        if (priorityEnums.length > 0) {
          conditions.push(inArray(collaborationTasks.priority, priorityEnums));
        }
      }
      
      if (dueStart) {
        conditions.push(gte(collaborationTasks.dueDate, dueStart));
      }
      
      if (dueEnd) {
        conditions.push(lte(collaborationTasks.dueDate, dueEnd));
      }
      
      const whereCondition = and(...conditions);
      
      // Use a more concise approach with sortBy mapped to column
      let orderBy: any;
      
      // Map sort column
      switch (sortBy) {
        case 'title':
          orderBy = sortOrder === 'asc' ? collaborationTasks.title : desc(collaborationTasks.title);
          break;
        case 'dueDate':
          orderBy = sortOrder === 'asc' ? collaborationTasks.dueDate : desc(collaborationTasks.dueDate);
          break;
        case 'status':
          orderBy = sortOrder === 'asc' ? collaborationTasks.status : desc(collaborationTasks.status);
          break;
        case 'priority':
          orderBy = sortOrder === 'asc' ? collaborationTasks.priority : desc(collaborationTasks.priority);
          break;
        case 'updatedAt':
          orderBy = sortOrder === 'asc' ? collaborationTasks.updatedAt : desc(collaborationTasks.updatedAt);
          break;
        default:
          // Default to createdAt
          orderBy = sortOrder === 'asc' ? collaborationTasks.createdAt : desc(collaborationTasks.createdAt);
      }
      
      // Execute query with order by
      const tasksResult = await this.drizzleService.query(db => db.select()
        .from(collaborationTasks)
        .where(whereCondition)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset)
      );
      
      // Count total matching records
      const totalResult = await this.drizzleService.query(db => db.select({ 
          count: sql`count(*)` 
        })
        .from(collaborationTasks)
        .where(whereCondition)
      );
      
      const total = Number(totalResult[0]?.count || 0);
      
      return { tasks: tasksResult, total };
    } catch (error) {
      this._logger.error(`Error fetching tasks for company ${companyId}`, { error });
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
      // Use transaction to ensure all related updates succeed or fail together
      return await this.drizzleService.transaction(async (tx) => {
        // Get current task
        const currentTask = await this.getTaskById(taskId, companyId);
        
        if (!currentTask) {
          throw new Error(`Task not found: ${taskId}`);
        }
        
        // Track status change if status is being updated
        if (updates.status && updates.status !== currentTask.status) {
          await tx.insert(taskStatusHistory)
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
          await tx.insert(taskAssignmentHistory)
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
        const whereCondition = and(
          eq(collaborationTasks.id, taskId),
          eq(collaborationTasks.companyId, companyId)
        );
        
        const updatedTasks = await tx.update(collaborationTasks)
          .set({
            ...updates,
            updatedAt: new Date(),
            updatedBy: userId
          })
          .where(whereCondition)
          .returning();
        
        if (updatedTasks.length === 0) {
          throw new Error(`Failed to update task: ${taskId}`);
        }
        
        return updatedTasks[0];
      });
    } catch (error) {
      this._logger.error(`Error updating task ${taskId} for company ${companyId}`, { error });
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
      // Use transaction to ensure all related deletions succeed or fail together
      return await this.drizzleService.transaction(async (tx) => {
        // Create where conditions for related tables
        const taskHistoryCondition = and(
          eq(taskAssignmentHistory.taskId, taskId),
          eq(taskAssignmentHistory.companyId, companyId)
        );
        
        const statusHistoryCondition = and(
          eq(taskStatusHistory.taskId, taskId),
          eq(taskStatusHistory.companyId, companyId)
        );
        
        const watchersCondition = and(
          eq(taskWatchers.taskId, taskId),
          eq(taskWatchers.companyId, companyId)
        );
        
        // Delete related records first (cascading must be handled manually)
        await Promise.all([
          tx.delete(taskAssignmentHistory).where(taskHistoryCondition),
          tx.delete(taskStatusHistory).where(statusHistoryCondition),
          tx.delete(taskWatchers).where(watchersCondition)
        ]);
        
        // Create where condition for the task
        const taskCondition = and(
          eq(collaborationTasks.id, taskId),
          eq(collaborationTasks.companyId, companyId)
        );
        
        // Delete the task
        const result = await tx.delete(collaborationTasks)
          .where(taskCondition)
          .returning();
        
        return result.length > 0;
      });
    } catch (error) {
      this._logger.error(`Error deleting task ${taskId} for company ${companyId}`, { error });
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
      const whereCondition = and(
        eq(taskAssignmentHistory.taskId, taskId),
        eq(taskAssignmentHistory.companyId, companyId)
      );
      
      return await this.drizzleService.query(db => db.select()
        .from(taskAssignmentHistory)
        .where(whereCondition)
        .orderBy(desc(taskAssignmentHistory.createdAt))
      );
    } catch (error) {
      this._logger.error(`Error fetching task assignment history for task ${taskId} in company ${companyId}`, { error });
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
      const whereCondition = and(
        eq(taskStatusHistory.taskId, taskId),
        eq(taskStatusHistory.companyId, companyId)
      );
      
      return await this.drizzleService.query(db => db.select()
        .from(taskStatusHistory)
        .where(whereCondition)
        .orderBy(desc(taskStatusHistory.createdAt))
      );
    } catch (error) {
      this._logger.error(`Error fetching task status history for task ${taskId} in company ${companyId}`, { error });
      throw error;
    }
  }
  
  /**
   * Assign a task to a user
   * 
   * @param taskId Task ID
   * @param companyId Company ID
   * @param assigneeId User ID being assigned the task
   * @param assignerId User ID making the assignment
   * @returns Updated task
   */
  async assignTask(
    taskId: string,
    companyId: string,
    assigneeId: string,
    assignerId: string
  ): Promise<CollaborationTask> {
    try {
      // Check if task exists
      const task = await this.getTaskById(taskId, companyId);
      
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }
      
      // Use transaction for consistency
      return await this.drizzleService.transaction(async (tx) => {
        // Create assignment history entry
        await tx.insert(taskAssignmentHistory)
          .values({
            id: randomUUID(),
            taskId,
            companyId,
            assignedTo: assigneeId,
            assignedBy: assignerId,
            assignedFrom: task.assignedTo,
            createdAt: new Date()
          });
        
        // Update the task with new assignee
        const whereCondition = and(
          eq(collaborationTasks.id, taskId),
          eq(collaborationTasks.companyId, companyId)
        );
        
        const updatedTasks = await tx.update(collaborationTasks)
          .set({
            assignedTo: assigneeId,
            updatedAt: new Date(),
            updatedBy: assignerId
          })
          .where(whereCondition)
          .returning();
        
        if (updatedTasks.length === 0) {
          throw new Error(`Failed to update task assignment: ${taskId}`);
        }
        
        return updatedTasks[0];
      });
    } catch (error) {
      this._logger.error(`Error assigning task ${taskId} to user ${assigneeId}`, { error });
      throw error;
    }
  }
  
  /**
   * Update task status
   * 
   * @param taskId Task ID
   * @param companyId Company ID
   * @param status New status
   * @param userId User ID making the change
   * @returns Updated task
   */
  async updateTaskStatus(
    taskId: string,
    companyId: string,
    status: TaskStatus,
    userId: string
  ): Promise<CollaborationTask> {
    try {
      // Check if task exists
      const task = await this.getTaskById(taskId, companyId);
      
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }
      
      // Use transaction for consistency
      return await this.drizzleService.transaction(async (tx) => {
        // Don't update if status is the same
        if (task.status === status) {
          return task;
        }
        
        // Create status history entry
        await tx.insert(taskStatusHistory)
          .values({
            id: randomUUID(),
            taskId,
            companyId,
            status: status,
            previousStatus: task.status,
            changedBy: userId,
            comments: status === TaskStatus.COMPLETED ? 'Task completed' : `Status changed to ${status}`,
            createdAt: new Date()
          });
        
        // Update the task with new status
        const whereCondition = and(
          eq(collaborationTasks.id, taskId),
          eq(collaborationTasks.companyId, companyId)
        );
        
        const updatedTasks = await tx.update(collaborationTasks)
          .set({
            status,
            updatedAt: new Date(),
            updatedBy: userId,
            // Set completedAt if status is COMPLETED
            ...(status === TaskStatus.COMPLETED ? { completedAt: new Date(), completedBy: userId } : {})
          })
          .where(whereCondition)
          .returning();
        
        if (updatedTasks.length === 0) {
          throw new Error(`Failed to update task status: ${taskId}`);
        }
        
        return updatedTasks[0];
      });
    } catch (error) {
      this._logger.error(`Error updating task ${taskId} status to ${status}`, { error });
      throw error;
    }
  }
}