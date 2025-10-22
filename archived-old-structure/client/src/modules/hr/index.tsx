import React from 'react';
import { Route, Switch } from 'wouter';
import AppLayout from '../../components/layout/AppLayout';

// Import all pages
import OverviewPage from './pages/overview';
import EmployeesPage from './pages/employees';
import EmployeeDetailsPage from './pages/employees/EmployeeDetails';
import NewEmployeePage from './pages/employees/new/index';
import ContractsPage from './pages/contracts';
import ContractDetailsPage from './pages/contracts/ContractDetails';
import DepartmentsPage from './pages/departments';
import DepartmentDetailsPage from './pages/departments/DepartmentDetails';
import AbsencesPage from './pages/absences';
import AbsenceDetailsPage from './pages/absences/AbsenceDetails';
import PayrollPage from './pages/payroll';
import PayrollDetailsPage from './pages/payroll/PayrollDetails';
import ReportsPage from './pages/reports';
import CorPage from './pages/cor';
import CommissionsPage from './pages/commissions';
import NewCommissionPage from './pages/commissions/new';
import RevisalPage from './pages/revisal';
import HrSettingsPage from './pages/settings';
import NotFound from '../shared/pages/not-found';

/**
 * HR Module
 * 
 * Main module component that handles routes for the HR section
 * Wrapped with AppLayout to ensure consistent sidebar and header
 */
const HRModule: React.FC = () => {
  return (
    <AppLayout>
      <Switch>
        {/* Overview */}
        <Route path="/hr" component={OverviewPage} />
        
        {/* Employees */}
        <Route path="/hr/employees/new" component={NewEmployeePage} />
        <Route path="/hr/employees/:id/edit" component={EmployeeDetailsPage} />
        <Route path="/hr/employees/:id" component={EmployeeDetailsPage} />
        <Route path="/hr/employees" component={EmployeesPage} />
        
        {/* Contracts */}
        <Route path="/hr/contracts/new" component={ContractDetailsPage} />
        <Route path="/hr/contracts/:id/edit" component={ContractDetailsPage} />
        <Route path="/hr/contracts/:id" component={ContractDetailsPage} />
        <Route path="/hr/contracts" component={ContractsPage} />
        
        {/* Departments */}
        <Route path="/hr/departments/new" component={DepartmentDetailsPage} />
        <Route path="/hr/departments/:id/edit" component={DepartmentDetailsPage} />
        <Route path="/hr/departments/:id" component={DepartmentDetailsPage} />
        <Route path="/hr/departments" component={DepartmentsPage} />
        
        {/* Absences */}
        <Route path="/hr/absences/new" component={AbsenceDetailsPage} />
        <Route path="/hr/absences/:id/edit" component={AbsenceDetailsPage} />
        <Route path="/hr/absences/:id" component={AbsenceDetailsPage} />
        <Route path="/hr/absences" component={AbsencesPage} />
        
        {/* Payroll */}
        <Route path="/hr/payroll/:id" component={PayrollDetailsPage} />
        <Route path="/hr/payroll" component={PayrollPage} />
        
        {/* Reports */}
        <Route path="/hr/reports" component={ReportsPage} />
        
        {/* COR - Classification of Occupations */}
        <Route path="/hr/cor/:id" component={CorPage} />
        <Route path="/hr/cor" component={CorPage} />
        
        {/* Commissions */}
        <Route path="/hr/commissions/new" component={NewCommissionPage} />
        <Route path="/hr/commissions/:id" component={CommissionsPage} />
        <Route path="/hr/commissions" component={CommissionsPage} />
        
        {/* Revisal */}
        <Route path="/hr/revisal/:id" component={RevisalPage} />
        <Route path="/hr/revisal/new" component={RevisalPage} />
        <Route path="/hr/revisal" component={RevisalPage} />
        
        {/* Settings */}
        <Route path="/hr/settings" component={HrSettingsPage} />
        
        {/* Fallback */}
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
};

export default HRModule;