/**
 * Financial Data Service
 * 
 * Serviciu pentru gestionarea datelor financiare ale companiilor
 * și interogarea acestora de la ANAF
 */
import axios from 'axios';
import { BaseDrizzleService } from '../../../common/drizzle/modules/core/base-drizzle.service';
import { financialData, financialDataErrors, financialDataJobs, FinancialDataInsert, FinancialDataErrorInsert, FinancialDataJobInsert } from '../schema/financial-data.schema';
import { eq, and, sql } from 'drizzle-orm';
import { AuditService } from '../../audit/services/audit.service';
import { Logger } from '../../../common/logger';

const ANAF_BILANT_URL = 'https://webservicesp.anaf.ro/bilant';
const MAX_RETRY_COUNT = 3;
const CURRENT_YEAR = new Date().getFullYear();

/**
 * Serviciu pentru gestionarea datelor financiare
 */
export class FinancialDataService extends BaseDrizzleService {
  private logger = new Logger('FinancialDataService');
  
  constructor(
    private readonly auditService: AuditService
  ) {
    super();
  }

  /**
   * Interogare date financiare pentru un CUI și an fiscal specifice
   * Impune limitarea de 1 request pe secundă
   */
  async fetchFinancialData(cui: string, fiscalYear: number, userId?: string, companyId?: string): Promise<any> {
    try {
      this.logger.info(`🔍 Interogare date financiare pentru CUI ${cui}, anul ${fiscalYear}`);
      
      // Normalizare CUI (eliminare prefix RO)
      const normalizedCui = cui.replace(/^RO/, '');
      
      // Verificare existență date în baza de date
      const existingData = await this.query(async (db) => {
        return await db.select()
          .from(financialData)
          .where(and(
            eq(financialData.cui, normalizedCui),
            eq(financialData.fiscalYear, fiscalYear)
          ))
          .limit(1);
      });
      
      if (existingData.length > 0) {
        this.logger.info(`✅ Date financiare găsite în baza de date pentru CUI ${cui}, anul ${fiscalYear}`);
        return existingData[0];
      }
      
      // Construire URL pentru ANAF
      const url = `${ANAF_BILANT_URL}?an=${fiscalYear}&cui=${normalizedCui}`;
      
      // Interogare API ANAF
      this.logger.info(`📡 Trimitere cerere către ANAF: ${url}`);
      
      // Înregistrare audit
      if (userId && companyId) {
        await this.auditService.logEvent({
          eventType: 'anaf_bilant_request',
          module: 'anaf_financial_data',
          description: `Interogare bilanț ANAF pentru CUI ${normalizedCui}, anul ${fiscalYear}`,
          userId,
          companyId,
          entityId: normalizedCui,
          entityType: 'company_cui',
          data: { cui: normalizedCui, fiscalYear }
        });
      }
      
      const response = await axios.get(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'TalentInventory/1.0'
        }
      });
      
      const data = response.data;
      
      // Validare răspuns
      if (!data || !data.cui || !data.an) {
        throw new Error(`Răspuns invalid de la ANAF pentru CUI ${cui}, anul ${fiscalYear}`);
      }
      
      // Transformare indicatori în format adecvat
      const indicators = Array.isArray(data.i) ? data.i : [];
      
      // Salvare date în baza de date
      const insertData: FinancialDataInsert = {
        cui: normalizedCui,
        companyId: companyId || '',
        fiscalYear: data.an,
        companyName: data.deni || '',
        caenCode: data.caen || 0,
        caenDescription: data.den_caen || '',
        indicators: indicators,
        fetchedAt: new Date(),
        isProcessed: true,
        createdBy: userId,
        updatedBy: userId
      };
      
      const saved = await this.query(async (db) => {
        return await db.insert(financialData)
          .values(insertData)
          .returning();
      });
      
      this.logger.info(`✅ Date financiare salvate în baza de date pentru CUI ${cui}, anul ${fiscalYear}`);
      
