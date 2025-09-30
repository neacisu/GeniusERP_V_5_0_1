import { Router } from 'express';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { JwtAuthMode } from '../../auth/types';
import { UserRole } from '../../auth/types';
import { PayrollService } from '../services/payroll.service';
import { AbsenceService } from '../services/absence.service';
import { RevisalService } from '../services/revisal.service'; 
import { CommissionService } from '../services/commission.service';
import { EmployeeService } from '../services/employee.service';

const router = Router();

// Employee routes
router.get('/employees', 
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  AuthGuard.companyGuard('companyId'),
  EmployeeService.getEmployees
);

router.post('/employees',
  AuthGuard.protect(JwtAuthMode.REQUIRED), 
  AuthGuard.roleGuard([UserRole.ADMIN, UserRole.HR_ADMIN]),
  EmployeeService.createEmployee
);

// Payroll routes
router.get('/payroll',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  AuthGuard.roleGuard([UserRole.ADMIN, UserRole.HR_ADMIN, UserRole.ACCOUNTANT]),
  PayrollService.getPayroll
);

// Absences routes
router.post('/absences',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  AuthGuard.companyGuard('companyId'),
  AbsenceService.createAbsence
);

// Revisal routes
router.get('/revisal/export',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  AuthGuard.roleGuard([UserRole.ADMIN, UserRole.HR_ADMIN]),
  RevisalService.exportRevisal
);

// Commission routes
router.get('/commissions',
  AuthGuard.protect(JwtAuthMode.REQUIRED),
  AuthGuard.roleGuard([UserRole.ADMIN, UserRole.HR_ADMIN, UserRole.SALES_MANAGER]),
  CommissionService.getCommissions
);

export default router;