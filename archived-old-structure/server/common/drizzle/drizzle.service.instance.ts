/**
 * Drizzle Service Singleton
 * 
 * Exportă instanța singleton a serviciului Drizzle pentru a fi refolosit
 * în toată aplicația, asigurând o singură conexiune la baza de date.
 */

import { DrizzleService } from './drizzle.service';

// Creare și export a instanței singleton
export const drizzleService = new DrizzleService();