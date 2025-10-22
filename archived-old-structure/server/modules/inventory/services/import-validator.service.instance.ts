/**
 * Import Validator Service Instance
 * 
 * Instanță singleton a serviciului de validare a importurilor.
 * Aceasta furnizează o instanță partajată în cadrul întregii aplicații.
 */

import { ImportValidatorService } from './import-validator.service';
import { drizzleService } from '../../../common/drizzle/drizzle.service.instance';
import { auditService } from '../../../modules/audit/services/audit.service.instance';

// Creează o instanță singleton a serviciului
export const importValidatorService = new ImportValidatorService(
  drizzleService, 
  auditService
);

export default importValidatorService;