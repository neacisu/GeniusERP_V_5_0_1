/**
 * Note Service
 * 
 * Service for managing task notes in the Collaboration module.
 */

import { eq, desc, sql, and } from 'drizzle-orm';
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
      // Filter by ID and company ID
      const notes = await this.drizzleService.query(db => db.select()
        .from(collaborationNotes)
        .where(and(
          eq(collaborationNotes.id, noteId),
          eq(collaborationNotes.companyId, companyId)
        ))
      );
      
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
      const {
        limit = 50,
        offset = 0,
        sortOrder = 'desc', // Default to newest first
        isPinned
      } = options;
      
      // Build where conditions
      const conditions = [eq(collaborationNotes.companyId, companyId)];
      if (isPinned !== undefined) {
        conditions.push(eq(collaborationNotes.isPinned, isPinned));
      }
      
      // Execute query for notes
      const notesResult = await this.drizzleService.query(db => {
        let query = db.select().from(collaborationNotes).where(and(...conditions));
        
        // Apply ordering
        if (sortOrder === 'asc') {
          query = query.orderBy(collaborationNotes.createdAt);
        } else {
          query = query.orderBy(desc(collaborationNotes.createdAt));
        }
        
        // Apply pagination
        return query.limit(limit).offset(offset);
      });
      
      // Get total count
      const totalResult = await this.drizzleService.query(db => 
        db.select({ count: sql`count(*)` })
          .from(collaborationNotes)
          .where(and(...conditions))
      );
      
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
      return await this.drizzleService.query(db => 
        db.select()
          .from(collaborationNotes)
          .where(and(
            eq(collaborationNotes.taskId, taskId),
            eq(collaborationNotes.companyId, companyId)
          ))
          .orderBy(desc(collaborationNotes.createdAt))
      );
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
      const updatedNotes = await this.drizzleService.query(db =>
        db.update(collaborationNotes)
          .set({
            ...updates,
            updatedAt: new Date(),
            editedBy: userId
          })
          .where(and(
            eq(collaborationNotes.id, noteId),
            eq(collaborationNotes.companyId, companyId)
          ))
          .returning()
      );
      
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
      const result = await this.drizzleService.query(db =>
        db.delete(collaborationNotes)
          .where(and(
            eq(collaborationNotes.id, noteId),
            eq(collaborationNotes.companyId, companyId)
          ))
          .returning()
      );
      
      return result.length > 0;
    } catch (error) {
      this._logger.error('Failed to delete note', { error, noteId, companyId });
      throw error;
    }
  }
}