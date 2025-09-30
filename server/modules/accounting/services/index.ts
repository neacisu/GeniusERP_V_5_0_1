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

// Export all services
export {
  JournalService,
  SalesJournalService,
  PurchaseJournalService,
  BankJournalService,
  CashRegisterService,
  NoteContabilService,
  ValidateDocumentService
};

// Export default as object containing all services
export default {
  JournalService,
  SalesJournalService,
  PurchaseJournalService,
  BankJournalService,
  CashRegisterService,
  NoteContabilService,
  ValidateDocumentService
};