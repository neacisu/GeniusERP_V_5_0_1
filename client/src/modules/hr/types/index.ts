/**
 * HR Module Type Definitions
 */

// Employee entity
export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  personalEmail?: string;
  personalPhone?: string;
  birthDate?: string;
  cnp?: string;
  address?: string;
  city?: string;
  county?: string;
  postalCode?: string;
  country?: string;
  nationality?: string;
  position: string;
  departmentId?: string;
  department?: string;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Employment Contract
export interface Contract {
  id: string;
  employeeId: string;
  employeeName?: string;
  contractNumber: string;
  startDate: string;
  endDate?: string;
  contractType: string;
  position: string;
  grossSalary: number;
  workHours: number;
  workingDaysPerWeek: number;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Department entity
export interface Department {
  id: string;
  name: string;
  code?: string;
  description?: string;
  parentDepartmentId?: string;
  managerId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Absence entity
export interface Absence {
  id: string;
  employeeId: string;
  absenceType: string;
  startDate: string;
  endDate: string;
  workingDays: number;
  status: string;
  notes?: string;
  medicalCertificateNumber?: string;
  medicalCertificateDate?: string;
  medicalCertificateIssuedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Payroll entity
export interface Payroll {
  id: string;
  employeeId: string;
  year: number;
  month: number;
  baseSalaryGross: number;
  netSalary: number;
  incomeTax: number;
  socialInsurance: number;
  healthInsurance: number;
  additionalIncome: number;
  additionalTaxes: number;
  status: string;
  paymentDate?: string;
  bankAccount?: string;
  createdAt: string;
  updatedAt: string;
}

// Commission Entity
export interface Commission {
  id: string;
  employeeId: string;
  amount: number;
  currency: string;
  commissionType: string;
  referenceNumber?: string;
  calculationBase: number;
  calculationRate: number;
  taxable: boolean;
  status: string;
  payoutDate?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// COR Occupational Code
export interface OccupationalCode {
  id: string;
  code: string;
  name: string;
  description?: string;
  groupId: string;
  groupName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Revisal Export
export interface RevisalExport {
  id: string;
  exportDate: string;
  filename: string;
  employeeCount: number;
  status: string;
  notes?: string;
  exportedById: string;
  createdAt: string;
  updatedAt: string;
}

// Response wrapper interface
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
}

// Paginated response
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}