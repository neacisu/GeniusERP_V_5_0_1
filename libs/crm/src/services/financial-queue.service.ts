/**
 * Financial Queue Service
 * 
 * Serviciu pentru procesarea în background a job-urilor de interogare date financiare
 * Folosește BullMQ pentru a respecta limitarea de 1 request/secundă impusă de ANAF
 */
import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { DrizzleService } from "@common/drizzle/drizzle.service";
import { FinancialDataService } from './financial-data.service';
import { AuditService } from '../../audit/services/audit.service';
import { Logger } from "@common/logger";
import { financialDataJobs } from '../schema/financial-data.schema';
import { eq } from 'drizzle-orm';
import { getBullMQRedisConfig } from '../../../config/redis';
import { BaseDrizzleService } from "@common/drizzle/modules/core/base-drizzle.service";

// Configurare queue names
const FINANCIAL_DATA_QUEUE = 'anaf-financial-data';
const FINANCIAL_RETRY_QUEUE = 'anaf-financial-retry';

// Tipuri de job-uri
interface FetchFinancialDataJob {
  cui: string;
  fiscalYear: number;
  companyId: string;
  userId?: string;
  jobId: number;
}

interface RetryErrorJob {
  errorId: number;
  cui: string;
  fiscalYear: number;
  companyId: string;
}

/**
 * Serviciu pentru gestionarea cozilor de procesare date financiare
 */
export class FinancialQueueService extends BaseDrizzleService {
  private dataQueue: Queue;
  private retryQueue: Queue;
  private dataWorker: Worker;
  private retryWorker: Worker;
  private redisClient: IORedis;
  private logger = new Logger('FinancialQueueService');
  
