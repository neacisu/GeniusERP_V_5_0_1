/**
 * Inventory Code Generator Utilities
 *
 * Provides helper functions for generating warehouse and document codes
 * using alphanumeric sequences and date-based numbering.
 */

/**
 * Generate a random alphanumeric code of specified length.
 *
 * @param length - Length of the code to generate.
 * @param type - Character set to use (alphanumeric, alpha, numeric).
 */
export function generateRandomCode(
  length: number = 6,
  type: 'alphanumeric' | 'alpha' | 'numeric' = 'alphanumeric'
): string {
  let chars: string;

  switch (type) {
    case 'alpha':
      chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      break;
    case 'numeric':
      chars = '0123456789';
      break;
    case 'alphanumeric':
    default:
      chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      break;
  }

  let result = '';
  const charsLength = chars.length;

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * charsLength));
  }

  return result;
}

/**
 * Generate a sequential document number with prefix and padding.
 */
export function generateSequentialCode(
  prefix: string,
  currentNumber: number,
  padding: number = 5
): string {
  const paddedNumber = String(currentNumber).padStart(padding, '0');
  return `${prefix}${paddedNumber}`;
}

/**
 * Generate a document number with a date component and optional separator.
 */
export function generateDateBasedCode(
  prefix: string,
  date: Date = new Date(),
  separator: string = '',
  currentNumber: number = 1,
  padding: number = 3
): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const paddedNumber = String(currentNumber).padStart(padding, '0');

  return `${prefix}${year}${separator}${month}${separator}${day}${separator}${paddedNumber}`;
}
