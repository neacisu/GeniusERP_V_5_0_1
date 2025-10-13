/**
 * Secure File Upload Middleware
 * 
 * Middleware unificat pentru toate upload-urile de fișiere în aplicație.
 * Implementează măsuri de securitate conform OWASP File Upload Cheat Sheet.
 * 
 * Protecții implementate:
 * - Validare tip MIME
 * - Validare extensie fișier
 * - Limitare dimensiune fișier
 * - Validare nume fișier (prevenire path traversal)
 * - Generare nume unice (prevenire coliziuni și ghicire)
 * - Stocare în directoare izolate
 */

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { Request } from 'express';
import { createModuleLogger } from '../logger/loki-logger';

const logger = createModuleLogger('file-upload');

/**
 * Tipuri MIME permise pentru fișiere generale
 */
export const ALLOWED_MIME_TYPES = {
  // Documente
  PDF: 'application/pdf',
  DOC: 'application/msword',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  XLS: 'application/vnd.ms-excel',
  XLSX: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  TXT: 'text/plain',
  CSV: 'text/csv',
  
  // Imagini
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  GIF: 'image/gif',
  WEBP: 'image/webp',
  
  // Altele
  ZIP: 'application/zip',
  JSON: 'application/json',
  XML: 'application/xml'
} as const;

/**
 * Extensii permise pentru fișiere
 */
export const ALLOWED_EXTENSIONS = {
  DOCUMENTS: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv'],
  IMAGES: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  ARCHIVES: ['.zip'],
  DATA: ['.json', '.xml']
} as const;

/**
 * Dimensiuni maxime pentru diferite tipuri de fișiere
 */
export const MAX_FILE_SIZES = {
  IMAGE: 5 * 1024 * 1024,       // 5 MB pentru imagini
  DOCUMENT: 10 * 1024 * 1024,   // 10 MB pentru documente
  ARCHIVE: 50 * 1024 * 1024,    // 50 MB pentru arhive
  DEFAULT: 10 * 1024 * 1024     // 10 MB default
} as const;

/**
 * Opțiuni de configurare pentru upload
 */
export interface FileUploadOptions {
  /**
   * Subdirectorul în uploads/ unde vor fi stocate fișierele
   */
  subdir: string;
  
  /**
   * Tipuri MIME permise (default: toate documentele și imaginile)
   */
  allowedMimeTypes?: string[];
  
  /**
   * Extensii permise (default: toate extensiile pentru documente și imagini)
   */
  allowedExtensions?: string[];
  
  /**
   * Dimensiune maximă fișier în bytes (default: 10MB)
   */
  maxFileSize?: number;
  
  /**
   * Număr maxim de fișiere per request (default: 1)
   */
  maxFiles?: number;
  
  /**
   * Păstrează numele original (false = generează UUID, true = folosește original sanitizat)
   */
  preserveOriginalName?: boolean;
}

/**
 * Validează și sanitizează numele fișierului
 */
function sanitizeFilename(filename: string): string {
  // Înlocuiește caractere periculoase și whitespace
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '') // Caractere interzise Windows
    .replace(/\s+/g, '_')                   // Whitespace -> underscore
    .replace(/\.{2,}/g, '.')                // Multiple dots -> single dot
    .replace(/^\.+/, '')                    // Leading dots
    .substring(0, 255);                     // Limitare lungime
}

/**
 * Verifică dacă directorul există, altfel îl creează
 */
