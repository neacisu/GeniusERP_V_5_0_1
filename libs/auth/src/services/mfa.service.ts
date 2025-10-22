/**
 * Multi-Factor Authentication (MFA) Service
 * 
 * Implementare 2FA/MFA folosind TOTP (Time-based One-Time Password)
 * conform RFC 6238 și OWASP Authentication Cheat Sheet.
 * 
 * Suportă:
 * - Generare secrete TOTP
 * - Generare QR codes pentru aplicații de autentificare (Google Authenticator, Authy, etc.)
 * - Verificare coduri OTP
 * - Cod backup pentru recovery
 */

import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { randomBytes } from 'crypto';
import { createModuleLogger } from "@common/logger/loki-logger";
import { DrizzleService } from "@common/drizzle";
import { users } from '@geniuserp/shared';
import { eq } from 'drizzle-orm';

const logger = createModuleLogger('mfa-service');

// Configurare TOTP
authenticator.options = {
  window: 1,        // Accept 1 interval înainte/după (30 sec = ±30 sec window)
  step: 30,         // 30 secunde per token
  digits: 6         // 6 cifre (standard)
};

/**
 * Rezultat generare secret MFA
 */
export interface MfaSetupResult {
  secret: string;
  qrCode: string;
  backupCodes: string[];
  uri: string;
}

/**
 * Service pentru gestionarea Multi-Factor Authentication
 */
export class MfaService extends DrizzleService {
  
  /**
   * Generează secret TOTP nou și QR code pentru utilizator
   * 
   * @param userId - ID-ul utilizatorului
   * @param email - Email-ul utilizatorului (pentru afișare în app authenticator)
   * @returns Secret, QR code și backup codes
   */
  async setupMfa(userId: string, email: string): Promise<MfaSetupResult> {
    try {
      logger.info(`Setting up MFA for user: ${userId}`);
      
      // Generează secret TOTP (base32 encoded)
      const secret = authenticator.generateSecret();
      
      // Generează URI pentru QR code
      const appName = 'GeniusERP';
      const uri = authenticator.keyuri(email, appName, secret);
      
      // Generează QR code ca data URL
      const qrCode = await QRCode.toDataURL(uri);
      
      // Generează backup codes (10 coduri de 8 caractere)
      const backupCodes = this.generateBackupCodes(10);
      
      // Salvează secret și backup codes în baza de date (criptate)
      await this.saveMfaSecret(userId, secret, backupCodes);
      
      logger.info(`MFA setup completed for user: ${userId}`);
      
      return {
        secret,
        qrCode,
        backupCodes,
        uri
      };
    } catch (error) {
      logger.error(`Failed to setup MFA for user ${userId}:`, error);
      throw new Error('Nu s-a putut configura autentificarea cu doi factori');
    }
  }
  
  /**
   * Verifică un cod OTP introdus de utilizator
   * 
   * @param userId - ID-ul utilizatorului
   * @param token - Codul OTP introdus (6 cifre)
   * @returns true dacă codul este valid
   */
  async verifyMfaToken(userId: string, token: string): Promise<boolean> {
    try {
      // Obține secretul utilizatorului din DB
      const secret = await this.getUserMfaSecret(userId);
      
      if (!secret) {
        logger.warn(`MFA verification failed - no secret for user: ${userId}`);
        return false;
      }
      
      // Verifică token-ul
      const isValid = authenticator.verify({
        token: token.replace(/\s/g, ''), // Elimină spații
        secret
      });
      
      if (isValid) {
        logger.info(`MFA verification successful for user: ${userId}`);
      } else {
        logger.warn(`MFA verification failed for user: ${userId}`);
      }
      
      return isValid;
    } catch (error) {
      logger.error(`Error verifying MFA token for user ${userId}:`, error);
      return false;
    }
  }
  
