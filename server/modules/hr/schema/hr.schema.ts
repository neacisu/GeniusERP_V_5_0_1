/**
 * HR Schema - Romanian Labor and Payroll Compliance
 * 
 * This schema implements HR data structures in compliance with:
 * - Romanian Labor Code (Codul Muncii)
 * - REVISAL reporting requirements
 * - ANAF declaration standards
 * - CAS/CASS/CAM taxation rules
 */

import {
  pgTable,
  uuid,
  text,
  varchar,
  numeric,
  timestamp,
  date,
  index,
  boolean,
  integer,
  json,
  primaryKey,
  time,
  smallint
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users, companies } from "../../../../shared/schema";

/**
 * Employee table - Core HR data 
 * Contains basic employee information and references employment contracts
 */
export const employees = pgTable("hr_employees", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  userId: uuid("user_id").references(() => users.id),
  
  // Personal Information
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  personalEmail: text("personal_email"),
  personalPhone: text("personal_phone"),
  
  // Official Identification (Revisal/ANAF required)
  cnp: varchar("cnp", { length: 13 }).notNull(), // Romanian personal identification number
  idSeriesNumber: varchar("id_series_number", { length: 20 }), // CI/BI Series and number
  birthDate: date("birth_date"),
  birthPlace: text("birth_place"),
  nationality: text("nationality").default("Romanian"),
  
  // Address
  address: text("address"),
  city: text("city"),
  county: text("county"),
  postalCode: varchar("postal_code", { length: 10 }),
  
  // Basic Employment Info
  position: text("position").notNull(),
  department: text("department"),
  departmentId: uuid("department_id").references(() => departments.id),
  managerEmployeeId: uuid("manager_employee_id").references(() => employees.id),
  
  // Status
  isActive: boolean("is_active").default(true),
  status: varchar("status", { length: 50 }).default("active"), // active, terminated, suspended, etc.
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id)
}, (table) => ({
  companyIdx: index("hr_employee_company_idx").on(table.companyId),
  cnpIdx: index("hr_employee_cnp_idx").on(table.cnp)
}));

/**
 * Employment Contracts - REVISAL compliant
 * 
 * Stores detailed contract information required for:
 * - REVISAL reporting
 * - Labor inspections
 * - ANAF declarations D112/D205
 */
export const employmentContracts = pgTable("hr_employment_contracts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: uuid("employee_id").notNull().references(() => employees.id),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  
  // Contract Identification
  contractNumber: varchar("contract_number", { length: 50 }).notNull(),
  revisalId: varchar("revisal_id", { length: 50 }), // Registration number in REVISAL
  
  // Contract Type (Codul Muncii)
  contractType: varchar("contract_type", { length: 50 }).notNull().default("full_time"), // full_time, part_time
  durationType: varchar("duration_type", { length: 50 }).notNull().default("indefinite"), // indefinite, definite
  
  // Status
  status: varchar("status", { length: 50 }).notNull().default("active"), // draft, active, suspended, terminated, transferred
  
  // Dates
  startDate: date("start_date").notNull(),
  endDate: date("end_date"), // For fixed-term contracts
  isIndefinite: boolean("is_indefinite").default(false),
  suspendedFrom: date("suspended_from"),
  suspendedUntil: date("suspended_until"),
  terminationDate: date("termination_date"),
  terminationReason: text("termination_reason"),
  
  // Working Time (Revisal required)
  workingTime: varchar("working_time", { length: 50 }),
  workingHoursPerDay: numeric("working_hours_per_day", { precision: 5, scale: 2 }).notNull().default("8"), 
  workingHoursPerWeek: numeric("working_hours_per_week", { precision: 5, scale: 2 }).notNull().default("40"),
  
  // Compensation
  baseSalaryGross: numeric("base_salary_gross", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("RON").notNull(),
  paymentInterval: varchar("payment_interval", { length: 20 }).default("monthly").notNull(), // monthly, weekly, etc.
  
  // CAEN and COR Codes (REVISAL requirement)
  caenCode: varchar("caen_code", { length: 10 }), // Activity classification
  corCode: varchar("cor_code", { length: 10 }).notNull(), // Occupation classification
  
  // Leave Entitlement
  annualLeaveEntitlement: integer("annual_leave_entitlement").default(21), // In days
  
  // Special Cases
  isTelemuncaPossible: boolean("is_telemunca_possible").default(false), // Remote work possibility
  hasCompetitionClause: boolean("has_competition_clause").default(false),
  hasConfidentialityClause: boolean("has_confidentiality_clause").default(true),
  
  // Document Management
  contractFilePath: text("contract_file_path"),
  annexesFilePaths: json("annexes_file_paths").default([]),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id)
}, (table) => ({
  employeeContractIdx: index("hr_employment_contract_employee_idx").on(table.employeeId),
  companyContractIdx: index("hr_employment_contract_company_idx").on(table.companyId),
  contractNumberIdx: index("hr_employment_contract_number_idx").on(table.contractNumber)
}));

