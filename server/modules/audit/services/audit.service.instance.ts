/**
 * Audit Service Singleton
 * 
 * Exportă o instanță a serviciului de Audit pentru a fi refolosit
 * în toată aplicația, asigurând consecvența auditării acțiunilor.
 */

import AuditService from './audit.service';
import { drizzleService } from '../../../common/drizzle/drizzle.service.instance';

// Export a serviciului Audit pentru utilizare în aplicație
export const auditService = AuditService;