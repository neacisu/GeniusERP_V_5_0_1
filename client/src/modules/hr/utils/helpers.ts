/**
 * HR Module Helper Functions
 */

/**
 * Format date from ISO string to a more readable format
 * @param dateString ISO date string
 * @returns Formatted date string (DD.MM.YYYY)
 */
export function formatDate(dateString: string | Date): string {
  if (!dateString) return '';
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  
  return date.toLocaleDateString('ro-RO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Format currency value
 * @param value Number to format
 * @returns Formatted currency string
 */
export function formatCurrency(value: number): string {
  if (value === undefined || value === null) return '0';
  
  return value.toLocaleString('ro-RO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Format Romanian CNP with proper separators
 * @param cnp CNP string
 * @returns Formatted CNP
 */
export function formatCNP(cnp: string): string {
  if (!cnp || cnp.length !== 13) return cnp;
  
  // Format: 1 | 8 | 0 | 0 | 1 | 0 | 1 | 1 | 2 | 3 | 4 | 5 | 6
  // Category: S|YY|MM|DD|  County  |  Birth Order |Check
  return `${cnp.substring(0, 1)}-${cnp.substring(1, 7)}-${cnp.substring(7, 12)}-${cnp.substring(12)}`;
}

/**
 * Validate Romanian CNP (Numeric Personal Code)
 * @param cnp CNP string
 * @returns Boolean indicating if CNP is valid
 */
export function isValidCnp(cnp: string): boolean {
  if (!cnp || cnp.length !== 13 || !/^\d+$/.test(cnp)) {
    return false;
  }

  // Validation weight
  const weight = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];
  
  // Calculate check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnp[i]) * weight[i];
  }
  
  const remainder = sum % 11;
  const checkDigit = remainder === 10 ? 1 : remainder;
  
  // Check if the calculated check digit matches the last digit of the CNP
  return checkDigit === parseInt(cnp[12]);
}

/**
 * Calculate age from date of birth
 * @param dateOfBirth Date of birth
 * @returns Age in years
 */
export function calculateAge(dateOfBirth: string | Date): number {
  if (!dateOfBirth) return 0;
  
  const birthDate = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  const today = new Date();
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Get color for employee status
 * @param status Employee status
 * @returns CSS color class
 */
export function getEmployeeStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'text-green-600';
    case 'inactive':
      return 'text-red-600';
    case 'on_leave':
      return 'text-amber-600';
    default:
      return 'text-slate-600';
  }
}

/**
 * Get color for contract status
 * @param status Contract status
 * @returns CSS color class
 */
export function getContractStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'text-green-600';
    case 'expired':
      return 'text-red-600';
    case 'expiring_soon':
      return 'text-amber-600';
    case 'terminated':
      return 'text-slate-600';
    default:
      return 'text-slate-600';
  }
}

/**
 * Get label for contract status
 * @param status Contract status
 * @returns Romanian status label
 */
export function getContractStatusLabel(status: string): string {
  switch (status) {
    case 'active':
      return 'Activ';
    case 'expired':
      return 'Expirat';
    case 'expiring_soon':
      return 'Expiră curând';
    case 'terminated':
      return 'Terminat';
    default:
      return status;
  }
}

/**
 * Get Romanian label for contract type
 * @param type Contract type
 * @returns Romanian type label
 */
export function getContractTypeLabel(type: string): string {
  switch (type) {
    case 'full_time':
      return 'Normă întreagă';
    case 'part_time':
      return 'Timp parțial';
    case 'temporary':
      return 'Perioadă determinată';
    case 'indefinite':
      return 'Perioadă nedeterminată';
    default:
      return type;
  }
}

/**
 * Get Romanian label for employee status
 * @param status Employee status
 * @returns Romanian status label
 */
export function getEmployeeStatusLabel(status: string): string {
  switch (status) {
    case 'active':
      return 'Activ';
    case 'inactive':
      return 'Inactiv';
    case 'on_leave':
      return 'În concediu';
    default:
      return status;
  }
}

/**
 * Get label for absence type
 * @param type Absence type
 * @returns Romanian type label
 */
export function getAbsenceTypeLabel(type: string): string {
  switch (type) {
    case 'vacation':
      return 'Concediu de odihnă';
    case 'sick_leave':
      return 'Concediu medical';
    case 'unpaid_leave':
      return 'Concediu fără plată';
    case 'parental_leave':
      return 'Concediu parental';
    case 'study_leave':
      return 'Concediu pentru studii';
    case 'other':
      return 'Alt tip de absență';
    default:
      return type;
  }
}

/**
 * Get label for absence status
 * @param status Absence status
 * @returns Romanian status label
 */
export function getAbsenceStatusLabel(status: string): string {
  switch (status) {
    case 'pending':
      return 'În așteptare';
    case 'approved':
      return 'Aprobată';
    case 'rejected':
      return 'Respinsă';
    default:
      return status;
  }
}

/**
 * Get color for absence status
 * @param status Absence status
 * @returns CSS color class
 */
export function getAbsenceStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'text-amber-600';
    case 'approved':
      return 'text-green-600';
    case 'rejected':
      return 'text-red-600';
    default:
      return 'text-slate-600';
  }
}