/**
 * Payroll Logs - Monthly salary processing history
 * 
 * Records monthly salary calculations with all components required for:
 * - D112 ANAF Declaration
 * - Salary slips generation
 * - CAS/CASS/CAM tax calculations
 */
export const payrollLogs = pgTable("hr_payroll_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: uuid("employee_id").notNull().references(() => employees.id),
  employmentContractId: uuid("employment_contract_id").notNull().references(() => employmentContracts.id),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  
  // Period
  year: integer("year").notNull(),
  month: integer("month").notNull(), // 1-12
  
  // Status
  status: varchar("status", { length: 50 }).default("draft").notNull(), // draft, calculated, finalized, paid
  paymentDate: date("payment_date"),
  
  // Base Values
  workingDaysInMonth: smallint("working_days_in_month").notNull(),
  workedDays: numeric("worked_days", { precision: 5, scale: 2 }).notNull(),
  
  // Gross Salary Components
  baseSalaryGross: numeric("base_salary_gross", { precision: 12, scale: 2 }).notNull(),
  grossTotal: numeric("gross_total", { precision: 12, scale: 2 }).notNull(),
  
  // Bonuses and Additional Income
  overtimeHours: numeric("overtime_hours", { precision: 5, scale: 2 }).default("0"),
  overtimeAmount: numeric("overtime_amount", { precision: 12, scale: 2 }).default("0"),
  mealTicketsCount: integer("meal_tickets_count").default(0),
  mealTicketsValue: numeric("meal_tickets_value", { precision: 12, scale: 2 }).default("0"),
  giftTicketsValue: numeric("gift_tickets_value", { precision: 12, scale: 2 }).default("0"),
  vacationTicketsValue: numeric("vacation_tickets_value", { precision: 12, scale: 2 }).default("0"),
  bonuses: numeric("bonuses", { precision: 12, scale: 2 }).default("0"),
  commissions: numeric("commissions", { precision: 12, scale: 2 }).default("0"),
  otherCompensations: json("other_compensations").default({}),
  
  // Tax Exemptions
  itExemptionType: varchar("it_exemption_type", { length: 50 }), // IT, research, disabled, construction, etc.
  
  // Employee Contributions
  casBasis: numeric("cas_basis", { precision: 12, scale: 2 }),
  casEmployeeAmount: numeric("cas_employee_amount", { precision: 12, scale: 2 }), // 25% of CAS basis
  cassEmployeeAmount: numeric("cass_employee_amount", { precision: 12, scale: 2 }), // 10% of CASS basis
  incomeTaxAmount: numeric("income_tax_amount", { precision: 12, scale: 2 }), // 10% usually
  
  // Employer Contributions
  camEmployerAmount: numeric("cam_employer_amount", { precision: 12, scale: 2 }), // Work insurance contribution (2.25%)
  
  // Net Calculation
  netSalary: numeric("net_salary", { precision: 12, scale: 2 }).notNull(),
  
  // Deductions
  personalDeduction: numeric("personal_deduction", { precision: 12, scale: 2 }).default("0"),
  otherDeductions: json("other_deductions").default({}),
  
  // ANAF Declaration information
  anafDeclarationStatus: varchar("anaf_declaration_status", { length: 50 }).default("pending"), // pending, submitted, accepted
  anafDeclarationDate: date("anaf_declaration_date"),
  anafDeclarationNumber: varchar("anaf_declaration_number", { length: 50 }),
  
  // Document references
  payslipFilePath: text("payslip_file_path"),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id)
}, (table) => ({
  employeePayrollIdx: index("hr_payroll_employee_idx").on(table.employeeId),
  companyPayrollIdx: index("hr_payroll_company_idx").on(table.companyId),
  periodIdx: index("hr_payroll_period_idx").on(table.year, table.month)
}));

