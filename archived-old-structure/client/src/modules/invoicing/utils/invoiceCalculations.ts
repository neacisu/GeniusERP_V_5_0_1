/**
 * Invoice Calculation Utilities
 * 
 * Utility functions for calculating invoice totals and amounts.
 */
import { InvoiceItem } from '../types';

/**
 * Calculate net amount (without VAT) for a single invoice item
 * 
 * @param item Invoice item to calculate for
 * @returns Net amount
 */
export function calculateNetAmount(item: InvoiceItem): number {
  const quantity = item.quantity || 0;
  const unitPrice = item.unitPrice || 0;
  const discount = item.discount || 0;
  
  // Apply discount
  return quantity * unitPrice * (1 - discount / 100);
}

/**
 * Calculate VAT amount for a single invoice item
 * 
 * @param item Invoice item to calculate for
 * @returns VAT amount
 */
export function calculateVAT(item: InvoiceItem): number {
  const netAmount = calculateNetAmount(item);
  const vatRate = item.vatRate || 0;
  
  return netAmount * (vatRate / 100);
}

/**
 * Calculate gross amount (with VAT) for a single invoice item
 * 
 * @param item Invoice item to calculate for
 * @returns Gross amount
 */
export function calculateGrossAmount(item: InvoiceItem): number {
  const netAmount = calculateNetAmount(item);
  const vatAmount = calculateVAT(item);
  
  return netAmount + vatAmount;
}

/**
 * Calculate subtotal (sum of net amounts) for all invoice items
 * 
 * @param items Array of invoice items
 * @returns Subtotal amount
 */
export function calculateSubtotal(items: InvoiceItem[]): number {
  if (!items || !Array.isArray(items)) return 0;
  
  return items.reduce((sum, item) => sum + calculateNetAmount(item), 0);
}

/**
 * Calculate total VAT for all invoice items
 * 
 * @param items Array of invoice items
 * @returns Total VAT amount
 */
export function calculateTotalVAT(items: InvoiceItem[]): number {
  if (!items || !Array.isArray(items)) return 0;
  
  return items.reduce((sum, item) => sum + calculateVAT(item), 0);
}

/**
 * Calculate total amount (with VAT) for all invoice items
 * 
 * @param items Array of invoice items
 * @returns Total amount
 */
export function calculateTotal(items: InvoiceItem[]): number {
  if (!items || !Array.isArray(items)) return 0;
  
  return items.reduce((sum, item) => sum + calculateGrossAmount(item), 0);
}

/**
 * Format number as currency string
 * 
 * @param value Number to format
 * @param currency Currency code (default: RON)
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, currency: string = 'RON'): string {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Format number with specific decimal places
 * 
 * @param value Number to format
 * @param decimals Number of decimal places (default: 2)
 * @returns Formatted number string
 */
export function formatNumber(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('ro-RO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}

/**
 * Format date as a localized string
 * 
 * @param date Date to format
 * @param options Intl.DateTimeFormatOptions (optional)
 * @returns Formatted date string
 */
export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '-';
  }
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  };
  
  return new Intl.DateTimeFormat('ro-RO', options || defaultOptions).format(date);
}