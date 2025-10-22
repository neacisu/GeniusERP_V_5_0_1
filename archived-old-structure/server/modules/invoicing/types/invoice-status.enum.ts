/**
 * Invoice Status Enum
 * 
 * Defines the possible states of an invoice in the Romanian accounting system.
 * Follows the standard lifecycle: Draft → Issued → Sent/Canceled
 */

export enum InvoiceStatus {
  DRAFT = 'draft',
  ISSUED = 'issued',
  SENT = 'sent',
  CANCELED = 'canceled'
}