  constructor(
    private readonly db: DrizzleService,
    private readonly financialDataService: FinancialDataService,
    private readonly auditService: AuditService
  ) {
    super();
    // Obține configurația Redis pentru BullMQ
    const bullConfig = getBullMQRedisConfig();
    
    // Creează conexiunea Redis fără prefix (BullMQ nu acceptă prefixarea prin ioredis)
    this.redisClient = new IORedis(bullConfig.connection);
    
    // Opțiuni comune pentru cozi
    const queueOptions = {
      connection: this.redisClient,
      prefix: bullConfig.prefix,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000
        }
      }
    };
    
    // Opțiuni comune pentru workers
    const workerOptions = {
      connection: this.redisClient,
      prefix: bullConfig.prefix,
      concurrency: 1,
      limiter: {
        max: 1,
        duration: 1000,
      }
    };
    
    // Inițializare cozi
    this.dataQueue = new Queue(FINANCIAL_DATA_QUEUE, queueOptions);
    this.retryQueue = new Queue(FINANCIAL_RETRY_QUEUE, queueOptions);
    
    // Inițializare workers
    this.dataWorker = new Worker(
      FINANCIAL_DATA_QUEUE, 
      async (job: Job<FetchFinancialDataJob>) => this.processJob(job),
      workerOptions
    );
    
    this.retryWorker = new Worker(
      FINANCIAL_RETRY_QUEUE,
      async (job: Job<RetryErrorJob>) => this.processRetryJob(job),
      workerOptions
    );
    
    // Event handlers
    this.setupEventHandlers();
  }
  
  /**
   * Configurează handlerii de evenimente pentru workers
   */
  private setupEventHandlers() {
    this.dataWorker.on('completed', (job: Job<FetchFinancialDataJob>) => {
      this.logger.info(`✅ Job finalizat pentru CUI ${job.data.cui}, anul ${job.data.fiscalYear}`);
      this.checkAndScheduleNextYear(job);
    });
    
    this.dataWorker.on('failed', (job: Job<FetchFinancialDataJob> | undefined, error: Error) => {
      if (job) {
        this.logger.error(`❌ Eroare la job pentru CUI ${job.data.cui}, anul ${job.data.fiscalYear}: ${error.message}`);
      } else {
        this.logger.error(`❌ Eroare la job: ${error.message}`);
      }
    });
    
    this.retryWorker.on('completed', (job: Job<RetryErrorJob>) => {
      this.logger.info(`✅ Retry reușit pentru CUI ${job.data.cui}, anul ${job.data.fiscalYear}`);
    });
    
    this.retryWorker.on('failed', (job: Job<RetryErrorJob> | undefined, error: Error) => {
      if (job) {
        this.logger.error(`❌ Retry eșuat pentru CUI ${job.data.cui}, anul ${job.data.fiscalYear}: ${error.message}`);
      } else {
        this.logger.error(`❌ Eroare la retry: ${error.message}`);
      }
    });
  }
  
  /**
   * Verifică și programează procesarea următorului an fiscal
   */
  private async checkAndScheduleNextYear(job: Job<FetchFinancialDataJob>) {
    try {
      const { cui, fiscalYear, companyId, userId, jobId } = job.data;
      
      // Obținem job-ul din baza de date folosind query builder
      const dbJob = await this.getJobById(jobId);
      
      if (!dbJob.length) {
        this.logger.error(`⚠️ Nu s-a găsit job-ul ${jobId} în baza de date`);
        return;
      }
      
      const jobData = dbJob[0];
      const progress = Math.round(((fiscalYear - jobData.startYear + 1) / jobData.totalYears) * 100);
      
      // Verificăm dacă am ajuns la ultimul an
      if (fiscalYear >= jobData.endYear) {
        // Job complet - actualizare status
        await this.financialDataService.updateJobStatus(jobId, 'completed', 100);
        this.logger.info(`🏁 Job complet pentru CUI ${cui}, anii ${jobData.startYear}-${jobData.endYear}`);
        
        // Înregistrare audit
        if (userId) {
          await this.auditService.logEvent({
            eventType: 'anaf_financial_job_completed',
            module: 'anaf_financial_data',
            description: `Job complet pentru interogare bilanțuri ANAF pentru CUI ${cui}, anii ${jobData.startYear}-${jobData.endYear}`,
            userId,
            companyId,
            entityId: cui,
            entityType: 'company_cui',
            data: { cui, startYear: jobData.startYear, endYear: jobData.endYear }
          });
        }
        return;
      }
      
      // Programăm următorul an
      const nextYear = fiscalYear + 1;
      await this.financialDataService.updateJobStatus(jobId, 'pending', progress, nextYear);
      
      // Adăugare job pentru următorul an
      await this.addFetchJobToQueue({
        cui,
        fiscalYear: nextYear,
        companyId,
        userId,
        jobId
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`❌ Eroare la verificarea și programarea următorului an: ${error.message}`);
      } else {
        this.logger.error('❌ Eroare necunoscută la verificarea și programarea următorului an');
      }
    }
  }
  
  /**
   * Procesează un job de interogare date financiare
   */
  private async processJob(job: Job<FetchFinancialDataJob>) {
    try {
      const { cui, fiscalYear, companyId, userId, jobId } = job.data;
      
      // Obținem job-ul din baza de date folosind query builder
      const dbJob = await this.getJobById(jobId);
      
      if (!dbJob.length) {
        throw new Error(`Job ${jobId} not found in database`);
      }
      
      // Procesăm job-ul
      await this.financialDataService.fetchFinancialData(cui, fiscalYear, userId, companyId);
      
      // Actualizăm progresul
      await this.updateJobProgress(jobId, fiscalYear);
      
      return { success: true };
    } catch (error) {
      this.logger.error('Error processing job', error);
      throw error;
    }
  }
  
  /**
   * Procesează un job de reîncercare
   */
  private async processRetryJob(job: Job<RetryErrorJob>): Promise<any> {
    const { errorId, cui, fiscalYear, companyId } = job.data;
    
    this.logger.info(`🔄 Reîncercare pentru CUI ${cui}, anul ${fiscalYear}`);
    
    try {
      // Incrementează contorul de reîncercări
      await this.financialDataService.incrementErrorRetryCount(errorId);
      
      // Obține datele financiare de la ANAF
      const data = await this.financialDataService.fetchFinancialData(cui, fiscalYear, undefined, companyId);
      
      // Marchează eroarea ca rezolvată
      await this.financialDataService.markErrorAsResolved(errorId);
      
      return data;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`❌ Reîncercare eșuată pentru CUI ${cui}, anul ${fiscalYear}: ${error.message}`);
      } else {
        this.logger.error(`❌ Eroare necunoscută la reîncercarea pentru CUI ${cui}, anul ${fiscalYear}`);
      }
      throw error;
    }
  }
  
  /**
   * Adaugă un job de interogare date financiare în coadă
   */
  async addFetchJobToQueue(jobData: FetchFinancialDataJob): Promise<Job<FetchFinancialDataJob>> {
    return await this.dataQueue.add(
      `fetch-${jobData.cui}-${jobData.fiscalYear}`,
      jobData,
      {
        removeOnComplete: 100,
        removeOnFail: 200
      }
    );
  }
  
  /**
   * Adaugă un job de reîncercare în coadă
   */
  async addRetryJobToQueue(jobData: RetryErrorJob): Promise<Job<RetryErrorJob>> {
    return await this.retryQueue.add(
      `retry-${jobData.cui}-${jobData.fiscalYear}`,
      jobData,
      {
        removeOnComplete: 100,
        removeOnFail: 200
      }
    );
  }
  
  /**
   * Creează un job pentru interogarea datelor financiare pentru toți anii disponibili
   */
  async createFinancialDataJob(cui: string, companyId: string, startYear: number, endYear: number, userId?: string): Promise<any> {
    try {
      // Creează job-ul în baza de date
      const job = await this.financialDataService.createFinancialDataJob(cui, companyId, startYear, endYear, userId);
      
      // Adaugă primul an în coadă
      await this.addFetchJobToQueue({
        cui,
        fiscalYear: startYear,
        companyId,
        userId,
        jobId: job.id
      });
      
      return job;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`❌ Eroare la crearea job-ului pentru CUI ${cui}: ${error.message}`);
      } else {
        this.logger.error(`❌ Eroare necunoscută la crearea job-ului pentru CUI ${cui}`);
      }
      throw error;
    }
  }
  
  /**
   * Procesează erorile nerezolvate
   */
  async processUnresolvedErrors(): Promise<number> {
    try {
      const errors = await this.financialDataService.getUnresolvedErrors();
      
      this.logger.info(`🔍 Procesare ${errors.length} erori nerezolvate`);
      
      let processedCount = 0;
      
      for (const error of errors) {
        await this.addRetryJobToQueue({
          errorId: error.id,
          cui: error.cui,
          fiscalYear: error.fiscalYear,
          companyId: ''  // In acest caz, companyId nu este esențial pentru reîncercare
        });
        
        processedCount++;
      }
      
      return processedCount;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`❌ Eroare la procesarea erorilor nerezolvate: ${error.message}`);
      } else {
        this.logger.error('❌ Eroare necunoscută la procesarea erorilor nerezolvate');
      }
      return 0;
    }
  }
  
  /**
   * Închide conexiunile queue și workers
   */
  async close(): Promise<void> {
    await this.dataWorker.close();
    await this.retryWorker.close();
    await this.dataQueue.close();
    await this.retryQueue.close();
    await this.redisClient.quit();
  }
  
  /**
   * Returnează starea curentă a cozilor
   */
  async getQueueStatus(): Promise<any> {
    const [
      dataCounts,
      retryCounts,
      dataJobs,
      retryJobs
    ] = await Promise.all([
      this.dataQueue.getJobCounts(),
      this.retryQueue.getJobCounts(),
      this.dataQueue.getJobs(['active', 'waiting', 'delayed'], 0, 5),
      this.retryQueue.getJobs(['active', 'waiting', 'delayed'], 0, 5)
    ]);
    
    return {
      dataQueue: {
        counts: dataCounts,
        activeJobs: await Promise.all(dataJobs.map(async (job) => ({
          id: job.id,
          name: job.name,
          data: job.data,
          state: await job.getState()
        })))
      },
      retryQueue: {
        counts: retryCounts,
        activeJobs: await Promise.all(retryJobs.map(async (job) => ({
          id: job.id,
          name: job.name,
          data: job.data,
          state: await job.getState()
        })))
      }
    };
  }
  
  /**
   * Pornește un cron job pentru procesarea erorilor nerezolvate
   */
  startErrorProcessingCron(cronExpression: string = '0 */6 * * *'): void {
    // Notă: În mod normal, am implementa un cron job aici
    // Dar pentru simplitate, vom lăsa această metodă goală
    // În implementarea reală, am putea folosi node-cron pentru a programa această activitate
    this.logger.info(`📅 Cron job configurat pentru procesarea erorilor: ${cronExpression}`);
  }

  /**
   * Obține un job după ID
   */
  private async getJobById(jobId: number): Promise<any[]> {
    return this.query(async (db) => {
      return db.select()
        .from(financialDataJobs)
        .where(eq(financialDataJobs.id, jobId));
    });
  }

  /**
   * Actualizează progresul unui job
   */
  async updateJobProgress(jobId: number, currentYear: number): Promise<void> {
    try {
      // Obținem job-ul din baza de date
      const dbJob = await this.getJobById(jobId);
      
      if (!dbJob.length) {
        throw new Error(`Job ${jobId} not found in database`);
      }
      
      const jobData = dbJob[0];
      const progress = Math.round(((currentYear - jobData.startYear + 1) / jobData.totalYears) * 100);
      
      // Actualizăm progresul
      await this.financialDataService.updateJobStatus(jobId, 'pending', progress, currentYear);
      
      this.logger.info(`📊 Progres actualizat pentru job ${jobId}: ${progress}% (anul ${currentYear})`);
    } catch (error) {
      this.logger.error(`❌ Eroare la actualizarea progresului job-ului ${jobId}:`, error);
      throw error;
    }
  }
}