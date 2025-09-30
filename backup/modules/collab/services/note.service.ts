/**
 * Note Service
 * 
 * Service for managing task notes in the Collaboration module.
 */

import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, desc } from 'drizzle-orm';
import {
  collaborationNotes,
  NewCollaborationNote,
  CollaborationNote
} from '../../../../shared/schema/collaboration.schema';
import { randomUUID } from 'crypto';
import { Logger } from '../../../common/logger';

// Create a logger instance for the note service
const logger = new Logger('NoteService');

/**
 * Note Service Class
 * 
 * Manages task notes including creation, retrieval, and updates.
 */
export class NoteService {
  /**
   * Constructor
   * 
   * @param db Drizzle database instance
   */
  constructor(private db: PostgresJsDatabase<any>) {}
  
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
      const createdNotes = await this.db.insert(collaborationNotes)
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
    } catch (error) {
      logger.error('Error creating note', { error, noteData: note });
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
      const notes = await this.db.select()
        .from(collaborationNotes)
        .where(and(
          eq(collaborationNotes.id, noteId),
          eq(collaborationNotes.companyId, companyId)
        ));
      
      return notes.length > 0 ? notes[0] : null;
    } catch (error) {
      logger.error('Error fetching note by ID', { error, noteId, companyId });
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
      return await this.db.select()
        .from(collaborationNotes)
        .where(and(
          eq(collaborationNotes.taskId, taskId),
          eq(collaborationNotes.companyId, companyId)
        ))
        .orderBy(desc(collaborationNotes.createdAt));
    } catch (error) {
      logger.error('Error fetching notes by task ID', { error, taskId, companyId });
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
      const updatedNotes = await this.db.update(collaborationNotes)
        .set({
          ...updates,
          updatedAt: new Date(),
          editedBy: userId
        })
        .where(and(
          eq(collaborationNotes.id, noteId),
          eq(collaborationNotes.companyId, companyId)
        ))
        .returning();
      
      if (updatedNotes.length === 0) {
        throw new Error(`Note not found: ${noteId}`);
      }
      
      return updatedNotes[0];
    } catch (error) {
      logger.error('Error updating note', { error, noteId, companyId, updates });
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
      const result = await this.db.delete(collaborationNotes)
        .where(and(
          eq(collaborationNotes.id, noteId),
          eq(collaborationNotes.companyId, companyId)
        ))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      logger.error('Error deleting note', { error, noteId, companyId });
      throw error;
    }
  }
}