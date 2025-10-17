/**
 * Pagină pentru adăugarea unui comision nou
 * 
 * Implementează un flux complet de adăugare comision pentru agenții de vânzări
 * conform structurilor de comisioane definite în sistem.
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import HrLayout from '@/modules/hr/components/layout/HrLayout';
import CommissionForm from '@/modules/hr/components/forms/CommissionForm';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const NewCommissionPage: React.FC = () => {
  const { toast } = useToast();

  // Query commission rules (for validation purposes)
  const { data: rules } = useQuery({
    queryKey: ['/api/hr/commissions/rules'],
    queryFn: async () => {
      return await apiRequest('/api/hr/commissions/rules');
    },
  });

  // Handle successful commission creation
  const handleSuccess = (data: any) => {
    // Show success message
    toast({
      title: 'Comision creat cu succes',
      description: `Comisionul pentru ${data.employeeName} a fost adăugat.`,
    });

    // Invalidate commissions queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['/api/hr/commissions'] });
    
    // Redirect to commissions page
    window.location.href = '/hr/commissions';
  };

  return (
    <HrLayout
      title="Adaugă comision nou"
      subtitle="Creează un nou comision pentru agenții de vânzări"
      activeTab="commissions"
      backLink={{
        label: 'Înapoi la lista de comisioane',
        href: '/hr/commissions',
      }}
    >
      <Card>
        <CardContent className="pt-6">
          <CommissionForm 
            onSuccess={handleSuccess}
            rules={rules}
          />
        </CardContent>
      </Card>
    </HrLayout>
  );
};

export default NewCommissionPage;