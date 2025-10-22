import React, { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import CollabIntegration from "../../modules/collab/components/CollabIntegration";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        
        {/* Integrare cu modulul de colaborare */}
        <CollabIntegration enableTasks={true} enableCommunity={true} />
      </div>
    </div>
  );
}
