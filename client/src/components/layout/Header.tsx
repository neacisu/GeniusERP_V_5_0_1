import React from "react";
import { useAuth } from "@/hooks/use-auth";
import { Logo } from "@/components/ui/logo";

type HeaderProps = {
  toggleSidebar: () => void;
};

export default function Header({ toggleSidebar }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getUserInitials = () => {
    if (!user) return "U";
    return `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`;
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <button 
            className="p-2 rounded-full hover:bg-gray-100 md:hidden"
            onClick={toggleSidebar}
          >
            <span className="material-icons">menu</span>
          </button>
          <div className="ml-2 flex items-center">
            <Logo size="sm" className="md:hidden" />
            <div className="ml-4 relative">
              <div className="flex items-center border rounded-md px-3 py-1.5 bg-gray-50 w-64">
                <span className="material-icons text-gray-500 mr-2">search</span>
                <input 
                  type="text" 
                  placeholder="Căutare..." 
                  className="bg-transparent border-none outline-none w-full text-sm" 
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button className="p-1.5 rounded-full hover:bg-gray-100 relative">
            <span className="material-icons">notifications</span>
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <button className="p-1.5 rounded-full hover:bg-gray-100">
            <span className="material-icons">settings</span>
          </button>
          
          <div className="flex items-center ml-4">
            <div className="w-9 h-9 rounded-full bg-primary-light flex items-center justify-center text-white font-medium">
              {getUserInitials()}
            </div>
            <div className="ml-2 hidden md:block">
              <div className="text-sm font-medium text-gray-900">
                {user ? `${user.firstName} ${user.lastName}` : 'User'}
              </div>
              <div className="text-xs text-gray-500">{user?.role || 'User'}</div>
            </div>
            <button 
              onClick={handleLogout}
              className="ml-2 p-1.5 rounded-full hover:bg-gray-100"
              title="Logout"
            >
              <span className="material-icons text-gray-600">logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