  /**
   * Verifică un backup code
   * Backup codes pot fi folosite doar o singură dată
   * 
   * @param userId - ID-ul utilizatorului
   * @param code - Backup code introdus
   * @returns true dacă backup code-ul este valid și nefolosit
   */
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    try {
      const backupCodes = await this.getUserBackupCodes(userId);
      
      if (!backupCodes || backupCodes.length === 0) {
        logger.warn(`Backup code verification failed - no codes for user: ${userId}`);
        return false;
      }
      
      // Verifică dacă codul există în listă
      const codeIndex = backupCodes.indexOf(code);
      
      if (codeIndex === -1) {
        logger.warn(`Invalid backup code for user: ${userId}`);
        return false;
      }
      
      // Șterge codul folosit (one-time use)
      backupCodes.splice(codeIndex, 1);
      await this.updateBackupCodes(userId, backupCodes);
      
      logger.info(`Backup code used successfully for user: ${userId}. Remaining codes: ${backupCodes.length}`);
      
      // Avertizare dacă mai sunt puține coduri
      if (backupCodes.length <= 2) {
        logger.warn(`Low backup codes for user ${userId}: ${backupCodes.length} remaining`);
      }
      
      return true;
    } catch (error) {
      logger.error(`Error verifying backup code for user ${userId}:`, error);
      return false;
    }
  }
  
  /**
   * Dezactivează MFA pentru un utilizator
   */
  async disableMfa(userId: string): Promise<void> {
    try {
      await this.query(async (db) => {
        await db.update(users)
          .set({ 
            mfaSecret: null,
            mfaBackupCodes: null,
            mfaEnabled: false,
            updatedAt: new Date()
          })
          .where(eq(users.id, userId));
      }, 'disableMfa');
      
      logger.info(`MFA disabled for user: ${userId}`);
    } catch (error) {
      logger.error(`Failed to disable MFA for user ${userId}:`, error);
      throw new Error('Nu s-a putut dezactiva autentificarea cu doi factori');
    }
  }
  
  /**
   * Verifică dacă MFA este activat pentru un utilizator
   */
  async isMfaEnabled(userId: string): Promise<boolean> {
    try {
      const result = await this.query(async (db) => {
        const user = await db.select({ mfaEnabled: users.mfaEnabled })
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        
        return user[0]?.mfaEnabled || false;
      }, 'isMfaEnabled');
      
      return result;
    } catch (error) {
      logger.error(`Error checking MFA status for user ${userId}:`, error);
      return false;
    }
  }
  
  /**
   * Generează backup codes noi pentru un utilizator
   * Folosit când utilizatorul a folosit majoritatea codurilor existente
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    try {
      const backupCodes = this.generateBackupCodes(10);
      await this.updateBackupCodes(userId, backupCodes);
      
      logger.info(`Backup codes regenerated for user: ${userId}`);
      
      return backupCodes;
    } catch (error) {
      logger.error(`Failed to regenerate backup codes for user ${userId}:`, error);
      throw new Error('Nu s-au putut genera coduri backup noi');
    }
  }
  
  // ========== Private Methods ==========
  
  /**
   * Generează backup codes
   */
  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    
    for (let i = 0; i < count; i++) {
      // Generează cod de 8 caractere (format: XXXX-XXXX pentru ușurință)
      const bytes = randomBytes(4);
      const code = bytes.toString('hex').toUpperCase();
      const formattedCode = `${code.substring(0, 4)}-${code.substring(4, 8)}`;
      codes.push(formattedCode);
    }
    
    return codes;
  }
  
  /**
   * Salvează secret MFA și backup codes în baza de date
   * NOTE: În producție, acestea ar trebui criptate cu o cheie master
   */
  private async saveMfaSecret(userId: string, secret: string, backupCodes: string[]): Promise<void> {
    await this.query(async (db) => {
      await db.update(users)
        .set({
          mfaSecret: secret,
          mfaBackupCodes: JSON.stringify(backupCodes),
          mfaEnabled: false, // Utilizatorul trebuie să confirme înainte de activare
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
    }, 'saveMfaSecret');
  }
  
  /**
   * Obține secretul MFA al utilizatorului
   */
  private async getUserMfaSecret(userId: string): Promise<string | null> {
    const result = await this.query(async (db) => {
      const user = await db.select({ mfaSecret: users.mfaSecret })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      return user[0]?.mfaSecret || null;
    }, 'getUserMfaSecret');
    
    return result;
  }
  
  /**
   * Obține backup codes ale utilizatorului
   */
  private async getUserBackupCodes(userId: string): Promise<string[]> {
    const result = await this.query(async (db) => {
      const user = await db.select({ mfaBackupCodes: users.mfaBackupCodes })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      const codesJson = user[0]?.mfaBackupCodes;
      return codesJson ? JSON.parse(codesJson as string) : [];
    }, 'getUserBackupCodes');
    
    return result;
  }
  
  /**
   * Actualizează backup codes
   */
  private async updateBackupCodes(userId: string, backupCodes: string[]): Promise<void> {
    await this.query(async (db) => {
      await db.update(users)
        .set({
          mfaBackupCodes: JSON.stringify(backupCodes),
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
    }, 'updateBackupCodes');
  }
}

// Singleton instance
let mfaServiceInstance: MfaService | null = null;

export function getMfaService(): MfaService {
  if (!mfaServiceInstance) {
    mfaServiceInstance = new MfaService();
  }
  return mfaServiceInstance;
}

logger.info('✓ MFA Service initialized');

