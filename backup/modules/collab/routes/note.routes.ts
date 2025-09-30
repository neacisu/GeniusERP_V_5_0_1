/**
 * Note Routes
 * 
 * Defines API routes for task notes in the Collaboration module.
 */

import { Express, Request, Response } from 'express';
import { NoteService } from '../services/note.service';
import { AuthGuard } from '../../../common/middleware/auth-guard';
import { z } from 'zod';
import { insertCollaborationNoteSchema } from '../../../../shared/schema/collaboration.schema';
import { Logger } from '../../../common/logger';

// Create a logger instance for note routes
const logger = new Logger('NoteRoutes');

const BASE_PATH = '/api/collaboration/notes';

/**
 * Register note routes with the Express app
 * 
 * @param app Express application
 * @param noteService Note service instance
 */
export function registerNoteRoutes(app: Express, noteService: NoteService): void {
  /**
   * Get notes for a task
   * 
   * @route GET /api/collaboration/notes
   */
  app.get(BASE_PATH, AuthGuard.requireAuth(), AuthGuard.requireCompanyAccess(), async (req: Request, res: Response) => {
    try {
      const companyId = req.user.companyId;
      const taskId = req.query.taskId as string;
      
      if (!taskId) {
        return res.status(400).json({ message: 'taskId query parameter is required' });
      }
      
      const notes = await noteService.getNotesByTaskId(taskId, companyId);
      
      res.status(200).json(notes);
    } catch (error) {
      logger.error('Error in GET /api/collaboration/notes', { error });
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  /**
   * Get a note by ID
   * 
   * @route GET /api/collaboration/notes/:id
   */
  app.get(`${BASE_PATH}/:id`, AuthGuard.requireAuth(), AuthGuard.requireCompanyAccess(), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = req.user.companyId;
      
      const note = await noteService.getNoteById(id, companyId);
      
      if (!note) {
        return res.status(404).json({ message: 'Note not found' });
      }
      
      res.status(200).json(note);
    } catch (error) {
      logger.error('Error in GET /api/collaboration/notes/:id', { error, noteId: req.params.id });
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  /**
   * Create a new note
   * 
   * @route POST /api/collaboration/notes
   */
  app.post(BASE_PATH, AuthGuard.requireAuth(), AuthGuard.requireCompanyAccess(), async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const companyId = req.user.companyId;
      
      // Validate request body
      const noteSchema = insertCollaborationNoteSchema.extend({
        companyId: z.string().uuid(),
        userId: z.string().uuid()
      });
      
      const validatedData = noteSchema.parse({
        ...req.body,
        companyId,
        userId
      });
      
      const note = await noteService.createNote(validatedData, userId);
      
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid note data', errors: error.format() });
      }
      
      logger.error('Error in POST /api/collaboration/notes', { error });
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  /**
   * Update a note
   * 
   * @route PATCH /api/collaboration/notes/:id
   */
  app.patch(`${BASE_PATH}/:id`, AuthGuard.requireAuth(), AuthGuard.requireCompanyAccess(), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const companyId = req.user.companyId;
      
      // Validate request body (partial updates allowed)
      const updateNoteSchema = insertCollaborationNoteSchema.partial();
      const validatedData = updateNoteSchema.parse(req.body);
      
      const note = await noteService.updateNote(id, companyId, validatedData, userId);
      
      res.status(200).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid note data', errors: error.format() });
      }
      
      logger.error('Error in PATCH /api/collaboration/notes/:id', { error, noteId: req.params.id });
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  /**
   * Delete a note
   * 
   * @route DELETE /api/collaboration/notes/:id
   */
  app.delete(`${BASE_PATH}/:id`, AuthGuard.requireAuth(), AuthGuard.requireCompanyAccess(), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const companyId = req.user.companyId;
      
      const success = await noteService.deleteNote(id, companyId);
      
      if (!success) {
        return res.status(404).json({ message: 'Note not found' });
      }
      
      res.status(204).send();
    } catch (error) {
      logger.error('Error in DELETE /api/collaboration/notes/:id', { error, noteId: req.params.id });
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}