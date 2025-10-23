/**
 * HR Services Index
 * 
 * Export all HR services
 * Note: contract.service and employee.service both export EmploymentContractType and EmploymentContractStatus
 * We explicitly export from contract.service to avoid ambiguity
 */

export * from './absence.service';
export * from './commission.service';
export * from './department.service';
export * from './document.service';
export * from './holiday.service';
export * from './payroll.service';
export * from './revisal.service';
export * from './settings.service';

// Export contract service (includes EmploymentContractType and EmploymentContractStatus)
export * from './contract.service';

// Export employee service but exclude the duplicate types
export { EmployeeService } from './employee.service';
