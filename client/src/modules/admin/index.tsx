/**
 * Admin Module
 * 
 * Main module for system administration and user management in the ERP system.
 * Includes user management, role management, and permissions management.
 */

import React from "react";
import { useRoute, Switch, Route } from "wouter";
import UsersPage from "./pages/UsersPage";
import NewUserPage from "./pages/NewUserPage";
import EditUserPage from "./pages/EditUserPage";
import RolesPage from "./pages/RolesPage";
import NewRolePage from "./pages/NewRolePage";
import EditRolePage from "./pages/EditRolePage";
import PermissionsPage from "./pages/PermissionsPage";
import CollabIntegration from "../collab/components/CollabIntegration";
import AppLayout from "@/components/layout/AppLayout";

export default function AdminRoutes() {
  // Definim rute specifice pentru fiecare pattern posibil
  const [matchUsersEdit] = useRoute("/admin/users/:id/edit");
  const [matchUsersNew] = useRoute("/admin/users/new");
  const [matchUsers] = useRoute("/admin/users");
  const [matchRolesEdit] = useRoute("/admin/roles/:id/edit");
  const [matchRolesNew] = useRoute("/admin/roles/new");
  const [matchRoles] = useRoute("/admin/roles");
  const [matchPermissions] = useRoute("/admin/permissions");
  
  // Wrapper function to include collaboration integration
  const withCollabIntegration = (Component: React.ComponentType) => {
    return (
      <AppLayout>
        <div className="container mx-auto py-4">
          <Component />
          
          {/* Integrare cu modulul de colaborare */}
          <CollabIntegration 
            moduleContext="Admin" 
            enableTasks={true} 
            enableCommunity={true} 
          />
        </div>
      </AppLayout>
    );
  };
  
  // Verifică pattern-ul URL-ului și returnează componenta potrivită
  if (matchUsersEdit) return withCollabIntegration(EditUserPage);
  if (matchUsersNew) return withCollabIntegration(NewUserPage);
  if (matchUsers) return withCollabIntegration(UsersPage);
  if (matchRolesEdit) return withCollabIntegration(EditRolePage);
  if (matchRolesNew) return withCollabIntegration(NewRolePage);
  if (matchRoles) return withCollabIntegration(RolesPage);
  if (matchPermissions) return withCollabIntegration(PermissionsPage);
  
  // Default: pagina de utilizatori ca dashboard admin
  return withCollabIntegration(UsersPage);
}