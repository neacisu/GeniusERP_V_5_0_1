import { Router, Request, Response } from 'express';
import { AuthGuard } from '@geniuserp/auth';
import { JwtAuthMode } from '@geniuserp/auth';
import { SettingsService } from '../services/settings.service';
import { HrDocumentService } from '../services/document.service';
import { HolidayService } from '../services/holiday.service';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

// Import all HR controllers
import { EmployeeController } from '../controllers/employee.controller';
import { DepartmentController } from '../controllers/department.controller';
import { ContractController } from '../controllers/contract.controller';
import { AbsenceController } from '../controllers/absence.controller';
import { PayrollController } from '../controllers/payroll.controller';
import { CorController } from '../controllers/cor.controller';
import { RevisalController } from '../controllers/revisal.controller';
import { CommissionController } from '../controllers/commission.controller';

// Import all HR services
import { EmployeeService } from '../services/employee.service';
import { DepartmentService } from '../services/department.service';
import { ContractService } from '../services/contract.service';
import { AbsenceService } from '../services/absence.service';
import { PayrollService } from '../services/payroll.service';
import { CorService } from '../services/cor.service';
import { RevisalService } from '../services/revisal.service';
import { CommissionService } from '../services/commission.service';

// Import other required dependencies
import { getDrizzle } from '@common/drizzle';
import { AuditService } from '@geniuserp/audit';

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

// Inițializare servicii HR (existente)
const documentService = new HrDocumentService();
const holidayService = new HolidayService();

// Initialize all services for controllers
const db = getDrizzle();
const auditService = new AuditService();
const employeeService = new EmployeeService();
const departmentService = new DepartmentService();
const contractService = new ContractService();
const absenceService = new AbsenceService();
const payrollService = new PayrollService();
const corService = new CorService(db, auditService);
const revisalService = new RevisalService();
const commissionService = new CommissionService();

// Initialize all controllers with their services
const employeeController = new EmployeeController(employeeService);
const departmentController = new DepartmentController(departmentService, employeeService);
const contractController = new ContractController(contractService);
const absenceController = new AbsenceController(absenceService);
const payrollController = new PayrollController(payrollService);
const corController = new CorController(db, corService);
const revisalController = new RevisalController(revisalService);
const commissionController = new CommissionController(commissionService);

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

// ========================================
// EMPLOYEE ROUTES
// ========================================
router.get('/employees',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => employeeController.searchEmployees(req, res)
);

router.get('/employees/:id',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => employeeController.getEmployeeById(req, res)
);

router.post('/employees',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => employeeController.createEmployee(req, res)
);

router.post('/employees/simple',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => employeeController.createSimpleEmployee(req, res)
);

router.patch('/employees/:id',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => employeeController.updateEmployee(req, res)
);

// ========================================
// DEPARTMENT ROUTES
// ========================================
router.get('/departments',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => departmentController.getDepartments(req, res)
);

router.post('/departments',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => departmentController.createDepartment(req, res)
);

router.get('/departments/:id/employees',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => departmentController.getEmployeesByDepartment(req, res)
);

// ========================================
// CONTRACT ROUTES
// ========================================
router.get('/contracts',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => contractController.getContractsByEmployeeId(req, res)
);

router.post('/contracts',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => contractController.createContract(req, res)
);

router.patch('/contracts/:id',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => contractController.updateContract(req, res)
);

// ========================================
// ABSENCE ROUTES
// ========================================
router.get('/absences',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: Request, res: Response) => absenceController.getPendingAbsences(req, res)
);

router.get('/absences/employee/:employeeId',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: Request, res: Response) => absenceController.getEmployeeAbsences(req, res)
);

router.post('/absences',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: Request, res: Response) => absenceController.createAbsence(req, res)
);

router.patch('/absences/:id/approve',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: Request, res: Response) => absenceController.approveAbsence(req, res)
);

