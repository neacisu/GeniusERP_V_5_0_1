/**
 * Unit Tests: Accounting Schema
 * Testează schema Drizzle pentru modulul accounting
 */

import { ledger_entries, ledger_lines, account_balances } from '../../../../../../../libs/shared/src/schema/accounting.schema';

describe('Accounting Schema', () => {
  it('should have ledger_entries table defined', () => {
    expect(ledger_entries).toBeDefined();
  });

  it('should have ledger_lines table defined', () => {
    expect(ledger_lines).toBeDefined();
  });

  it('should have account_balances table defined', () => {
    expect(account_balances).toBeDefined();
  });
});

