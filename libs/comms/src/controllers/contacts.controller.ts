/**
 * Contacts Controller
 * 
 * This controller handles HTTP requests related to communication contacts.
 * It isolates business logic from the request/response handling.
 */

import { Request, Response } from 'express';
import { ContactsService } from '../services/contacts.service';
import { Logger } from '../../../common/logger';

// Create a logger for the contacts controller
const logger = new Logger('ContactsController');

/**
 * Controller for communications contacts
 */
export class ContactsController {
  constructor(private contactsService: ContactsService) {}

  /**
   * Get all contacts with pagination and search
   */
  async getContacts(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: 'Missing company ID' });
      }
      
      // Extract search and pagination options
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
        message: 'Failed to get contacts',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Get a specific contact by ID
   */
  async getContact(req: Request, res: Response) {
    try {
      const { contactId } = req.params;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: 'Missing company ID' });
      }
      
      const contact = await this.contactsService.getContactById(contactId, companyId);
      
      if (!contact) {
        return res.status(404).json({ message: 'Contact not found' });
      }
      
      return res.json(contact);
    } catch (error) {
      logger.error(`Error getting contact ${req.params.contactId}`, error);
      return res.status(500).json({ 
        message: 'Failed to get contact',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Create a new contact
   */
  async createContact(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: 'Missing company ID' });
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
        message: 'Failed to create contact',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Update a contact
   */
  async updateContact(req: Request, res: Response) {
    try {
      const { contactId } = req.params;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: 'Missing company ID' });
      }
      
      // Check if contact exists
      const contact = await this.contactsService.getContactById(contactId, companyId);
      if (!contact) {
        return res.status(404).json({ message: 'Contact not found' });
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
        message: 'Failed to update contact',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Delete a contact
   */
  async deleteContact(req: Request, res: Response) {
    try {
      const { contactId } = req.params;
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: 'Missing company ID' });
      }
      
      const deleted = await this.contactsService.deleteContact(contactId, companyId);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Contact not found' });
      }
      
      return res.status(204).end();
    } catch (error) {
      logger.error(`Error deleting contact ${req.params.contactId}`, error);
      return res.status(500).json({ 
        message: 'Failed to delete contact',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Find contacts by identifiers
   */
  async findContactsByIdentifiers(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;
      
      if (!companyId) {
        return res.status(400).json({ message: 'Missing company ID' });
      }
      
      // Validate request
      if (!req.body.email && !req.body.phone && !req.body.externalId) {
        return res.status(400).json({ 
          message: 'At least one identifier (email, phone, or externalId) is required' 
        });
      }
      
      const contacts = await this.contactsService.findContactsByIdentifiers(companyId, {
        email: req.body.email,
        phone: req.body.phone,
        externalId: req.body.externalId
      });
      
      return res.json(contacts);
    } catch (error) {
      logger.error('Error finding contacts by identifiers', error);
      return res.status(500).json({ 
        message: 'Failed to find contacts',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}