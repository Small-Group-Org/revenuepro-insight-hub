import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from "react-router-dom";
import { useUserContext } from "../../utils/UserContext";
import UserSelect from '@/components/layout/UserSelect';
import { API_URL, userRoutes } from '@/utils/constant';

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

  const isDev = (() => {
    const url = API_URL?.trim() || '';
    return url.includes('localhost') || url.includes('127.0.0.1') || url.includes('dev-revenue-pro-backend');
  })();

  return (
    <div className={cn(
      "bg-sidebar text-sidebar-foreground transition-all duration-300 flex flex-col relative",
      isCollapsed ? "w-16" : "w-60"
    )}>
      {/* Header */}
      <div className="p-2 border-b border-sidebar-border">
        <div className={cn(
          "flex items-center py-1",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          {!isCollapsed && (
            <img src="/logo.png" alt="logo" className="w-[65%]" />
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
      {isAdmin && location.pathname !== "/user-management" && location.pathname !== "/global-dashboard" && (
        <div className={`p-2 border-b border-slate-700 ${isCollapsed ? "p-0" : "px-2 py-4"}`}>
          <UserSelect isCollapsed={isCollapsed} />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <div className="space-y-2">
          {userRoutes.map(({ id, label, icon: Icon, path }) => (
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
        </div>
      </nav>

      {isDev && !isCollapsed && (
        <div
          className={cn(
            "absolute bottom-[24px] right-[6px] left-[6px]",
          )}
        >
          <div
            className={cn(
              "w-full rounded-md border text-xs font-semibold tracking-wide",
              "px-2 py-1 flex items-center justify-center",
              "bg-yellow-500/15 border-yellow-500 text-yellow-300 shadow-sm"
            )}
          >
            DEV Mode
          </div>
        </div>
      )}

    </div>
  );
};
