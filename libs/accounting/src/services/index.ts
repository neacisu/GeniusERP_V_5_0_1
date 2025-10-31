/**
 * Accounting Services Index
 * 
 * This file exports all services from the accounting module.
 */

import JournalService from './journal.service';
import SalesJournalService from './sales-journal.service';
import PurchaseJournalService from './purchase-journal.service';
import BankJournalService from './bank-journal.service';
import CashRegisterService from './cash-register.service';
import NoteContabilService from './note-contabil.service';
import ValidateDocumentService from './validate-document';
import { AccountingService } from './accounting.service';
import { AnalyticAccountsService } from './analytic-accounts.service';

// Fiscal Closure Services
import FiscalClosureService from './fiscal-closure.service';
import DepreciationCalculationService from './depreciation-calculation.service';
import FXRevaluationService from './fx-revaluation.service';
import VATClosureService from './vat-closure.service';
import YearEndClosureService from './year-end-closure.service';
import AccountingPeriodsService from './accounting-periods.service';
import PeriodLockService from './period-lock.service';

// Export all services
export {
  JournalService,
  SalesJournalService,
  PurchaseJournalService,
  BankJournalService,
  CashRegisterService,
  NoteContabilService,
  ValidateDocumentService,
  AccountingService,
  AnalyticAccountsService,
  FiscalClosureService,
  DepreciationCalculationService,
  FXRevaluationService,
  VATClosureService,
  YearEndClosureService,
  AccountingPeriodsService,
  PeriodLockService
};

// Export default as object containing all services
export default {
  JournalService,
  SalesJournalService,
  PurchaseJournalService,
  BankJournalService,
  CashRegisterService,
  NoteContabilService,
  ValidateDocumentService,
  AccountingService,
  AnalyticAccountsService,
  FiscalClosureService,
  DepreciationCalculationService,
  FXRevaluationService,
  VATClosureService,
  YearEndClosureService,
  AccountingPeriodsService,
  PeriodLockService
};