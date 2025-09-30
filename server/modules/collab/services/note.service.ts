/**
 * Note Service
 * 
 * Service for managing task notes in the Collaboration module.
 */

import { eq, desc, sql } from 'drizzle-orm';
import {
  collaborationNotes,
  NewCollaborationNote,
  CollaborationNote
} from '../../../../shared/schema/collaboration.schema';
import { randomUUID } from 'crypto';
import { Logger } from '../../../common/logger';
import { DrizzleService } from '../../../common/drizzle/drizzle.service';

/**
 * Note Service Class
 * 
 * Manages task notes including creation, retrieval, and updates.
 */
export class NoteService {
  private _logger: Logger;
  
  /**
   * Constructor
   * 
   * @param drizzleService Drizzle service for database operations
   */
  constructor(private drizzleService: DrizzleService) {
    this._logger = new Logger('NoteService');
  }
  
  /**
   * Create a new note for a task
   * 
   * @param note Note data
   * @param userId User ID creating the note
   * @returns Created note
   */
  async createNote(note: NewCollaborationNote, userId: string): Promise<CollaborationNote> {
    try {
      const noteId = note.id || randomUUID();
      const now = new Date();
      
      // Create the note
      return await this.drizzleService.transaction(async (tx) => {
        const createdNotes = await tx.insert(collaborationNotes)
          .values({
            ...note,
            id: noteId,
            userId,
            createdAt: now,
            updatedAt: now
          })
          .returning();
        
        if (createdNotes.length === 0) {
          throw new Error('Failed to create note');
        }
        
        return createdNotes[0];
      });
    } catch (error) {
      this._logger.error('Failed to create note', { error, companyId: note.companyId });
      throw error;
    }
  }
  
  /**
   * Get a note by ID
   * 
   * @param noteId Note ID
   * @param companyId Company ID
   * @returns Note or null if not found
   */
  async getNoteById(noteId: string, companyId: string): Promise<CollaborationNote | null> {
    try {
      const db = this.drizzleService.db;
      
      // Filter by ID and company ID
      const notes = await db.select().from(collaborationNotes)
        .where(eq(collaborationNotes.id, noteId))
        .where(eq(collaborationNotes.companyId, companyId));
      
      return notes.length > 0 ? notes[0] : null;
    } catch (error) {
      this._logger.error('Failed to fetch note by ID', { error, noteId, companyId });
      throw error;
    }
  }
  
  /**
   * Get all notes for a company with pagination
   * 
   * @param companyId Company ID
   * @param options Query options (limit, offset, sort)
   * @returns List of notes and total count
   */
  async getAllNotesByCompany(companyId: string, options: {
    limit?: number;
    offset?: number;
    sortOrder?: 'asc' | 'desc';
    isPinned?: boolean;
  } = {}): Promise<{ notes: CollaborationNote[]; total: number }> {
    try {
      const db = this.drizzleService.db;
      const {
        limit = 50,
        offset = 0,
        sortOrder = 'desc', // Default to newest first
        isPinned
      } = options;
      
      // Execute queries with conditional filtering
      let notesResult;
      let totalResult;
      
      // Create base query builder
      let queryBuilder = db.select().from(collaborationNotes)
        .where(eq(collaborationNotes.companyId, companyId));
      
      let countQuery = db.select({ count: sql`count(*)` })
        .from(collaborationNotes)
        .where(eq(collaborationNotes.companyId, companyId));
        
      // Add isPinned filter if needed
      if (isPinned !== undefined) {
        queryBuilder = queryBuilder.where(eq(collaborationNotes.isPinned, isPinned));
        countQuery = countQuery.where(eq(collaborationNotes.isPinned, isPinned));
      }
      
      // Apply ordering
      if (sortOrder === 'asc') {
        queryBuilder = queryBuilder.orderBy(collaborationNotes.createdAt);
      } else {
        queryBuilder = queryBuilder.orderBy(desc(collaborationNotes.createdAt));
      }
      
      // Apply pagination
      queryBuilder = queryBuilder.limit(limit).offset(offset);
      
      // Execute queries
      notesResult = await queryBuilder;
      totalResult = await countQuery;
      
      const total = Number(totalResult[0]?.count || 0);
      
      return { 
        notes: notesResult, 
        total 
      };
    } catch (error) {
      this._logger.error('Failed to fetch notes for company', { error, companyId });
      throw error;
    }
  }
  
  /**
   * Get all notes for a task
   * 
   * @param taskId Task ID
   * @param companyId Company ID
   * @returns List of notes
   */
  async getNotesByTaskId(taskId: string, companyId: string): Promise<CollaborationNote[]> {
    try {
      const db = this.drizzleService.db;
      
      // Use multiple where clauses instead of and()
      return await db.select()
        .from(collaborationNotes)
        .where(eq(collaborationNotes.taskId, taskId))
        .where(eq(collaborationNotes.companyId, companyId))
        .orderBy(desc(collaborationNotes.createdAt));
    } catch (error) {
      this._logger.error('Failed to fetch notes for task', { error, taskId, companyId });
      throw error;
    }
  }
  
  /**
   * Update a note
   * 
   * @param noteId Note ID
   * @param companyId Company ID
   * @param updates Note updates
   * @param userId User ID making the update
   * @returns Updated note
   */
  async updateNote(
    noteId: string,
    companyId: string,
    updates: Partial<NewCollaborationNote>,
    userId: string
  ): Promise<CollaborationNote> {
    try {
      const db = this.drizzleService.db;
      
      // Use multiple where clauses instead of and()
      const updatedNotes = await db.update(collaborationNotes)
        .set({
          ...updates,
          updatedAt: new Date(),
          editedBy: userId
        })
        .where(eq(collaborationNotes.id, noteId))
        .where(eq(collaborationNotes.companyId, companyId))
        .returning();
      
      if (updatedNotes.length === 0) {
        throw new Error(`Note not found: ${noteId}`);
      }
      
      return updatedNotes[0];
    } catch (error) {
      this._logger.error('Failed to update note', { error, noteId, companyId });
      throw error;
    }
  }
  
  /**
   * Delete a note
   * 
   * @param noteId Note ID
   * @param companyId Company ID
   * @returns True if deleted
   */
  async deleteNote(noteId: string, companyId: string): Promise<boolean> {
    try {
      const db = this.drizzleService.db;
      
      // Use multiple where clauses instead of and()
      const result = await db.delete(collaborationNotes)
        .where(eq(collaborationNotes.id, noteId))
        .where(eq(collaborationNotes.companyId, companyId))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      this._logger.error('Failed to delete note', { error, noteId, companyId });
      throw error;
    }
  }
}