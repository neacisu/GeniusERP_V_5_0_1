/**
 * MFA/2FA Routes
 * 
 * Rute pentru configurarea și gestionarea autentificării cu doi factori
 */

import { Router } from 'express';
import { getMfaService } from '../services/mfa.service';
import { AuthGuard } from '../guards/auth.guard';
import { JwtAuthMode } from '../types';
import { createModuleLogger } from '../../../common/logger/loki-logger';

const logger = createModuleLogger('mfa-routes');
const router = Router();
const mfaService = getMfaService();

// Toate rutele MFA necesită autentificare
router.use(AuthGuard.protect(JwtAuthMode.REQUIRED));

/**
 * POST /api/auth/mfa/setup
 * Inițializează configurarea MFA pentru utilizatorul curent
 */
router.post('/setup', async (req, res) => {
  try {
    const userId = req.user!.id;
    const email = req.user!.email || '';
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required for MFA setup'
      });
    }
    
    logger.info(`MFA setup requested by user: ${userId}`);
    
    const result = await mfaService.setupMfa(userId, email);
    
    res.json({
      success: true,
      message: 'MFA configurat cu succes. Scanați codul QR cu aplicația de autentificare.',
      data: {
        qrCode: result.qrCode,
        backupCodes: result.backupCodes,
        secret: result.secret // Pentru copiere manuală dacă QR nu funcționează
      }
    });
  } catch (error) {
    logger.error('MFA setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Nu s-a putut configura MFA'
    });
  }
});

/**
 * POST /api/auth/mfa/verify
 * Verifică un cod OTP pentru activarea MFA
 */
router.post('/verify', async (req, res) => {
  try {
    const userId = req.user!.id;
    const { token } = req.body;
    
    if (!token || token.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'Codul OTP trebuie să aibă 6 cifre'
      });
    }
    
    const isValid = await mfaService.verifyMfaToken(userId, token);
    
    if (isValid) {
      // Activează MFA pentru utilizator
      await mfaService.query(async (db) => {
        const { users } = await import('@shared/schema');
        const { eq } = await import('drizzle-orm');
        await db.update(users)
          .set({ mfaEnabled: true, updatedAt: new Date() })
          .where(eq(users.id, userId));
      }, 'activateMfa');
      
      res.json({
        success: true,
        message: 'MFA activat cu succes'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Cod OTP invalid'
      });
    }
  } catch (error) {
    logger.error('MFA verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Eroare la verificarea MFA'
    });
  }
});

/**
 * POST /api/auth/mfa/disable
 * Dezactivează MFA pentru utilizatorul curent
 */
router.post('/disable', async (req, res) => {
  try {
    const userId = req.user!.id;
    const { password } = req.body;
    
    // Verifică parola pentru siguranță
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Parola este necesară pentru dezactivarea MFA'
      });
    }
    
    // TODO: Verificare parolă
    
    await mfaService.disableMfa(userId);
    
    res.json({
      success: true,
      message: 'MFA dezactivat cu succes'
    });
  } catch (error) {
    logger.error('MFA disable error:', error);
    res.status(500).json({
      success: false,
      message: 'Nu s-a putut dezactiva MFA'
    });
  }
});

/**
 * POST /api/auth/mfa/regenerate-backup-codes
 * Generează backup codes noi
 */
router.post('/regenerate-backup-codes', async (req, res) => {
  try {
    const userId = req.user!.id;
    
    const backupCodes = await mfaService.regenerateBackupCodes(userId);
    
    res.json({
      success: true,
      message: 'Backup codes regenerate cu succes',
      data: { backupCodes }
    });
  } catch (error) {
    logger.error('Backup codes regeneration error:', error);
    res.status(500).json({
      success: false,
      message: 'Nu s-au putut genera backup codes noi'
    });
  }
});

/**
 * GET /api/auth/mfa/status
 * Verifică statusul MFA pentru utilizatorul curent
 */
router.get('/status', async (req, res) => {
  try {
    const userId = req.user!.id;
    
    const isEnabled = await mfaService.isMfaEnabled(userId);
    
    res.json({
      success: true,
      data: { mfaEnabled: isEnabled }
    });
  } catch (error) {
    logger.error('MFA status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Nu s-a putut verifica statusul MFA'
    });
  }
});

logger.info('✓ MFA routes initialized');

export default router;

