/**
 * Contacts Service
 * 
 * This service handles contact operations including creating, updating,
 * retrieving, and deleting contact profiles across communication channels.
 */

import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, or, like, desc } from 'drizzle-orm';
import { 
  contacts
} from '../../../../shared/schema/communications.schema';
import { Logger } from '../../../common/logger';

// Create a logger for contact operations
const logger = new Logger('ContactsService');

/**
 * Service for managing communication contacts
 */
export class ContactsService {
  constructor(private db: PostgresJsDatabase) {}

  /**
   * Create a new contact profile
   * 
   * @param companyId Company ID
   * @param data Contact data
   * @returns The created contact
   */
  async createContact(companyId: string, data: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    company?: string;
    jobTitle?: string;
    avatarUrl?: string;
    socialProfiles?: Record<string, string>;
    communicationPreferences?: Record<string, boolean>;
    optOut?: Record<string, boolean>;
    metadata?: Record<string, any>;
    externalId?: string;
    externalSource?: string;
    createdBy?: string;
  }) {
    try {
      logger.info(`Creating contact for company ${companyId}`);
      
      const [contact] = await this.db.insert(contacts).values({
        companyId,
        email: data.email,
        phone: data.phone,
        firstName: data.firstName,
        lastName: data.lastName,
        displayName: data.displayName || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
        company: data.company,
        jobTitle: data.jobTitle,
        avatarUrl: data.avatarUrl,
        socialProfiles: data.socialProfiles ? JSON.stringify(data.socialProfiles) : '{}',
        communicationPreferences: data.communicationPreferences ? JSON.stringify(data.communicationPreferences) : '{}',
        optOut: data.optOut ? JSON.stringify(data.optOut) : '{}',
        metadata: data.metadata ? JSON.stringify(data.metadata) : '{}',
        externalId: data.externalId,
        externalSource: data.externalSource,
        createdBy: data.createdBy
      }).returning();
      
      return contact;
    } catch (error) {
      logger.error(`Failed to create contact for company ${companyId}`, error);
      throw new Error(`Failed to create contact: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get a contact by ID
   * 
   * @param contactId Contact ID
   * @param companyId Company ID
   * @returns The contact
   */
  async getContactById(contactId: string, companyId: string) {
    try {
      const result = await this.db.select()
        .from(contacts)
        .where(
          and(
            eq(contacts.id, contactId),
            eq(contacts.companyId, companyId)
          )
        );
      
      if (result.length === 0) {
        return null;
      }
      
      return result[0];
    } catch (error) {
      logger.error(`Failed to get contact ${contactId}`, error);
      throw new Error(`Failed to get contact: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Find contacts by various identifiers
   * 
   * @param companyId Company ID
   * @param identifiers Email, phone or external ID
   * @returns Array of matching contacts
   */
  async findContactsByIdentifiers(companyId: string, identifiers: {
    email?: string;
    phone?: string;
    externalId?: string;
  }) {
    try {
      // Build conditions for the search
      const conditions = [];
      
      if (identifiers.email) {
        conditions.push(eq(contacts.email, identifiers.email));
      }
      
      if (identifiers.phone) {
        conditions.push(eq(contacts.phone, identifiers.phone));
      }
      
      if (identifiers.externalId) {
        conditions.push(eq(contacts.externalId, identifiers.externalId));
      }
      
      // If no identifiers provided, return empty array
      if (conditions.length === 0) {
        return [];
      }
      
      // Execute query
      const result = await this.db.select()
        .from(contacts)
        .where(
          and(
            eq(contacts.companyId, companyId),
            or(...conditions)
          )
        );
      
      return result;
    } catch (error) {
      logger.error(`Failed to find contacts for company ${companyId}`, error);
      throw new Error(`Failed to find contacts: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get contacts for a company with pagination and search
   * 
   * @param companyId Company ID
   * @param options Search and pagination options
   * @returns Array of contacts
   */
  async getContacts(companyId: string, options?: {
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    try {
      // Build WHERE conditions array
      const whereConditions: any[] = [eq(contacts.companyId, companyId)];
      
      // Apply search if provided
      if (options?.search) {
        const searchTerm = `%${options.search}%`;
        whereConditions.push(
          or(
            like(contacts.firstName, searchTerm),
            like(contacts.lastName, searchTerm),
            like(contacts.displayName, searchTerm),
            like(contacts.email, searchTerm),
            like(contacts.phone, searchTerm),
            like(contacts.company, searchTerm)
          )
        );
      }
      
      // Build query with all conditions at once
      let query = this.db.select()
        .from(contacts)
        .where(and(...whereConditions))
        .orderBy(desc(contacts.createdAt));
      
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      
      if (options?.offset) {
        query = query.offset(options.offset);
      }
      
      // Execute the query
      return await query;
    } catch (error) {
      logger.error(`Failed to get contacts for company ${companyId}`, error);
      throw new Error(`Failed to get contacts: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Update a contact
   * 
   * @param contactId Contact ID
   * @param companyId Company ID
   * @param data Update data
   * @returns The updated contact
   */
  async updateContact(contactId: string, companyId: string, data: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    company?: string;
    jobTitle?: string;
    avatarUrl?: string;
    socialProfiles?: Record<string, string>;
    communicationPreferences?: Record<string, boolean>;
    optOut?: Record<string, boolean>;
    metadata?: Record<string, any>;
    externalId?: string;
    externalSource?: string;
    updatedBy?: string;
  }) {
    try {
      logger.info(`Updating contact ${contactId}`);
      
      // Prepare update data
      const updateData: any = {};
      
      if (data.email !== undefined) {
        updateData.email = data.email;
      }
      
      if (data.phone !== undefined) {
        updateData.phone = data.phone;
      }
      
      if (data.firstName !== undefined) {
        updateData.firstName = data.firstName;
      }
      
      if (data.lastName !== undefined) {
        updateData.lastName = data.lastName;
      }
      
      if (data.displayName !== undefined) {
        updateData.displayName = data.displayName;
      } else if (data.firstName !== undefined || data.lastName !== undefined) {
        // If first or last name changed but display name wasn't provided, update it
        const contact = await this.getContactById(contactId, companyId);
        if (contact) {
          const firstName = data.firstName !== undefined ? data.firstName : contact.firstName;
          const lastName = data.lastName !== undefined ? data.lastName : contact.lastName;
          updateData.displayName = `${firstName || ''} ${lastName || ''}`.trim();
        }
      }
      
      if (data.company !== undefined) {
        updateData.company = data.company;
      }
      
      if (data.jobTitle !== undefined) {
        updateData.jobTitle = data.jobTitle;
      }
      
      if (data.avatarUrl !== undefined) {
        updateData.avatarUrl = data.avatarUrl;
      }
      
      if (data.socialProfiles !== undefined) {
        updateData.socialProfiles = JSON.stringify(data.socialProfiles);
      }
      
      if (data.communicationPreferences !== undefined) {
        updateData.communicationPreferences = JSON.stringify(data.communicationPreferences);
      }
      
      if (data.optOut !== undefined) {
        updateData.optOut = JSON.stringify(data.optOut);
      }
      
      if (data.metadata !== undefined) {
        updateData.metadata = JSON.stringify(data.metadata);
      }
      
      if (data.externalId !== undefined) {
        updateData.externalId = data.externalId;
      }
      
      if (data.externalSource !== undefined) {
        updateData.externalSource = data.externalSource;
      }
      
      if (data.updatedBy !== undefined) {
        updateData.updatedBy = data.updatedBy;
      }
      
      // Add updated timestamp
      updateData.updatedAt = new Date();
      
      // Perform the update
      const [updatedContact] = await this.db.update(contacts)
        .set(updateData)
        .where(
          and(
            eq(contacts.id, contactId),
            eq(contacts.companyId, companyId)
          )
        )
        .returning();
      
      return updatedContact;
    } catch (error) {
      logger.error(`Failed to update contact ${contactId}`, error);
      throw new Error(`Failed to update contact: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Delete a contact
   * 
   * @param contactId Contact ID
   * @param companyId Company ID
   * @returns True if deleted
   */
  async deleteContact(contactId: string, companyId: string) {
    try {
      logger.info(`Deleting contact ${contactId}`);
      
      const result = await this.db.delete(contacts)
        .where(
          and(
            eq(contacts.id, contactId),
            eq(contacts.companyId, companyId)
          )
        );
      
      return result && result.length > 0;
    } catch (error) {
      logger.error(`Failed to delete contact ${contactId}`, error);
      throw new Error(`Failed to delete contact: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}