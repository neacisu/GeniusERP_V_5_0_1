/**
 * Documents Module Layout Component
 * 
 * Provides a common layout for all document module pages, with unified heading, 
 * tab navigation, and proper context providers.
 */

import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation } from 'wouter';
import { FileText, Archive, ScrollText, Search, Edit, Fingerprint, FileSearch } from 'lucide-react';
import CollabIntegration from '../../../collab/components/CollabIntegration';

interface DocumentsModuleLayoutProps {
  children: React.ReactNode;
  activeTab: string;
}

export function DocumentsModuleLayout({ children, activeTab }: DocumentsModuleLayoutProps) {
  const [_, setLocation] = useLocation();

  const handleTabChange = (value: string) => {
    setLocation(`/documents/${value}`);
  };

  return (
    <AppLayout>
      <div className="flex flex-col space-y-6 p-6">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-2">
            <FileText className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Registratura & Arhiva</h1>
          </div>
          
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full max-w-4xl grid grid-cols-7">
              <TabsTrigger value="archive" className="flex items-center gap-1">
                <Archive className="h-4 w-4" />
                <span className="hidden sm:inline">Arhivă</span>
              </TabsTrigger>
              
              <TabsTrigger value="registry" className="flex items-center gap-1">
                <ScrollText className="h-4 w-4" />
                <span className="hidden sm:inline">Registru</span>
              </TabsTrigger>

              <TabsTrigger value="templates" className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Șabloane</span>
              </TabsTrigger>

              <TabsTrigger value="ocr" className="flex items-center gap-1">
                <FileSearch className="h-4 w-4" />
                <span className="hidden sm:inline">OCR</span>
              </TabsTrigger>

              <TabsTrigger value="editor" className="flex items-center gap-1">
                <Edit className="h-4 w-4" />
                <span className="hidden sm:inline">Editor</span>
              </TabsTrigger>

              <TabsTrigger value="signatures" className="flex items-center gap-1">
                <Fingerprint className="h-4 w-4" />
                <span className="hidden sm:inline">Semnături</span>
              </TabsTrigger>

              <TabsTrigger value="search" className="flex items-center gap-1">
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Căutare</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="bg-background rounded-lg pb-6">
          {children}
          
          {/* Integrare cu modulul de colaborare */}
          <div className="mt-6 px-6">
            <CollabIntegration 
              moduleContext="Documents" 
              enableTasks={true} 
              enableCommunity={true} 
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default DocumentsModuleLayout;