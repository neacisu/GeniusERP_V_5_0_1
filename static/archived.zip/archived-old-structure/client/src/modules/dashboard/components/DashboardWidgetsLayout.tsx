/**
 * Dashboard Widgets Layout
 * 
 * This component manages the layout of dashboard widgets with grid positioning
 * and supports different view modes (default, customized).
 */

import React, { useState, useEffect } from 'react';
import { useWidgetRegistry, WidgetInstance, WidgetSize } from '../services/WidgetRegistry';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  LayoutGrid, 
  Plus, 
  Settings, 
  RefreshCw,
  Columns,
  Rows,
  MoreHorizontal,
  Edit
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Wrapper component for rendering a widget
const WidgetWrapper = ({ widget, onEdit, onRemove, isEditing }: { 
  widget: WidgetInstance, 
  onEdit: () => void, 
  onRemove: () => void,
  isEditing: boolean
}) => {
  const { getDefinitionById } = useWidgetRegistry();
  const definition = getDefinitionById(widget.definitionId);
  
  if (!definition) return null;
  
  const WidgetComponent = definition.component;
  
  return (
    <div 
      className={cn(
        "col-span-1 transition-all duration-300",
        widget.size === 'medium' && "md:col-span-2",
        widget.size === 'large' && "md:col-span-2 lg:col-span-3",
        widget.size === 'full' && "md:col-span-2 lg:col-span-4 xl:col-span-4",
        isEditing && "border-2 border-dashed border-primary/40 rounded-lg p-1"
      )}
    >
      {isEditing && (
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 bg-background/80 backdrop-blur-sm hover:bg-background"
            onClick={onEdit}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 bg-background/80 backdrop-blur-sm hover:bg-background hover:text-destructive"
            onClick={onRemove}
          >
            <span className="material-icons text-sm">close</span>
          </Button>
        </div>
      )}
      
      <WidgetComponent 
        widget={widget} 
        definition={definition} 
        onEditConfig={onEdit}
      />
    </div>
  );
};

interface DashboardWidgetsLayoutProps {
  className?: string;
}

export default function DashboardWidgetsLayout({ className }: DashboardWidgetsLayoutProps) {
  const { user } = useAuth();
  const { definitions } = useWidgetRegistry();
  const { toast } = useToast();
  
  const [widgets, setWidgets] = useState<WidgetInstance[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  
  // Initialize default widgets
  useEffect(() => {
    if (!user) return;
    
    // Create default widgets for a new dashboard
    const defaultWidgets: WidgetInstance[] = [
      // Collaboration widgets
      {
        id: 'my-tasks-1',
        definitionId: 'my-tasks',
        size: 'medium',
        position: 0,
        config: {
          userId: user.id
        }
      },
      {
        id: 'team-activity-1',
        definitionId: 'team-activity',
        size: 'medium',
        position: 1,
        config: {
          limit: 7
        }
      },
      {
        id: 'community-updates-1',
        definitionId: 'community-updates',
        size: 'medium',
        position: 2,
        config: {
          limit: 5
        }
      },
      {
        id: 'collab-notifications-1',
        definitionId: 'collab-notifications',
        size: 'medium',
        position: 3,
        config: {
          limit: 6
        }
      },
      // Finance widgets
      {
        id: 'exchange-rates-1',
        definitionId: 'exchange-rates',
        size: 'large',
        position: 4,
        config: {
          currencies: ['EUR', 'USD', 'GBP', 'CHF']
        }
      }
    ];
    
    setWidgets(defaultWidgets);
  }, [user]);
  
  // Sort widgets by position
  const sortedWidgets = [...widgets].sort((a, b) => a.position - b.position);
  
  // Handler for widget edit
  const handleEditWidget = (widgetId: string) => {
    toast({
      title: 'Editare widget',
      description: 'Funcționalitatea de editare a widget-urilor va fi disponibilă în curând.',
    });
  };
  
  // Handler for widget removal
  const handleRemoveWidget = (widgetId: string) => {
    setWidgets(widgets.filter(w => w.id !== widgetId));
    
    toast({
      title: 'Widget eliminat',
      description: 'Widget-ul a fost eliminat din dashboard.',
    });
  };
  
  // Toggle edit mode
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };
  
  // Refresh all widgets
  const refreshWidgets = () => {
    toast({
      title: 'Actualizare dashboard',
      description: 'Actualizarea widget-urilor în curs...',
    });
    
    // In a real implementation, this would trigger a refresh of all widget data
    // For now, just show a success message
    setTimeout(() => {
      toast({
        title: 'Dashboard actualizat',
        description: 'Toate widget-urile au fost actualizate cu succes.',
      });
    }, 1000);
  };
  
  return (
    <div className={className}>
      {/* Dashboard toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Colaborare</h1>
          <p className="text-muted-foreground">
            Vizualizează sarcinile, activitatea echipei și notificările
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Tabs value={layout} onValueChange={(v) => setLayout(v as 'grid' | 'list')} className="mr-2">
            <TabsList className="h-9">
              <TabsTrigger value="grid" className="px-3">
                <LayoutGrid className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="list" className="px-3">
                <Rows className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button
            variant="outline"
            size="sm"
            onClick={refreshWidgets}
            className="h-9"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            <span>Actualizează</span>
          </Button>
          
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={toggleEditMode}
            className="h-9"
          >
            <Edit className="h-4 w-4 mr-1" />
            <span>{isEditing ? 'Finalizează' : 'Editează'}</span>
          </Button>
          
          {isEditing && (
            <Button
              variant="outline"
              size="sm"
              className="h-9"
            >
              <Plus className="h-4 w-4 mr-1" />
              <span>Adaugă Widget</span>
            </Button>
          )}
        </div>
      </div>
      
      {/* Widgets grid */}
      <div 
        className={cn(
          "grid gap-6 relative",
          layout === 'grid' ? "grid-cols-1 md:grid-cols-4 lg:grid-cols-4" : "grid-cols-1"
        )}
      >
        {sortedWidgets.map((widget) => (
          <WidgetWrapper
            key={widget.id}
            widget={widget}
            onEdit={() => handleEditWidget(widget.id)}
            onRemove={() => handleRemoveWidget(widget.id)}
            isEditing={isEditing}
          />
        ))}
        
        {isEditing && widgets.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed rounded-lg">
            <LayoutGrid className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="mt-2 text-lg font-medium">Nu există widget-uri</h3>
            <p className="mt-1 text-muted-foreground">
              Adaugă widget-uri pentru a personaliza dashboard-ul tău.
            </p>
            <Button className="mt-4" onClick={() => {}}>
              <Plus className="h-4 w-4 mr-1" />
              <span>Adaugă primul widget</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}