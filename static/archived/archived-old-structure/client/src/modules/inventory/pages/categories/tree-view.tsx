/**
 * Category Tree View Component
 * 
 * Displays product categories in a hierarchical tree structure.
 * Supports expanding/collapsing nodes and contextual actions.
 */

import React, { useState } from "react";
import { ProductCategory } from "../../types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronRight, 
  ChevronDown, 
  FolderClosed, 
  FolderOpen, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  CheckCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Define extended type with children for tree structure
interface CategoryTreeItem extends ProductCategory {
  children: CategoryTreeItem[];
}

interface TreeViewProps {
  data: CategoryTreeItem[];
  onEdit: (category: ProductCategory) => void;
  onDeactivate: (id: string) => void;
}

interface TreeNodeProps {
  item: CategoryTreeItem;
  level: number;
  onEdit: (category: ProductCategory) => void;
  onDeactivate: (id: string) => void;
}

// Individual tree node component
const TreeNode: React.FC<TreeNodeProps> = ({ item, level, onEdit, onDeactivate }) => {
  const [expanded, setExpanded] = useState(level === 0); // Expand only root level by default
  const hasChildren = item.children && item.children.length > 0;
  
  return (
    <div className="select-none">
      <div 
        className={`flex items-center py-2 px-1 hover:bg-muted/50 rounded-md ${!item.isActive ? 'opacity-60' : ''}`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        <Button 
          variant="ghost" 
          size="icon" 
          className={`h-6 w-6 p-0 ${!hasChildren ? 'invisible' : ''}`}
          onClick={() => setExpanded(!expanded)}
        >
          {hasChildren && (expanded ? 
            <ChevronDown className="h-4 w-4" /> : 
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
        
        <div className="flex items-center flex-1 gap-2">
          {expanded && hasChildren ? 
            <FolderOpen className="h-4 w-4 text-amber-500" /> : 
            <FolderClosed className="h-4 w-4 text-amber-500" />
          }
          <span className="ml-1 text-sm font-medium">{item.name}</span>
          {!item.isActive && (
            <Badge variant="outline" className="text-xs">Inactivă</Badge>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(item)}>
              <Edit className="mr-2 h-4 w-4" />
              Editează
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDeactivate(item.id)}
              className={item.isActive ? "text-destructive" : "text-green-600"}
            >
              {item.isActive ? (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Dezactivează
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Activează
                </>
              )}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Render children recursively if expanded */}
      {expanded && hasChildren && (
        <div className="ml-2">
          {item.children.map((child) => (
            <TreeNode 
              key={child.id} 
              item={child} 
              level={level + 1} 
              onEdit={onEdit}
              onDeactivate={onDeactivate}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Main TreeView component
export const TreeView: React.FC<TreeViewProps> = ({ data, onEdit, onDeactivate }) => {
  return (
    <div className="tree-view">
      {data.map((item) => (
        <TreeNode 
          key={item.id} 
          item={item} 
          level={0}
          onEdit={onEdit}
          onDeactivate={onDeactivate}
        />
      ))}
    </div>
  );
};