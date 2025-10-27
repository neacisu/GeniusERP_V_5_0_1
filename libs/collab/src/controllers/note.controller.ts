/**
 * Note Controller
 * 
 * Handles HTTP requests related to notes in the Collaboration module.
 */
import { Request, Response, Router } from 'express';
import { z } from 'zod';
import { AuthGuard } from '@geniuserp/auth';
import { JwtAuthMode } from '@geniuserp/auth';
import { createModuleLogger } from "@common/logger/loki-logger";
import { NoteService } from '../services/note.service';
import { insertCollaborationNoteSchema } from '@geniuserp/shared/schema/collaboration.schema';

// Create module logger
const logger = createModuleLogger('CollabNoteController');

export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  /**
   * Register routes for the Note controller
   * 
   * @param router Express router
   */
  registerRoutes(router: Router): void {
    router.get('/', AuthGuard.protect(JwtAuthMode.REQUIRED), this.getAllNotes.bind(this));
    router.get('/task/:taskId', AuthGuard.protect(JwtAuthMode.REQUIRED), this.getNotesByTask.bind(this));
    router.get('/:id', AuthGuard.protect(JwtAuthMode.REQUIRED), this.getNoteById.bind(this));
    router.post('/', AuthGuard.protect(JwtAuthMode.REQUIRED), this.createNote.bind(this));
    router.patch('/:id', AuthGuard.protect(JwtAuthMode.REQUIRED), this.updateNote.bind(this));
    router.delete('/:id', AuthGuard.protect(JwtAuthMode.REQUIRED), this.deleteNote.bind(this));
  }

  /**
   * Get all notes for a company
   */
  async getAllNotes(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      // const companyId = req.user.companyId;  // Unused variable
      
      // Parse query parameters
      // const limit = req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : 50;  // Unused variable
      // const offset = req.query['offset'] ? parseInt(req.query['offset'] as string, 10) : 0;  // Unused variable
      const sortOrder = req.query['sortOrder'] === 'asc' ? 'asc' : 'desc';
      const isPinned = req.query['isPinned'] ? req.query['isPinned'] === 'true' : undefined;
      
      // Get all notes for the company with pagination
      const result = await this.noteService.getAllNotesByCompany(companyId, {
        limit,
        offset,
        sortOrder,
        isPinned
      });
      
      res.status(200).json(result);
    } catch (error) {
      logger.error(`Error in GET /notes - CompanyId: ${req.user?.companyId}`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Get notes for a specific task
   */
  async getNotesByTask(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const { taskId } = req.params;
      // const companyId = req.user.companyId;  // Unused variable
      
      const notes = await this.noteService.getNotesByTaskId(taskId, companyId);
      
      res.status(200).json(notes);
    } catch (error) {
      logger.error(`Error in GET /notes/task/:taskId - TaskId: ${req.params['taskId']}`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Get a note by ID
   */
  async getNoteById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const { id } = req.params;
      // const companyId = req.user.companyId;  // Unused variable
      
      const note = await this.noteService.getNoteById(id, companyId);
      
      if (!note) {
        res.status(404).json({ message: 'Note not found' });
        return;
      }
      
      res.status(200).json(note);
    } catch (error) {
      logger.error(`Error in GET /notes/:id - NoteId: ${req.params['id']}`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Create a new note
   */
  async createNote(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id || !req.user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      // const userId = req.user.id;  // Unused variable
      // const companyId = req.user.companyId;  // Unused variable
      
      // Validate request body
      const noteSchema = insertCollaborationNoteSchema.extend({
        companyId: z.string().uuid(),
        createdBy: z.string().uuid(),
      });
      
      const validatedData = noteSchema.parse({
        ...req.body,
        companyId,
        createdBy: userId,
      });
      
      const note = await this.noteService.createNote(validatedData, userId);
      
      res.status(201).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid note data', errors: error.format() });
        return;
      }
      
      logger.error('Error in POST /notes', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Update a note
   */
  async updateNote(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id || !req.user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const { id } = req.params;
      // const userId = req.user.id;  // Unused variable
      // const companyId = req.user.companyId;  // Unused variable
      
      // Validate request body (partial updates allowed)
      const updateNoteSchema = insertCollaborationNoteSchema.partial();
      const validatedData = updateNoteSchema.parse(req.body);
      
      const note = await this.noteService.updateNote(id, companyId, validatedData, userId);
      
      if (!note) {
        res.status(404).json({ message: 'Note not found or you are not authorized to edit it' });
        return;
      }
      
      res.status(200).json(note);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: 'Invalid note data', errors: error.format() });
        return;
      }
      
      logger.error(`Error in PATCH /notes/:id - NoteId: ${req.params['id']}`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  /**
   * Delete a note
   */
  async deleteNote(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.user.id || !req.user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const { id } = req.params;
      // const userId = req.user.id;  // Unused variable
      // const companyId = req.user.companyId;  // Unused variable
      
      const success = await this.noteService.deleteNote(id, companyId);
      
      if (!success) {
        res.status(404).json({ message: 'Note not found or you are not authorized to delete it' });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      logger.error(`Error in DELETE /notes/:id - NoteId: ${req.params['id']}`, error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}

export const createNoteController = (noteService: NoteService): NoteController => {
  return new NoteController(noteService);
};