/**
 * Process List Component
 * 
 * Componenta pentru afișarea listei de procese în format tabel sau grid
 */

import React, { useState } from 'react';
import ProcessCard from './ProcessCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, LayoutList, Search, Filter } from 'lucide-react';
import BPMEmptyState from '../common/BPMEmptyState';
import { GitBranch } from 'lucide-react';

export interface Process {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  lastRun?: string;
  createdAt: string;
  updatedAt?: string;
  runCount?: number;
  successRate?: number;
  owner?: string;
  category?: string;
}

interface ProcessListProps {
  processes: Process[];
  onCreateProcess: () => void;
}

const ProcessList: React.FC<ProcessListProps> = ({ processes, onCreateProcess }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  
  // Filter processes based on search query and filters
  const filteredProcesses = processes.filter(process => {
    const matchesSearch = !searchQuery || 
      process.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      process.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'all' || process.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || process.status === selectedStatus;
    
    return matchesSearch && matchesType && matchesStatus;
  });
  
  return (
    <div className="space-y-6">
      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Caută procese..." 
              className="pl-9" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tip proces" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate tipurile</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="approval">Aprobare</SelectItem>
              <SelectItem value="document">Document</SelectItem>
              <SelectItem value="custom">Personalizat</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="draft">Ciornă</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as 'grid' | 'list')} className="hidden sm:block">
            <TabsList className="h-10">
              <TabsTrigger value="grid" className="px-3">
                <LayoutGrid className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="list" className="px-3">
                <LayoutList className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {/* No results state */}
      {filteredProcesses.length === 0 ? (
        <BPMEmptyState 
          title="Nu există procese" 
          description="Nu s-au găsit procese care să corespundă criteriilor de căutare. Începeți prin a crea un proces nou."
          icon={<GitBranch className="h-10 w-10" />}
          action={{
            label: "Creează proces",
            onClick: onCreateProcess,
          }}
          variant="card"
        />
      ) : (
        <div>
          {view === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProcesses.map((process) => (
                <ProcessCard key={process.id} process={process} />
              ))}
            </div>
          ) : (
            <div className="border rounded-md">
              {/* Table view would be implemented here */}
              <div className="p-8 text-center text-muted-foreground">
                Vizualizarea de tip listă va fi implementată în curând.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProcessList;