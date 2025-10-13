/**
 * Password Validation
 * 
 * Validator unificat pentru parole conform OWASP Password Storage Cheat Sheet
 * și NIST SP 800-63B guidelines.
 * 
 * Cerințe minime:
 * - Minimum 12 caractere (NIST recomandă 8-64, dar 12+ este mai sigur)
 * - Cel puțin o literă mare
 * - Cel puțin o literă mică  
 * - Cel puțin o cifră
 * - Cel puțin un caracter special
 * 
 * Validări suplimentare:
 * - Nu permite parole comune (top 10000)
 * - Nu permite parole care conțin username-ul
 * - Nu permite caractere repetitive (ex: "aaaaaa")
 */

import { z } from 'zod';

/**
 * Lista parolelor comune care sunt interzise
 * În producție, aceasta ar trebui să fie o listă completă de ~10000 parole
 */
const COMMON_PASSWORDS = [
  'password', 'password123', '123456', '12345678', '123456789',
  'qwerty', 'abc123', 'password1', '111111', '123123',
  'admin', 'admin123', 'root', 'toor', 'pass',
  'parola', 'parola123', '123parola', 'administrator'
];

/**
 * Schema Zod pentru validare parole
 * 
 * Poate fi folosită direct în formulare sau în API-uri
 */
export const passwordSchema = z
  .string({ required_error: 'Parola este obligatorie' })
  .min(12, 'Parola trebuie să aibă minimum 12 caractere')
  .max(128, 'Parola nu poate depăși 128 caractere') // Previne DoS prin parole foarte lungi
  .regex(/[A-Z]/, 'Parola trebuie să conțină cel puțin o literă mare (A-Z)')
  .regex(/[a-z]/, 'Parola trebuie să conțină cel puțin o literă mică (a-z)')
  .regex(/[0-9]/, 'Parola trebuie să conțină cel puțin o cifră (0-9)')
  .regex(/[^A-Za-z0-9]/, 'Parola trebuie să conțină cel puțin un caracter special (!@#$%^&* etc.)')
  .refine(
    (password) => !COMMON_PASSWORDS.includes(password.toLowerCase()),
    { message: 'Această parolă este prea comună. Vă rugăm alegeți o parolă mai puternică.' }
  )
  .refine(
    (password) => !/(.)\1{3,}/.test(password),
    { message: 'Parola nu poate conține mai mult de 3 caractere consecutive identice' }
  );

/**
 * Schema pentru validarea parolei cu confirmare
 */
export const passwordWithConfirmationSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string()
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Parolele nu coincid',
    path: ['confirmPassword']
  }
);

/**
 * Schema pentru schimbarea parolei (necesită parola veche)
 */
export const changePasswordSchema = z.object({
  oldPassword: z.string({ required_error: 'Parola veche este obligatorie' }),
  newPassword: passwordSchema,
  confirmPassword: z.string()
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: 'Parolele nu coincid',
    path: ['confirmPassword']
  }
).refine(
  (data) => data.oldPassword !== data.newPassword,
  {
    message: 'Parola nouă trebuie să fie diferită de parola veche',
    path: ['newPassword']
  }
);

/**
 * Validare parola cu username context (previne username în parolă)
 */
export function validatePasswordWithUsername(password: string, username: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Validare standard
  const result = passwordSchema.safeParse(password);
  if (!result.success) {
    errors.push(...result.error.errors.map(e => e.message));
  }
  
  // Verifică dacă parola conține username-ul
  if (username && password.toLowerCase().includes(username.toLowerCase())) {
    errors.push('Parola nu poate conține numele de utilizator');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validare parola cu email context (previne email în parolă)
 */
export function validatePasswordWithEmail(password: string, email: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Validare standard
  const result = passwordSchema.safeParse(password);
  if (!result.success) {
    errors.push(...result.error.errors.map(e => e.message));
  }
  
  // Verifică dacă parola conține partea locală a email-ului
  if (email) {
    const localPart = email.split('@')[0];
    if (password.toLowerCase().includes(localPart.toLowerCase())) {
      errors.push('Parola nu poate conține adresa de email');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Calculează puterea parolei (0-100)
 * Util pentru feedback vizual în UI
 */
export function calculatePasswordStrength(password: string): number {
  let strength = 0;
  
  // Lungime
  if (password.length >= 12) strength += 25;
  else if (password.length >= 10) strength += 15;
  else if (password.length >= 8) strength += 10;
  
  // Complexitate
  if (/[a-z]/.test(password)) strength += 15;
  if (/[A-Z]/.test(password)) strength += 15;
  if (/[0-9]/.test(password)) strength += 15;
  if (/[^A-Za-z0-9]/.test(password)) strength += 20;
  
  // Diversitate caractere
  const uniqueChars = new Set(password).size;
  if (uniqueChars > 10) strength += 10;
  else if (uniqueChars > 7) strength += 5;
  
  return Math.min(strength, 100);
}

/**
 * Returnează eticheta pentru puterea parolei
 */
export function getPasswordStrengthLabel(strength: number): string {
  if (strength >= 80) return 'Foarte puternică';
  if (strength >= 60) return 'Puternică';
  if (strength >= 40) return 'Medie';
  if (strength >= 20) return 'Slabă';
  return 'Foarte slabă';
}

/**
 * Returnează culoarea pentru puterea parolei (pentru UI)
 */
export function getPasswordStrengthColor(strength: number): string {
  if (strength >= 80) return '#10b981'; // green
  if (strength >= 60) return '#3b82f6'; // blue
  if (strength >= 40) return '#f59e0b'; // yellow
  if (strength >= 20) return '#f97316'; // orange
  return '#ef4444'; // red
}

