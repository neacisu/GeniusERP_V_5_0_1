/**
 * Invoice Reports Page
 * 
 * View and generate various types of invoice reports and analytics.
 */

import React, { useState } from "react";
import { Link } from "wouter";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

// Lucide icons
import { Plus, Search, Filter, BarChart, LineChart, PieChart, Download } from "lucide-react";

// Custom components
import PageHeader from "../../components/common/PageHeader";
import TabsNav, { TabItem } from "../../components/common/TabsNav";

const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("sales");
  const [searchQuery, setSearchQuery] = useState("");

  const tabItems: TabItem[] = [
    { id: "sales", label: "Vânzări" },
    { id: "clients", label: "Clienți" },
    { id: "taxes", label: "TVA" },
    { id: "custom", label: "Personalizate" }
  ];

  const handleCreateReport = () => {
    // Navigate to report creation page (to be implemented)
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Rapoarte" 
        description="Generează și vizualizează rapoarte de facturare"
        onAddNew={handleCreateReport}
        addNewLabel="Raport nou"
      />

      <Card>
        <CardContent className="p-6">
          <TabsNav 
            items={tabItems} 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
          />

          <div className="mt-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Caută rapoarte..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex flex-shrink-0 gap-2">
                <Button variant="outline" className="flex items-center whitespace-nowrap">
                  <Filter className="mr-2 h-4 w-4" />
                  Filtrare
                </Button>
                <Button variant="outline" className="flex items-center whitespace-nowrap">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-blue-50 p-6 flex items-center justify-center">
                  <BarChart className="h-12 w-12 text-blue-700" />
                </div>
                <CardContent className="p-6 flex-grow">
                  <h3 className="text-xl font-semibold mb-2">Sumar vânzări</h3>
                  <p className="text-muted-foreground mb-4">
                    Raport de vânzări sumarizat pe perioade și categorii.
                  </p>
                </CardContent>
                <div className="p-4 border-t">
                  <Button variant="outline" className="w-full" onClick={handleCreateReport}>
                    Generează raport
                  </Button>
                </div>
              </Card>

              <Card className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-green-50 p-6 flex items-center justify-center">
                  <LineChart className="h-12 w-12 text-green-700" />
                </div>
                <CardContent className="p-6 flex-grow">
                  <h3 className="text-xl font-semibold mb-2">Tendințe vânzări</h3>
                  <p className="text-muted-foreground mb-4">
                    Evoluția vânzărilor în timp și prognoze de viitor.
                  </p>
                </CardContent>
                <div className="p-4 border-t">
                  <Button variant="outline" className="w-full" onClick={handleCreateReport}>
                    Generează raport
                  </Button>
                </div>
              </Card>

              <Card className="flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                <div className="bg-purple-50 p-6 flex items-center justify-center">
                  <PieChart className="h-12 w-12 text-purple-700" />
                </div>
                <CardContent className="p-6 flex-grow">
                  <h3 className="text-xl font-semibold mb-2">Analiză clienți</h3>
                  <p className="text-muted-foreground mb-4">
                    Distribuția vânzărilor pe segmente de clienți.
                  </p>
                </CardContent>
                <div className="p-4 border-t">
                  <Button variant="outline" className="w-full" onClick={handleCreateReport}>
                    Generează raport
                  </Button>
                </div>
              </Card>
            </div>

            <div className="rounded-lg border border-dashed p-8 text-center">
              <h3 className="text-lg font-medium mb-2">Rapoarte avansate în dezvoltare</h3>
              <p className="text-muted-foreground">
                Rapoartele avansate și analizele detaliate vor fi disponibile în curând.
              </p>
              <Button className="mt-4" onClick={handleCreateReport}>
                <Plus className="mr-2 h-4 w-4" />
                Creează raport personalizat
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsPage;