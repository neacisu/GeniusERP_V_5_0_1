/**
 * Security Logger - Utilitar pentru logging securizat cu obfuscare date sensibile
 * 
 * Funcționalități:
 * - Obfuscare tokeni JWT
 * - Obfuscare UUID-uri
 * - Detectare și obfuscare automată date sensibile
 * - Logging condițional bazat pe mediu
 * 
 * @module security-logger
 */

// Tipuri de log levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Tipuri de date sensibile
export enum SensitiveDataType {
  TOKEN = 'TOKEN',
  UUID = 'UUID',
  PASSWORD = 'PASSWORD',
  EMAIL = 'EMAIL',
  API_KEY = 'API_KEY',
  URL = 'URL',
  IP = 'IP'
}

/**
 * Configurare logging bazată pe mediu
 */
const LOG_CONFIG = {
  level: (import.meta.env['VITE_LOG_LEVEL'] as LogLevel) || 
         (import.meta.env.PROD ? 'error' : 'debug'),
  enableSensitiveLogs: import.meta.env['VITE_ENABLE_SENSITIVE_LOGS'] === 'true' || 
                       import.meta.env.DEV,
  isProd: import.meta.env.PROD
};

/**
 * Obfuscă un token JWT
 * Format: "eyJhbG...c2d" (primele 7 + ultimele 4 caractere)
 * 
 * @param token - Token JWT complet
 * @returns Token obfuscat
 */
export function maskToken(token: string | null | undefined): string {
  if (!token || typeof token !== 'string') {
    return '***INVALID_TOKEN***';
  }
  
  if (token.length < 12) {
    return '***SHORT_TOKEN***';
  }
  
  const prefix = token.substring(0, 7);
  const suffix = token.substring(token.length - 4);
  
  return `${prefix}...${suffix}`;
}

/**
 * Obfuscă un UUID
 * Format: "f74b89a3-...-cff7039b8c2d" (primele 8 + ultimele 12)
 * 
 * @param uuid - UUID complet
 * @returns UUID obfuscat
 */
export function maskUUID(uuid: string | null | undefined): string {
  if (!uuid || typeof uuid !== 'string') {
    return '***INVALID_UUID***';
  }
  
  // Pattern UUID: 8-4-4-4-12
  const uuidPattern = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
  
  if (!uuidPattern.test(uuid)) {
    return '***MALFORMED_UUID***';
  }
  
  const prefix = uuid.substring(0, 8);
  const suffix = uuid.substring(uuid.length - 12);
  
  return `${prefix}-...-${suffix}`;
}

/**
 * Obfuscă o parolă
 * Format: "***PASSWORD:LENGTH***"
 * 
 * @param password - Parolă
 * @returns Lungime parolă obfuscată
 */
export function maskPassword(password: string | null | undefined): string {
  if (!password || typeof password !== 'string') {
    return '***NO_PASSWORD***';
  }
  
  return `***PASSWORD:LENGTH_${password.length}***`;
}

/**
 * Obfuscă un email
 * Format: "u***@domain.com"
 * 
 * @param email - Adresă email
 * @returns Email obfuscat
 */
export function maskEmail(email: string | null | undefined): string {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return '***INVALID_EMAIL***';
  }
  
  const [username, domain] = email.split('@');
  const maskedUsername = username.length > 1 
    ? username[0] + '***' 
    : '***';
  
  return `${maskedUsername}@${domain}`;
}

/**
 * Obfuscă un API key
 * Format: "sk_...xyz"
 * 
 * @param apiKey - API key
 * @returns API key obfuscat
 */
export function maskApiKey(apiKey: string | null | undefined): string {
  if (!apiKey || typeof apiKey !== 'string') {
    return '***INVALID_API_KEY***';
  }
  
  if (apiKey.length < 8) {
    return '***SHORT_API_KEY***';
  }
  
  const prefix = apiKey.substring(0, 3);
  const suffix = apiKey.substring(apiKey.length - 3);
  
  return `${prefix}...${suffix}`;
}

/**
 * Obfuscă o adresă IP
 * Format: "192.168.***.**" (IPv4) sau "2001:db8:***" (IPv6)
 * 
 * @param ip - Adresă IP
 * @returns IP obfuscat
 */
export function maskIP(ip: string | null | undefined): string {
  if (!ip || typeof ip !== 'string') {
    return '***INVALID_IP***';
  }
  
  // IPv4
  if (ip.includes('.')) {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.***.**`;
    }
  }
  
  // IPv6
  if (ip.includes(':')) {
    const parts = ip.split(':');
    if (parts.length >= 3) {
      return `${parts[0]}:${parts[1]}:***`;
    }
  }
  
  return '***UNKNOWN_IP***';
}

/**
 * Obfuscă URL-uri (păstrează doar domeniul)
 * Format: "https://domain.com/***"
 * 
 * @param url - URL complet
 * @returns URL obfuscat
 */
export function maskURL(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') {
    return '***INVALID_URL***';
  }
  
  try {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname}/***`;
  } catch {
    // Dacă nu e URL valid, obfuscă complet
    return '***MALFORMED_URL***';
  }
}