router.patch('/absences/:id/deny',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: Request, res: Response) => absenceController.denyAbsence(req, res)
);

// ========================================
// PAYROLL ROUTES
// ========================================
router.get('/payroll/history',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => payrollController.getEmployeePayrollHistory(req, res)
);

router.get('/payroll/report',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => payrollController.getPayrollReport(req, res)
);

router.post('/payroll/calculate/:employeeId',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => payrollController.calculateEmployeePayroll(req, res)
);

router.post('/payroll/process',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => payrollController.processCompanyPayroll(req, res)
);

router.post('/payroll/export',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => payrollController.exportPayroll(req, res)
);

// ========================================
// COR (Clasificarea Ocupațiilor din România) ROUTES
// ========================================
router.get('/cor/occupations',
  (req: Request, res: Response) => corController.getOccupations(req, res)
);

router.get('/cor/occupations/search',
  (req: Request, res: Response) => corController.searchOccupations(req, res)
);

router.get('/cor/occupations/:code',
  (req: Request, res: Response) => corController.getOccupationByCode(req, res)
);

router.get('/cor/groups',
  (req: Request, res: Response) => corController.getMajorGroups(req, res)
);

router.get('/cor/groups/submajor',
  (req: Request, res: Response) => corController.getSubmajorGroups(req, res)
);

router.get('/cor/groups/minor',
  (req: Request, res: Response) => corController.getMinorGroups(req, res)
);

router.get('/cor/groups/subminor',
  (req: Request, res: Response) => corController.getSubminorGroups(req, res)
);

router.get('/cor/stats',
  (req: Request, res: Response) => corController.getCorStats(req, res)
);

router.post('/cor/validate',
  (req: Request, res: Response) => corController.validateCorCode(req, res)
);

router.post('/cor/seed',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => corController.seedCorData(req, res)
);

router.post('/cor/seed-xml',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => corController.seedCorDataFromWordXml(req, res)
);

router.post('/cor/import-batch',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => corController.importOccupationBatch(req, res)
);

// ========================================
// REVISAL EXPORT ROUTES
// ========================================
router.post('/revisal/export',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => revisalController.generateRevisalXml(req, res)
);

router.post('/revisal/validate',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => revisalController.validateRevisalXml(req, res)
);

router.post('/revisal/submit-log',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => revisalController.logRevisalSubmission(req, res)
);

router.get('/revisal/logs',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => revisalController.getRevisalLogs(req, res)
);

router.get('/revisal/logs/:id',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => revisalController.getRevisalLogById(req, res)
);

// Alias pentru /revisal/logs -> /revisal/operations (frontend folosește ambele)
router.get('/revisal/operations',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => revisalController.getRevisalLogs(req, res)
);

