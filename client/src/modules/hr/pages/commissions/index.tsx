/**
 * Commissions Page
 * 
 * Displays a list of all commissions for sales agents with filtering options
 * and provides navigation to create new commissions.
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import HrLayout from '@/modules/hr/components/layout/HrLayout';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/modules/hr/components/common/CurrencyInput';
import { Badge } from '@/components/ui/badge';
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, Loader2, Filter } from 'lucide-react';

// Status badge colors
const statusColors = {
  calculated: 'bg-blue-500',
  approved: 'bg-green-500',
  paid: 'bg-emerald-700',
  cancelled: 'bg-red-500',
  pending: 'bg-amber-500',
};

// Romanian labels for status
const statusLabels = {
  calculated: 'Calculat',
  approved: 'Aprobat',
  paid: 'Plătit',
  cancelled: 'Anulat',
  pending: 'În așteptare',
};

const CommissionsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [monthFilter, setMonthFilter] = useState<string>('current');
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  // Get commissions data
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/hr/commissions', page, pageSize, statusFilter, monthFilter],
    queryFn: async () => {
      const res = await apiRequest(
        'GET',
        `/api/hr/commissions?page=${page}&limit=${pageSize}&status=${statusFilter}&month=${monthFilter}`
      );
      return await res.json();
    },
  });

  // Get commission stats
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/hr/commissions/stats'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/hr/commissions/stats');
      return await res.json();
    },
  });

  // Format the month options
  const monthOptions = [
    { value: 'current', label: 'Luna curentă' },
    { value: 'last', label: 'Luna trecută' },
    { value: 'all', label: 'Toate' },
  ];

  // Format status filter options
  const statusOptions = [
    { value: 'all', label: 'Toate' },
    { value: 'pending', label: 'În așteptare' },
    { value: 'calculated', label: 'Calculat' },
    { value: 'approved', label: 'Aprobat' },
    { value: 'paid', label: 'Plătit' },
    { value: 'cancelled', label: 'Anulat' },
  ];

  return (
    <HrLayout
      title="Comisioane"
      subtitle="Gestionați comisioanele pentru agenții de vânzări"
      activeTab="commissions"
      action={{
        label: 'Adaugă comision',
        href: '/hr/commissions/new',
        icon: <PlusCircle className="h-4 w-4 mr-2" />,
      }}
    >
      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comisioane</CardTitle>
            <Badge variant="outline" className="font-normal">Luna curentă</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                formatCurrency(statsData?.totalAmount || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoadingStats ? '-' : statsData?.totalCount || 0} comisioane
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">În așteptare</CardTitle>
            <Badge variant="secondary">Necesită aprobare</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                formatCurrency(statsData?.pendingAmount || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoadingStats ? '-' : statsData?.pendingCount || 0} comisioane
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobate</CardTitle>
            <Badge variant="outline" className="bg-green-500 text-white">Aprobate</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                formatCurrency(statsData?.approvedAmount || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoadingStats ? '-' : statsData?.approvedCount || 0} comisioane
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plătite</CardTitle>
            <Badge variant="outline" className="bg-emerald-700 text-white">Plătite</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                formatCurrency(statsData?.paidAmount || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoadingStats ? '-' : statsData?.paidCount || 0} comisioane
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <CardTitle>Lista comisioane</CardTitle>
              <CardDescription>
                Gestionați și filtrați comisioanele agenților de vânzări
              </CardDescription>
            </div>
            <Button variant="outline" onClick={() => {}} className="mt-2 sm:mt-0">
              <Filter className="h-4 w-4 mr-2" />
              Filtrează
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="w-full sm:w-48">
              <Select
                defaultValue={statusFilter}
                onValueChange={(value) => setStatusFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Select
                defaultValue={monthFilter}
                onValueChange={(value) => setMonthFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Perioadă" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Input placeholder="Caută după nume, cod sau agent..." />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Denumire</TableHead>
                <TableHead>Suma vânzare</TableHead>
                <TableHead>Comision</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                    <p className="mt-2 text-sm text-muted-foreground">Se încarcă comisioanele...</p>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6 text-red-500">
                    Eroare la încărcarea datelor. Vă rugăm încercați din nou.
                  </TableCell>
                </TableRow>
              ) : data?.items?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    <p className="text-muted-foreground">Nu există comisioane de afișat</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => window.location.href = '/hr/commissions/new'}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Adaugă comision nou
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                data?.items?.map((commission: any) => (
                  <TableRow key={commission.id}>
                    <TableCell className="font-medium">{commission.id.slice(0, 8)}</TableCell>
                    <TableCell>
                      {commission.employee?.firstName} {commission.employee?.lastName}
                    </TableCell>
                    <TableCell>{commission.name}</TableCell>
                    <TableCell>{formatCurrency(commission.saleAmount)}</TableCell>
                    <TableCell>{formatCurrency(commission.commissionAmount)}</TableCell>
                    <TableCell>
                      <Badge 
                        className={`${statusColors[commission.status as keyof typeof statusColors] || 'bg-gray-500'}`}
                      >
                        {statusLabels[commission.status as keyof typeof statusLabels] || commission.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(commission.createdAt).toLocaleDateString('ro-RO')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </HrLayout>
  );
};

export default CommissionsPage;