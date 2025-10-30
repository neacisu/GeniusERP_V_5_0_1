/**
 * Note Routes
 * 
 * Register all routes for the notes feature in the collaboration module.
 */
import { Router } from 'express';
import { NoteController } from '../controllers/note.controller';

/**
 * Register note routes
 * 
 * @param noteController Note controller
 * @returns Express router with note routes
 */
export function registerNoteRoutes(noteController: NoteController): Router {
  const router = Router();
  
  // Register all routes on the controller
  noteController.registerRoutes(router);
  
  return router;
}