router.get('/revisal/stats',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req: any, res: Response) => {
    try {
      // Pentru moment returnăm statistici simple bazate pe logs
      const logs = await revisalService.getRevisalExportLogs(req.user?.companyId || '');
      const stats = {
        total: logs.length,
        completed: logs.filter((l: any) => l.status === 'completed').length,
        pending: logs.filter((l: any) => l.status === 'pending').length,
        failed: logs.filter((l: any) => l.status === 'failed').length
      };
      res.json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

router.post('/revisal/upload',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  upload.single('file'),
  async (req: any, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Niciun fișier încărcat' });
      }
      res.json({ 
        success: true, 
        data: { 
          filename: req.file.filename,
          path: req.file.path 
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ========================================
// COMMISSION ROUTES
// ========================================
router.get('/commissions',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => commissionController.getCommissions(req, res)
);

router.get('/commissions/rules',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => commissionController.getCommissionStructures(req, res)
);

router.get('/commissions/stats',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => commissionController.getCommissionSummary(req, res)
);

router.get('/commissions/:id',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => commissionController.getCommissionById(req, res)
);

router.post('/commissions',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => commissionController.createCommission(req, res)
);

router.patch('/commissions/:id',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => commissionController.updateCommissionStructure(req, res)
);

router.post('/commissions/:id/approve',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => commissionController.approveCommission(req, res)
);

router.post('/commissions/:id/paid',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => commissionController.markCommissionPaid(req, res)
);

router.post('/commissions/calculate',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => commissionController.calculateCommission(req, res)
);

router.get('/commissions/employee/:employeeId',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => commissionController.getEmployeeCommissions(req, res)
);

// ========================================
// ADDITIONAL EMPLOYEE ROUTES
// ========================================
router.get('/employees/by-role',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req: any, res: Response) => {
    try {
      const { role } = req.query;
      // Reutilizăm searchEmployees cu filtru pe rol
      req.query.role = role;
      await employeeController.searchEmployees(req, res);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ========================================
// ADDITIONAL PAYROLL ROUTES
// ========================================
// Alias pentru /payroll fără /history (listing general de payroll)
router.get('/payroll',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => payrollController.getPayrollReport(req, res)
);

router.post('/payroll/run',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  (req: any, res: Response) => payrollController.processCompanyPayroll(req, res)
);

// ========================================
// ADDITIONAL DEPARTMENT ROUTES (cu ID)
// ========================================
router.get('/departments/:id',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const department = await departmentService.getDepartmentById(id, req.user?.companyId || '');
      if (!department) {
        return res.status(404).json({ success: false, message: 'Departament negăsit' });
      }
      res.json({ success: true, data: department });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

router.patch('/departments/:id',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      await departmentService.updateDepartment(id, updateData, req.user?.companyId || '', req.user?.id || '');
      res.json({ success: true, message: 'Departament actualizat cu succes' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

router.delete('/departments/:id',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      await departmentService.deactivateDepartment(id, req.user?.companyId || '', req.user?.id || '');
      res.json({ success: true, message: 'Departament dezactivat cu succes' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ========================================
// ADDITIONAL ABSENCE ROUTES (cu ID)
// ========================================
router.get('/absences/:id',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      // Căutăm absența în lista de absențe a companiei
      const absences = await absenceService.getEmployeeAbsences(req.user?.companyId || '');
      const absence = absences.find((a: any) => a.id === id);
      if (!absence) {
        return res.status(404).json({ success: false, message: 'Absență negăsită' });
      }
      res.json({ success: true, data: absence });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

router.patch('/absences/:id',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const { approved, comment } = req.body;
      // Folosim reviewAbsence pentru actualizare
      await absenceService.reviewAbsence(id, approved, comment || '', req.user?.id || '');
      res.json({ success: true, message: 'Absență actualizată cu succes' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

router.delete('/absences/:id',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      // Folosim cancelAbsence pentru ștergere
      await absenceService.cancelAbsence(id, 'Șters de utilizator', req.user?.id || '');
      res.json({ success: true, message: 'Absență anulată cu succes' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ========================================
// ADDITIONAL CONTRACT ROUTES (cu ID)
// ========================================
router.get('/contracts/:id',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const contract = await contractService.getContractById(id, req.user?.companyId || '');
      res.json({ success: true, data: contract });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

router.delete('/contracts/:id',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req: any, res: Response) => {
    try {
      const { id } = req.params;
      const { terminationDate, reason } = req.body;
      // Folosim terminateContract pentru ștergere
      await contractService.terminateContract(
        id,
        req.user?.companyId || '',
        req.user?.id || '',
        terminationDate ? new Date(terminationDate) : new Date(),
        reason || 'Șters de utilizator'
      );
      res.json({ success: true, message: 'Contract încheiat cu succes' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

// ========================================
// ANAF EXPORT ROUTE
// ========================================
router.post('/anaf/export',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  async (req: any, res: Response) => {
    try {
      // Exportul ANAF folosește același mecanism ca Revisal
      await revisalController.generateRevisalXml(req, res);
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
);

export default router;