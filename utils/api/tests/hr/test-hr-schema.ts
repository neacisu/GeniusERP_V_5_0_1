/**
 * HR Schema Test
 * 
 * This script tests the HR module schema by creating sample
 * employees, contracts, and departments to verify
 * the database structure works correctly.
 */

import { PostgresJsDatabase, drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// Import HR schemas
import * as hrSchema from './server/modules/hr/schema';
const {
  employees, 
  employmentContracts, 
  departments,
  workSchedules,
  absences,
  payrollLogs
} = hrSchema;

// Import shared schemas
import { companies, users } from '@shared/schema';

// Load environment variables
dotenv.config();

/**
 * Test the HR schema
 */
async function testHrSchema() {
  console.log('Starting HR schema test...');

  // Create database connection
  const connectionString = process.env.DATABASE_URL || '';
  if (!connectionString) {
    console.error('DATABASE_URL is not defined in environment variables');
    process.exit(1);
  }

  // Create SQL connection
  const sql = postgres(connectionString, { max: 1 });
  
  // Create Drizzle ORM instance
  const db = drizzle(sql);

  try {
    // Generate IDs for test entities
    const companyId = uuidv4();
    const userId = uuidv4();
    const employeeId = uuidv4();
    const departmentId = uuidv4();
    
    console.log('Creating test company...');
    // Insert test company
    await db.insert(companies).values({
      id: companyId,
      name: 'Test HR Company',
      fiscalCode: `RO${Math.floor(10000000 + Math.random() * 90000000)}`,
      registrationNumber: `J40/${Math.floor(1000 + Math.random() * 9000)}/2025`,
      address: 'Str. Testelor 123',
      city: 'Bucharest',
      county: 'Bucharest',
      country: 'Romania',
      vatPayer: true,
      vatRate: 19
    });

    console.log('Creating test user...');
    // Insert test user
    const randomUsername = `test_user_${Math.floor(Math.random() * 1000000)}`;
    const randomEmail = `test${Math.floor(Math.random() * 1000000)}@example.com`;
    console.log(`Using random username: ${randomUsername}`);
    console.log(`Using random email: ${randomEmail}`);
    
    await db.insert(users).values({
      id: userId,
      username: randomUsername,
      email: randomEmail,
      password: 'dummy_hash',
      firstName: 'Test',
      lastName: 'User',
      role: 'admin',
      companyId: companyId
    });

    console.log('Creating test department...');
    // Insert test department
    await db.insert(departments).values({
      id: departmentId,
      companyId: companyId,
      name: 'HR Department',
      code: 'HR',
      description: 'Human Resources Department',
      costCenter: 'CC001',
      isActive: true,
      createdBy: userId,
      updatedBy: userId
    });

    console.log('Creating test employee...');
    // Insert test employee
    await db.insert(employees).values({
      id: employeeId,
      companyId: companyId,
      userId: userId,
      firstName: 'Ion',
      lastName: 'Popescu',
      email: randomEmail,
      phone: '+40712345678',
      personalEmail: 'personal.email@example.com',
      personalPhone: '+40712345679',
      cnp: '1234567890123',
      idSeriesNumber: 'RX123456',
      birthDate: new Date('1985-01-15').toISOString(),
      birthPlace: 'Bucharest',
      nationality: 'Romanian',
      address: 'Str. Exemplului 45, Bl. E4, Sc. A, Ap. 12',
      city: 'Bucharest',
      county: 'Bucharest',
      postalCode: '012345',
      position: 'Software Developer',
      department: 'IT',
      isActive: true,
      status: 'active',
      createdBy: userId,
      updatedBy: userId
    });

    console.log('Creating test employment contract...');
    // Insert test employment contract
    const contractResult = await db.insert(employmentContracts).values({
      employeeId: employeeId,
      companyId: companyId,
      contractNumber: `${Math.floor(100 + Math.random() * 900)}/2025`,
      revisalId: 'REV12345',
      contractType: 'full_time',
      durationType: 'indefinite',
      startDate: new Date('2025-01-15').toISOString().split('T')[0], // Format as YYYY-MM-DD
      workingHoursPerDay: 8,
      workingHoursPerWeek: 40,
      baseSalaryGross: 10000,
      currency: 'RON',
      paymentInterval: 'monthly',
      caenCode: '6201',
      corCode: '251401',
      annualLeaveEntitlement: 21,
      isTelemuncaPossible: true,
      hasConfidentialityClause: true,
      createdBy: userId,
      updatedBy: userId
    }).returning();
    
    const contractId = contractResult[0].id;

    console.log('Creating test work schedule...');
    // Insert test work schedule
    const scheduleResult = await db.insert(workSchedules).values({
      employmentContractId: contractId,
      companyId: companyId,
      dayOfWeek: 1, // Monday
      startTime: '09:00:00',
      endTime: '17:00:00',
      breakStartTime: '12:00:00',
      breakEndTime: '13:00:00'
    }).returning();
    
    const scheduleId = scheduleResult[0].id;

    console.log('Creating test absence record...');
    // Insert test absence
    const absenceResult = await db.insert(absences).values({
      employeeId: employeeId,
      companyId: companyId,
      startDate: new Date('2025-07-01').toISOString().split('T')[0], // Format as YYYY-MM-DD
      endDate: new Date('2025-07-15').toISOString().split('T')[0], // Format as YYYY-MM-DD
      workingDays: 11,
      absenceType: 'annual_leave',
      absenceCode: 'CO',
      status: 'approved',
      approvedBy: userId,
      notes: 'Summer vacation',
      createdBy: userId,
      updatedBy: userId
    }).returning();
    
    const absenceId = absenceResult[0].id;

    console.log('Creating test payroll record...');
    // Insert test payroll log
    const payrollResult = await db.insert(payrollLogs).values({
      employeeId: employeeId,
      employmentContractId: contractId,
      companyId: companyId,
      year: 2025,
      month: 1,
      status: 'finalized',
      paymentDate: new Date('2025-02-10').toISOString().split('T')[0], // Format as YYYY-MM-DD
      workingDaysInMonth: 21,
      workedDays: 21,
      baseSalaryGross: 10000,
      grossTotal: 10000,
      casBasis: 10000,
      casEmployeeAmount: 2500, // 25%
      cassEmployeeAmount: 1000, // 10%
      incomeTaxAmount: 650, // 10% after deductions
      camEmployerAmount: 225, // 2.25%
      netSalary: 5850,
      personalDeduction: 0,
      anafDeclarationStatus: 'submitted',
      anafDeclarationDate: new Date('2025-02-25').toISOString().split('T')[0], // Format as YYYY-MM-DD
      createdBy: userId,
      updatedBy: userId
    }).returning();
    
    const payrollId = payrollResult[0].id;

    // Fetch and verify inserted data
    console.log('Retrieving test data for verification...');
    
    const fetchedEmployeeResult = await db.select().from(employees).where(eq(employees.id, employeeId));
    console.log(`Retrieved ${fetchedEmployeeResult.length} employee record(s)`);
    
    const fetchedContractResult = await db.select().from(employmentContracts).where(eq(employmentContracts.id, contractId));
    console.log(`Retrieved ${fetchedContractResult.length} contract record(s)`);
    
    const fetchedDepartmentResult = await db.select().from(departments).where(eq(departments.id, departmentId));
    console.log(`Retrieved ${fetchedDepartmentResult.length} department record(s)`);
    
    const fetchedScheduleResult = await db.select().from(workSchedules).where(eq(workSchedules.id, scheduleId));
    console.log(`Retrieved ${fetchedScheduleResult.length} work schedule record(s)`);
    
    const fetchedAbsenceResult = await db.select().from(absences).where(eq(absences.id, absenceId));
    console.log(`Retrieved ${fetchedAbsenceResult.length} absence record(s)`);
    
    const fetchedPayrollResult = await db.select().from(payrollLogs).where(eq(payrollLogs.id, payrollId));
    console.log(`Retrieved ${fetchedPayrollResult.length} payroll record(s)`);

    if (fetchedEmployeeResult.length > 0 && 
        fetchedContractResult.length > 0 && 
        fetchedDepartmentResult.length > 0 && 
        fetchedScheduleResult.length > 0 &&
        fetchedAbsenceResult.length > 0 &&
        fetchedPayrollResult.length > 0) {
      console.log('HR schema test successful! All test records created and retrieved correctly.');
      
      // Output sample employee data
      console.log('Sample employee data:');
      console.log({
        id: fetchedEmployeeResult[0].id,
        fullName: `${fetchedEmployeeResult[0].firstName} ${fetchedEmployeeResult[0].lastName}`,
        cnp: fetchedEmployeeResult[0].cnp,
        position: fetchedEmployeeResult[0].position,
        status: fetchedEmployeeResult[0].status
      });
      
      // Output sample contract data
      console.log('Sample contract data:');
      console.log({
        id: fetchedContractResult[0].id,
        contractNumber: fetchedContractResult[0].contractNumber,
        contractType: fetchedContractResult[0].contractType, 
        startDate: fetchedContractResult[0].startDate,
        baseSalaryGross: fetchedContractResult[0].baseSalaryGross,
        currency: fetchedContractResult[0].currency
      });
      
      // Output sample payroll data
      console.log('Sample payroll data:');
      console.log({
        id: fetchedPayrollResult[0].id,
        period: `${fetchedPayrollResult[0].month}/${fetchedPayrollResult[0].year}`,
        grossTotal: fetchedPayrollResult[0].grossTotal,
        casEmployeeAmount: fetchedPayrollResult[0].casEmployeeAmount,
        cassEmployeeAmount: fetchedPayrollResult[0].cassEmployeeAmount,
        incomeTaxAmount: fetchedPayrollResult[0].incomeTaxAmount,
        netSalary: fetchedPayrollResult[0].netSalary
      });
    } else {
      console.error('HR schema test failed! Some test records were not created or retrieved correctly.');
    }
    
  } catch (error) {
    console.error('Error during HR schema test:', error);
    throw error;
  } finally {
    // Close database connection
    await sql.end();
    console.log('Database connection closed.');
  }
}

// Run the test
testHrSchema().catch(console.error);