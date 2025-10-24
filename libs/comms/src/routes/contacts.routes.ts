/**
 * Contacts Router
 * 
 * This router handles HTTP requests related to communication contacts.
 */

import express, { Router, Request, Response } from 'express';
import { ContactsService } from '../services/contacts.service';
import { AuthGuard } from '../../../modules/auth/guards/auth.guard';
import { JwtAuthMode } from '../../../modules/auth/constants/auth-mode.enum';
import { createModuleLogger } from "@common/logger/loki-logger";

// Create a logger for the contacts routes
const logger = createModuleLogger('ContactsRouter');

/**
 * Router for contacts endpoints
 */
export class ContactsRouter {
  private router: Router;
  
  constructor(private contactsService: ContactsService) {
    this.router = express.Router();
    this.setupRoutes();
  }
  
  /**
   * Set up the routes for the router
   */
  private setupRoutes() {
    // Get all contacts for company with search and pagination
    this.router.get('/', AuthGuard.protect(JwtAuthMode.REQUIRED), this.getContacts.bind(this));
    
    // Get a specific contact
    this.router.get('/:contactId', AuthGuard.protect(JwtAuthMode.REQUIRED), this.getContact.bind(this));
    
    // Create a new contact
    this.router.post('/', AuthGuard.protect(JwtAuthMode.REQUIRED), this.createContact.bind(this));
    
    // Update a contact
    this.router.patch('/:contactId', AuthGuard.protect(JwtAuthMode.REQUIRED), this.updateContact.bind(this));
    
    // Delete a contact
    this.router.delete('/:contactId', AuthGuard.protect(JwtAuthMode.REQUIRED), this.deleteContact.bind(this));
    
    // Find contacts by identifiers (email, phone, etc.)
    this.router.post('/find', AuthGuard.protect(JwtAuthMode.REQUIRED), this.findContacts.bind(this));
  }
  
  /**
   * Get the configured router
   * @returns Express Router
   */
  public getRouter(): Router {
    return this.router;
  }
  
  /**
   * Handler for GET /contacts
   */
  private async getContacts(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Missing company ID' });
      }
      
      // Extract search and pagination options from query params
      const options: any = {};
      
      if (req.query.search) {
        options.search = req.query.search as string;
      }
      
      if (req.query.limit) {
        options.limit = parseInt(req.query.limit as string, 10);
      }
      
      if (req.query.offset) {
        options.offset = parseInt(req.query.offset as string, 10);
      }
      
      const contacts = await this.contactsService.getContacts(companyId, options);
      
      return res.json(contacts);
    } catch (error) {
      logger.error('Error getting contacts', error);
      return res.status(500).json({ 
        error: 'Failed to get contacts',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Handler for GET /contacts/:contactId
   */
  private async getContact(req: Request, res: Response) {
    try {
      const { contactId } = req.params;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Missing company ID' });
      }
      
      const contact = await this.contactsService.getContactById(contactId, companyId);
      
      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }
      
      return res.json(contact);
    } catch (error) {
      logger.error(`Error getting contact ${req.params.contactId}`, error);
      return res.status(500).json({ 
        error: 'Failed to get contact',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Handler for POST /contacts
   */
  private async createContact(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Missing company ID' });
      }
      
      // Create the contact
      const contact = await this.contactsService.createContact(companyId, {
        email: req.body.email,
        phone: req.body.phone,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        displayName: req.body.displayName,
        company: req.body.company,
        jobTitle: req.body.jobTitle,
        avatarUrl: req.body.avatarUrl,
        socialProfiles: req.body.socialProfiles,
        communicationPreferences: req.body.communicationPreferences,
        optOut: req.body.optOut,
        metadata: req.body.metadata,
        externalId: req.body.externalId,
        externalSource: req.body.externalSource,
        createdBy: userId
      });
      
      return res.status(201).json(contact);
    } catch (error) {
      logger.error('Error creating contact', error);
      return res.status(500).json({ 
        error: 'Failed to create contact',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Handler for PATCH /contacts/:contactId
   */
  private async updateContact(req: Request, res: Response) {
    try {
      const { contactId } = req.params;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Missing company ID' });
      }
      
      // Check if contact exists
      const contact = await this.contactsService.getContactById(contactId, companyId);
      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' });
      }
      
      // Update the contact
      const updatedContact = await this.contactsService.updateContact(contactId, companyId, {
        email: req.body.email,
        phone: req.body.phone,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        displayName: req.body.displayName,
        company: req.body.company,
        jobTitle: req.body.jobTitle,
        avatarUrl: req.body.avatarUrl,
        socialProfiles: req.body.socialProfiles,
        communicationPreferences: req.body.communicationPreferences,
        optOut: req.body.optOut,
        metadata: req.body.metadata,
        externalId: req.body.externalId,
        externalSource: req.body.externalSource,
        updatedBy: userId
      });
      
      return res.json(updatedContact);
    } catch (error) {
      logger.error(`Error updating contact ${req.params.contactId}`, error);
      return res.status(500).json({ 
        error: 'Failed to update contact',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Handler for DELETE /contacts/:contactId
   */
  private async deleteContact(req: Request, res: Response) {
    try {
      const { contactId } = req.params;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Missing company ID' });
      }
      
      // Delete the contact
      const deleted = await this.contactsService.deleteContact(contactId, companyId);
      
      if (!deleted) {
        return res.status(404).json({ error: 'Contact not found' });
      }
      
      return res.status(204).end();
    } catch (error) {
      logger.error(`Error deleting contact ${req.params.contactId}`, error);
      return res.status(500).json({ 
        error: 'Failed to delete contact',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Handler for POST /contacts/find
   */
  private async findContacts(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ error: 'Missing company ID' });
      }
      
      // Find contacts by the provided identifiers
      const contacts = await this.contactsService.findContactsByIdentifiers(companyId, {
        email: req.body.email,
        phone: req.body.phone,
        externalId: req.body.externalId
      });
      
      return res.json(contacts);
    } catch (error) {
      logger.error('Error finding contacts', error);
      return res.status(500).json({ 
        error: 'Failed to find contacts',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  }
}