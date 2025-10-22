import { Router, Request, Response } from 'express';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/types';
import { SettingsService } from '../services/settings.service';
import { EmployeeService } from '../services/employee.service';
import { HrDocumentService } from '../services/document.service';
import { HolidayService } from '../services/holiday.service';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configurare multer pentru încărcarea documentelor
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads/hr_documents';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + uuidv4();
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Limită de 10MB
  }
});

// Inițializare servicii HR
const employeeService = new EmployeeService();
const documentService = new HrDocumentService();
const holidayService = new HolidayService();

// Settings routes
router.get('/settings',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req: Request, res: Response) => {
    try {
      await SettingsService.getSettings(req, res);
    } catch (error: any) {
      console.error("Error in settings endpoint:", error);
      res.status(500).json({
        success: false,
        message: "Eroare la obținerea setărilor",
        error: (error as Error).message
      });
    }
  }
);

router.put('/settings/:id',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req: Request, res: Response) => {
    try {
      await SettingsService.updateSettings(req, res);
    } catch (error: any) {
      console.error("Error in settings update endpoint:", error);
      res.status(500).json({
        success: false,
        message: "Eroare la actualizarea setărilor",
        error: (error as Error).message
      });
    }
  }
);

// Employee draft routes
router.post('/employees/draft',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req: Request, res: Response) => {
    try {
      const { userData, draftId } = req.body;
      const userId = req.user?.id || '';
      const companyId = req.user?.companyId || '';

      // Salvăm ciorna angajatului
      const savedDraft = await documentService.saveEmployeeDraft(
        companyId,
        userData,
        userId,
        draftId
      );

      res.status(200).json({
        success: true,
        data: savedDraft,
        message: "Ciorna angajatului a fost salvată cu succes"
      });
    } catch (error: any) {
      console.error("Error saving employee draft:", error);
      res.status(500).json({
        success: false,
        message: "Eroare la salvarea ciornei angajatului",
        error: (error as Error).message
      });
    }
  }
);

// Generate compliance documents
router.post('/documents/generate-compliance',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req: Request, res: Response) => {
    try {
      const { employeeData } = req.body;
      const userId = req.user?.id || '';
      const companyId = req.user?.companyId || '';

      // Generăm documente de conformitate
      const documents = await documentService.generateComplianceDocuments(
        companyId,
        employeeData,
        userId
      );

      res.status(200).json({
        success: true,
        data: documents,
        message: "Documentele au fost generate cu succes"
      });
    } catch (error: any) {
      console.error("Error generating compliance documents:", error);
      res.status(500).json({
        success: false,
        message: "Eroare la generarea documentelor de conformitate",
        error: (error as Error).message
      });
    }
  }
);

// Upload document
router.post('/documents/upload',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Niciun fișier primit"
        });
      }

      const { employeeId, documentType } = req.body;
      const userId = req.user?.id || '';
      const companyId = req.user?.companyId || '';
      
      // Înregistrăm documentul în baza de date
      const documentUrl = `/uploads/hr_documents/${req.file.filename}`;
      const uploadedDocument = await documentService.saveEmployeeDocument(
        companyId,
        employeeId || null,
        documentType || 'other',
        documentUrl,
        req.file.originalname,
        userId
      );

      res.status(200).json({
        success: true,
        data: {
          documentUrl,
          document: uploadedDocument
        },
        message: "Documentul a fost încărcat cu succes"
      });
    } catch (error: any) {
      console.error("Error uploading document:", error);
      res.status(500).json({
        success: false,
        message: "Eroare la încărcarea documentului",
        error: (error as Error).message
      });
    }
  }
);

// Endpoint pentru a obține zilele de sărbătoare legală pentru România
router.get('/holidays',
  async (req: Request, res: Response) => {
    try {
      const holidays = await holidayService.getRomanianHolidays();
      
      res.status(200).json({
        success: true,
        data: holidays,
        message: "Zilele de sărbătoare legală au fost obținute cu succes"
      });
    } catch (error: any) {
      console.error("Error fetching Romanian holidays:", error);
      res.status(500).json({
        success: false,
        message: "Eroare la obținerea zilelor de sărbătoare legală",
        error: (error as Error).message
      });
    }
  }
);

export default router;