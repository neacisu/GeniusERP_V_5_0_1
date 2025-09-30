/**
 * BPM Module Initialization
 * 
 * This file initializes services and dependencies for the Business Process Management module.
 */

import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { Logger } from '../../common/logger';
import { getDrizzle } from '../../common/drizzle';
import { DrizzleService } from '../../common/drizzle/drizzle.service'; 
import { ProcessService } from './services/process.service';
import { TriggerService } from './services/trigger.service';
import { ProcessInstanceService } from './services/process-instance.service';
import { StepTemplateService } from './services/step-template.service';
import { StepExecutionService } from './services/step-execution.service';
import { ApiConnectionService } from './services/api-connection.service';
import { ScheduledJobService } from './services/scheduled-job.service';

const logger = new Logger('BPM Init');

/**
 * Initialize BPM services
 */
export function initBpmServices(db?: PostgresJsDatabase<any>) {
  logger.info('Initializing BPM services...');
  
  // Use provided database connection or get default connection
  const dbConnection = db || getDrizzle();
  
  // Create DrizzleService with the database connection
  const drizzleService = new DrizzleService(dbConnection);
  
  // Initialize BPM services with DrizzleService
  const processService = new ProcessService(drizzleService);
  const triggerService = new TriggerService(drizzleService, processService);
  const processInstanceService = new ProcessInstanceService(drizzleService, processService);
  const stepTemplateService = new StepTemplateService(drizzleService);
  
  // Initialize newly implemented services
  const stepExecutionService = new StepExecutionService(drizzleService);
  const apiConnectionService = new ApiConnectionService(drizzleService);
  const scheduledJobService = new ScheduledJobService(
    drizzleService,
    processService,
    processInstanceService
  );
  
  logger.info('BPM services initialized successfully');
  
  return {
    processService,
    triggerService,
    processInstanceService,
    stepTemplateService,
    stepExecutionService,
    apiConnectionService,
    scheduledJobService
  };
}