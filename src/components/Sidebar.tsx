import React from 'react';
import { BarChart3, Target, Plus, TrendingUp, Menu, X, UserPlus, LogOut, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from "react-router-dom";
import { useUserContext } from "../utils/UserContext";
import UserSelect from './UserSelect';
import { menuItems } from '@/utils/constant';
import { useUserStore } from '@/stores/userStore';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
}

interface UserWithRole {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}


export const Sidebar = ({ isCollapsed, onToggleCollapse, onLogout }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUserContext();
  const userWithRole = user as UserWithRole | null;
  const isAdmin = userWithRole && (userWithRole.role === 'ADMIN');
  
  return (
    <div className={cn(
      "bg-sidebar text-sidebar-foreground transition-all duration-300 flex flex-col",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-2 border-b border-sidebar-border">
        <div className={cn(
          "flex items-center py-2",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          {!isCollapsed && (
            <img src="/logo.png" alt="logo" className="w-[75%]" />
          )}
          <button
            onClick={onToggleCollapse}
            className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
          >
            {isCollapsed ? <Menu size={24} /> : <X size={20} />}
          </button>
        </div>
      </div>

      {/* User Select for Admin */}
      {isAdmin && location.pathname !== "/create-user" && (
        <div className={`p-2 border-b border-slate-700 ${isCollapsed ? "p-0" : "px-2 py-4"}`}>
          <UserSelect isCollapsed={isCollapsed} />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <div className="space-y-2">
          {menuItems.map(({ id, label, icon: Icon, path }) => (
            <button
              key={id}
              onClick={() => navigate(path)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
                "hover:bg-sidebar-accent",
                location.pathname === path 
                  ? "bg-gradient-accent shadow-md" 
                  : "text-sidebar-foreground"
              )}
            >
              <Icon size={isCollapsed ? 24 : 20} />
              {!isCollapsed && (
                <span className="font-medium">{label}</span>
              )}
            </button>
          ))}
          {/* Admin Section */}
          {isAdmin && (
            <button
              onClick={() => navigate('/create-user')}
                          className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
              "hover:bg-sidebar-accent",
              location.pathname === '/create-user'
                ? "bg-gradient-accent shadow-md"
                : "text-sidebar-foreground"
            )}
            >
              <UserPlus size={isCollapsed ? 24 : 20} />
              {!isCollapsed && (
                <span className="font-medium">Create User</span>
              )}
            </button>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-slate-700">
        <button
          onClick={onLogout}
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
            "hover:bg-slate-800",
            "text-red-400"
          )}
        >
          <LogOut size={isCollapsed ? 24 : 20} />
          {!isCollapsed && (
            <span className="font-medium">Logout</span>
          )}
        </button>
      </div>
    </div>
  );
};
