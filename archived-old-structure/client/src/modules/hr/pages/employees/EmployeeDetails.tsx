import React from 'react';
import { useParams, useLocation } from 'wouter';
import HrLayout from '../../components/layout/HrLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

/**
 * Employee Details Page Component
 */
const EmployeeDetailsPage: React.FC = () => {
  const params = useParams();
  const employeeId = params.id;
  const isNewEmployee = !employeeId;
  const [_, navigate] = useLocation();

  return (
    <HrLayout
      activeTab="employees"
      title={isNewEmployee ? "Adăugare angajat nou" : "Detalii angajat"}
      subtitle={isNewEmployee ? "Completați datele pentru noul angajat" : `ID angajat: ${employeeId}`}
    >
      <div className="mb-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/hr/employees')}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Înapoi la angajați
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isNewEmployee ? "Angajat nou" : "Detalii angajat"}</CardTitle>
          <CardDescription>
            {isNewEmployee 
              ? "Introduceți informațiile pentru noul angajat" 
              : "Vizualizare și editare informații angajat"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Formular detalii angajat va fi implementat aici</p>
        </CardContent>
      </Card>
    </HrLayout>
  );
};

export default EmployeeDetailsPage;