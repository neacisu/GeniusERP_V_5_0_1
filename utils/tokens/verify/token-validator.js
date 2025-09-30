/**
 * Token Validator Utility
 * 
 * Advanced token validation utilities for the application.
 * This module provides validation beyond simple JWT verification,
 * including role checking, permission validation, and expiration warnings.
 */

import { verifyToken } from '../token-manager.js';

/**
 * Check if a token has specific roles
 * @param {string} token - JWT token
 * @param {string[]} requiredRoles - Roles to check for
 * @returns {Promise<{hasRoles: boolean, missingRoles: string[], result: any}>}
 */
async function checkRoles(token, requiredRoles = []) {
  const verificationResult = await verifyToken(token);
  
  if (!verificationResult.isValid) {
    return {
      hasRoles: false,
      missingRoles: requiredRoles,
      result: verificationResult
    };
  }
  
  const tokenRoles = verificationResult.decoded.roles || [];
  const missingRoles = requiredRoles.filter(role => !tokenRoles.includes(role));
  
  return {
    hasRoles: missingRoles.length === 0,
    missingRoles,
    result: verificationResult
  };
}

/**
 * Check if a token has specific permissions
 * @param {string} token - JWT token
 * @param {string[]} requiredPermissions - Permissions to check for
 * @returns {Promise<{hasPermissions: boolean, missingPermissions: string[], result: any}>}
 */
async function checkPermissions(token, requiredPermissions = []) {
  const verificationResult = await verifyToken(token);
  
  if (!verificationResult.isValid) {
    return {
      hasPermissions: false,
      missingPermissions: requiredPermissions,
      result: verificationResult
    };
  }
  
  const tokenPermissions = verificationResult.decoded.permissions || [];
  const missingPermissions = requiredPermissions.filter(permission => !tokenPermissions.includes(permission));
  
  return {
    hasPermissions: missingPermissions.length === 0,
    missingPermissions,
    result: verificationResult
  };
}

/**
 * Check token expiration status
 * @param {string} token - JWT token
 * @param {number} warningThresholdMinutes - Minutes before expiration to trigger warning
 * @returns {Promise<{status: string, minutesRemaining: number, result: any}>}
 */
async function checkExpiration(token, warningThresholdMinutes = 60) {
  const verificationResult = await verifyToken(token);
  
  if (!verificationResult.isValid) {
    return {
      status: 'invalid',
      minutesRemaining: 0,
      result: verificationResult
    };
  }
  
  const expiryTime = verificationResult.decoded.exp * 1000; // Convert to milliseconds
  const currentTime = Date.now();
  const timeRemaining = expiryTime - currentTime;
  const minutesRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60)));
  
  let status = 'valid';
  
  if (timeRemaining <= 0) {
    status = 'expired';
  } else if (minutesRemaining <= warningThresholdMinutes) {
    status = 'warning';
  }
  
  return {
    status,
    minutesRemaining,
    result: verificationResult
  };
}

/**
 * Perform a complete validation of a token
 * @param {string} token - JWT token
 * @param {object} options - Validation options
 * @returns {Promise<object>} - Complete validation result
 */
async function validateToken(token, options = {}) {
  const {
    requiredRoles = [],
    requiredPermissions = [],
    warningThresholdMinutes = 60
  } = options;
  
  // Perform basic verification
  const basicResult = await verifyToken(token);
  
  if (!basicResult.isValid) {
    return {
      isValid: false,
      error: basicResult.error,
      roles: { hasRoles: false, missingRoles: requiredRoles },
      permissions: { hasPermissions: false, missingPermissions: requiredPermissions },
      expiration: { status: 'invalid', minutesRemaining: 0 }
    };
  }
  
  // Check roles, permissions and expiration
  const [rolesResult, permissionsResult, expirationResult] = await Promise.all([
    checkRoles(token, requiredRoles),
    checkPermissions(token, requiredPermissions),
    checkExpiration(token, warningThresholdMinutes)
  ]);
  
  return {
    isValid: true,
    decoded: basicResult.decoded,
    roles: {
      hasRoles: rolesResult.hasRoles,
      missingRoles: rolesResult.missingRoles
    },
    permissions: {
      hasPermissions: permissionsResult.hasPermissions,
      missingPermissions: permissionsResult.missingPermissions
    },
    expiration: {
      status: expirationResult.status,
      minutesRemaining: expirationResult.minutesRemaining
    }
  };
}

export default {
  checkRoles,
  checkPermissions,
  checkExpiration,
  validateToken
};