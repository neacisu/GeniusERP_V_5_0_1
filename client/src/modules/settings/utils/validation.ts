/**
 * Validation Utility Functions
 * 
 * Utility functions for validating form inputs in settings components
 */

import { z } from "zod";

/**
 * Common validation schema for email address
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Adresa de email nu este validă");

/**
 * Common validation schema for phone number
 */
export const phoneSchema = z
  .string()
  .trim()
  .regex(/^(\+4|0)?0?[0-9]{9}$/, "Numărul de telefon nu este valid");

/**
 * Common validation schema for website URL
 */
export const websiteSchema = z
  .string()
  .trim()
  .toLowerCase()
  .url("URL-ul nu este valid")
  .or(z.literal(""))
  .optional();

/**
 * Common validation schema for Romanian fiscal code (CUI)
 */
export const fiscalCodeSchema = z
  .string()
  .trim()
  .regex(/^RO?[0-9]{2,10}$/, "Codul fiscal nu este valid");

/**
 * Common validation schema for Romanian company registration number
 */
export const registrationNumberSchema = z
  .string()
  .trim()
  .regex(/^J[0-9]{2}\/[0-9]{1,6}\/[0-9]{4}$/, "Numărul de înregistrare la Registrul Comerțului nu este valid");

/**
 * Common validation schema for Romanian bank account (IBAN)
 */
export const ibanSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^RO[0-9]{2}[A-Z]{4}[A-Z0-9]{16}$/, "IBAN-ul nu este valid");

/**
 * Common validation schema for password
 */
export const passwordSchema = z
  .string()
  .min(8, "Parola trebuie să aibă cel puțin 8 caractere")
  .regex(/[A-Z]/, "Parola trebuie să conțină cel puțin o literă mare")
  .regex(/[a-z]/, "Parola trebuie să conțină cel puțin o literă mică")
  .regex(/[0-9]/, "Parola trebuie să conțină cel puțin o cifră");

/**
 * Common validation schema for CNP (Romanian personal identification number)
 */
export const cnpSchema = z
  .string()
  .trim()
  .regex(/^[1-8][0-9]{12}$/, "CNP-ul nu este valid");

/**
 * Check if a string is a valid email address
 */
export function isValidEmail(email: string): boolean {
  return emailSchema.safeParse(email).success;
}

/**
 * Check if a string is a valid phone number
 */
export function isValidPhone(phone: string): boolean {
  return phoneSchema.safeParse(phone).success;
}

/**
 * Check if a string is a valid website URL
 */
export function isValidWebsite(website: string): boolean {
  return websiteSchema.safeParse(website).success;
}

/**
 * Check if a string is a valid fiscal code (CUI)
 */
export function isValidFiscalCode(fiscalCode: string): boolean {
  return fiscalCodeSchema.safeParse(fiscalCode).success;
}

/**
 * Check if a string is a valid registration number
 */
export function isValidRegistrationNumber(registrationNumber: string): boolean {
  return registrationNumberSchema.safeParse(registrationNumber).success;
}

/**
 * Check if a string is a valid IBAN
 */
export function isValidIBAN(iban: string): boolean {
  return ibanSchema.safeParse(iban).success;
}

/**
 * Check if a string is a valid CNP
 */
export function isValidCNP(cnp: string): boolean {
  return cnpSchema.safeParse(cnp).success;
}