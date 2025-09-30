import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date for display
 * @param date Date to format
 * @returns Formatted date string (e.g., "10 Apr 2025")
 */
export function formatDate(date: Date): string {
  // Check if the date is valid
  if (!(date instanceof Date) || isNaN(date.getTime())) {
    return 'Data invalidă';
  }
  
  // Format as "10 Apr 2025"
  const options: Intl.DateTimeFormatOptions = { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  };
  
  return new Intl.DateTimeFormat('ro-RO', options).format(date);
}

/**
 * Format a number for display with specified decimal places
 * @param num Number to format
 * @param decimals Number of decimal places to show
 * @returns Formatted number string
 */
export function formatNumber(num: number, decimals: number = 2): string {
  // Check if the number is valid
  if (typeof num !== 'number' || isNaN(num)) {
    return '-';
  }
  
  // Format with requested decimal places
  const options: Intl.NumberFormatOptions = { 
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  };
  
  return new Intl.NumberFormat('ro-RO', options).format(num);
}
