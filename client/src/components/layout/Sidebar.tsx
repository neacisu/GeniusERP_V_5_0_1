import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { ChevronDown, ChevronRight, Package, Layers, Store, Receipt, RefreshCw, BarChart, BoxesIcon } from "lucide-react";
import { Logo } from "@/components/ui/logo";

type SidebarProps = {
  isOpen: boolean;
  toggleSidebar: () => void;
};

type NavItem = {
  title: string;
  path: string;
  icon: string;
  children?: NavItem[];
};

export default function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
  const [location] = useLocation();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Determine which items should be expanded based on the current location
  useEffect(() => {
    // Auto-expand the accounting submenu if we're on any accounting page
    if (location.startsWith("/accounting")) {
      setExpandedItems(prev => ({ ...prev, "/accounting": true }));
    }
    
    // Auto-expand the admin submenu if we're on any admin page
    if (location.startsWith("/admin")) {
      setExpandedItems(prev => ({ ...prev, "/admin": true }));
    }
    
    // Auto-expand the AI submenu if we're on any AI page
    if (location.startsWith("/ai")) {
      setExpandedItems(prev => ({ ...prev, "/ai": true }));
    }
    
    // Auto-expand the Analytics submenu if we're on any analytics page
    if (location.startsWith("/analytics")) {
      setExpandedItems(prev => ({ ...prev, "/analytics": true }));
    }
    
    // Auto-expand the BPM submenu if we're on any BPM page
    if (location.startsWith("/bpm")) {
      setExpandedItems(prev => ({ ...prev, "/bpm": true }));
    }
    
    // Auto-expand the Collab submenu if we're on any collab page
    if (location.startsWith("/collab")) {
      setExpandedItems(prev => ({ ...prev, "/collab": true }));
    }
    
    // Auto-expand the CRM submenu if we're on any CRM page
    if (location.startsWith("/crm")) {
      setExpandedItems(prev => ({ ...prev, "/crm": true }));
    }

    // Auto-expand the Documents submenu if we're on any documents page
    if (location.startsWith("/documents")) {
      setExpandedItems(prev => ({ ...prev, "/documents": true }));
    }
    
    // Auto-expand the Ecommerce submenu if we're on any ecommerce page
    if (location.startsWith("/ecommerce")) {
      setExpandedItems(prev => ({ ...prev, "/ecommerce": true }));
    }
    
    // Auto-expand the HR submenu if we're on any HR page
    if (location.startsWith("/hr")) {
      setExpandedItems(prev => ({ ...prev, "/hr": true }));
    }
    
    // Auto-expand the Inventory submenu if we're on any inventory page
    if (location.startsWith("/inventory")) {
      setExpandedItems(prev => ({ ...prev, "/inventory": true }));
    }
    
    // Auto-expand the Sales submenu if we're on any sales page
    if (location.startsWith("/sales")) {
      setExpandedItems(prev => ({ ...prev, "/sales": true }));
    }
  }, [location]);

  const isActive = (path: string) => {
    if (path === "/") {
      return location === "/" || location === "/dashboard";
    }
    return location === path || location.startsWith(`${path}/`);
  };

  const toggleExpand = (path: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };
  
  // Define accounting submenu items
  const accountingSubitems: NavItem[] = [
    { title: "Plan de Conturi", path: "/accounting/chart-of-accounts", icon: "menu_book" },
    { title: "Registru Jurnal", path: "/accounting/journal-entries", icon: "menu_book" },
    { title: "Note Contabile", path: "/accounting/note-contabil", icon: "receipt" },
    { title: "Jurnal Vânzări", path: "/accounting/sales-journal", icon: "point_of_sale" },
    { title: "Jurnal Cumpărări", path: "/accounting/purchase-journal", icon: "shopping_cart" },
    { title: "Registru de Casă", path: "/accounting/cash-register", icon: "payments" },
    { title: "Extrase Bancare", path: "/accounting/bank-journal", icon: "account_balance" },
    { title: "Rapoarte Financiare", path: "/accounting/financial-reports", icon: "insert_chart" },
  ];
  
  // Define HR submenu items
  const hrSubitems: NavItem[] = [
    { title: "Tablou general", path: "/hr", icon: "dashboard" },
    { title: "Angajați", path: "/hr/employees", icon: "people" },
    { title: "Contracte", path: "/hr/contracts", icon: "description" },
    { title: "Departamente", path: "/hr/departments", icon: "business" },
    { title: "Absențe", path: "/hr/absences", icon: "event_busy" },
    { title: "Salarizare", path: "/hr/payroll", icon: "payments" },
    { title: "Comisioane", path: "/hr/commissions", icon: "savings" },
    { title: "Revisal", path: "/hr/revisal", icon: "gavel" },
    { title: "Nomenclator COR", path: "/hr/cor", icon: "badge" },
    { title: "Rapoarte", path: "/hr/reports", icon: "assessment" },
    { title: "Setări HR", path: "/hr/settings", icon: "settings" },
  ];
  
  // Define AI submenu items
  const aiSubitems: NavItem[] = [
    { title: "Dashboard", path: "/ai", icon: "dashboard" },
    { title: "Rapoarte Inteligente", path: "/ai/reports", icon: "summarize" },
    { title: "Sales AI", path: "/ai/sales", icon: "trending_up" },
    { title: "Inbox AI", path: "/ai/inbox", icon: "mail" },
    { title: "Product Q&A", path: "/ai/products", icon: "quiz" },
    { title: "Integrare OpenAI", path: "/ai/openai", icon: "smart_toy" },
  ];
  
  // Define Analytics submenu items
  const analyticsSubitems: NavItem[] = [
    { title: "Dashboard", path: "/analytics", icon: "dashboard" },
    { title: "Rapoarte", path: "/analytics/reports", icon: "description" },
    { title: "Metrici", path: "/analytics/metrics", icon: "speed" },
    { title: "Alerte", path: "/analytics/alerts", icon: "notifications" },
  ];
  
  // Define Documents submenu items
  const documentsSubitems: NavItem[] = [
    { title: "Arhivă", path: "/documents/archive", icon: "archive" },
    { title: "Registru", path: "/documents/registry", icon: "menu_book" },
    { title: "Șabloane", path: "/documents/templates", icon: "description" },
    { title: "OCR", path: "/documents/ocr", icon: "document_scanner" },
    { title: "Editor", path: "/documents/editor", icon: "edit_document" },
    { title: "Semnături", path: "/documents/signatures", icon: "fingerprint" },
    { title: "Căutare", path: "/documents/search", icon: "search" },
  ];
  
  // Define BPM submenu items
  const bpmSubitems: NavItem[] = [
    { title: "Dashboard", path: "/bpm", icon: "dashboard" },
    { title: "Procese", path: "/bpm/processes", icon: "account_tree" },
    { title: "Triggere", path: "/bpm/triggers", icon: "bolt" },
    { title: "Automatizări", path: "/bpm/automations", icon: "settings_suggest" },
    { title: "Integrări", path: "/bpm/integrations", icon: "sync" },
    { title: "Monitorizare", path: "/bpm/monitoring", icon: "monitoring" },
    { title: "Planificator", path: "/bpm/scheduler", icon: "schedule" },
  ];
  
  // Define Collaboration submenu items
  const collabSubitems: NavItem[] = [
    { title: "Tablou general", path: "/collab", icon: "dashboard" },
    { title: "Sarcini", path: "/collab/tasks", icon: "task_alt" },
    { title: "Notițe", path: "/collab/notes", icon: "note" },
    { title: "Thread-uri", path: "/collab/threads", icon: "forum" },
    { title: "Mesaje", path: "/collab/messages", icon: "chat" },
    { title: "Comunitate", path: "/collab/community", icon: "groups" },
    { title: "Setări", path: "/collab/settings", icon: "settings" },
  ];
  
  // Define Sales module submenu items
  const salesSubitems: NavItem[] = [
    { title: "Tablou general", path: "/sales", icon: "dashboard" },
    { title: "Clienți", path: "/sales/customers", icon: "people" },
    { title: "Contracte", path: "/sales/deals", icon: "handshake" },
    { title: "Pipeline", path: "/sales/pipeline", icon: "trending_up" },
    { title: "Oportunități", path: "/sales/opportunities", icon: "rocket_launch" },
    { title: "Oferte", path: "/sales/quotes", icon: "receipt" },
    { title: "Analiză vânzări", path: "/sales/analytics", icon: "bar_chart" },
    { title: "Facturi", path: "/invoicing", icon: "description" },
    { title: "Setări vânzări", path: "/sales/settings", icon: "settings" },
  ];
  
  // Define E-commerce submenu items
  const ecommerceSubitems: NavItem[] = [
    { title: "Dashboard", path: "/ecommerce", icon: "dashboard" },
    { title: "Comenzi", path: "/ecommerce/orders", icon: "shopping_cart" },
    { title: "Produse", path: "/ecommerce/products", icon: "inventory" },
    { title: "Magazin", path: "/ecommerce/shop", icon: "store" },
    { title: "Clienți", path: "/ecommerce/customers", icon: "people" },
    { title: "Promoții", path: "/ecommerce/discounts", icon: "local_offer" },
    { title: "Analiză", path: "/ecommerce/analytics", icon: "bar_chart" },
    { title: "Livrare", path: "/ecommerce/fulfillment", icon: "local_shipping" },
    { title: "Integrare Shopify", path: "/ecommerce/integrations/shopify", icon: "sync" },
    { title: "Setări", path: "/ecommerce/settings", icon: "settings" },
  ];

  return (
    <div 
      className={`${isOpen ? 'fixed inset-0 z-20' : 'hidden'} md:flex md:static md:inset-auto md:z-auto flex-col w-64 bg-white shadow-md transition-all duration-300`}
    >
      {/* Logo and brand */}
      <div className="p-6 border-b border-gray-200">
        <Logo size="sm" />
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4">
        <ul>
          <li className="px-3 py-2">
            <div className="text-xs font-semibold text-gray-500 uppercase px-3 mb-2">Principal</div>
            <Link href="/" className={`flex items-center px-3 py-2 rounded-md font-medium ${isActive('/')
                ? 'text-primary bg-primary/10 border-r-2 border-primary' 
                : 'text-gray-700 hover:bg-gray-100 hover:text-primary'}`}>
              <span className="material-icons mr-3">dashboard</span>
              <span>Dashboard</span>
            </Link>
          </li>
          
          <li className="px-3 py-2">
            <div className="text-xs font-semibold text-gray-500 uppercase px-3 mb-2 mt-4">Module</div>
            
            {/* AI Genius with collapsible subitems */}
            <div className="mb-1">
              <div 
                className={`flex items-center justify-between px-3 py-2 rounded-md font-medium cursor-pointer ${
                  isActive('/ai') 
                    ? 'text-primary bg-primary/10' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                }`}
                onClick={() => toggleExpand("/ai")}
              >
                <div className="flex items-center">
                  <span className="material-icons mr-3">psychology</span>
                  <span>AI Genius</span>
                </div>
                <div className="text-gray-500">
                  {expandedItems['/ai'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>
              
              {/* Subitems for AI */}
              {expandedItems['/ai'] && (
                <div className="ml-10 mt-1 space-y-1">
                  {aiSubitems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`flex items-center px-3 py-1.5 text-sm rounded-md font-medium ${
                        isActive(item.path)
                          ? 'text-primary bg-primary/10'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                      }`}
                    >
                      <span className="material-icons text-sm mr-2">{item.icon}</span>
                      <span>{item.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            
            {/* Accounting with collapsible subitems */}
            <div className="mb-1">
              <div 
                className={`flex items-center justify-between px-3 py-2 rounded-md font-medium cursor-pointer ${
                  isActive('/accounting') 
                    ? 'text-primary bg-primary/10' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                }`}
                onClick={() => toggleExpand("/accounting")}
              >
                <div className="flex items-center">
                  <span className="material-icons mr-3">account_balance_wallet</span>
                  <span>Contabilitate</span>
                </div>
                <div className="text-gray-500">
                  {expandedItems['/accounting'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>
              
              {/* Subitems for Accounting */}
              {expandedItems['/accounting'] && (
                <div className="ml-10 mt-1 space-y-1">
                  {accountingSubitems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`flex items-center px-3 py-1.5 text-sm rounded-md font-medium ${
                        isActive(item.path)
                          ? 'text-primary bg-primary/10'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                      }`}
                    >
                      <span className="material-icons text-sm mr-2">{item.icon}</span>
                      <span>{item.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            
            {/* HR (Personal) with collapsible subitems */}
            <div className="mb-1">
              <div 
                className={`flex items-center justify-between px-3 py-2 rounded-md font-medium cursor-pointer ${
                  isActive('/hr') 
                    ? 'text-primary bg-primary/10' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                }`}
                onClick={() => toggleExpand("/hr")}
              >
                <div className="flex items-center">
                  <span className="material-icons mr-3">people</span>
                  <span>Personal & HR</span>
                </div>
                <div className="text-gray-500">
                  {expandedItems['/hr'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>
              
              {/* Subitems for HR */}
              {expandedItems['/hr'] && (
                <div className="ml-10 mt-1 space-y-1">
                  {hrSubitems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`flex items-center px-3 py-1.5 text-sm rounded-md font-medium ${
                        isActive(item.path)
                          ? 'text-primary bg-primary/10'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                      }`}
                    >
                      <span className="material-icons text-sm mr-2">{item.icon}</span>
                      <span>{item.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            
            {/* Inventory (Gestiune Stocuri) with collapsible subitems */}
            <div className="mb-1">
              <div 
                className={`flex items-center justify-between px-3 py-2 rounded-md font-medium cursor-pointer ${
                  isActive('/inventory') 
                    ? 'text-primary bg-primary/10' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                }`}
                onClick={() => toggleExpand("/inventory")}
              >
                <div className="flex items-center">
                  <span className="material-icons mr-3">inventory_2</span>
                  <span>Gestiune Stocuri</span>
                </div>
                <div className="text-gray-500">
                  {expandedItems['/inventory'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>
              
              {/* Subitems for Inventory */}
              {expandedItems['/inventory'] && (
                <div className="ml-10 mt-1 space-y-1">
                  <Link
                    href="/inventory"
                    className={`flex items-center px-3 py-1.5 text-sm rounded-md font-medium ${
                      isActive('/inventory') && !location.includes('/inventory/')
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                    }`}
                  >
                    <span className="material-icons text-sm mr-2">dashboard</span>
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    href="/inventory/products"
                    className={`flex items-center px-3 py-1.5 text-sm rounded-md font-medium ${
                      isActive('/inventory/products')
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                    }`}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    <span>Produse</span>
                  </Link>
                  <Link
                    href="/inventory/categories"
                    className={`flex items-center px-3 py-1.5 text-sm rounded-md font-medium ${
                      isActive('/inventory/categories')
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                    }`}
                  >
                    <Layers className="h-4 w-4 mr-2" />
                    <span>Categorii produse</span>
                  </Link>
                  <Link
                    href="/inventory/warehouses"
                    className={`flex items-center px-3 py-1.5 text-sm rounded-md font-medium ${
                      isActive('/inventory/warehouses')
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                    }`}
                  >
                    <Store className="h-4 w-4 mr-2" />
                    <span>Gestiuni</span>
                  </Link>
                  <Link
                    href="/inventory/stock-levels"
                    className={`flex items-center px-3 py-1.5 text-sm rounded-md font-medium ${
                      isActive('/inventory/stock-levels')
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                    }`}
                  >
                    <BoxesIcon className="h-4 w-4 mr-2" />
                    <span>Stocuri</span>
                  </Link>
                  <Link
                    href="/inventory/nir"
                    className={`flex items-center px-3 py-1.5 text-sm rounded-md font-medium ${
                      isActive('/inventory/nir')
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                    }`}
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    <span>NIR</span>
                  </Link>
                  <Link
                    href="/inventory/transfers"
                    className={`flex items-center px-3 py-1.5 text-sm rounded-md font-medium ${
                      isActive('/inventory/transfers')
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                    }`}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    <span>Transferuri</span>
                  </Link>
                  <Link
                    href="/inventory/reports"
                    className={`flex items-center px-3 py-1.5 text-sm rounded-md font-medium ${
                      isActive('/inventory/reports')
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                    }`}
                  >
                    <BarChart className="h-4 w-4 mr-2" />
                    <span>Rapoarte</span>
                  </Link>
                </div>
              )}
            </div>
            
            {/* Invoicing (Facturare) with collapsible subitems */}
            <div className="mb-1">
              <div 
                className={`flex items-center justify-between px-3 py-2 rounded-md font-medium cursor-pointer ${
                  isActive('/invoicing') 
                    ? 'text-primary bg-primary/10' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                }`}
                onClick={() => toggleExpand("/invoicing")}
              >
                <div className="flex items-center">
                  <span className="material-icons mr-3">receipt_long</span>
                  <span>Facturare</span>
                </div>
                <div className="text-gray-500">
                  {expandedItems['/invoicing'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>
              
              {/* Subitems for Invoicing */}
              {expandedItems['/invoicing'] && (
                <div className="ml-10 mt-1 space-y-1">
                  <Link
                    href="/invoicing"
                    className={`flex items-center px-3 py-1.5 text-sm rounded-md font-medium ${
                      isActive('/invoicing') && !location.includes('/invoicing/')
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                    }`}
                  >
                    <span className="material-icons text-sm mr-2">dashboard</span>
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    href="/invoicing/invoices"
                    className={`flex items-center px-3 py-1.5 text-sm rounded-md font-medium ${
                      isActive('/invoicing/invoices')
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                    }`}
                  >
                    <span className="material-icons text-sm mr-2">description</span>
                    <span>Facturi</span>
                  </Link>
                  <Link
                    href="/invoicing/customers"
                    className={`flex items-center px-3 py-1.5 text-sm rounded-md font-medium ${
                      isActive('/invoicing/customers')
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                    }`}
                  >
                    <span className="material-icons text-sm mr-2">people</span>
                    <span>Clienți</span>
                  </Link>
                  <Link
                    href="/invoicing/templates"
                    className={`flex items-center px-3 py-1.5 text-sm rounded-md font-medium ${
                      isActive('/invoicing/templates')
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                    }`}
                  >
                    <span className="material-icons text-sm mr-2">article</span>
                    <span>Șabloane</span>
                  </Link>
                  <Link
                    href="/invoicing/recurring"
                    className={`flex items-center px-3 py-1.5 text-sm rounded-md font-medium ${
                      isActive('/invoicing/recurring')
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                    }`}
                  >
                    <span className="material-icons text-sm mr-2">replay</span>
                    <span>Recurente</span>
                  </Link>
                  <Link
                    href="/invoicing/reports"
                    className={`flex items-center px-3 py-1.5 text-sm rounded-md font-medium ${
                      isActive('/invoicing/reports')
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                    }`}
                  >
                    <span className="material-icons text-sm mr-2">analytics</span>
                    <span>Rapoarte</span>
                  </Link>
                  <Link
                    href="/invoicing/settings"
                    className={`flex items-center px-3 py-1.5 text-sm rounded-md font-medium ${
                      isActive('/invoicing/settings')
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                    }`}
                  >
                    <span className="material-icons text-sm mr-2">settings</span>
                    <span>Setări</span>
                  </Link>
                </div>
              )}
            </div>
            
            {/* Collaboration with collapsible subitems */}
            <div className="mb-1">
              <div 
                className={`flex items-center justify-between px-3 py-2 rounded-md font-medium cursor-pointer ${
                  isActive('/collab') 
                    ? 'text-primary bg-primary/10' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                }`}
                onClick={() => toggleExpand("/collab")}
              >
                <div className="flex items-center">
                  <span className="material-icons mr-3">group_work</span>
                  <span>Colaborare</span>
                </div>
                <div className="text-gray-500">
                  {expandedItems['/collab'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>
              
              {/* Subitems for Collaboration */}
              {expandedItems['/collab'] && (
                <div className="ml-10 mt-1 space-y-1">
                  {collabSubitems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`flex items-center px-3 py-1.5 text-sm rounded-md font-medium ${
                        isActive(item.path)
                          ? 'text-primary bg-primary/10'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                      }`}
                    >
                      <span className="material-icons text-sm mr-2">{item.icon}</span>
                      <span>{item.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            
            {/* E-commerce with collapsible subitems */}
            <div className="mb-1">
              <div 
                className={`flex items-center justify-between px-3 py-2 rounded-md font-medium cursor-pointer ${
                  isActive('/ecommerce') 
                    ? 'text-primary bg-primary/10' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                }`}
                onClick={() => toggleExpand("/ecommerce")}
              >
                <div className="flex items-center">
                  <span className="material-icons mr-3">shopping_cart</span>
                  <span>OnlineShop</span>
                </div>
                <div className="text-gray-500">
                  {expandedItems['/ecommerce'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>
              
              {/* Subitems for E-commerce */}
              {expandedItems['/ecommerce'] && (
                <div className="ml-10 mt-1 space-y-1">
                  {ecommerceSubitems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`flex items-center px-3 py-1.5 text-sm rounded-md font-medium ${
                        isActive(item.path)
                          ? 'text-primary bg-primary/10'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                      }`}
                    >
                      <span className="material-icons text-sm mr-2">{item.icon}</span>
                      <span>{item.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            
            {/* Sales (Vanzari) with collapsible subitems */}
            <div className="mb-1">
              <div 
                className={`flex items-center justify-between px-3 py-2 rounded-md font-medium cursor-pointer ${
                  isActive('/sales') 
                    ? 'text-primary bg-primary/10' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                }`}
                onClick={() => toggleExpand("/sales")}
              >
                <div className="flex items-center">
                  <span className="material-icons mr-3">point_of_sale</span>
                  <span>Vânzări</span>
                </div>
                <div className="text-gray-500">
                  {expandedItems['/sales'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>
              
              {/* Subitems for Sales */}
              {expandedItems['/sales'] && (
                <div className="ml-10 mt-1 space-y-1">
                  {salesSubitems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`flex items-center px-3 py-1.5 text-sm rounded-md font-medium ${
                        isActive(item.path)
                          ? 'text-primary bg-primary/10'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                      }`}
                    >
                      <span className="material-icons text-sm mr-2">{item.icon}</span>
                      <span>{item.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            
            {/* CRM with collapsible subitems */}
            <div className="mb-1">
              <div 
                className={`flex items-center justify-between px-3 py-2 rounded-md font-medium cursor-pointer ${
                  isActive('/crm') 
                    ? 'text-primary bg-primary/10' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                }`}
                onClick={() => toggleExpand("/crm")}
              >
                <div className="flex items-center">
                  <span className="material-icons mr-3">people</span>
                  <span>Parteneri</span>
                </div>
                <div className="text-gray-500">
                  {expandedItems['/crm'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>
              
              {/* Subitems for CRM */}
              {expandedItems['/crm'] && (
                <div className="ml-10 mt-1 space-y-1">
                  <Link
                    href="/crm"
                    className={`flex items-center px-3 py-1.5 text-sm rounded-md font-medium ${
                      isActive('/crm') && !isActive('/crm/customers') && !isActive('/crm/contacts') && !isActive('/crm/deals') && !isActive('/crm/pipelines') && !isActive('/crm/activities')
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                    }`}
                  >
                    <span className="material-icons text-sm mr-2">dashboard</span>
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    href="/crm/customers"
                    className={`flex items-center px-3 py-1.5 text-sm rounded-md font-medium ${
                      isActive('/crm/customers')
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                    }`}
                  >
                    <span className="material-icons text-sm mr-2">business</span>
                    <span>Companii</span>
                  </Link>
                  <Link
                    href="/crm/contacts"
                    className={`flex items-center px-3 py-1.5 text-sm rounded-md font-medium ${
                      isActive('/crm/contacts')
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                    }`}
                  >
                    <span className="material-icons text-sm mr-2">contacts</span>
                    <span>Contacte</span>
                  </Link>
                  <Link
                    href="/crm/deals"
                    className={`flex items-center px-3 py-1.5 text-sm rounded-md font-medium ${
                      isActive('/crm/deals')
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                    }`}
                  >
                    <span className="material-icons text-sm mr-2">trending_up</span>
                    <span>Oportunități</span>
                  </Link>
                  <Link
                    href="/crm/pipelines"
                    className={`flex items-center px-3 py-1.5 text-sm rounded-md font-medium ${
                      isActive('/crm/pipelines')
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                    }`}
                  >
                    <span className="material-icons text-sm mr-2">assessment</span>
                    <span>Pipeline</span>
                  </Link>
                  <Link
                    href="/crm/activities"
                    className={`flex items-center px-3 py-1.5 text-sm rounded-md font-medium ${
                      isActive('/crm/activities')
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                    }`}
                  >
                    <span className="material-icons text-sm mr-2">event</span>
                    <span>Activități</span>
                  </Link>
                </div>
              )}
            </div>
            
            {/* Analytics with collapsible subitems */}
            <div className="mb-1">
              <div 
                className={`flex items-center justify-between px-3 py-2 rounded-md font-medium cursor-pointer ${
                  isActive('/analytics') 
                    ? 'text-primary bg-primary/10' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                }`}
                onClick={() => toggleExpand("/analytics")}
              >
                <div className="flex items-center">
                  <span className="material-icons mr-3">assessment</span>
                  <span>Rapoarte</span>
                </div>
                <div className="text-gray-500">
                  {expandedItems['/analytics'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>
              
              {/* Subitems for Analytics */}
              {expandedItems['/analytics'] && (
                <div className="ml-10 mt-1 space-y-1">
                  {analyticsSubitems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`flex items-center px-3 py-1.5 text-sm rounded-md font-medium ${
                        isActive(item.path)
                          ? 'text-primary bg-primary/10'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                      }`}
                    >
                      <span className="material-icons text-sm mr-2">{item.icon}</span>
                      <span>{item.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            
            {/* Documents with collapsible subitems */}
            <div className="mb-1">
              <div 
                className={`flex items-center justify-between px-3 py-2 rounded-md font-medium cursor-pointer ${
                  isActive('/documents') 
                    ? 'text-primary bg-primary/10' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                }`}
                onClick={() => toggleExpand("/documents")}
              >
                <div className="flex items-center">
                  <span className="material-icons mr-3">folder_copy</span>
                  <span>Registratura & Arhiva</span>
                </div>
                <div className="text-gray-500">
                  {expandedItems['/documents'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>
              
              {/* Subitems for Documents */}
              {expandedItems['/documents'] && (
                <div className="ml-10 mt-1 space-y-1">
                  {documentsSubitems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`flex items-center px-3 py-1.5 text-sm rounded-md font-medium ${
                        isActive(item.path)
                          ? 'text-primary bg-primary/10'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                      }`}
                    >
                      <span className="material-icons text-sm mr-2">{item.icon}</span>
                      <span>{item.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
            
            {/* BPM with collapsible subitems */}
            <div className="mb-1">
              <div 
                className={`flex items-center justify-between px-3 py-2 rounded-md font-medium cursor-pointer ${
                  isActive('/bpm') 
                    ? 'text-primary bg-primary/10' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                }`}
                onClick={() => toggleExpand("/bpm")}
              >
                <div className="flex items-center">
                  <span className="material-icons mr-3">auto_fix_high</span>
                  <span>Automatizări</span>
                </div>
                <div className="text-gray-500">
                  {expandedItems['/bpm'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>
              
              {/* Subitems for BPM */}
              {expandedItems['/bpm'] && (
                <div className="ml-10 mt-1 space-y-1">
                  {bpmSubitems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      className={`flex items-center px-3 py-1.5 text-sm rounded-md font-medium ${
                        isActive(item.path)
                          ? 'text-primary bg-primary/10'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                      }`}
                    >
                      <span className="material-icons text-sm mr-2">{item.icon}</span>
                      <span>{item.title}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </li>
          
          <li className="px-3 py-2">
            <div className="text-xs font-semibold text-gray-500 uppercase px-3 mb-2 mt-4">Sistem</div>
            
            <Link href="/settings" className={`flex items-center px-3 py-2 rounded-md font-medium ${isActive('/settings') 
                ? 'text-primary bg-primary/10 border-r-2 border-primary' 
                : 'text-gray-700 hover:bg-gray-100 hover:text-primary'}`}>
              <span className="material-icons mr-3">settings</span>
              <span>Setări</span>
            </Link>
            
            {/* Admin with collapsible subitems */}
            <div className="mb-1">
              <div 
                className={`flex items-center justify-between px-3 py-2 rounded-md font-medium cursor-pointer ${
                  isActive('/admin') 
                    ? 'text-primary bg-primary/10' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                }`}
                onClick={() => toggleExpand("/admin")}
              >
                <div className="flex items-center">
                  <span className="material-icons mr-3">admin_panel_settings</span>
                  <span>Utilizatori & Roluri</span>
                </div>
                <div className="text-gray-500">
                  {expandedItems['/admin'] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </div>
              </div>
              
              {/* Subitems for Admin */}
              {expandedItems['/admin'] && (
                <div className="ml-10 mt-1 space-y-1">
                  <Link
                    href="/admin/users"
                    className={`flex items-center px-3 py-1.5 text-sm rounded-md font-medium ${
                      isActive('/admin/users')
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                    }`}
                  >
                    <span className="material-icons text-sm mr-2">people</span>
                    <span>Utilizatori</span>
                  </Link>
                  <Link
                    href="/admin/roles"
                    className={`flex items-center px-3 py-1.5 text-sm rounded-md font-medium ${
                      isActive('/admin/roles')
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                    }`}
                  >
                    <span className="material-icons text-sm mr-2">verified_user</span>
                    <span>Roluri</span>
                  </Link>
                  <Link
                    href="/admin/permissions"
                    className={`flex items-center px-3 py-1.5 text-sm rounded-md font-medium ${
                      isActive('/admin/permissions')
                        ? 'text-primary bg-primary/10'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-primary'
                    }`}
                  >
                    <span className="material-icons text-sm mr-2">security</span>
                    <span>Permisiuni</span>
                  </Link>
                </div>
              )}
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}