function ensureDirectoryExists(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Created upload directory: ${dir}`);
  }
}

/**
 * Creează middleware Multer pentru upload securizat
 */
export function createSecureUpload(options: FileUploadOptions) {
  const {
    subdir,
    allowedMimeTypes = [
      ...Object.values(ALLOWED_MIME_TYPES).filter(type => 
        type.startsWith('application/') || type.startsWith('image/')
      )
    ],
    allowedExtensions = [
      ...ALLOWED_EXTENSIONS.DOCUMENTS,
      ...ALLOWED_EXTENSIONS.IMAGES
    ],
    maxFileSize = MAX_FILE_SIZES.DEFAULT,
    maxFiles = 1,
    preserveOriginalName = false
  } = options;
  
  const uploadDir = path.join(process.cwd(), 'uploads', subdir);
  ensureDirectoryExists(uploadDir);
  
  // Configurare storage Multer
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      
      if (preserveOriginalName) {
        const sanitized = sanitizeFilename(file.originalname);
        const timestamp = Date.now();
        const basename = path.basename(sanitized, ext);
        cb(null, `${basename}_${timestamp}${ext}`);
      } else {
        // Generează nume unic cu UUID
        const uniqueName = `${uuidv4()}${ext}`;
        cb(null, uniqueName);
      }
    }
  });
  
  // FileFilter pentru validare
  const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Validare MIME type
    if (!allowedMimeTypes.includes(file.mimetype)) {
      logger.warn(`Rejected file upload - invalid MIME type: ${file.mimetype}`);
      return cb(new Error(`Tip fișier nepermis: ${file.mimetype}. Tipuri permise: ${allowedMimeTypes.join(', ')}`));
    }
    
    // Validare extensie
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      logger.warn(`Rejected file upload - invalid extension: ${ext}`);
      return cb(new Error(`Extensie nepermisă: ${ext}. Extensii permise: ${allowedExtensions.join(', ')}`));
    }
    
    // Validare nume fișier - prevenire path traversal
    if (file.originalname.includes('..') || /[<>:"/\\|?*\x00-\x1F]/.test(file.originalname)) {
      logger.warn(`Rejected file upload - dangerous filename: ${file.originalname}`);
      return cb(new Error('Numele fișierului conține caractere interzise sau secvențe periculoase'));
    }
    
    logger.debug(`File upload validation passed: ${file.originalname} (${file.mimetype})`);
    cb(null, true);
  };
  
  // Configurare Multer
  const upload = multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxFileSize,
      files: maxFiles,
      // Limite suplimentare pentru prevenire DoS
      fields: 50,           // Max câmpuri non-file
      fieldSize: 1024 * 1024, // 1MB per câmp
      fieldNameSize: 100    // Max lungime nume câmp
    }
  });
  
  logger.info(`Secure file upload middleware created for: ${subdir}`);
  logger.info(`- Max file size: ${(maxFileSize / 1024 / 1024).toFixed(2)} MB`);
  logger.info(`- Max files: ${maxFiles}`);
  logger.info(`- Allowed types: ${allowedMimeTypes.length} MIME types`);
  
  return upload;
}

/**
 * Middleware predefinit pentru upload-uri generale
 */
export const generalUpload = createSecureUpload({
  subdir: 'general',
  maxFileSize: MAX_FILE_SIZES.DEFAULT
});

/**
 * Middleware predefinit pentru imagini
 */
export const imageUpload = createSecureUpload({
  subdir: 'images',
  allowedMimeTypes: Object.values(ALLOWED_MIME_TYPES).filter(t => t.startsWith('image/')),
  allowedExtensions: ALLOWED_EXTENSIONS.IMAGES,
  maxFileSize: MAX_FILE_SIZES.IMAGE
});

/**
 * Middleware predefinit pentru documente contabilitate
 */
export const accountingDocumentUpload = createSecureUpload({
  subdir: 'accounting-attachments',
  allowedMimeTypes: [
    ALLOWED_MIME_TYPES.PDF,
    ALLOWED_MIME_TYPES.JPEG,
    ALLOWED_MIME_TYPES.PNG,
    ALLOWED_MIME_TYPES.DOCX,
    ALLOWED_MIME_TYPES.XLSX,
    ALLOWED_MIME_TYPES.TXT
  ],
  allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png', '.docx', '.xlsx', '.txt'],
  maxFileSize: MAX_FILE_SIZES.DOCUMENT
});

/**
 * Middleware predefinit pentru documente HR
 */
export const hrDocumentUpload = createSecureUpload({
  subdir: 'hr_documents',
  allowedMimeTypes: [
    ALLOWED_MIME_TYPES.PDF,
    ALLOWED_MIME_TYPES.DOCX,
    ALLOWED_MIME_TYPES.JPEG,
    ALLOWED_MIME_TYPES.PNG
  ],
  allowedExtensions: ['.pdf', '.docx', '.jpg', '.jpeg', '.png'],
  maxFileSize: MAX_FILE_SIZES.DOCUMENT
});

/**
 * Helper pentru ștergere fișier securizată
 */
export async function deleteFile(filePath: string): Promise<void> {
  try {
    // Verifică că path-ul este în directorul uploads
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const absolutePath = path.resolve(filePath);
    
    if (!absolutePath.startsWith(uploadsDir)) {
      throw new Error('Încercare de ștergere fișier din afara directorului uploads');
    }
    
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      logger.info(`File deleted: ${absolutePath}`);
    }
  } catch (error) {
    logger.error(`Failed to delete file: ${filePath}`, error);
    throw error;
  }
}

/**
 * Helper pentru verificare existență fișier
 */
export function fileExists(filePath: string): boolean {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const absolutePath = path.resolve(filePath);
    
    if (!absolutePath.startsWith(uploadsDir)) {
      return false;
    }
    
    return fs.existsSync(absolutePath);
  } catch {
    return false;
  }
}

logger.info('✓ Secure file upload middleware initialized');

