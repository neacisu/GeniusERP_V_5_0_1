/**
 * Company Controller
 * 
 * Handles HTTP requests related to CRM companies
 */
import { Request, Response } from 'express';
import { DrizzleService } from "@common/drizzle/drizzle.service";
import { JwtAuthMode } from '@geniuserp/auth';
import { AuthGuard } from '@geniuserp/auth';
import { UserRole } from '@geniuserp/auth';
import { v4 as uuidv4 } from 'uuid';
import { crm_companies } from '../schema/crm.schema';
import { eq, like, or, sql } from 'drizzle-orm';
import { analytic_accounts, synthetic_accounts } from '@geniuserp/shared';

export class CompanyController {
  private db: DrizzleService;
  private jwtService: any = null;

  constructor(db?: DrizzleService) {
    this.db = db || new DrizzleService();

    // Bind the methods to this instance
    this.createCompany = this.createCompany.bind(this);
    this.getCompany = this.getCompany.bind(this);
    this.updateCompany = this.updateCompany.bind(this);
    this.deleteCompany = this.deleteCompany.bind(this);
    this.listCompanies = this.listCompanies.bind(this);
  }

  /**
   * Register routes
   */
  registerRoutes(app: any, jwtService?: any) {
    // Store JWT service reference
    if (jwtService) {
      this.jwtService = jwtService;
    }

    // Company routes
    // Create company - requires sales_agent, company_admin or admin role
    app.post(
      '/api/crm/companies', 
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.SALES_AGENT, UserRole.COMPANY_ADMIN, UserRole.ADMIN]),
      this.createCompany
    );

    // Get company by ID
    app.get(
      '/api/crm/companies/:id', 
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.getCompany
    );

    // Update company - requires sales_agent, company_admin or admin role
    app.put(
      '/api/crm/companies/:id', 
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.SALES_AGENT, UserRole.COMPANY_ADMIN, UserRole.ADMIN]),
      this.updateCompany
    );

    // Delete company - requires company_admin or admin role
    app.delete(
      '/api/crm/companies/:id', 
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.COMPANY_ADMIN, UserRole.ADMIN]),
      this.deleteCompany
    );

    // List all companies
    app.get(
      '/api/crm/companies', 
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.listCompanies
    );
  }

  /**
   * Find the next available analytic account number
   * @param prefix The prefix for the analytic account (401 or 4111)
   * @param companyId The company ID to search within
   */
  /**
   * Synchronize an analytic account between crm_companies and analytic_accounts table
   * @param code The analytic account code (401.x or 4111.x format)
   * @param companyName The company name to use for the analytic account name
   * @returns true if successful, false otherwise
   */
  private async syncAnalyticAccount(code: string, companyName: string): Promise<boolean> {
    try {
      console.log(`[CompanyController] Syncing analytic account ${code} for company ${companyName}`);
      
      // First check if the account already exists in PC_analytic_accounts
      const existingAccount = await this.db.executeQuery(`
        SELECT * FROM PC_analytic_accounts
        WHERE code = $1
        LIMIT 1
      `, [code]);
      
      if (existingAccount && existingAccount.length > 0) {
        console.log(`[CompanyController] Analytic account ${code} already exists in PC_analytic_accounts`);
        return true; // Account already exists, consider it synced
      }
      
      // Figure out which synthetic account to link to
      const prefix = code.split('.')[0]; // Get the prefix (401 or 4111)
      
      // Find corresponding synthetic account
      const syntheticAccount = await this.db.executeQuery(`
        SELECT * FROM PC_synthetic_accounts
        WHERE code = $1
        LIMIT 1
      `, [prefix]);
      
      if (!syntheticAccount || syntheticAccount.length === 0) {
        console.error(`[CompanyController] Could not find synthetic account with code ${prefix}`);
        return false;
      }
      
      const syntheticId = syntheticAccount[0].id;
      const accountFunction = syntheticAccount[0].account_function; // Inherit function from synthetic account
      
      // Create new analytic account
      const analyticAccountData = {
        code: code,
        name: `${companyName} - ${code}`,
        description: `Cont analitic pentru compania ${companyName}`,
        synthetic_id: syntheticId,
        account_function: accountFunction,
        is_active: true
      };
      
      // Insert the analytic account
      await this.db.executeQuery(`
        INSERT INTO PC_analytic_accounts (code, name, description, synthetic_id, account_function, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (code) DO NOTHING
      `, [
        analyticAccountData.code,
        analyticAccountData.name,
        analyticAccountData.description,
        analyticAccountData.synthetic_id,
        analyticAccountData.account_function,
        analyticAccountData.is_active
      ]); // Extra protection against duplicates
      
      console.log(`[CompanyController] Successfully created analytic account ${code} in PC_analytic_accounts`);
      return true;
    } catch (error) {
      console.error(`[CompanyController] Error syncing analytic account ${code}:`, error);
      return false;
    }
  }
  
  /**
   * Find the next available analytic account number and ensure it doesn't exist in either table
   * @param prefix The prefix for the analytic account (401 or 4111)
   * @param companyId The company ID to search within
   */
  private async getNextAnalyticAccountNumber(prefix: string, companyId: string): Promise<string> {
    try {
      console.log(`[CompanyController] Finding next available ${prefix}.x account number`);
      const columnName = `analythic_${prefix}`;
      
      // Query to find the highest existing account number in crm_companies
      const query = `
        SELECT ${columnName} 
        FROM crm_companies 
        WHERE company_id = $1 
          AND ${columnName} IS NOT NULL 
          AND ${columnName} LIKE '${prefix}.%'
        ORDER BY ${columnName} DESC 
        LIMIT 1
      `;
      
      const result = await this.db.executeQuery(query, [companyId]);
      
      let nextNumber = 1;
      
      if (result && result.length > 0) {
        const lastAccount = result[0][columnName];
        if (lastAccount && typeof lastAccount === 'string') {
          const parts = lastAccount.split('.');
          if (parts.length === 2) {
            const lastNumber = parseInt(parts[1], 10);
            if (!isNaN(lastNumber)) {
              nextNumber = lastNumber + 1;
            }
          }
        }
      }
      
      // Also check PC_analytic_accounts table to ensure number is unique there too
      let isUnique = false;
      let candidateCode = '';
      
      while (!isUnique) {
        candidateCode = `${prefix}.${nextNumber}`;
        
        // Check if this code exists in PC_analytic_accounts
        const existingAnalytic = await this.db.executeQuery(`
          SELECT * FROM PC_analytic_accounts
          WHERE code = $1
          LIMIT 1
        `, [candidateCode]);
        
        if (existingAnalytic && existingAnalytic.length > 0) {
          // Code already exists in PC_analytic_accounts, try next number
          nextNumber++;
        } else {
          isUnique = true;
        }
      }
      
      console.log(`[CompanyController] Next ${prefix}.x account number: ${candidateCode}`);
      return candidateCode;
    } catch (error) {
      console.error(`[CompanyController] Error finding next analytic account number for ${prefix}:`, error);
      return `${prefix}.1`; // Default to 1 if there's an error
    }
  }

  /**
   * Create a new company
   */
  async createCompany(req: Request, res: Response) {
    try {
      console.log('[CompanyController] Creating company:', req.body);
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      if (!userId || !companyId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Validate the request body
      if (!req.body.name) {
        return res.status(400).json({ message: 'Company name is required' });
      }

      if (!req.body.fiscalCode) {
        return res.status(400).json({ message: 'Fiscal code is required' });
      }

      if (!req.body.type) {
        return res.status(400).json({ message: 'Company type is required' });
      }

      // Use the explicit cui field if provided, otherwise format fiscalCode according to VAT status
      let cuiValue = '';
      
      if (req.body.cui) {
        // If cui is explicitly provided, use it as is (already formatted correctly on client)
        cuiValue = req.body.cui.trim().toUpperCase();
        console.log(`[CompanyController] Using provided cui value: ${cuiValue}`);
      } else {
        // Fallback to formatting fiscalCode
        cuiValue = req.body.fiscalCode || '';
        if (typeof cuiValue === 'string') {
          cuiValue = cuiValue.trim().toUpperCase();
          
          // If company is VAT payer, ensure it has RO prefix
          if (req.body.vatPayer === true) {
            if (!cuiValue.startsWith('RO')) {
              cuiValue = `RO${cuiValue}`;
            }
          } else {
            // For non-VAT payers, remove RO prefix if it exists
            if (cuiValue.startsWith('RO')) {
              cuiValue = cuiValue.substring(2);
            }
          }
        }
        console.log(`[CompanyController] Formatted fiscalCode to cui: ${cuiValue}`);
      }
      
      // Check for duplicates
      try {
        const existingCompany = await this.db.executeQuery(`
          SELECT * FROM crm_companies
          WHERE cui = $1 AND company_id = $2
          LIMIT 1
        `, [cuiValue, companyId]);
        
        if (existingCompany && existingCompany.length > 0) {
          return res.status(400).json({ 
            message: 'Duplicate CUI detected', 
            error: `A company with CUI ${cuiValue} already exists.` 
          });
        }
      } catch (duplicateError) {
        console.error('[CompanyController] Error checking for duplicates:', duplicateError);
        // Continue with creation since this is just a validation
      }

      // Generate analytic account numbers if company is customer or supplier
      let analythic401Value = null;
      let analythic4111Value = null;

      if (req.body.isSupplier === true) {
        analythic401Value = await this.getNextAnalyticAccountNumber('401', companyId);
      }

      if (req.body.isCustomer === true) {
        analythic4111Value = await this.getNextAnalyticAccountNumber('4111', companyId);
      }

      // Prepare the company data
      const companyData = {
        name: req.body.name,
        description: req.body.notes || null,
        website: req.body.website || null,
        industry: req.body.industry || null,
        phone: req.body.phone || null,
        email: req.body.email || null,
        address: req.body.address || null,
        city: req.body.city || null,
        postalCode: req.body.postalCode || null,
        country: req.body.country || null,
        vatNumber: req.body.fiscalCode || null,
        registrationNumber: req.body.regNumber || null,
        cui: cuiValue, // Add the formatted CUI value
        companyId: companyId,
        status: req.body.isActive ? 'active' : 'inactive',
        customFields: {
          street: req.body.street || null,
          streetNumber: req.body.streetNumber || null,
          addressDetails: req.body.addressDetails || null,
          county: req.body.county || null,
          vatPayer: req.body.vatPayer || false,
          vatIncasare: req.body.vatIncasare || false,
          isSupplier: req.body.isSupplier || false,
          isCustomer: req.body.isCustomer || true,
          contactPerson: req.body.contactPerson || null,
          leadScore: req.body.leadScore || 50,
          bankAccount: req.body.bankAccount || null,
          bank: req.body.bank || null,
          socialCapital: req.body.socialCapital ? Number(req.body.socialCapital) : null,
          type: req.body.type || 'lead'
        },
        isCustomer: req.body.isCustomer || true,
        isSupplier: req.body.isSupplier || false,
        analythic_401: analythic401Value,
        analythic_4111: analythic4111Value,
        createdBy: userId,
        updatedBy: userId
      };

      // Insert the company into the database
      console.log('[CompanyController] Inserting company data:', companyData);
      try {
        const result = await this.db.query(async (db) => {
          return await db.insert(crm_companies)
            .values(companyData)
            .returning();
        });
        
        console.log('[CompanyController] Insert result:', result);
        
        // Now sync the analytic accounts with the analytic_accounts table
        if (analythic401Value) {
          await this.syncAnalyticAccount(analythic401Value, companyData.name);
        }
        
        if (analythic4111Value) {
          await this.syncAnalyticAccount(analythic4111Value, companyData.name);
        }
        
        return res.status(201).json(result[0]);
      } catch (insertError) {
        console.error('[CompanyController] Database insertion error:', insertError);
        return res.status(500).json({ 
          message: 'Failed to insert company data', 
          error: (insertError as Error).message 
        });
      }
    } catch (error) {
      console.error('[CompanyController] Error creating company:', error);
      return res.status(500).json({ message: 'Failed to create company', error: (error as Error).message });
    }
  }

  /**
   * Get a company by ID
   */
  async getCompany(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      console.log(`[CompanyController] Getting company by id: ${id} for companyId: ${companyId}`);

      try {
        // Using direct query
        const company = await this.db.query(async (db) => {
          return await db.query.crm_companies.findFirst({
            where: (companies: any, { eq, and }: any) => 
              and(
                eq(companies.id, id),
                eq(companies.companyId, companyId)
              )
          });
        });

        if (!company) {
          return res.status(404).json({ message: 'Company not found' });
        }

        return res.json(company);
      } catch (queryError) {
        console.error('[CompanyController] Error querying company:', queryError);
        throw queryError;
      }
    } catch (error) {
      console.error('[CompanyController] Error getting company:', error);
      return res.status(500).json({ message: 'Failed to get company', error: (error as Error).message });
    }
  }

  /**
   * Update a company
   */
  async updateCompany(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      if (!userId || !companyId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      // Check if the company exists
      console.log(`[CompanyController] Checking if company exists: ${id} for companyId: ${companyId}`);
      
      let existingCompany;
      try {
        // Direct query to find company
        existingCompany = await this.db.query(async (db) => {
          return await db.query.crm_companies.findFirst({
            where: (companies: any, { eq, and }: any) => 
              and(
                eq(companies.id, id),
                eq(companies.companyId, companyId)
              )
          });
        });
        
        console.log('[CompanyController] Found existing company:', existingCompany ? 'yes' : 'no');

        if (!existingCompany) {
          return res.status(404).json({ message: 'Company not found' });
        }

        // Prepare the updated data
        const updateData: any = {
          updatedBy: userId,
          updatedAt: new Date()
        };

        // Handle CUI for updates
        if (req.body.cui !== undefined || req.body.fiscalCode || req.body.vatPayer !== undefined) {
          let cuiValue;
          
          // Prioritize explicit cui value if provided (already correctly formatted on client)
          if (req.body.cui) {
            cuiValue = req.body.cui.trim().toUpperCase();
            console.log(`[CompanyController] Using provided cui value for update: ${cuiValue}`);
          } else if (req.body.fiscalCode || req.body.vatPayer !== undefined) {
            // Fallback to formatting fiscalCode based on VAT status
            cuiValue = req.body.fiscalCode || existingCompany.vat_number || existingCompany.cui || '';
            if (typeof cuiValue === 'string') {
              cuiValue = cuiValue.trim().toUpperCase();
              
              // Check if VAT status is being updated or use existing status
              const vatPayer = req.body.vatPayer !== undefined 
                ? req.body.vatPayer 
                : (existingCompany.customFields?.vatPayer || false);
              
              // If company is VAT payer, ensure it has RO prefix
              if (vatPayer === true) {
                if (!cuiValue.startsWith('RO')) {
                  cuiValue = `RO${cuiValue}`;
                }
              } else {
                // For non-VAT payers, remove RO prefix if it exists
                if (cuiValue.startsWith('RO')) {
                  cuiValue = cuiValue.substring(2);
                }
              }
              console.log(`[CompanyController] Formatted fiscalCode to cui for update: ${cuiValue}`);
            }
          }
          
          // If CUI is changing, check for duplicates
          if (cuiValue && cuiValue !== existingCompany.cui) {
            try {
              const existingCompanyWithCui = await this.db.query(async (db) => {
                return await db.select().from(crm_companies)
                  .where(sql`cui = ${cuiValue} AND company_id = ${companyId} AND id <> ${id}`)
                  .limit(1);
              });
              
              if (existingCompanyWithCui && existingCompanyWithCui.length > 0) {
                return res.status(400).json({ 
                  message: 'Duplicate CUI detected', 
                  error: `A company with CUI ${cuiValue} already exists.` 
                });
              }
            } catch (duplicateError) {
              console.error('[CompanyController] Error checking for duplicates:', duplicateError);
              // Continue with update since this is just a validation
            }
          }
          
          // Add the formatted CUI to the updateData if we have a value
          if (cuiValue) {
            updateData.cui = cuiValue;
          }
        }

        // Add all the fields that can be updated
        if (req.body.name) updateData.name = req.body.name;
        if (req.body.notes) updateData.description = req.body.notes;
        if (req.body.website) updateData.website = req.body.website;
        if (req.body.industry) updateData.industry = req.body.industry;
        if (req.body.phone) updateData.phone = req.body.phone;
        if (req.body.email) updateData.email = req.body.email;
        if (req.body.address) updateData.address = req.body.address;
        if (req.body.city) updateData.city = req.body.city;
        if (req.body.postalCode) updateData.postalCode = req.body.postalCode;
        if (req.body.country) updateData.country = req.body.country;
        if (req.body.fiscalCode) updateData.vat_number = req.body.fiscalCode;
        if (req.body.regNumber) updateData.registrationNumber = req.body.regNumber;
        if (req.body.isActive !== undefined) updateData.status = req.body.isActive ? 'active' : 'inactive';

        // Handle custom fields
        const currentCustomFields = existingCompany.customFields || {};
        const updatedCustomFields = { ...currentCustomFields };

        // Update custom fields if provided
        if (req.body.street !== undefined) updatedCustomFields.street = req.body.street;
        if (req.body.streetNumber !== undefined) updatedCustomFields.streetNumber = req.body.streetNumber;
        if (req.body.addressDetails !== undefined) updatedCustomFields.addressDetails = req.body.addressDetails;
        if (req.body.county !== undefined) updatedCustomFields.county = req.body.county;
        if (req.body.vatPayer !== undefined) updatedCustomFields.vatPayer = req.body.vatPayer;
        if (req.body.vatIncasare !== undefined) updatedCustomFields.vatIncasare = req.body.vatIncasare;
        if (req.body.isSupplier !== undefined) updatedCustomFields.isSupplier = req.body.isSupplier;
        if (req.body.isCustomer !== undefined) updatedCustomFields.isCustomer = req.body.isCustomer;
        if (req.body.contactPerson !== undefined) updatedCustomFields.contactPerson = req.body.contactPerson;
        if (req.body.leadScore !== undefined) updatedCustomFields.leadScore = req.body.leadScore;
        if (req.body.bankAccount !== undefined) updatedCustomFields.bankAccount = req.body.bankAccount;
        if (req.body.bank !== undefined) updatedCustomFields.bank = req.body.bank;
        if (req.body.socialCapital !== undefined) updatedCustomFields.socialCapital = req.body.socialCapital ? Number(req.body.socialCapital) : null;
        if (req.body.type !== undefined) updatedCustomFields.type = req.body.type;

        updateData.customFields = updatedCustomFields;
        
        // Update isCustomer and isSupplier fields
        const wasCustomer = existingCompany.isCustomer || (existingCompany.customFields && existingCompany.customFields.isCustomer);
        const wasSupplier = existingCompany.isSupplier || (existingCompany.customFields && existingCompany.customFields.isSupplier);
        
        if (req.body.isCustomer !== undefined) {
          // If a company already has an analytic 4111 account, it must remain a customer
          if (existingCompany.analythic_4111 && req.body.isCustomer === false) {
            console.log(`[CompanyController] Cannot change customer status for company with analytic account: ${existingCompany.analythic_4111}`);
            return res.status(403).json({ 
              message: 'Nu se poate schimba statusul de client', 
              error: 'Companiile cu conturi analitice de client (4111.x) nu pot fi modificate în non-client.' 
            });
          }
          
          updateData.isCustomer = req.body.isCustomer;
          updatedCustomFields.isCustomer = req.body.isCustomer;
          
          // Create analytic account for customer if not exists and the company is now a customer
          if (req.body.isCustomer === true && (!existingCompany.analythic_4111 || !wasCustomer)) {
            updateData.analythic_4111 = await this.getNextAnalyticAccountNumber('4111', companyId);
            console.log(`[CompanyController] Created new analytic account for customer: ${updateData.analythic_4111}`);
            
            // We will need to sync this new account after the update is done
            updateData._needSyncAnalytic4111 = true;
          }
        }
        
        if (req.body.isSupplier !== undefined) {
          // If a company already has an analytic 401 account, it must remain a supplier
          if (existingCompany.analythic_401 && req.body.isSupplier === false) {
            console.log(`[CompanyController] Cannot change supplier status for company with analytic account: ${existingCompany.analythic_401}`);
            return res.status(403).json({ 
              message: 'Nu se poate schimba statusul de furnizor', 
              error: 'Companiile cu conturi analitice de furnizor (401.x) nu pot fi modificate în non-furnizor.' 
            });
          }
          
          updateData.isSupplier = req.body.isSupplier;
          updatedCustomFields.isSupplier = req.body.isSupplier;
          
          // Create analytic account for supplier if not exists and the company is now a supplier
          if (req.body.isSupplier === true && (!existingCompany.analythic_401 || !wasSupplier)) {
            updateData.analythic_401 = await this.getNextAnalyticAccountNumber('401', companyId);
            console.log(`[CompanyController] Created new analytic account for supplier: ${updateData.analythic_401}`);
            
            // We will need to sync this new account after the update is done
            updateData._needSyncAnalytic401 = true;
          }
        }

        // Update the company in the database
        console.log('[CompanyController] Updating company with data:', updateData);
        
        // Direct update query
        const result = await this.db.query(async (db) => {
          return await db.update(crm_companies)
            .set(updateData)
            .where(sql`id = ${id} AND company_id = ${companyId}`)
            .returning();
        });
        
        console.log('[CompanyController] Update result:', result);
        
        if (!result || result.length === 0) {
          return res.status(404).json({ message: 'Company update failed - no records affected' });
        }
        
        // Sync new analytic accounts with the analytic_accounts table if created
        const updatedCompany = result[0];
        
        if (updateData._needSyncAnalytic4111 && updatedCompany.analythic_4111) {
          await this.syncAnalyticAccount(updatedCompany.analythic_4111, updatedCompany.name);
        }
        
        if (updateData._needSyncAnalytic401 && updatedCompany.analythic_401) {
          await this.syncAnalyticAccount(updatedCompany.analythic_401, updatedCompany.name);
        }
        
        return res.json(updatedCompany);
      } catch (queryError) {
        console.error('[CompanyController] Error during company operation:', queryError);
        throw queryError;
      }
    } catch (error) {
      console.error('[CompanyController] Error updating company:', error);
      return res.status(500).json({ message: 'Failed to update company', error: (error as Error).message });
    }
  }

  /**
   * Delete a company
   */
  async deleteCompany(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const companyId = req.user?.companyId;

      if (!userId || !companyId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      console.log(`[CompanyController] Deleting company: ${id} for companyId: ${companyId}`);
      
      try {
        // First check if the company has analytic accounts
        const existingCompany = await this.db.query(async (db) => {
          return await db.select().from(crm_companies)
            .where(sql`id = ${id} AND company_id = ${companyId}`)
            .limit(1);
        });
        
        if (!existingCompany || existingCompany.length === 0) {
          return res.status(404).json({ message: 'Company not found' });
        }
        
        // Check if the company has any analytic accounts
        if (existingCompany[0].analythic_401 || existingCompany[0].analythic_4111) {
          return res.status(403).json({ 
            message: 'Nu poate fi ștearsă această companie', 
            error: 'Companiile cu conturi analitice (client/furnizor) nu pot fi șterse din sistem.' 
          });
        }
        
        // If no analytic accounts, proceed with deletion
        const result = await this.db.query(async (db) => {
          return await db.delete(crm_companies)
            .where(sql`id = ${id} AND company_id = ${companyId}`)
            .returning();
        });
        
        console.log('[CompanyController] Delete result:', result);

        if (!result || result.length === 0) {
          return res.status(404).json({ message: 'Company not found' });
        }

        return res.json({ message: 'Company deleted successfully' });
      } catch (deleteError) {
        console.error('[CompanyController] Error during delete operation:', deleteError);
        throw deleteError;
      }
    } catch (error) {
      console.error('[CompanyController] Error deleting company:', error);
      return res.status(500).json({ message: 'Failed to delete company', error: (error as Error).message });
    }
  }

  /**
   * List companies with filtering and pagination
   */
  async listCompanies(req: Request, res: Response) {
    try {
      const companyId = req.user?.companyId;

      if (!companyId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const {
        page = '1',
        limit = '20',
        searchTerm,
        type,
        status,
        sortBy = 'created_at',
        sortDirection = 'desc',
        isCustomer
      } = req.query;

      const pageNumber = parseInt(page as string, 10);
      const limitNumber = parseInt(limit as string, 10);
      const offset = (pageNumber - 1) * limitNumber;

      // Get companies
      console.log('[CompanyController] Listing companies for companyId:', companyId);
      
      try {
        // Înlocuim metodele Drizzle ORM cu interogări SQL directe pentru
        // a fi siguri că funcționează cu orice versiune a Drizzle
        let sqlQuery = `
          SELECT * FROM crm_companies 
          WHERE company_id = $1
        `;
        
        const params = [companyId];
        let paramIndex = 2; // Începem de la 2 deoarece am folosit deja $1
        
        // Adăugăm filtrarea pentru căutare textuală
        if (searchTerm && typeof searchTerm === 'string') {
          const searchString = `%${searchTerm}%`;
          sqlQuery += ` AND (name ILIKE $${paramIndex} OR vat_number ILIKE $${paramIndex} OR cui ILIKE $${paramIndex})`;
          params.push(searchString);
          paramIndex++;
        }
        
        // Adăugăm filtrarea pentru tip
        if (type && typeof type === 'string') {
          sqlQuery += ` AND custom_fields->>'type' = $${paramIndex}`;
          params.push(type);
          paramIndex++;
        }
        
        // Adăugăm filtrarea pentru status
        if (status && typeof status === 'string') {
          sqlQuery += ` AND status = $${paramIndex}`;
          params.push(status);
          paramIndex++;
        }
        
        // Adăugăm filtrare pentru clienți
        if (isCustomer === 'true') {
          sqlQuery += ` AND is_customer = true`;
        }
        
        // Adăugăm sortarea
        if (sortBy && sortDirection) {
          if (typeof sortBy === 'string' && sortBy.startsWith('customFields.')) {
            const fieldName = sortBy.split('.')[1];
            sqlQuery += ` ORDER BY custom_fields->'${fieldName}' ${sortDirection === 'asc' ? 'ASC' : 'DESC'}`;
          } else {
            // Convertim camelCase la snake_case pentru a se potrivi cu formatul din baza de date
            let sortCol = sortBy as string;
            if (sortCol === 'createdAt') sortCol = 'created_at';
            if (sortCol === 'updatedAt') sortCol = 'updated_at';
            if (sortCol === 'companyId') sortCol = 'company_id';
            if (sortCol === 'vatNumber') sortCol = 'vat_number';
            if (sortCol === 'registrationNumber') sortCol = 'registration_number';
            if (sortCol === 'postalCode') sortCol = 'postal_code';
            
            sqlQuery += ` ORDER BY ${sortCol} ${sortDirection === 'asc' ? 'ASC' : 'DESC'}`;
          }
        }
        
        // Adăugăm paginarea
        sqlQuery += ` LIMIT ${limitNumber} OFFSET ${offset}`;
        
        // Executăm interogarea folosind metoda executeQuery
        const companies = await this.db.executeQuery(sqlQuery, params);
        console.log(`[CompanyController] Found ${companies.length} companies`);
        
        // Obținem numărul total de înregistrări
        let countQuery = `
          SELECT COUNT(*) FROM crm_companies 
          WHERE company_id = $1
        `;
        
        const countParams = [companyId];
        let countParamIndex = 2;
        
        // Aplicăm aceleași filtre la interogarea de numărare
        if (searchTerm && typeof searchTerm === 'string') {
          const searchString = `%${searchTerm}%`;
          countQuery += ` AND (name ILIKE $${countParamIndex} OR vat_number ILIKE $${countParamIndex} OR cui ILIKE $${countParamIndex})`;
          countParams.push(searchString);
          countParamIndex++;
        }
        
        if (type && typeof type === 'string') {
          countQuery += ` AND custom_fields->>'type' = $${countParamIndex}`;
          countParams.push(type);
          countParamIndex++;
        }
        
        if (status && typeof status === 'string') {
          countQuery += ` AND status = $${countParamIndex}`;
          countParams.push(status);
          countParamIndex++;
        }
        
        if (isCustomer === 'true') {
          countQuery += ` AND is_customer = true`;
        }
        
        const totalResult = await this.db.executeQuery(countQuery, countParams);
        console.log('[CompanyController] Total count result:', totalResult);
        
        const total = parseInt(totalResult[0].count, 10);
        
        return res.json({
          data: companies,
          meta: {
            total,
            page: pageNumber,
            limit: limitNumber,
            totalPages: Math.ceil(total / limitNumber)
          }
        });
      } catch (queryError) {
        console.error('[CompanyController] Error during list operation:', queryError);
        throw queryError;
      }
    } catch (error) {
      console.error('[CompanyController] Error listing companies:', error);
      return res.status(500).json({ message: 'Failed to list companies', error: (error as Error).message });
    }
  }
}

export default CompanyController;