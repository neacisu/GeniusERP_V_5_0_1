/**
 * Environment Variables Validation
 * 
 * Validează toate variabilele de mediu necesare la pornirea aplicației
 * pentru a preveni configurări nesecurizate în producție.
 * 
 * Conform OWASP și ISO 27001 - Security Misconfiguration prevention
 */

import { z } from 'zod';
import { createModuleLogger } from '../common/logger/loki-logger';

const logger = createModuleLogger('env-validation');

/**
 * Schema de validare pentru variabilele de mediu
 */
const envSchema = z.object({
  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test'], {
    errorMap: () => ({ message: 'NODE_ENV must be development, production, or test' })
  }),

  // Security - JWT & Sessions
  JWT_SECRET: z.string().min(32, {
    message: 'JWT_SECRET must be at least 32 characters for security'
  }),
  JWT_EXPIRES_IN: z.string().default('24h'),
  
  SESSION_SECRET: z.string().min(32, {
    message: 'SESSION_SECRET must be at least 32 characters for security'
  }),

  // Database
  DATABASE_URL: z.string().url({
    message: 'DATABASE_URL must be a valid URL'
  }),

  // Redis (optional but recommended for rate limiting)
  REDIS_URL: z.string().url().optional(),
  REDIS_PASSWORD: z.string().optional(),

  // CORS - Required in production
  ALLOWED_ORIGINS: z.string().refine((val) => {
    if (process.env.NODE_ENV === 'production') {
      return val && val.length > 0 && val !== '*';
    }
    return true;
  }, {
    message: 'ALLOWED_ORIGINS must be explicitly set in production (not *)'
  }),

  // Cookie Domain (optional but recommended for production)
  COOKIE_DOMAIN: z.string().optional(),

  // Port
  PORT: z.string().default('5000'),

  // External Services (optional)
  OPENAI_API_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  ANAF_API_KEY: z.string().optional(),

  // Monitoring (optional)
  SENTRY_DSN: z.string().optional(),
  LOKI_HOST: z.string().optional(),
  GRAFANA_URL: z.string().optional(),
});

export type ValidatedEnv = z.infer<typeof envSchema>;

/**
 * Validează variabilele de mediu la pornirea aplicației
 * @throws Error dacă validarea eșuează
 */
export function validateEnv(): ValidatedEnv {
  try {
    const validatedEnv = envSchema.parse(process.env);
    
    logger.info('✓ Environment variables validated successfully');
    
    // Log-uri suplimentare pentru confirmare (fără a expune valori sensibile)
    logger.info(`Environment: ${validatedEnv.NODE_ENV}`);
    logger.info(`JWT_SECRET length: ${validatedEnv.JWT_SECRET.length} characters`);
    logger.info(`SESSION_SECRET length: ${validatedEnv.SESSION_SECRET.length} characters`);
    logger.info(`Database configured: ${validatedEnv.DATABASE_URL.includes('postgresql') ? 'PostgreSQL' : 'Unknown'}`);
    logger.info(`Redis configured: ${validatedEnv.REDIS_URL ? 'Yes' : 'No (using fallback)'}`);
    logger.info(`CORS origins: ${validatedEnv.ALLOWED_ORIGINS || 'Not set (development only)'}`);
    
    // Avertismente pentru configurări lipsă în producție
    if (validatedEnv.NODE_ENV === 'production') {
      if (!validatedEnv.REDIS_URL) {
        logger.warn('⚠ REDIS_URL not set - rate limiting will use memory store (not recommended for production)');
      }
      if (!validatedEnv.COOKIE_DOMAIN) {
        logger.warn('⚠ COOKIE_DOMAIN not set - cookies will not be restricted to domain');
      }
      if (!validatedEnv.SENTRY_DSN) {
        logger.warn('⚠ SENTRY_DSN not set - error tracking disabled');
      }
    }
    
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error('✗ Environment validation failed:');
      error.errors.forEach((err) => {
        logger.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      logger.error('\nPlease check your .env file and ensure all required variables are set correctly.');
      logger.error('See env.example.txt for reference.');
    } else {
      logger.error('✗ Unexpected error during environment validation:', error);
    }
    
    // Oprește aplicația dacă validarea eșuează
    process.exit(1);
  }
}

/**
 * Validează și returnează o variabilă specifică
 */
export function getEnvVar(key: keyof ValidatedEnv): string | undefined {
  const env = validateEnv();
  return env[key] as string | undefined;
}

/**
 * Verifică dacă aplicația rulează în producție
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Verifică dacă aplicația rulează în development
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

