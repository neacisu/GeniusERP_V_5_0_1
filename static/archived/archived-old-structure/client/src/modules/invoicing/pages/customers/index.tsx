/**
 * Customers Page
 * 
 * Manage invoice customers, view customer details, and customer invoicing history.
 */

import React, { useState } from "react";
import { Link } from "wouter";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

// Lucide icons
import { Plus, Search, Filter, ArrowUpDown } from "lucide-react";

// Custom components
import PageHeader from "../../components/common/PageHeader";
import TabsNav, { TabItem } from "../../components/common/TabsNav";

const CustomersPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const tabItems: TabItem[] = [
    { id: "all", label: "Toți clienții" },
    { id: "companies", label: "Firme" },
    { id: "individuals", label: "Persoane fizice" },
    { id: "archived", label: "Arhivați" }
  ];

  const handleCreateCustomer = () => {
    // Navigate to customer creation page (to be implemented)
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Clienți" 
        description="Gestionează clienți pentru facturare"
        onAddNew={handleCreateCustomer}
        addNewLabel="Client nou"
      />

      <Card>
        <CardContent className="p-6">
          <TabsNav 
            items={tabItems} 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
          />

          <div className="mt-6 space-y-4">
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Caută clienți..."
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
                  <ArrowUpDown className="mr-2 h-4 w-4" />
                  Sortare
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-dashed p-8 text-center">
              <h3 className="text-lg font-medium mb-2">Pagină în dezvoltare</h3>
              <p className="text-muted-foreground">
                Această funcționalitate va fi disponibilă în curând.
              </p>
              <Button className="mt-4" onClick={handleCreateCustomer}>
                <Plus className="mr-2 h-4 w-4" />
                Adaugă client nou
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomersPage;