import React from 'react';
import { BarChart3, Target, Plus, TrendingUp, Menu, X, UserPlus, LogOut, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from "react-router-dom";
import { useUserContext } from "../utils/UserContext";

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

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/' },
  { id: 'settargets', label: 'Set Targets', icon: Target, path: '/targets' },
  { id: 'actuals', label: 'Weekly Reporting', icon: Plus, path: '/actuals' },
  { id: 'compare', label: 'Target Vs Actual', icon: TrendingUp, path: '/compare' },
  { id: 'leads', label: 'Lead Sheet', icon: Users, path: '/leads' },
];

export const Sidebar = ({ isCollapsed, onToggleCollapse, onLogout }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUserContext();
  const userWithRole = user as UserWithRole | null;
  const isAdmin = userWithRole && (userWithRole.role === 'ADMIN'); // Placeholder admin check
  return (
    <div className={cn(
      "bg-sidebar text-sidebar-foreground transition-all duration-300 flex flex-col",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-sidebar-primary">
              RevenuePRO AI
            </h1>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors"
          >
            {isCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map(({ id, label, icon: Icon, path }) => (
            <button
              key={id}
              onClick={() => navigate(path)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
                "hover:bg-slate-800",
                location.pathname === path 
                  ? "bg-blue-600 shadow-md" 
                  : "text-slate-300"
              )}
            >
              <Icon size={20} />
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
                "hover:bg-slate-800",
                location.pathname === '/create-user'
                  ? "bg-blue-600 shadow-md"
                  : "text-slate-300"
              )}
            >
              <UserPlus size={20} />
              {!isCollapsed && (
                <span className="font-medium">Create User</span>
              )}
            </button>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={onLogout}
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
            "hover:bg-slate-800",
            "text-red-400"
          )}
        >
          <LogOut size={20} />
          {!isCollapsed && (
            <span className="font-medium">Logout</span>
          )}
        </button>
        <div className={cn(
          "text-xs text-slate-400 mt-2",
          isCollapsed ? "text-center" : ""
        )}>
          {isCollapsed ? "v1.0" : "RevenuePRO AI v1.0"}
        </div>
      </div>
    </div>
  );
};
