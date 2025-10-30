import React from 'react';
import { Link, useLocation } from 'wouter';
import {
  CheckSquare,
  MessageSquare, 
  Users, 
  FileText, 
  Calendar,
  BarChart3, 
  Settings, 
  ChevronRight,
  MessageCircle,
  BookOpen,
  Lightbulb,
  VideoIcon,
  LinkIcon,
  HelpCircle
} from 'lucide-react';

interface CollabLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  activeTab: string;
}

/**
 * Layout Component pentru modulul de colaborare
 * 
 * Oferă un layout consistent cu navigare pentru toate paginile modulului
 */
const CollabLayout: React.FC<CollabLayoutProps> = ({ 
  children, 
  title, 
  subtitle,
  activeTab 
}) => {
  const [location] = useLocation();
  
  // Elementele de navigare principale
  const navItems = [
    { id: 'overview', label: 'Tablou general', path: '/collab', icon: <BarChart3 size={20} /> },
    { id: 'tasks', label: 'Sarcini', path: '/collab/tasks', icon: <CheckSquare size={20} /> },
    { id: 'notes', label: 'Notițe', path: '/collab/notes', icon: <FileText size={20} /> },
    { id: 'threads', label: 'Discuții', path: '/collab/threads', icon: <MessageSquare size={20} /> },
    { id: 'community', label: 'Comunitate', path: '/collab/community', icon: <Users size={20} /> },
    { id: 'settings', label: 'Setări', path: '/collab/settings', icon: <Settings size={20} /> }
  ];
  
  // Elementele de navigare pentru comunitate
  const communityNavItems = [
    { id: 'community-general', label: 'General', path: '/collab/community', icon: <MessageCircle size={20} /> },
    { id: 'community-announcements', label: 'Anunțuri', path: '/collab/community/announcements', icon: <MessageSquare size={20} /> },
    { id: 'community-questions', label: 'Întrebări', path: '/collab/community/questions', icon: <HelpCircle size={20} /> },
    { id: 'community-ideas', label: 'Idei', path: '/collab/community/ideas', icon: <Lightbulb size={20} /> },
    { id: 'community-events', label: 'Evenimente', path: '/collab/community/events', icon: <Calendar size={20} /> },
    { id: 'community-resources', label: 'Resurse', path: '/collab/community/resources', icon: <BookOpen size={20} /> },
    { id: 'community-tutorials', label: 'Tutoriale', path: '/collab/community/tutorials', icon: <VideoIcon size={20} /> }
  ];
  
  // Determină ce elemente de navigare să afișeze
  const isInCommunity = location.startsWith('/collab/community');
  const tabItems = isInCommunity ? communityNavItems : navItems;
  
  // Generează breadcrumb-uri
  const generateBreadcrumbs = () => {
    const pathParts = location.split('/').filter(Boolean);
    
    // Dacă suntem la rădăcina modulului de colaborare
    if (pathParts.length === 1 && pathParts[0] === 'collab') {
      return [
        { label: 'Acasă', path: '/' },
        { label: 'Colaborare', path: '/collab' }
      ];
    }
    
    const breadcrumbs = [
      { label: 'Acasă', path: '/' },
      { label: 'Colaborare', path: '/collab' }
    ];
    
    // Adaugă pagina curentă la breadcrumb
    if (pathParts.length > 1 && pathParts[0] === 'collab') {
      // Verifică dacă suntem în secțiunea Comunitate
      if (pathParts[1] === 'community') {
        breadcrumbs.push({
          label: 'Comunitate',
          path: '/collab/community'
        });
        
        // Adaugă subsecțiunea din comunitate, dacă există
        if (pathParts.length > 2) {
          const communityItem = communityNavItems.find(item => 
            item.path === `/${pathParts[0]}/${pathParts[1]}/${pathParts[2]}`);
          
          if (communityItem) {
            breadcrumbs.push({
              label: communityItem.label,
              path: communityItem.path
            });
          }
        }
      } else {
        // Pentru alte secțiuni din Colaborare
        const navItem = navItems.find(item => item.id === pathParts[1]);
        if (navItem) {
          breadcrumbs.push({
            label: navItem.label,
            path: navItem.path
          });
        }
      }
      
      // Adaugă subpaginile dacă există
      if (pathParts.length > 2 && pathParts[1] !== 'community') {
        if (pathParts[2] === 'new') {
          breadcrumbs.push({
            label: 'Adăugare nouă',
            path: `/${pathParts[0]}/${pathParts[1]}/${pathParts[2]}`
          });
        } else if (pathParts[2] && pathParts.length === 3) {
          breadcrumbs.push({
            label: 'Detalii',
            path: `/${pathParts[0]}/${pathParts[1]}/${pathParts[2]}`
          });
        } else if (pathParts[3] === 'edit') {
          breadcrumbs.push({
            label: 'Detalii',
            path: `/${pathParts[0]}/${pathParts[1]}/${pathParts[2]}`
          });
          breadcrumbs.push({
            label: 'Editare',
            path: `/${pathParts[0]}/${pathParts[1]}/${pathParts[2]}/${pathParts[3]}`
          });
        }
      }
    }
    
    return breadcrumbs;
  };
  
  const breadcrumbs = generateBreadcrumbs();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col space-y-2">
            {/* Breadcrumbs */}
            <nav className="flex text-sm text-muted-foreground">
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center">
                  {index > 0 && <ChevronRight className="mx-1 h-4 w-4" />}
                  <Link 
                    href={crumb.path}
                    className={`hover:text-primary ${index === breadcrumbs.length - 1 ? 'font-medium text-foreground' : ''}`}
                  >
                    {crumb.label}
                  </Link>
                </div>
              ))}
            </nav>
            
            {/* Titlul paginii */}
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
            </div>
            
            {/* Navigare orizontală */}
            <div className="flex space-x-1 pt-4 border-b overflow-x-auto pb-1">
              {tabItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.path}
                  className={`px-3 py-2 rounded-t-md text-sm font-medium flex items-center whitespace-nowrap
                    ${activeTab === item.id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-primary hover:bg-muted'
                    }
                  `}
                >
                  {item.icon && <span className="mr-2">{item.icon}</span>}
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </header>
      
      {/* Conținut principal */}
      <main className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  );
};

export default CollabLayout;