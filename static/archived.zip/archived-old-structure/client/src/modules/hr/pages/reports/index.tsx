import React, { useState } from 'react';
import { useLocation } from 'wouter';
import {
  BarChart3,
  FileText,
  Download,
  Calendar,
  RefreshCcw,
  Filter,
  Users,
  Clock,
  DollarSign
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import HrLayout from '../../components/layout/HrLayout';
import { useHrApi } from '../../hooks/useHrApi';

/**
 * HR Reports Page Component
 * 
 * Displays and manages different HR reports
 */
const HrReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("employees");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [reportFormat, setReportFormat] = useState("pdf");
  const { toast } = useToast();
  
  // Define report groups
  const reportGroups = [
    {
      id: 'employees',
      name: 'Rapoarte angajați',
      icon: <Users className="h-5 w-5" />,
      reports: [
        { id: 'employee-list', name: 'Listă angajați', description: 'Raport complet cu toți angajații activi' },
        { id: 'employee-birthdays', name: 'Zile de naștere', description: 'Calendar zile de naștere angajați' },
        { id: 'employee-analysis', name: 'Analiză personal', description: 'Statistici și grafice despre angajați' },
        { id: 'employee-certifications', name: 'Certificate și competențe', description: 'Raport certificate angajați' }
      ]
    },
    {
      id: 'payroll',
      name: 'Rapoarte salarizare',
      icon: <DollarSign className="h-5 w-5" />,
      reports: [
        { id: 'payroll-summary', name: 'Situație salarii', description: 'Raport centralizator salarii' },
        { id: 'payroll-analysis', name: 'Analiză salarizare', description: 'Analiză detaliată salarii și bonusuri' },
        { id: 'salary-comparisons', name: 'Comparație salarii', description: 'Comparație salarii pe departamente' },
        { id: 'tax-report', name: 'Raport impozite', description: 'Centralizator impozite și contribuții' }
      ]
    },
    {
      id: 'absences',
      name: 'Rapoarte absențe',
      icon: <Calendar className="h-5 w-5" />,
      reports: [
        { id: 'absence-summary', name: 'Situație concedii', description: 'Centralizator concedii pe departamente' },
        { id: 'absence-trends', name: 'Tendințe absențe', description: 'Analiză absențe pe perioade' },
        { id: 'sick-leave-report', name: 'Concedii medicale', description: 'Raport concedii medicale' },
        { id: 'absence-balances', name: 'Sold zile concediu', description: 'Situație zile concediu disponibile' }
      ]
    },
    {
      id: 'time',
      name: 'Rapoarte de timp',
      icon: <Clock className="h-5 w-5" />,
      reports: [
        { id: 'time-sheets', name: 'Pontaje', description: 'Situație pontaje pe departamente' },
        { id: 'overtime-report', name: 'Raport ore suplimentare', description: 'Centralizator ore suplimentare' },
        { id: 'attendance-report', name: 'Raport prezență', description: 'Situație prezență angajați' },
        { id: 'lateness-report', name: 'Raport întârzieri', description: 'Analiză întârzieri' }
      ]
    }
  ];
  
  // Get current report group
  const currentReportGroup = reportGroups.find(group => group.id === activeTab);
  
  // Handle report generation
  const handleGenerateReport = (reportId: string) => {
    toast({
      title: "Raport în curs de generare",
      description: "Raportul va fi disponibil în câteva momente",
    });
    
    // In a real application, this would trigger a report generation
    setTimeout(() => {
      toast({
        title: "Raport generat cu succes",
        description: "Raportul a fost generat și este gata pentru descărcare",
      });
    }, 1500);
  };
  
  return (
    <HrLayout 
      activeTab="reports" 
      title="Rapoarte HR" 
      subtitle="Generare și management rapoarte HR"
    >
      <div className="space-y-6">
        {/* Report Controls */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Control rapoarte</CardTitle>
            <CardDescription>
              Selectați perioada și formatul pentru rapoarte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">An</label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Selectează anul" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(5)].map((_, i) => {
                      const yearValue = (new Date().getFullYear() - 2 + i).toString();
                      return (
                        <SelectItem key={yearValue} value={yearValue}>
                          {yearValue}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Lună</label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Selectează luna" />
                  </SelectTrigger>
                  <SelectContent>
                    {[...Array(12)].map((_, i) => {
                      const monthValue = (i + 1).toString();
                      const monthName = format(new Date(2024, i, 1), 'LLLL', { locale: ro });
                      return (
                        <SelectItem key={monthValue} value={monthValue}>
                          {monthName.charAt(0).toUpperCase() + monthName.slice(1)}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Format</label>
                <Select value={reportFormat} onValueChange={setReportFormat}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Selectează formatul" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="ml-auto">
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtre avansate
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Reports Content */}
        <Tabs defaultValue="employees" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-6">
            {reportGroups.map(group => (
              <TabsTrigger key={group.id} value={group.id} className="flex items-center">
                {group.icon && <span className="mr-2">{group.icon}</span>}
                {group.name}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {reportGroups.map(group => (
            <TabsContent key={group.id} value={group.id} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.reports.map(report => (
                  <Card key={report.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-primary" />
                        {report.name}
                      </CardTitle>
                      <CardDescription>{report.description}</CardDescription>
                    </CardHeader>
                    <CardFooter className="border-t pt-4 pb-2 flex justify-between">
                      <Button variant="outline" size="sm">
                        <RefreshCcw className="h-4 w-4 mr-2" />
                        Previzualizare
                      </Button>
                      <Button size="sm" onClick={() => handleGenerateReport(report.id)}>
                        <Download className="h-4 w-4 mr-2" />
                        Generează
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </HrLayout>
  );
};

export default HrReportsPage;