/**
 * Invoicing Customer Controller
 * 
 * This controller provides customer data for invoicing module,
 * mapping customers from CRM to a format suitable for invoicing.
 */
import { Request, Response, NextFunction } from 'express';
import { Logger } from '../../../common/logger';
import { DrizzleService } from '../../../common/drizzle/drizzle.service';
import { eq, and } from 'drizzle-orm';
import { JwtUserData } from '../../../../shared/types';

// Extindere Request pentru a suporta ambele formate de token
declare global {
  namespace Express {
    interface User extends JwtUserData {
      company_id?: string | null; // Adăugat pentru compatibilitate
    }
  }
}

export class CustomerController {
  private logger: Logger;
  private drizzle: DrizzleService;

  constructor() {
    this.logger = new Logger('CustomerController');
    this.drizzle = new DrizzleService();
  }

  /**
   * Get customers for invoicing (company clients)
   */
  async getInvoiceCustomers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Get company ID from the authenticated user (set by AuthGuard)
      // Verificăm ambele formate (camelCase și snake_case) pentru compatibilitate
      const companyId = req.user?.companyId || req.user?.company_id;
      
      if (!companyId) {
        this.logger.warn('No company ID found in authenticated user');
        this.logger.debug(`User object debug: ${JSON.stringify(req.user)}`);
        res.status(400).json({ 
          error: 'Lipsă ID companie. Vă rugăm să vă autentificați din nou.' 
        });
        return;
      }
      
      this.logger.debug(`Getting invoicing customers for company ${companyId}`);
      this.logger.debug(`Token info: userPresent=${!!req.user}, companyIdFormat=${typeof companyId}, hasAuth=${!!req.headers.authorization}`);
      
      // Query companies marked as clients using Drizzle ORM
      this.logger.debug(`Getting customers for company ID: ${companyId}`);
      
      const { crm_companies } = await import('../../crm/schema/crm.schema');
      
      const customers = await this.drizzle.query(async (db) => {
        return await db
          .select({
            id: crm_companies.id,
            name: crm_companies.name,
            fiscalCode: crm_companies.vatNumber,
            registrationNumber: crm_companies.registrationNumber,
            address: crm_companies.address,
            city: crm_companies.city,
            county: crm_companies.postalCode,
            country: crm_companies.country,
            email: crm_companies.email,
            phone: crm_companies.phone
          })
          .from(crm_companies)
          .where(and(
            eq(crm_companies.companyId, companyId as string),
            eq(crm_companies.isCustomer, true)
          ));
      });
      
      this.logger.debug(`Found ${customers.length} customers for invoicing`);
      if (customers.length > 0) {
        this.logger.debug(`First customer: ${JSON.stringify(customers[0])}`);
      }
      
      res.status(200).json(customers);
    } catch (error) {
      this.logger.error(`Error getting invoicing customers: ${error}`);
      res.status(500).json({ 
        error: 'A apărut o eroare la încărcarea clienților. Încercați din nou sau contactați administratorul.'
      });
      next(error);
    }
  }
}