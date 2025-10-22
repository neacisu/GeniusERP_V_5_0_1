/**
 * Layout pentru modulul AI
 * 
 * Acest layout oferă navigare verticală în cadrul modulului AI,
 * și este folosit ca wrapper pentru toate subpaginile modulului.
 */

import React, { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  Card,
  CardContent,
} from "@/components/ui/card";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

type AILayoutProps = {
  children: ReactNode;
};

export default function AILayout({ children }: AILayoutProps) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}