      return saved[0];
    } catch (error: any) {
      this.logger.error(`❌ Eroare la interogarea datelor financiare pentru CUI ${cui}, anul ${fiscalYear}: ${error.message}`);
      
      // Înregistrare eroare în baza de date
      const errorData: FinancialDataErrorInsert = {
        cui,
        fiscalYear,
        errorMessage: error.message || 'Eroare necunoscută',
        retryCount: 0,
        lastAttemptAt: new Date(),
        isResolved: false
      };
      
      await this.query(async (db) => {
        await db.insert(financialDataErrors)
          .values(errorData)
          .returning();
      });
      
      // Re-throw pentru a permite tratarea erorilor în continuare
      throw error;
    }
  }
  
  /**
   * Obține datele financiare pentru o companie și un an fiscal
   */
  async getFinancialData(cui: string, fiscalYear: number): Promise<any> {
    const normalizedCui = cui.replace(/^RO/, '');
    
    const data = await this.query(async (db) => {
      return await db.select()
        .from(financialData)
        .where(and(
          eq(financialData.cui, normalizedCui),
          eq(financialData.fiscalYear, fiscalYear)
        ))
        .limit(1);
    });
    
    return data[0] || null;
  }
  
  /**
   * Obține toate datele financiare pentru o companie
   */
  async getAllFinancialData(cui: string): Promise<any[]> {
    const normalizedCui = cui.replace(/^RO/, '');
    
    return await this.query(async (db) => {
      return await db.select()
        .from(financialData)
        .where(eq(financialData.cui, normalizedCui))
        .orderBy(financialData.fiscalYear);
    });
  }
  
  /**
   * Obține datele financiare pentru o listă de companii și un an fiscal
   */
  async getBulkFinancialData(cuiList: string[], fiscalYear: number): Promise<any[]> {
    const normalizedCuiList = cuiList.map(cui => cui.replace(/^RO/, ''));
    
    return await this.query(async (db) => {
      return await db.select()
        .from(financialData)
        .where(and(
          sql`${financialData.cui} IN (${normalizedCuiList.join(',')})`,
          eq(financialData.fiscalYear, fiscalYear)
        ));
    });
  }
  
  /**
   * Creează un job pentru interogarea datelor financiare pentru o companie
   * pentru toți anii disponibili (de la startYear la endYear)
   */
  async createFinancialDataJob(
    cui: string, 
    companyId: string, 
    startYear: number = 2014, 
    endYear: number = CURRENT_YEAR,
    userId?: string
  ): Promise<any> {
    const normalizedCui = cui.replace(/^RO/, '');
    const totalYears = (endYear - startYear) + 1;
    
    // Verificare job existent în curs
    const existingJob = await this.query(async (db) => {
      return await db.select()
        .from(financialDataJobs)
        .where(and(
          eq(financialDataJobs.cui, normalizedCui),
          eq(financialDataJobs.status, 'pending')
        ))
        .limit(1);
    });
    
    if (existingJob.length > 0) {
      return existingJob[0];
    }
    
    // Creare job nou
    const jobData: FinancialDataJobInsert = {
      cui: normalizedCui,
      companyId,
      status: 'pending',
      startYear,
      endYear,
      currentYear: startYear,
      progress: 0,
      totalYears,
      createdBy: userId
    };
    
    const job = await this.query(async (db) => {
      return await db.insert(financialDataJobs).values(jobData).returning();
    });
    
    // Înregistrare audit
    if (userId) {
      await this.auditService.logEvent({
        eventType: 'anaf_financial_job_created',
        module: 'anaf_financial_data',
        description: `Job creat pentru interogare bilanțuri ANAF pentru CUI ${normalizedCui}, anii ${startYear}-${endYear}`,
        userId,
        companyId,
        entityId: normalizedCui,
        entityType: 'company_cui',
        data: { cui: normalizedCui, startYear, endYear, totalYears }
      });
    }
    
    return job[0];
  }
  
  /**
   * Actualizează statusul unui job
   */
  async updateJobStatus(jobId: number, status: string, progress: number, currentYear?: number): Promise<any> {
    const updateData: any = {
      status,
      progress,
      lastProcessedAt: new Date()
    };
    
    if (currentYear) {
      updateData.currentYear = currentYear;
    }
    
    if (status === 'completed') {
      updateData.completedAt = new Date();
    }
    
    const updated = await this.query(async (db) => {
      return await db.update(financialDataJobs)
        .set(updateData)
        .where(eq(financialDataJobs.id, jobId))
        .returning();
    });
    
    return updated[0];
  }
  
  /**
   * Obține joburile în așteptare
   */
  async getPendingJobs(limit: number = 10): Promise<any[]> {
    return await this.query(async (db) => {
      return await db.select()
        .from(financialDataJobs)
        .where(eq(financialDataJobs.status, 'pending'))
        .limit(limit);
    });
  }
  
  /**
   * Obține un job după ID
   */
  async getJobById(jobId: number): Promise<any[]> {
    return await this.query(async (db) => {
      return await db.select()
        .from(financialDataJobs)
        .where(eq(financialDataJobs.id, jobId))
        .limit(1);
    });
  }
  
  /**
   * Obține erorile nerezolvate
   */
  async getUnresolvedErrors(): Promise<any[]> {
    return await this.query(async (db) => {
      return await db.select()
        .from(financialDataErrors)
        .where(eq(financialDataErrors.isResolved, false));
    });
  }
  
  /**
   * Incrementează contorul de reîncercări pentru o eroare
   */
  async incrementErrorRetryCount(errorId: number): Promise<void> {
    await this.query(async (db) => {
      await db.update(financialDataErrors)
        .set({
          retryCount: sql`${financialDataErrors.retryCount} + 1`,
          lastAttemptAt: new Date()
        })
        .where(eq(financialDataErrors.id, errorId));
    });
  }
  
  /**
   * Marchează o eroare ca rezolvată
   */
  async markErrorAsResolved(errorId: number): Promise<void> {
    await this.query(async (db) => {
      await db.update(financialDataErrors)
        .set({
          isResolved: true
        })
        .where(eq(financialDataErrors.id, errorId));
    });
  }
  
  /**
   * Obține statistici despre datele financiare
   */
  async getFinancialDataStats(companyId?: string): Promise<any> {
    const stats = await this.query(async (db) => {
      const baseQuery = db.select({
        totalRecords: sql`COUNT(*)`,
        uniqueCompanies: sql`COUNT(DISTINCT ${financialData.cui})`,
        earliestYear: sql`MIN(${financialData.fiscalYear})`,
        latestYear: sql`MAX(${financialData.fiscalYear})`,
        avgIndicatorsPerRecord: sql`AVG(jsonb_array_length(${financialData.indicators}))`
      })
      .from(financialData);

      if (companyId) {
        return await baseQuery.where(eq(financialData.companyId, companyId));
      }

      return await baseQuery;
    });

    return stats[0];
  }
}