/**
 * Absences - Leave management and tracking
 * 
 * All types of leave including:
 * - Annual leave (CO - concediu de odihna)
 * - Medical leave (CM - concediu medical)
 * - Unpaid leave
 * - Other types of absences
 */
export const absences = pgTable("hr_absences", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: uuid("employee_id").notNull().references(() => employees.id),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  
  // Absence Period
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  workingDays: numeric("working_days", { precision: 5, scale: 2 }).notNull(),
  
  // Type Classification (Romanian standards)
  absenceType: varchar("absence_type", { length: 50 }).notNull(), // annual_leave, medical_leave, unpaid_leave, etc.
  absenceCode: varchar("absence_code", { length: 10 }), // CO, CM, CFS, etc.
  medicalLeaveCode: varchar("medical_leave_code", { length: 10 }), // 01, 02, etc. for medical leave types
  
  // Approval
  status: varchar("status", { length: 50 }).default("pending").notNull(), // pending, approved, rejected
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  rejectionReason: text("rejection_reason"),
  
  // Medical Certificate Details (for medical leave)
  medicalCertificateNumber: varchar("medical_certificate_number", { length: 50 }),
  medicalCertificateDate: date("medical_certificate_date"),
  medicalCertificateIssuedBy: text("medical_certificate_issued_by"),
  medicalCertificateFilePath: text("medical_certificate_file_path"),
  
  // Comments
  notes: text("notes"),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id)
}, (table) => ({
  employeeAbsenceIdx: index("hr_absence_employee_idx").on(table.employeeId),
  companyAbsenceIdx: index("hr_absence_company_idx").on(table.companyId),
  dateRangeIdx: index("hr_absence_date_range_idx").on(table.startDate, table.endDate)
}));

/**
 * Work Schedule - Detailed working hours
 * 
 * For part-time and irregular schedules
 * Required for Revisal and labor inspections
 */
export const workSchedules = pgTable("hr_work_schedules", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  employmentContractId: uuid("employment_contract_id").notNull().references(() => employmentContracts.id),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  
  // Schedule Definition
  dayOfWeek: integer("day_of_week").notNull(), // 1 (Monday) to 7 (Sunday)
  startTime: time("start_time", { precision: 0 }).notNull(),
  endTime: time("end_time", { precision: 0 }).notNull(),
  breakStartTime: time("break_start_time", { precision: 0 }),
  breakEndTime: time("break_end_time", { precision: 0 }),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
}, (table) => ({
  contractScheduleIdx: index("hr_work_schedule_contract_idx").on(table.employmentContractId),
  companyScheduleIdx: index("hr_work_schedule_company_idx").on(table.companyId),
  
  // Primary key combination
  uniqueSchedule: primaryKey(table.employmentContractId, table.dayOfWeek)
}));

/**
 * Commission Structures - For sales and performance-based roles
 * 
 * Defines commission calculation rules and targets
 */
