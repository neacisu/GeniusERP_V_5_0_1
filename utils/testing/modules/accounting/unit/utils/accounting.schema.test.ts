/**
 * Unit Tests: Accounting Schema
 * Testează schema Drizzle pentru modulul accounting
 */

import { ledgerEntries, ledgerLines, accountBalances } from '../../../../../../server/modules/accounting/schema/accounting.schema';

describe('Accounting Schema', () => {
  it('should have ledgerEntries table defined', () => {
    expect(ledgerEntries).toBeDefined();
  });

  it('should have ledgerLines table defined', () => {
    expect(ledgerLines).toBeDefined();
  });

  it('should have accountBalances table defined', () => {
    expect(accountBalances).toBeDefined();
  });
});

