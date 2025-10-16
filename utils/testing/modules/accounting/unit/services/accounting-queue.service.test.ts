/**
 * Unit Tests: AccountingQueueService
 * Testează wrapper BullMQ pentru toate operațiunile accounting
 */

import { AccountingQueueService } from '../../../../../../server/modules/accounting/services/accounting-queue.service';

describe('AccountingQueueService', () => {
  let service: AccountingQueueService;

  beforeEach(() => {
    service = new AccountingQueueService();
  });

  it('should initialize service', () => {
    expect(service).toBeDefined();
  });

  it('should generate unique job IDs', () => {
    const id1 = (service as any).generateId();
    const id2 = (service as any).generateId();
    expect(id1).not.toBe(id2);
  });
});

