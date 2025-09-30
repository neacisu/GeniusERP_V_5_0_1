/**
 * HR Schema Migration Script
 * 
 * This script applies the Romanian HR management schema to the database.
 * It creates tables for employees, contracts, payroll, absences, commissions,
 * and regulatory compliance with Romanian labor laws.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

// Import HR schema
import {
  employees,
  employmentContracts,
  payrollLogs,
  absences,
  workSchedules,
  commissionStructures,
  employeeCommissions,
  departments,
  jobPositions,
  anafExportLogs,
  revisalExportLogs
} from './server/modules/hr/schema';

// Load environment variables
dotenv.config();

// Main migration function
async function main() {
  console.log('Starting HR schema migration...');

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
    console.log('Applying HR schema changes to the database...');
    
    // Use Drizzle's migrate function if available
    // Otherwise, push the schema directly
    try {
      await migrate(db, { migrationsFolder: 'drizzle/migrations' });
      console.log('Migration completed successfully using migrate function');
    } catch (error) {
      console.log('Using direct schema push method...');
      
      // Create tables directly
      // This approach is less safe but can be used for testing
      await db.execute(`
        -- Create HR tables if they don't exist
        
        -- Employees table
        CREATE TABLE IF NOT EXISTS hr_employees (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id UUID NOT NULL REFERENCES companies(id),
          user_id UUID REFERENCES users(id),
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT,
          personal_email TEXT,
          personal_phone TEXT,
          cnp VARCHAR(13) NOT NULL,
          id_series_number VARCHAR(20),
          birth_date DATE,
          birth_place TEXT,
          nationality TEXT DEFAULT 'Romanian',
          address TEXT,
          city TEXT,
          county TEXT,
          postal_code VARCHAR(10),
          position TEXT NOT NULL,
          department TEXT,
          manager_employee_id UUID REFERENCES hr_employees(id),
          is_active BOOLEAN DEFAULT true,
          status VARCHAR(50) DEFAULT 'active',
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now(),
          created_by UUID REFERENCES users(id),
          updated_by UUID REFERENCES users(id)
        );
        
        -- Create indices for employees
        CREATE INDEX IF NOT EXISTS hr_employee_company_idx ON hr_employees(company_id);
        CREATE INDEX IF NOT EXISTS hr_employee_cnp_idx ON hr_employees(cnp);
        
        -- Employment contracts table
        CREATE TABLE IF NOT EXISTS hr_employment_contracts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          employee_id UUID NOT NULL REFERENCES hr_employees(id),
          company_id UUID NOT NULL REFERENCES companies(id),
          contract_number VARCHAR(50) NOT NULL,
          revisal_id VARCHAR(50),
          contract_type VARCHAR(50) NOT NULL DEFAULT 'full_time',
          duration_type VARCHAR(50) NOT NULL DEFAULT 'indefinite',
          start_date DATE NOT NULL,
          end_date DATE,
          suspended_from DATE,
          suspended_until DATE,
          termination_date DATE,
          termination_reason TEXT,
          working_hours_per_day NUMERIC(5,2) NOT NULL DEFAULT 8,
          working_hours_per_week NUMERIC(5,2) NOT NULL DEFAULT 40,
          base_salary_gross NUMERIC(12,2) NOT NULL,
          currency VARCHAR(3) DEFAULT 'RON' NOT NULL,
          payment_interval VARCHAR(20) DEFAULT 'monthly' NOT NULL,
          caen_code VARCHAR(10),
          cor_code VARCHAR(10) NOT NULL,
          annual_leave_entitlement INTEGER DEFAULT 21,
          is_telemunca_possible BOOLEAN DEFAULT false,
          has_competition_clause BOOLEAN DEFAULT false,
          has_confidentiality_clause BOOLEAN DEFAULT true,
          contract_file_path TEXT,
          annexes_file_paths JSONB DEFAULT '[]',
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now(),
          created_by UUID REFERENCES users(id),
          updated_by UUID REFERENCES users(id)
        );
        
        -- Create indices for employment contracts
        CREATE INDEX IF NOT EXISTS hr_employment_contract_employee_idx ON hr_employment_contracts(employee_id);
        CREATE INDEX IF NOT EXISTS hr_employment_contract_company_idx ON hr_employment_contracts(company_id);
        CREATE INDEX IF NOT EXISTS hr_employment_contract_number_idx ON hr_employment_contracts(contract_number);
        
        -- Create payroll logs table
        CREATE TABLE IF NOT EXISTS hr_payroll_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          employee_id UUID NOT NULL REFERENCES hr_employees(id),
          employment_contract_id UUID NOT NULL REFERENCES hr_employment_contracts(id),
          company_id UUID NOT NULL REFERENCES companies(id),
          year INTEGER NOT NULL,
          month INTEGER NOT NULL,
          status VARCHAR(50) DEFAULT 'draft' NOT NULL,
          payment_date DATE,
          working_days_in_month SMALLINT NOT NULL,
          worked_days NUMERIC(5,2) NOT NULL,
          base_salary_gross NUMERIC(12,2) NOT NULL,
          gross_total NUMERIC(12,2) NOT NULL,
          overtime_hours NUMERIC(5,2) DEFAULT 0,
          overtime_amount NUMERIC(12,2) DEFAULT 0,
          meal_tickets_count INTEGER DEFAULT 0,
          meal_tickets_value NUMERIC(12,2) DEFAULT 0,
          gift_tickets_value NUMERIC(12,2) DEFAULT 0,
          vacation_tickets_value NUMERIC(12,2) DEFAULT 0,
          bonuses NUMERIC(12,2) DEFAULT 0,
          commissions NUMERIC(12,2) DEFAULT 0,
          other_compensations JSONB DEFAULT '{}',
          it_exemption_type VARCHAR(50),
          cas_basis NUMERIC(12,2),
          cas_employee_amount NUMERIC(12,2),
          cass_employee_amount NUMERIC(12,2),
          income_tax_amount NUMERIC(12,2),
          cam_employer_amount NUMERIC(12,2),
          net_salary NUMERIC(12,2) NOT NULL,
          personal_deduction NUMERIC(12,2) DEFAULT 0,
          other_deductions JSONB DEFAULT '{}',
          anaf_declaration_status VARCHAR(50) DEFAULT 'pending',
          anaf_declaration_date DATE,
          anaf_declaration_number VARCHAR(50),
          payslip_file_path TEXT,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now(),
          created_by UUID REFERENCES users(id),
          updated_by UUID REFERENCES users(id)
        );
        
        -- Create indices for payroll logs
        CREATE INDEX IF NOT EXISTS hr_payroll_employee_idx ON hr_payroll_logs(employee_id);
        CREATE INDEX IF NOT EXISTS hr_payroll_company_idx ON hr_payroll_logs(company_id);
        CREATE INDEX IF NOT EXISTS hr_payroll_period_idx ON hr_payroll_logs(year, month);
        
        -- Create absences table
        CREATE TABLE IF NOT EXISTS hr_absences (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          employee_id UUID NOT NULL REFERENCES hr_employees(id),
          company_id UUID NOT NULL REFERENCES companies(id),
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          working_days NUMERIC(5,2) NOT NULL,
          absence_type VARCHAR(50) NOT NULL,
          absence_code VARCHAR(10),
          medical_leave_code VARCHAR(10),
          status VARCHAR(50) DEFAULT 'pending' NOT NULL,
          approved_by UUID REFERENCES users(id),
          approved_at TIMESTAMPTZ,
          rejection_reason TEXT,
          medical_certificate_number VARCHAR(50),
          medical_certificate_date DATE,
          medical_certificate_issued_by TEXT,
          medical_certificate_file_path TEXT,
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now(),
          created_by UUID REFERENCES users(id),
          updated_by UUID REFERENCES users(id)
        );
        
        -- Create indices for absences
        CREATE INDEX IF NOT EXISTS hr_absence_employee_idx ON hr_absences(employee_id);
        CREATE INDEX IF NOT EXISTS hr_absence_company_idx ON hr_absences(company_id);
        CREATE INDEX IF NOT EXISTS hr_absence_date_range_idx ON hr_absences(start_date, end_date);
        
        -- Create work schedules table
        CREATE TABLE IF NOT EXISTS hr_work_schedules (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          employment_contract_id UUID NOT NULL REFERENCES hr_employment_contracts(id),
          company_id UUID NOT NULL REFERENCES companies(id),
          day_of_week INTEGER NOT NULL,
          start_time TIME(0) NOT NULL,
          end_time TIME(0) NOT NULL,
          break_start_time TIME(0),
          break_end_time TIME(0),
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now(),
          UNIQUE(employment_contract_id, day_of_week)
        );
        
        -- Create indices for work schedules
        CREATE INDEX IF NOT EXISTS hr_work_schedule_contract_idx ON hr_work_schedules(employment_contract_id);
        CREATE INDEX IF NOT EXISTS hr_work_schedule_company_idx ON hr_work_schedules(company_id);
        
        -- Create departments table
        CREATE TABLE IF NOT EXISTS hr_departments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id UUID NOT NULL REFERENCES companies(id),
          name TEXT NOT NULL,
          code VARCHAR(20),
          description TEXT,
          parent_department_id UUID REFERENCES hr_departments(id),
          manager_id UUID REFERENCES hr_employees(id),
          cost_center VARCHAR(50),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now(),
          created_by UUID REFERENCES users(id),
          updated_by UUID REFERENCES users(id)
        );
        
        -- Create indices for departments
        CREATE INDEX IF NOT EXISTS hr_department_company_idx ON hr_departments(company_id);
        CREATE INDEX IF NOT EXISTS hr_department_parent_idx ON hr_departments(parent_department_id);
        
        -- Create job positions table
        CREATE TABLE IF NOT EXISTS hr_job_positions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id UUID NOT NULL REFERENCES companies(id),
          name TEXT NOT NULL,
          internal_code VARCHAR(20),
          cor_code VARCHAR(10) NOT NULL,
          description TEXT,
          responsibilities TEXT,
          requirements TEXT,
          department_id UUID REFERENCES hr_departments(id),
          minimum_salary NUMERIC(12,2),
          maximum_salary NUMERIC(12,2),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now(),
          created_by UUID REFERENCES users(id),
          updated_by UUID REFERENCES users(id)
        );
        
        -- Create indices for job positions
        CREATE INDEX IF NOT EXISTS hr_job_position_company_idx ON hr_job_positions(company_id);
        CREATE INDEX IF NOT EXISTS hr_job_position_department_idx ON hr_job_positions(department_id);
        CREATE INDEX IF NOT EXISTS hr_job_position_cor_idx ON hr_job_positions(cor_code);
        
        -- Create commission structures table
        CREATE TABLE IF NOT EXISTS hr_commission_structures (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id UUID NOT NULL REFERENCES companies(id),
          name TEXT NOT NULL,
          description TEXT,
          is_active BOOLEAN DEFAULT true,
          structure_type VARCHAR(50) NOT NULL,
          calculation_period VARCHAR(20) DEFAULT 'monthly' NOT NULL,
          base_percentage NUMERIC(5,2),
          tiers_definition JSONB DEFAULT '[]',
          target_metrics JSONB DEFAULT '{}',
          calculation_formula TEXT,
          minimum_qualifying_amount NUMERIC(12,2),
          maximum_commission_cap NUMERIC(12,2),
          valid_from DATE NOT NULL,
          valid_to DATE,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now(),
          created_by UUID REFERENCES users(id),
          updated_by UUID REFERENCES users(id)
        );
        
        -- Create indices for commission structures
        CREATE INDEX IF NOT EXISTS hr_commission_structure_company_idx ON hr_commission_structures(company_id);
        
        -- Create employee commissions table
        CREATE TABLE IF NOT EXISTS hr_employee_commissions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          employee_id UUID NOT NULL REFERENCES hr_employees(id),
          commission_structure_id UUID NOT NULL REFERENCES hr_commission_structures(id),
          company_id UUID NOT NULL REFERENCES companies(id),
          year INTEGER NOT NULL,
          month INTEGER NOT NULL,
          target_amount NUMERIC(12,2),
          achieved_amount NUMERIC(12,2),
          achievement_percentage NUMERIC(5,2),
          calculated_commission NUMERIC(12,2),
          adjustment_amount NUMERIC(12,2) DEFAULT 0,
          adjustment_reason TEXT,
          final_commission_amount NUMERIC(12,2),
          status VARCHAR(50) DEFAULT 'calculated' NOT NULL,
          approved_by UUID REFERENCES users(id),
          approved_at TIMESTAMPTZ,
          paid_in_payroll_id UUID REFERENCES hr_payroll_logs(id),
          performance_metrics JSONB DEFAULT '{}',
          calculation_details JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now(),
          created_by UUID REFERENCES users(id),
          updated_by UUID REFERENCES users(id)
        );
        
        -- Create indices for employee commissions
        CREATE INDEX IF NOT EXISTS hr_employee_commission_employee_idx ON hr_employee_commissions(employee_id);
        CREATE INDEX IF NOT EXISTS hr_employee_commission_structure_idx ON hr_employee_commissions(commission_structure_id);
        CREATE INDEX IF NOT EXISTS hr_employee_commission_company_idx ON hr_employee_commissions(company_id);
        CREATE INDEX IF NOT EXISTS hr_employee_commission_period_idx ON hr_employee_commissions(year, month);
        
        -- Create ANAF export logs table
        CREATE TABLE IF NOT EXISTS hr_anaf_export_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id UUID NOT NULL REFERENCES companies(id),
          declaration_type VARCHAR(10) NOT NULL,
          year INTEGER NOT NULL,
          month INTEGER,
          quarter INTEGER,
          status VARCHAR(50) DEFAULT 'generated' NOT NULL,
          submission_date TIMESTAMPTZ,
          acceptance_date TIMESTAMPTZ,
          rejection_reason TEXT,
          declaration_number VARCHAR(50),
          registration_number VARCHAR(50),
          declaration_file_path TEXT,
          receipt_file_path TEXT,
          employee_count INTEGER NOT NULL,
          gross_salary_total NUMERIC(12,2) NOT NULL,
          cas_employee_total NUMERIC(12,2) NOT NULL,
          cass_employee_total NUMERIC(12,2) NOT NULL,
          income_tax_total NUMERIC(12,2) NOT NULL,
          cam_employer_total NUMERIC(12,2) NOT NULL,
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now(),
          created_by UUID REFERENCES users(id),
          updated_by UUID REFERENCES users(id)
        );
        
        -- Create indices for ANAF export logs
        CREATE INDEX IF NOT EXISTS hr_anaf_export_company_idx ON hr_anaf_export_logs(company_id);
        CREATE INDEX IF NOT EXISTS hr_anaf_export_period_idx ON hr_anaf_export_logs(year, month, quarter);
        CREATE INDEX IF NOT EXISTS hr_anaf_export_type_idx ON hr_anaf_export_logs(declaration_type);
        
        -- Create REVISAL export logs table
        CREATE TABLE IF NOT EXISTS hr_revisal_export_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          company_id UUID NOT NULL REFERENCES companies(id),
          revisal_version VARCHAR(20) NOT NULL,
          export_date TIMESTAMPTZ NOT NULL,
          employee_count INTEGER NOT NULL,
          new_employee_count INTEGER NOT NULL,
          modified_employee_count INTEGER NOT NULL,
          suspended_employee_count INTEGER NOT NULL,
          terminated_employee_count INTEGER NOT NULL,
          export_file_path TEXT NOT NULL,
          submission_status VARCHAR(50) DEFAULT 'generated' NOT NULL,
          submission_date DATE,
          registration_number VARCHAR(50),
          created_at TIMESTAMPTZ DEFAULT now(),
          updated_at TIMESTAMPTZ DEFAULT now(),
          created_by UUID REFERENCES users(id),
          updated_by UUID REFERENCES users(id)
        );
        
        -- Create indices for REVISAL export logs
        CREATE INDEX IF NOT EXISTS hr_revisal_export_company_idx ON hr_revisal_export_logs(company_id);
        CREATE INDEX IF NOT EXISTS hr_revisal_export_date_idx ON hr_revisal_export_logs(export_date);
      `);
      
      console.log('Schema push completed successfully');
    }
    
    console.log('HR schema migration completed successfully');
  } catch (error) {
    console.error('Error applying HR schema migration:', error);
    throw error;
  } finally {
    // Close database connection
    await sql.end();
  }
}

// Run the migration
main()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });