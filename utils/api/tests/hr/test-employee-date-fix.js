/**
 * Test script for employee creation with date handling fix
 */
import { EmployeeService } from './server/modules/hr/services/employee.service.js';

async function testEmployeeCreation() {
  try {
    console.log('Creating employee service...');
    const employeeService = new EmployeeService();
    
    console.log('Test 1: Creating employee with Date objects...');
    const employee1 = await employeeService.createEmployee(
      'a6827e12-ed96-4296-9ece-b08cda112a7a', // companyId
      'Test1', // firstName
      'Employee', // lastName
      'test1.employee@example.com', // email
      '0123456789', // phone
      'Software Developer', // position
      null, // departmentId
      '1900101000000', // cnp
      'Test Address', // address
      new Date('1990-01-01'), // birthDate
      new Date(), // hireDate
      { testData: true }, // data
      '64ba631a-2412-4722-aa92-14989ca89b43' // userId
    );
    
    console.log('✅ Employee 1 created successfully with ID:', employee1.id);
    
    console.log('Test 2: Creating employee with string dates...');
    const employee2 = await employeeService.createEmployee(
      'a6827e12-ed96-4296-9ece-b08cda112a7a', // companyId
      'Test2', // firstName
      'Employee', // lastName
      'test2.employee@example.com', // email
      '0123456789', // phone
      'QA Engineer', // position
      null, // departmentId
      '1900101000000', // cnp
      'Test Address 2', // address
      '1992-02-02', // birthDate as string
      '2024-04-01', // hireDate as string
      { testData: true }, // data
      '64ba631a-2412-4722-aa92-14989ca89b43' // userId
    );
    
    console.log('✅ Employee 2 created successfully with ID:', employee2.id);
    
    console.log('Test 3: Creating employment contract with Date objects...');
    const contract1 = await employeeService.createEmploymentContract(
      employee1.id, // employeeId
      'a6827e12-ed96-4296-9ece-b08cda112a7a', // companyId
      'CNT-001', // contractNumber
      'standard', // contractType
      new Date(), // startDate
      new Date('2025-12-31'), // endDate
      5000, // baseSalaryGross
      'full_time', // workingTime
      '123456', // corCode
      21, // annualVacationDays
      null, // contractFilePath
      null, // annexesFilePaths
      '64ba631a-2412-4722-aa92-14989ca89b43' // userId
    );
    
    console.log('✅ Contract 1 created successfully with ID:', contract1.id);
    
    console.log('Tests completed successfully! Date handling is fixed.');
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

testEmployeeCreation();