import React from 'react';
import { useLocation, Link } from 'wouter';
import { 
  Users, 
  FileText, 
  Building2, 
  Calendar, 
  DollarSign,
  PieChart,
  ClipboardList,
  ArrowRight
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import HrLayout from '../../components/layout/HrLayout';
import StatsCard from '../../components/cards/StatsCard';
import { useHrApi } from '../../hooks/useHrApi';

/**
 * HR Overview Page
 * 
 * Main dashboard for HR module
 */
const OverviewPage: React.FC = () => {
  const [_, navigate] = useLocation();
  
  // Use HR API hooks
  const { 
    useEmployees, 
    useDepartments,
    useContracts
  } = useHrApi();
  
  // Current date for payroll
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;
  
  // Fetch data
  const { data: employeesResponse, isLoading: isLoadingEmployees } = useEmployees();
  const { data: departmentsResponse, isLoading: isLoadingDepartments } = useDepartments();
  const { data: contractsResponse, isLoading: isLoadingContracts } = useContracts({ page: 1, limit: 5, status: 'active' });
  
  // Query absențe direct
  const { data: absencesResponse, isLoading: isLoadingAbsences } = useQuery<any, Error>({
    queryKey: ['/api/hr/absences', 1, 5, undefined, undefined, undefined, 'pending'],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '5');
      params.append('status', 'pending');
      
      const response = await apiRequest(`/api/hr/absences?${params.toString()}`);
      return response;
    }
  });
  
  // Query istoric salarial direct
  const { data: payrollResponse, isLoading: isLoadingPayroll } = useQuery<any, Error>({
    queryKey: ['/api/hr/payroll/history', currentYear, currentMonth],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('year', currentYear.toString());
      params.append('month', currentMonth.toString());
      
      const response = await apiRequest(`/api/hr/payroll/history?${params.toString()}`);
      return response;
    }
  });
  
  // Extract data
  const employees = employeesResponse?.data?.items || [];
  const totalEmployees = employeesResponse?.data?.total || 0;
  const departments = departmentsResponse?.data || [];
  const activeContracts = contractsResponse?.data?.items || [];
  const totalActiveContracts = contractsResponse?.data?.total || 0;
  const pendingAbsences = absencesResponse?.data?.items || 0;
  const totalPendingAbsences = absencesResponse?.data?.total || 0;
  const payrollRecords = payrollResponse?.data?.items || [];
  
  // Quick links configuration
  const quickLinks = [
    { 
      title: 'Angajați', 
      description: 'Gestionare date despre angajați, contacte și informații personale',
      icon: <Users className="h-8 w-8 text-primary" />,
      path: '/hr/employees',
      count: totalEmployees
    },
    { 
      title: 'Contracte', 
      description: 'Contracte de muncă, acte adiționale și documente',
      icon: <FileText className="h-8 w-8 text-primary" />,
      path: '/hr/contracts',
      count: totalActiveContracts
    },
    { 
      title: 'Departamente', 
      description: 'Structura organizațională și ierarhia companiei',
      icon: <Building2 className="h-8 w-8 text-primary" />,
      path: '/hr/departments',
      count: hr_departments.length
    },
    { 
      title: 'Absențe', 
      description: 'Concedii, zile libere și absențe',
      icon: <Calendar className="h-8 w-8 text-primary" />,
      path: '/hr/absences',
      count: totalPendingAbsences
    },
    { 
      title: 'Salarizare', 
      description: 'State de plată, fluturași și calcul salarial',
      icon: <DollarSign className="h-8 w-8 text-primary" />,
      path: '/hr/payroll',
      count: payrollRecords.length
    },
    { 
      title: 'Rapoarte', 
      description: 'Rapoarte și analize pentru departamentul HR',
      icon: <PieChart className="h-8 w-8 text-primary" />,
      path: '/hr/reports',
      count: null
    }
  ];

  return (
    <HrLayout 
      activeTab="overview" 
      title="Tablou de bord HR" 
      subtitle="Vizualizare generală a modulului de resurse umane"
    >
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatsCard
            title="Total angajați"
            value={isLoadingEmployees ? "..." : totalEmployees.toString()}
            icon={<Users size={20} />}
            color="primary"
          />
          
          <StatsCard
            title="Contracte active"
            value={isLoadingContracts ? "..." : totalActiveContracts.toString()}
            icon={<FileText size={20} />}
            color="success"
          />
          
          <StatsCard
            title="Absențe în așteptare"
            value={isLoadingAbsences ? "..." : totalPendingAbsences.toString()}
            icon={<Calendar size={20} />}
            color="warning"
          />
          
          <StatsCard
            title="Departamente"
            value={isLoadingDepartments ? "..." : hr_departments.length.toString()}
            icon={<Building2 size={20} />}
            color="info"
          />
        </div>
        
        {/* Quick Links */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((link, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  {link.icon}
                  {link.count !== null && (
                    <span className="px-2 py-1 bg-muted rounded-md text-sm font-medium">
                      {link.count}
                    </span>
                  )}
                </div>
                <CardTitle className="mt-4">{link.title}</CardTitle>
                <CardDescription>{link.description}</CardDescription>
              </CardHeader>
              <CardFooter className="pt-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-between"
                  onClick={() => navigate(link.path)}
                >
                  Accesează
                  <ArrowRight size={16} />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Activitate recentă</CardTitle>
            <CardDescription>Cele mai recente acțiuni și modificări</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <li className="flex items-start gap-4">
                <div className="mt-1 bg-primary/10 p-2 rounded-full">
                  <Users size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Angajat adăugat</p>
                  <p className="text-sm text-muted-foreground">Maria Popescu a fost adăugată în sistem</p>
                  <p className="text-xs text-muted-foreground mt-1">Acum 3 ore</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="mt-1 bg-amber-50 p-2 rounded-full">
                  <Calendar size={16} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Cerere absență aprobată</p>
                  <p className="text-sm text-muted-foreground">Cererea de concediu a lui Ion Ionescu a fost aprobată</p>
                  <p className="text-xs text-muted-foreground mt-1">Acum 5 ore</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="mt-1 bg-green-50 p-2 rounded-full">
                  <FileText size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Contract actualizat</p>
                  <p className="text-sm text-muted-foreground">Contractul lui Alexandru Gheorghe a fost actualizat</p>
                  <p className="text-xs text-muted-foreground mt-1">Ieri, 16:25</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="mt-1 bg-blue-50 p-2 rounded-full">
                  <DollarSign size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">State de plată generate</p>
                  <p className="text-sm text-muted-foreground">Statele de plată pentru luna curentă au fost generate</p>
                  <p className="text-xs text-muted-foreground mt-1">Ieri, 10:12</p>
                </div>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full">
              Vezi toate activitățile
            </Button>
          </CardFooter>
        </Card>
      </div>
    </HrLayout>
  );
};

export default OverviewPage;