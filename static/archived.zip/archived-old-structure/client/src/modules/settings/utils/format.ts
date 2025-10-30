/**
 * Format Utility Functions
 * 
 * Utility functions for formatting data in settings components
 */

import { format, formatDistanceToNow, parseISO, isValid } from "date-fns";
import { ro } from "date-fns/locale";

/**
 * Format a date value to a readable string
 */
export function formatDate(date: Date | string | null | undefined, formatString: string = "dd.MM.yyyy"): string {
  if (!date) return "-";
  
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(dateObj)) return "-";
    
    return format(dateObj, formatString, { locale: ro });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "-";
  }
}

/**
 * Format a date as a relative time (e.g., "2 days ago")
 */
export function formatRelativeDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  
  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    if (!isValid(dateObj)) return "-";
    
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: ro });
  } catch (error) {
    console.error("Error formatting relative date:", error);
    return "-";
  }
}

/**
 * Format a number as currency (RON)
 */
export function formatCurrency(amount: number | null | undefined, currency: string = "RON"): string {
  if (amount === null || amount === undefined) return "-";
  
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency,
    minimumFractionDigits: 2
  }).format(amount);
}

/**
 * Format a number with thousands separators
 */
export function formatNumber(num: number | null | undefined, decimals: number = 2): string {
  if (num === null || num === undefined) return "-";
  
  return new Intl.NumberFormat("ro-RO", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
}

/**
 * Format a phone number for display
 */
export function formatPhoneNumber(phone: string | null | undefined): string {
  if (!phone) return "-";
  
  // Romanian phone format: +40 123 456 789
  const cleaned = phone.replace(/\D/g, "");
  
  if (cleaned.length === 10) {
    return `+40 ${cleaned.substring(1, 4)} ${cleaned.substring(4, 7)} ${cleaned.substring(7, 10)}`;
  }
  
  if (cleaned.length === 9) {
    return `+40 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6, 9)}`;
  }
  
  return phone;
}

/**
 * Truncate a long string and add ellipsis
 */
export function truncateText(text: string | null | undefined, maxLength: number = 50): string {
  if (!text) return "";
  
  if (text.length <= maxLength) return text;
  
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Format a file size in bytes to human-readable format
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return "-";
  
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}

/**
 * Format a boolean value to Yes/No in Romanian
 */
export function formatBoolean(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return "-";
  
  return value ? "Da" : "Nu";
}

/**
 * Titlecase a string (convert first letter of each word to uppercase)
 */
export function titleCase(str: string | null | undefined): string {
  if (!str) return "";
  
  return str
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}