/**
 * Detectează și obfuscă automat date sensibile într-un obiect
 * Procesează recursive toate proprietățile
 * 
 * @param data - Obiect cu date potențial sensibile
 * @returns Obiect cu date obfuscate
 */
export function maskSensitiveData<T = any>(data: T): T {
  if (!LOG_CONFIG.enableSensitiveLogs && LOG_CONFIG.isProd) {
    // În producție cu sensitive logs disabled, nu returnăm nimic
    return '***SENSITIVE_DATA_HIDDEN***' as any;
  }
  
  if (data === null || data === undefined) {
    return data;
  }
  
  // Primitive types
  if (typeof data !== 'object') {
    return data;
  }
  
  // Arrays
  if (Array.isArray(data)) {
    return data.map(item => maskSensitiveData(item)) as any;
  }
  
  // Objects
  const masked: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    
    // Detectare automată tipuri de date sensibile
    if (lowerKey.includes('token') || lowerKey.includes('jwt') || 
        lowerKey.includes('authorization') || lowerKey.includes('bearer')) {
      masked[key] = maskToken(value as string);
    } else if (lowerKey.includes('password') || lowerKey.includes('pwd') || 
               lowerKey.includes('secret')) {
      masked[key] = maskPassword(value as string);
    } else if (lowerKey.includes('email') || lowerKey.includes('mail')) {
      masked[key] = maskEmail(value as string);
    } else if (lowerKey.includes('uuid') || lowerKey.includes('id')) {
      // Verifică dacă e UUID valid
      if (typeof value === 'string' && 
          /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)) {
        masked[key] = maskUUID(value);
      } else {
        masked[key] = value;
      }
    } else if (lowerKey.includes('apikey') || lowerKey.includes('api_key')) {
      masked[key] = maskApiKey(value as string);
    } else if (lowerKey.includes('ip') || lowerKey.includes('address')) {
      masked[key] = maskIP(value as string);
    } else if (lowerKey.includes('url') || lowerKey.includes('uri')) {
      masked[key] = maskURL(value as string);
    } else if (typeof value === 'object' && value !== null) {
      // Recursive pentru obiecte nested
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }
  
  return masked as T;
}

/**
 * Returnează nivelul de log permis bazat pe configurare
 * 
 * @returns Log level curent
 */
export function getLogLevel(): LogLevel {
  return LOG_CONFIG.level;
}

/**
 * Verifică dacă un anumit nivel de log ar trebui afișat
 * 
 * @param level - Nivelul de verificat
 * @returns true dacă ar trebui afișat
 */
export function shouldLog(level: LogLevel): boolean {
  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
  const currentLevelIndex = levels.indexOf(LOG_CONFIG.level);
  const requestedLevelIndex = levels.indexOf(level);
  
  return requestedLevelIndex >= currentLevelIndex;
}

/**
 * Logger central securizat
 * Înlocuiește console.log cu logging condițional și obfuscare automată
 * 
 * @param level - Nivel log
 * @param message - Mesaj principal
 * @param data - Date opționale (vor fi obfuscate automat)
 */
export function secureLog(
  level: LogLevel,
  message: string,
  data?: any
): void {
  // Verifică dacă ar trebui să logăm
  if (!shouldLog(level)) {
    return;
  }
  
  // Obfuscă datele
  const maskedData = data ? maskSensitiveData(data) : undefined;
  
  // Prefix pentru mediu
  const envPrefix = LOG_CONFIG.isProd ? '[PROD]' : '[DEV]';
  const timestamp = new Date().toISOString();
  
  // Log bazat pe nivel
  const logPrefix = `${envPrefix} [${timestamp}] [${level.toUpperCase()}]`;
  
  switch (level) {
    case 'debug':
      console.debug(logPrefix, message, maskedData);
      break;
    case 'info':
      console.info(logPrefix, message, maskedData);
      break;
    case 'warn':
      console.warn(logPrefix, message, maskedData);
      break;
    case 'error':
      console.error(logPrefix, message, maskedData);
      break;
  }
}

/**
 * Shorthand functions pentru logging rapid
 */
export const logger = {
  debug: (message: string, data?: any) => secureLog('debug', message, data),
  info: (message: string, data?: any) => secureLog('info', message, data),
  warn: (message: string, data?: any) => secureLog('warn', message, data),
  error: (message: string, data?: any) => secureLog('error', message, data),
  
  // Funcții speciale pentru date sensibile
  logToken: (context: string, token: string) => {
    secureLog('debug', `${context}: ${maskToken(token)}`);
  },
  logUUID: (context: string, uuid: string) => {
    secureLog('debug', `${context}: ${maskUUID(uuid)}`);
  },
  logRequest: (method: string, url: string, data?: any) => {
    secureLog('debug', `API Request: ${method} ${maskURL(url)}`, 
      data ? maskSensitiveData(data) : undefined);
  },
  logResponse: (url: string, status: number, data?: any) => {
    secureLog('debug', `API Response: ${maskURL(url)} [${status}]`, 
      data ? maskSensitiveData(data) : undefined);
  }
};

// Export configurare pentru acces extern
export const getLogConfig = () => ({ ...LOG_CONFIG });

