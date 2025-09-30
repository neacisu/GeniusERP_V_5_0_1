import { AuditService } from './server/modules/audit/services/audit.service.ts';
import { AuditAction } from './server/common/enums/audit.enum.ts';

async function testAuditServiceStaticMethod() {
  try {
    console.log('Testing AuditService.log static method...');
    
    const result = await AuditService.log({
      userId: '64ba631a-2412-4722-aa92-14989ca89b43',
      companyId: 'a6827e12-ed96-4296-9ece-b08cda112a7a',
      action: AuditAction.CREATE,
      entity: 'EMPLOYEE',
      entityId: '12345678-1234-1234-1234-123456789012',
      details: {
        firstName: 'Test',
        lastName: 'User',
        cnp: '1900101000000'
      }
    });
    
    console.log('AuditService.log called successfully with result:', result);
  } catch (error) {
    console.error('Error testing AuditService:', error);
  }
}

testAuditServiceStaticMethod();