export const commissionStructures = pgTable("hr_commission_structures", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  
  // Basic Info
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  
  // Type
  structureType: varchar("structure_type", { length: 50 }).notNull(), // sales, performance, mixed
  calculationPeriod: varchar("calculation_period", { length: 20 }).default("monthly").notNull(), // monthly, quarterly, etc.
  
  // Rules
  basePercentage: numeric("base_percentage", { precision: 5, scale: 2 }),
  tiersDefinition: json("tiers_definition").default([]), // Array of tier objects with thresholds and percentages
  targetMetrics: json("target_metrics").default({}), // What is being measured (sales volume, customer acquisition, etc.)
  calculationFormula: text("calculation_formula"), // Formula or explanation of calculation logic
  
  // Constraints
  minimumQualifyingAmount: numeric("minimum_qualifying_amount", { precision: 12, scale: 2 }),
  maximumCommissionCap: numeric("maximum_commission_cap", { precision: 12, scale: 2 }),
  
  // Timestamps
  validFrom: date("valid_from").notNull(),
  validTo: date("valid_to"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id)
}, (table) => ({
  companyCommissionStructureIdx: index("hr_commission_structure_company_idx").on(table.companyId)
}));

/**
 * Employee Commissions - Individual assignments and actual earnings
 */
export const employeeCommissions = pgTable("hr_employee_commissions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: uuid("employee_id").notNull().references(() => employees.id),
  commissionStructureId: uuid("commission_structure_id").notNull().references(() => commissionStructures.id),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  
  // Period
  year: integer("year").notNull(),
  month: integer("month").notNull(), // 1-12
  
  // Targets and Performance
  targetAmount: numeric("target_amount", { precision: 12, scale: 2 }),
  achievedAmount: numeric("achieved_amount", { precision: 12, scale: 2 }),
  achievementPercentage: numeric("achievement_percentage", { precision: 5, scale: 2 }),
  
  // Commission Calculation
  calculatedCommission: numeric("calculated_commission", { precision: 12, scale: 2 }),
  adjustmentAmount: numeric("adjustment_amount", { precision: 12, scale: 2 }).default("0"),
  adjustmentReason: text("adjustment_reason"),
  finalCommissionAmount: numeric("final_commission_amount", { precision: 12, scale: 2 }),
  
  // Processing Status
  status: varchar("status", { length: 50 }).default("calculated").notNull(), // calculated, approved, paid, disputed
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  paidInPayrollId: uuid("paid_in_payroll_id").references(() => payrollLogs.id),
  
  // Details
  performanceMetrics: json("performance_metrics").default({}), // Detailed performance data
  calculationDetails: json("calculation_details").default({}), // How the commission was calculated
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id)
}, (table) => ({
  employeeCommissionIdx: index("hr_employee_commission_employee_idx").on(table.employeeId),
  structureCommissionIdx: index("hr_employee_commission_structure_idx").on(table.commissionStructureId),
  companyCommissionIdx: index("hr_employee_commission_company_idx").on(table.companyId),
  periodCommissionIdx: index("hr_employee_commission_period_idx").on(table.year, table.month)
}));

/**
 * HR Departments Structure
 * 
 * Organizational structure definition for HR reporting
 */
export const departments = pgTable("hr_departments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  
  // Basic Info
  name: text("name").notNull(),
  code: varchar("code", { length: 20 }),
  description: text("description"),
  
  // Hierarchy
  parentDepartmentId: uuid("parent_department_id").references(() => departments.id),
  
  // Management
  managerId: uuid("manager_id").references(() => employees.id),
  
  // Budget Code
  costCenter: varchar("cost_center", { length: 50 }),
  
  // Status
  isActive: boolean("is_active").default(true),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id)
}, (table) => ({
  companyDepartmentIdx: index("hr_department_company_idx").on(table.companyId),
  parentDepartmentIdx: index("hr_department_parent_idx").on(table.parentDepartmentId)
}));

/**
 * Job Positions Catalog
 * 
 * Standard job positions with COR codes
 */
