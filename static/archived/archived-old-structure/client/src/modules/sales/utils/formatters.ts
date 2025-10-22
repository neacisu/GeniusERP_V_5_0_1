/**
 * Formatters Utility
 * 
 * Collection of formatting utilities for displaying data consistently
 * throughout the sales module.
 */

/**
 * Format a currency value with the specified currency code
 * @param value Number to format
 * @param currency Currency code (e.g. RON, EUR, USD)
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number = 0, currency: string = 'RON'): string => {
  return `${value.toLocaleString('ro-RO', {
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2
  })} ${currency}`;
};

/**
 * Format a date in Romanian format
 * @param dateString Date string or undefined
 * @returns Formatted date string or fallback value
 */
export const formatDate = (dateString: string | undefined, fallback: string = '-'): string => {
  if (!dateString) return fallback;
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ro-RO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return fallback;
  }
};

/**
 * Format a percentage value
 * @param value Percentage value
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number = 0): string => {
  return `${value.toLocaleString('ro-RO', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}%`;
};

/**
 * Format a number with specified decimal places
 * @param value Number to format
 * @param decimals Number of decimal places
 * @returns Formatted number string
 */
export const formatNumber = (value: number = 0, decimals: number = 2): string => {
  return value.toLocaleString('ro-RO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

/**
 * Truncate a string to a certain length and add ellipsis if needed
 * @param text Text to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number = 30): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Convert a timestamp to a relative time string (e.g. "2 hours ago")
 * @param timestamp Timestamp string or date object
 * @returns Relative time string
 */
export const timeAgo = (timestamp: string | Date): string => {
  if (!timestamp) return '';
  
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const now = new Date();
  const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  const intervals = {
    an: 31536000,
    lună: 2592000,
    săptămână: 604800,
    zi: 86400,
    oră: 3600,
    minut: 60,
    secundă: 1
  };
  
  type IntervalKey = keyof typeof intervals;
  
  let counter;
  let interval: IntervalKey;
  
  for (interval in intervals) {
    counter = Math.floor(secondsAgo / intervals[interval]);
    if (counter > 0) {
      if (counter === 1) {
        // Singular
        return `acum 1 ${interval}`;
      } else {
        // Plural - Romanian has specific rules for pluralization
        if (interval === 'lună') return `acum ${counter} luni`;
        if (interval === 'oră') return `acum ${counter} ore`;
        if (interval === 'zi') return `acum ${counter} zile`;
        if (interval === 'săptămână') return `acum ${counter} săptămâni`;
        if (interval === 'an') return `acum ${counter} ani`;
        return `acum ${counter} ${interval}e`;
      }
    }
  }
  
  return 'chiar acum';
};