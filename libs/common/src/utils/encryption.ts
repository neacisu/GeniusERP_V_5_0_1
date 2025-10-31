/**
 * Encryption Utility
 * 
 * Provides AES-256-GCM encryption/decryption for sensitive data
 * 
 * Folosit pentru:
 * - anaf_api_key (AC_accounting_settings)
 * - Alte API keys și tokens sensibile
 * - Date confidențiale care trebuie stocate în DB
 * 
 * IMPORTANT: Encryption key trebuie stocată în environment variables, NU în cod!
 */

import * as crypto from 'crypto';

// Encryption algorithm
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // For AES, this is always 16 bytes
const TAG_LENGTH = 16; // GCM authentication tag length
const SALT_LENGTH = 64;

/**
 * Get encryption key from environment
 * Falls back to a default for development (NU FOLOSIȚI ÎN PRODUCȚIE!)
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY || process.env.SECRET_KEY;
  
  if (!key) {
    console.warn('⚠️  WARNING: No ENCRYPTION_KEY found in environment! Using default (INSECURE for production!)');
    // Default key DOAR pentru development - NU FOLOSIȚI ÎN PRODUCȚIE!
    return crypto.scryptSync('default-encryption-key-CHANGE-IN-PRODUCTION', 'salt', 32);
  }
  
  // Derive 32-byte key from environment variable using scrypt
  return crypto.scryptSync(key, 'GeniusERP-Salt-v1', 32);
}

/**
 * Encrypt sensitive data using AES-256-GCM
 * 
 * @param text Text to encrypt (plain text)
 * @returns Encrypted string in format: iv:authTag:encryptedData (all hex-encoded)
 * 
 * @example
 * const encrypted = encrypt('my-secret-api-key');
 * // Returns: "a1b2c3d4....:e5f6g7h8....:i9j0k1l2...."
 */
export function encrypt(text: string): string {
  if (!text) {
    throw new Error('Cannot encrypt empty string');
  }

  const key = getEncryptionKey();
  
  // Generate random IV (Initialization Vector)
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  // Encrypt the text
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Get authentication tag
  const authTag = cipher.getAuthTag();
  
  // Return format: iv:authTag:encryptedData (all in hex)
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt sensitive data using AES-256-GCM
 * 
 * @param encryptedText Encrypted string in format: iv:authTag:encryptedData
 * @returns Decrypted plain text
 * 
 * @example
 * const decrypted = decrypt("a1b2c3d4....:e5f6g7h8....:i9j0k1l2....");
 * // Returns: "my-secret-api-key"
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) {
    throw new Error('Cannot decrypt empty string');
  }

  const key = getEncryptionKey();
  
  // Split the encrypted text into parts
  const parts = encryptedText.split(':');
  
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format. Expected format: iv:authTag:encryptedData');
  }
  
  const [ivHex, authTagHex, encrypted] = parts;
  
  // Convert hex strings back to Buffers
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  // Create decipher
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  // Decrypt the text
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * Check if a string is already encrypted
 * @param text String to check
 * @returns True if the string appears to be encrypted
 */
export function isEncrypted(text: string): boolean {
  if (!text) return false;
  
  // Check if it matches the encrypted format: hexIV:hexTag:hexData
  const parts = text.split(':');
  if (parts.length !== 3) return false;
  
  // Check if all parts are valid hex strings
  const hexRegex = /^[0-9a-f]+$/i;
  return parts.every(part => hexRegex.test(part) && part.length > 0);
}

/**
 * Safely encrypt a value (checks if already encrypted)
 * @param text Text to encrypt
 * @returns Encrypted text (or original if already encrypted)
 */
export function safeEncrypt(text: string | null | undefined): string | null {
  if (!text) return null;
  
  // If already encrypted, return as-is
  if (isEncrypted(text)) {
    return text;
  }
  
  return encrypt(text);
}

/**
 * Safely decrypt a value (checks if encrypted)
 * @param text Text to decrypt
 * @returns Decrypted text (or original if not encrypted/plain text)
 */
export function safeDecrypt(text: string | null | undefined): string | null {
  if (!text) return null;
  
  // If not encrypted (plain text), return as-is
  if (!isEncrypted(text)) {
    console.warn('⚠️  Attempting to decrypt non-encrypted value - returning plain text');
    return text;
  }
  
  try {
    return decrypt(text);
  } catch (error) {
    console.error('❌ Decryption failed:', error);
    throw new Error('Failed to decrypt sensitive data');
  }
}

/**
 * Hash a password using scrypt (for user passwords, NOT for API keys)
 * @param password Plain text password
 * @returns Hashed password
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a hash
 * @param password Plain text password to verify
 * @param hashedPassword Hashed password from database
 * @returns True if password matches
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, hash] = hashedPassword.split(':');
  const hashToVerify = crypto.scryptSync(password, salt, 64).toString('hex');
  return hash === hashToVerify;
}

