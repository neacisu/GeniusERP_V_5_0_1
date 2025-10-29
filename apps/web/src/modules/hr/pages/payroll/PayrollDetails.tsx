import React from 'react';
import { useParams, useLocation } from 'wouter';
import HrLayout from '../../components/layout/HrLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer, Download } from 'lucide-react';

/**
 * Payroll Details Page Component
 */
const PayrollDetailsPage: React.FC = () => {
  const params = useParams();
  const payrollId = params['id'];
  const [_, navigate] = useLocation();

  return (
    <HrLayout
      activeTab="payroll"
      title="Detalii salariu"
      subtitle={`ID salariu: ${payrollId}`}
    >
      <div className="mb-4 flex justify-between">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/hr/payroll')}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Înapoi la salarizare
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center">
            <Printer className="mr-2 h-4 w-4" />
            Tipărire fluturași
          </Button>
          <Button variant="outline" className="flex items-center">
            <Download className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Detalii salariu</CardTitle>
          <CardDescription>
            Vizualizare detalii salariu pentru perioada curentă
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Detalii salariu vor fi afișate aici</p>
        </CardContent>
      </Card>
    </HrLayout>
  );
};

export default PayrollDetailsPage;