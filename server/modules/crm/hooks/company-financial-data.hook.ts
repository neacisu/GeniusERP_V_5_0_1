/**
 * Company Financial Data Hook
 * 
 * Hook pentru declanșarea automată a interogării datelor financiare 
 * la adăugarea unei noi companii/CUI în baza de date
 */
import { DrizzleService } from '../../../common/drizzle/drizzle.service';
import { Logger } from '../../../common/logger';
import { FinancialQueueService } from '../services/financial-queue.service';
import { FinancialDataService } from '../services/financial-data.service';
import { AuditService } from '../../audit/services/audit.service';

const logger = new Logger('CompanyFinancialDataHook');

/**
 * Hook pentru datele financiare ale companiilor
 */
export class CompanyFinancialDataHook {
  private financialQueueService: FinancialQueueService;
  
  constructor(
    private readonly auditService: AuditService
  ) {
    const db = new DrizzleService();
    const financialDataService = new FinancialDataService(auditService);
    this.financialQueueService = new FinancialQueueService(db, financialDataService, auditService);
    
    logger.info('CompanyFinancialDataHook inițializat');
  }
  
  /**
   * Declanșat după adăugarea unei noi companii
   */
  async onCompanyCreated(company: any): Promise<void> {
    try {
      if (!company || !company.cui) {
        logger.warn('Company without CUI skipped');
        return;
      }
      
      logger.info(`Companie nouă detectată: ${company.name}, CUI ${company.cui}`);
      
      // Calcularea anului de start (minim 2014)
      const registrationYear = company.registrationDate 
        ? new Date(company.registrationDate).getFullYear() 
        : 2014;
      
      const startYear = Math.max(registrationYear, 2014);
      const currentYear = new Date().getFullYear();
      
      // Crearea job-ului pentru interogarea datelor financiare
      await this.financialQueueService.createFinancialDataJob(
        company.cui,
        company.id,
        startYear,
        currentYear,
        company.createdBy
      );
      
      logger.info(`Job programat pentru obținerea datelor financiare ale companiei ${company.name}, anii ${startYear}-${currentYear}`);
    } catch (error: any) {
      logger.error(`Eroare la programarea job-ului pentru datele financiare: ${error.message}`);
    }
  }
  
  /**
   * Declanșat după actualizarea CUI-ului unei companii
   */
  async onCompanyCuiUpdated(company: any, oldCui: string): Promise<void> {
    try {
      if (!company || !company.cui || company.cui === oldCui) {
        return;
      }
      
      logger.info(`CUI actualizat pentru compania ${company.name}: ${oldCui} -> ${company.cui}`);
      
      // Calcularea anului de start (minim 2014)
      const registrationYear = company.registrationDate 
        ? new Date(company.registrationDate).getFullYear() 
        : 2014;
      
      const startYear = Math.max(registrationYear, 2014);
      const currentYear = new Date().getFullYear();
      
      // Crearea job-ului pentru interogarea datelor financiare
      await this.financialQueueService.createFinancialDataJob(
        company.cui,
        company.id,
        startYear,
        currentYear,
        company.updatedBy
      );
      
      logger.info(`Job programat pentru obținerea datelor financiare ale companiei actualizate ${company.name}, anii ${startYear}-${currentYear}`);
    } catch (error: any) {
      logger.error(`Eroare la programarea job-ului pentru datele financiare după actualizarea CUI: ${error.message}`);
    }
  }
  
  /**
   * Programează procesarea erorilor nerezolvate periodic
   */
  startErrorProcessingScheduler(): void {
    const processErrors = async () => {
      try {
        logger.info('Procesare programată a erorilor nerezolvate');
        await this.financialQueueService.processUnresolvedErrors();
      } catch (error: any) {
        logger.error(`Eroare la procesarea programată a erorilor: ${error.message}`);
      }
    };
    
    // Procesare inițială
    processErrors();
    
    // Programare periodică (la fiecare 6 ore)
    setInterval(processErrors, 6 * 60 * 60 * 1000);
    
    logger.info('Procesarea erorilor programată la fiecare 6 ore');
  }
}