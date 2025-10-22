/**
 * Financial Data Controller
 * 
 * Controller pentru gestionarea datelor financiare obținute de la ANAF
 * Oferă endpoint-uri pentru interogare, administrare și raportare a datelor financiare
 */
import { Request, Response } from 'express';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode, UserRole } from '../../auth/types';
import { FinancialDataService } from '../services/financial-data.service';
import { FinancialQueueService } from '../services/financial-queue.service';
import { DrizzleService } from "@common/drizzle/drizzle.service";
import { AuditService } from '../../audit/services/audit.service';
import { Logger } from "@common/logger";
import { createFinancialDataJobSchema } from '../schema/financial-data.schema';
import { z } from 'zod';

const logger = new Logger('FinancialDataController');

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Controller pentru datele financiare
 */
export class FinancialDataController {
  private financialDataService: FinancialDataService;
  private financialQueueService: FinancialQueueService;
  
  constructor() {
    const db = new DrizzleService();
    const auditService = new AuditService();
    
    this.financialDataService = new FinancialDataService(auditService);
    this.financialQueueService = new FinancialQueueService(db, this.financialDataService, auditService);
    
    logger.info('FinancialDataController inițializat');
  }
  
  /**
   * Declanșează un job de interogare date financiare pentru o companie
   * @route POST /api/crm/financial-data/job
   */
  createFinancialDataJob = async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      
      if (!user || !user.id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const validationResult = createFinancialDataJobSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Date invalide', 
          details: validationResult.error.issues 
        });
      }
      
      const { cui, companyId, startYear = 2014, endYear = CURRENT_YEAR } = validationResult.data;
      
      logger.info(`Creare job pentru datele financiare ale companiei cu CUI ${cui}, perioada ${startYear}-${endYear}`);
      
      const job = await this.financialQueueService.createFinancialDataJob(
        cui, 
        companyId, 
        startYear, 
        endYear,
        user.id
      );
      
      return res.status(201).json({
        success: true,
        job: {
          id: job.id,
          cui: job.cui,
          startYear: job.startYear,
          endYear: job.endYear,
          status: job.status,
          progress: job.progress,
          totalYears: job.totalYears,
          createdAt: job.createdAt
        },
        message: `Job creat pentru interogarea datelor financiare ale companiei cu CUI ${cui} pentru anii ${startYear}-${endYear}`
      });
    } catch (error: any) {
      logger.error(`Eroare la crearea job-ului: ${error.message}`);
      return res.status(500).json({ 
        error: 'Eroare internă', 
        message: error.message 
      });
    }
  };
  
  /**
   * Obține datele financiare pentru o companie și un an specific
   * @route GET /api/crm/financial-data/:cui/:year
   */
  getFinancialData = async (req: Request, res: Response) => {
    try {
      const { cui, year } = req.params;
      
      if (!cui || !year) {
        return res.status(400).json({ error: 'CUI și anul sunt obligatorii' });
      }
      
      const fiscalYear = parseInt(year);
      
      if (isNaN(fiscalYear)) {
        return res.status(400).json({ error: 'Anul trebuie să fie un număr' });
      }
      
      logger.info(`Interogare date financiare pentru CUI ${cui}, anul ${fiscalYear}`);
      
      const data = await this.financialDataService.getFinancialData(cui, fiscalYear);
      
      if (!data) {
        // Dacă datele nu există în baza de date, încercăm să le obținem de la ANAF
        const user = req.user as any;
        
        if (user && user.id && user.companyId) {
          logger.info(`Datele nu există în baza de date, interogăm ANAF pentru CUI ${cui}, anul ${fiscalYear}`);
          
          try {
            const fetchedData = await this.financialDataService.fetchFinancialData(
              cui, 
              fiscalYear,
              user.id,
              user.companyId
            );
            
            return res.json({
              success: true,
              data: fetchedData,
              source: 'anaf'
            });
          } catch (error: any) {
            return res.status(404).json({ 
              error: 'Date indisponibile', 
              message: `Nu s-au putut obține datele financiare pentru CUI ${cui}, anul ${fiscalYear}`,
              details: error.message
            });
          }
        }
        
        return res.status(404).json({ 
          error: 'Date indisponibile', 
          message: `Nu există date financiare pentru CUI ${cui}, anul ${fiscalYear}` 
        });
      }
      
      return res.json({
        success: true,
        data,
        source: 'database'
      });
    } catch (error: any) {
      logger.error(`Eroare la interogarea datelor financiare: ${error.message}`);
      return res.status(500).json({ 
        error: 'Eroare internă', 
        message: error.message 
      });
    }
  };
  
  /**
   * Obține toate datele financiare pentru o companie
   * @route GET /api/crm/financial-data/:cui
   */
  getAllFinancialData = async (req: Request, res: Response) => {
    try {
      const { cui } = req.params;
      
      if (!cui) {
        return res.status(400).json({ error: 'CUI-ul este obligatoriu' });
      }
      
      logger.info(`Interogare toate datele financiare pentru CUI ${cui}`);
      
      const data = await this.financialDataService.getAllFinancialData(cui);
      
      return res.json({
        success: true,
        data,
        count: data.length
      });
    } catch (error: any) {
      logger.error(`Eroare la interogarea tuturor datelor financiare: ${error.message}`);
      return res.status(500).json({ 
        error: 'Eroare internă', 
        message: error.message 
      });
    }
  };
  
  /**
   * Obține starea curentă a cozilor de procesare a datelor financiare
   * @route GET /api/crm/financial-data/queue/status
   */
  getQueueStatus = async (req: Request, res: Response) => {
    try {
      logger.info('Interogare stare cozi de procesare date financiare');
      
      const status = await this.financialQueueService.getQueueStatus();
      
      return res.json({
        success: true,
        status
      });
    } catch (error: any) {
      logger.error(`Eroare la interogarea stării cozilor: ${error.message}`);
      return res.status(500).json({ 
        error: 'Eroare internă', 
        message: error.message 
      });
    }
  };
  
  /**
   * Declanșează procesarea erorilor nerezolvate
   * @route POST /api/crm/financial-data/errors/process
   */
  processErrors = async (req: Request, res: Response) => {
    try {
      logger.info('Procesare erori nerezolvate');
      
      const count = await this.financialQueueService.processUnresolvedErrors();
      
      return res.json({
        success: true,
        message: `${count} erori au fost programate pentru reîncercare`
      });
    } catch (error: any) {
      logger.error(`Eroare la procesarea erorilor: ${error.message}`);
      return res.status(500).json({ 
        error: 'Eroare internă', 
        message: error.message 
      });
    }
  };
  
  /**
   * Obține statistici despre datele financiare
   * @route GET /api/crm/financial-data/stats
   */
  getFinancialDataStats = async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      const companyId = user?.companyId;
      
      logger.info(`Interogare statistici date financiare${companyId ? ` pentru compania ${companyId}` : ''}`);
      
      const stats = await this.financialDataService.getFinancialDataStats(companyId);
      
      return res.json({
        success: true,
        stats
      });
    } catch (error: any) {
      logger.error(`Eroare la interogarea statisticilor: ${error.message}`);
      return res.status(500).json({ 
        error: 'Eroare internă', 
        message: error.message 
      });
    }
  };
  
  /**
   * Înregistrează rutele controller-ului
   */
  registerRoutes(app: any) {
    // Endpoint pentru crearea unui job de interogare date financiare
    app.post(
      '/api/crm/financial-data/job',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.COMPANY_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTANT]),
      this.createFinancialDataJob
    );
    
    // Endpoint pentru obținerea datelor financiare pentru un CUI și an specific
    app.get(
      '/api/crm/financial-data/:cui/:year',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.getFinancialData
    );
    
    // Endpoint pentru obținerea tuturor datelor financiare pentru un CUI
    app.get(
      '/api/crm/financial-data/:cui',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.getAllFinancialData
    );
    
    // Endpoint pentru obținerea stării cozilor de procesare
    app.get(
      '/api/crm/financial-data/queue/status',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.COMPANY_ADMIN, UserRole.ADMIN]),
      this.getQueueStatus
    );
    
    // Endpoint pentru procesarea erorilor nerezolvate
    app.post(
      '/api/crm/financial-data/errors/process',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      AuthGuard.roleGuard([UserRole.COMPANY_ADMIN, UserRole.ADMIN]),
      this.processErrors
    );
    
    // Endpoint pentru obținerea statisticilor
    app.get(
      '/api/crm/financial-data/stats',
      AuthGuard.protect(JwtAuthMode.REQUIRED),
      this.getFinancialDataStats
    );
    
    logger.info('Rute înregistrate pentru FinancialDataController');
  }
}