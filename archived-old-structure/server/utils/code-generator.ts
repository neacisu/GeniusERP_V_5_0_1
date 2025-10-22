/**
 * Code Generator Utility
 * 
 * This utility generates random codes that can be used for various purposes
 * such as document numbers, reference codes, etc.
 */

/**
 * Generate a random alphanumeric code of specified length
 * 
 * @param length - Length of the code
 * @param type - Type of characters to include (alphanumeric, alpha, numeric)
 * @returns A random code
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
 * Generate a sequential document number with prefix and padding
 * 
 * @param prefix - Prefix for the document number
 * @param currentNumber - Current sequence number
 * @param padding - Number of digits to pad to
 * @returns A formatted document number
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
 * Generate a document number with date component
 * This is useful for Romanian fiscal documents that require date-based numbering
 * 
 * @param prefix - Prefix for the document number
 * @param date - Date to use for the code (defaults to current date)
 * @param separator - Separator between date components
 * @param currentNumber - Current sequence number for the date
 * @param padding - Number of digits to pad the sequence number to
 * @returns A formatted document number with date component
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