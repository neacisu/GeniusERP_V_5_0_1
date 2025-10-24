/**
 * Contact Controller
 * 
 * Controller for handling contact-related API endpoints
 */
import { Express, Request, Response } from 'express';
import { ContactService } from '../services/contact.service';
import { JwtService } from '../../auth/services/jwt.service';
import { AuthGuard } from '@geniuserp/auth';
import { JwtAuthMode } from '@geniuserp/auth';
import { UserRole } from '@geniuserp/auth';

export class ContactController {
  private contactService: ContactService;
  
  constructor() {
    this.contactService = new ContactService();
  }
  
  /**
   * Register all contact routes
   */
  registerRoutes(app: Express, jwtService: JwtService): void {
    // Create a new contact
    app.post(
      '/api/crm/contacts',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.SALES_AGENT]),
      this.createContact.bind(this)
    );
    
    // Get a specific contact by ID
    app.get(
      '/api/crm/contacts/:id',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.SALES_AGENT, UserRole.USER]),
      this.getContact.bind(this)
    );
    
    // Update an existing contact
    app.put(
      '/api/crm/contacts/:id',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.SALES_AGENT]),
      this.updateContact.bind(this)
    );
    
    // Delete a contact
    app.delete(
      '/api/crm/contacts/:id',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.SALES_AGENT]),
      this.deleteContact.bind(this)
    );
    
    // List contacts with filters
    app.get(
      '/api/crm/contacts',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.SALES_AGENT, UserRole.USER]),
      this.listContacts.bind(this)
    );
    
    // Get contacts for a customer
    app.get(
      '/api/crm/customers/:customerId/contacts',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.ADMIN, UserRole.COMPANY_ADMIN, UserRole.SALES_AGENT, UserRole.USER]),
      this.getContactsByCustomer.bind(this)
    );
  }
  
  /**
   * Create a new contact
   */
  private async createContact(req: Request, res: Response): Promise<void> {
    try {
      const { user, body } = req;
      
      if (!user || !user.id || !user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const contactData = {
        ...body,
        companyId: user.companyId
      };
      
      const contact = await this.contactService.create(contactData, user.id);
      res.status(201).json(contact);
    } catch (error) {
      console.error('Error creating contact:', error);
      res.status(500).json({ 
        message: 'Failed to create contact', 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * Get a specific contact by ID
   */
  private async getContact(req: Request, res: Response): Promise<void> {
    try {
      const { user, params } = req;
      const { id } = params;
      
      if (!user || !user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const contact = await this.contactService.getById(id, user.companyId);
      
      if (!contact) {
        res.status(404).json({ message: 'Contact not found' });
        return;
      }
      
      res.json(contact);
    } catch (error) {
      console.error('Error getting contact:', error);
      res.status(500).json({ 
        message: 'Failed to get contact', 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * Update an existing contact
   */
  private async updateContact(req: Request, res: Response): Promise<void> {
    try {
      const { user, params, body } = req;
      const { id } = params;
      
      if (!user || !user.id || !user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const contactData = {
        ...body,
        companyId: user.companyId
      };
      
      const contact = await this.contactService.update(id, contactData, user.id);
      
      if (!contact) {
        res.status(404).json({ message: 'Contact not found' });
        return;
      }
      
      res.json(contact);
    } catch (error) {
      console.error('Error updating contact:', error);
      res.status(500).json({ 
        message: 'Failed to update contact', 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * Delete a contact
   */
  private async deleteContact(req: Request, res: Response): Promise<void> {
    try {
      const { user, params } = req;
      const { id } = params;
      
      if (!user || !user.id || !user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const success = await this.contactService.delete(id, user.companyId, user.id);
      
      if (!success) {
        res.status(404).json({ message: 'Contact not found' });
        return;
      }
      
      res.json({ message: 'Contact deleted successfully' });
    } catch (error) {
      console.error('Error deleting contact:', error);
      res.status(500).json({ 
        message: 'Failed to delete contact', 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * List contacts with filters
   */
  private async listContacts(req: Request, res: Response): Promise<void> {
    try {
      const { user, query } = req;
      
      if (!user || !user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      // Parse query parameters
      const page = query.page ? parseInt(query.page as string, 10) : 1;
      const limit = query.limit ? parseInt(query.limit as string, 10) : 20;
      const searchTerm = query.search as string;
      const customerId = query.customerId as string;
      const isDecisionMaker = query.isDecisionMaker === 'true';
      const isActive = query.isActive !== 'false'; // Default to true
      const sortBy = query.sortBy as string;
      const sortDirection = query.sortDirection as 'asc' | 'desc';
      
      const result = await this.contactService.list(user.companyId, {
        page,
        limit,
        searchTerm,
        customerId,
        isDecisionMaker: query.isDecisionMaker !== undefined ? isDecisionMaker : undefined,
        isActive: query.isActive !== undefined ? isActive : undefined,
        sortBy,
        sortDirection
      });
      
      res.json(result);
    } catch (error) {
      console.error('Error listing contacts:', error);
      res.status(500).json({ 
        message: 'Failed to list contacts', 
        error: (error as Error).message 
      });
    }
  }
  
  /**
   * Get contacts for a customer
   */
  private async getContactsByCustomer(req: Request, res: Response): Promise<void> {
    try {
      const { user, params } = req;
      const { customerId } = params;
      
      if (!user || !user.companyId) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      
      const contacts = await this.contactService.getByCustomerId(customerId, user.companyId);
      res.json(contacts);
    } catch (error) {
      console.error('Error getting customer contacts:', error);
      res.status(500).json({ 
        message: 'Failed to get customer contacts', 
        error: (error as Error).message 
      });
    }
  }
}