export const jobPositions = pgTable("hr_job_positions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  
  // Position Details
  name: text("name").notNull(),
  internalCode: varchar("internal_code", { length: 20 }),
  corCode: varchar("cor_code", { length: 10 }).notNull(), // Romanian Classification of Occupations code
  
  // Description
  description: text("description"),
  responsibilities: text("responsibilities"),
  requirements: text("requirements"),
  
  // Department
  departmentId: uuid("department_id").references(() => departments.id),
  
  // Salary Range
  minimumSalary: numeric("minimum_salary", { precision: 12, scale: 2 }),
  maximumSalary: numeric("maximum_salary", { precision: 12, scale: 2 }),
  
  // Status
  isActive: boolean("is_active").default(true),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id)
}, (table) => ({
  companyPositionIdx: index("hr_job_position_company_idx").on(table.companyId),
  departmentPositionIdx: index("hr_job_position_department_idx").on(table.departmentId),
  corCodeIdx: index("hr_job_position_cor_idx").on(table.corCode)
}));

/**
 * ANAF Export Logs
 * 
 * Tracks submission of declarations to ANAF
 */
export const anafExportLogs = pgTable("hr_anaf_export_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  
  // Declaration Type
  declarationType: varchar("declaration_type", { length: 10 }).notNull(), // D112, D205, etc.
  
  // Period
  year: integer("year").notNull(),
  month: integer("month"), // 1-12, null for annual declarations
  quarter: integer("quarter"), // 1-4, null for monthly or annual declarations
  
  // Status
  status: varchar("status", { length: 50 }).default("generated").notNull(), // generated, submitted, accepted, rejected
  submissionDate: timestamp("submission_date", { withTimezone: true }),
  acceptanceDate: timestamp("acceptance_date", { withTimezone: true }),
  rejectionReason: text("rejection_reason"),
  
  // Reference Numbers
  declarationNumber: varchar("declaration_number", { length: 50 }),
  registrationNumber: varchar("registration_number", { length: 50 }),
  
  // Files
  declarationFilePath: text("declaration_file_path"),
  receiptFilePath: text("receipt_file_path"),
  
  // Totals
  employeeCount: integer("employee_count").notNull(),
  grossSalaryTotal: numeric("gross_salary_total", { precision: 12, scale: 2 }).notNull(),
  casEmployeeTotal: numeric("cas_employee_total", { precision: 12, scale: 2 }).notNull(),
  cassEmployeeTotal: numeric("cass_employee_total", { precision: 12, scale: 2 }).notNull(),
  incomeTaxTotal: numeric("income_tax_total", { precision: 12, scale: 2 }).notNull(),
  camEmployerTotal: numeric("cam_employer_total", { precision: 12, scale: 2 }).notNull(),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id)
}, (table) => ({
  companyAnafIdx: index("hr_anaf_export_company_idx").on(table.companyId),
  periodAnafIdx: index("hr_anaf_export_period_idx").on(table.year, table.month, table.quarter),
  typeAnafIdx: index("hr_anaf_export_type_idx").on(table.declarationType)
}));

/**
 * REVISAL Export Logs
 * 
 * Tracks submission of REVISAL XML files
 */
export const revisalExportLogs = pgTable("hr_revisal_export_logs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  companyId: uuid("company_id").notNull().references(() => companies.id),
  
  // Export Details
  revisalVersion: varchar("revisal_version", { length: 20 }).notNull(),
  exportDate: timestamp("export_date", { withTimezone: true }).notNull(),
  
  // Statistics
  employeeCount: integer("employee_count").notNull(),
  newEmployeeCount: integer("new_employee_count").notNull(),
  modifiedEmployeeCount: integer("modified_employee_count").notNull(),
  suspendedEmployeeCount: integer("suspended_employee_count").notNull(),
  terminatedEmployeeCount: integer("terminated_employee_count").notNull(),
  
  // File
  exportFilePath: text("export_file_path").notNull(),
  
  // Status
  submissionStatus: varchar("submission_status", { length: 50 }).default("generated").notNull(), // generated, submitted, accepted, rejected
  submissionDate: date("submission_date"),
  registrationNumber: varchar("registration_number", { length: 50 }),
  
  // Timestamps
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  createdBy: uuid("created_by").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id)
}, (table) => ({
  companyRevisalIdx: index("hr_revisal_export_company_idx").on(table.companyId),
  dateRevisalIdx: index("hr_revisal_export_date_idx").on(table.exportDate)
}));