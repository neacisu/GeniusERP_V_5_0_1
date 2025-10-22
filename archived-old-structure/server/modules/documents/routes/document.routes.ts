/**
 * Document Routes
 * 
 * This file defines the Express routes for document operations,
 * using the new controller-based architecture pattern.
 */

import { Express } from 'express';
import { DrizzleService } from '../../../common/drizzle/drizzle.service';
import { DocumentController } from '../controllers/document.controller';
import { DocumentService } from '../services/document.service';
import { Logger } from '../../../common/logger';

const logger = new Logger('DocumentRoutes');

/**
 * Initialize document routes using the DocumentController
 */
export function initDocumentRoutes(app: Express): void {
  logger.info('Initializing document routes');
  
  const drizzleService = new DrizzleService();
  const documentService = new DocumentService(drizzleService);
  const documentController = new DocumentController(documentService);
  
  // Register routes with the controller
  documentController.registerRoutes(app);
  
  logger.info('Document routes initialized successfully');
}