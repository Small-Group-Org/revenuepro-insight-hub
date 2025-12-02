import {  Menu, X, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from "react-router-dom";
import { useUserContext } from "../../utils/UserContext";
import UserSelect from '../UserSelect';
import { API_URL, userRoutes } from '@/utils/constant';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTicketStore } from '@/stores/ticketStore';
import { updateLastAccess } from '@/service/userService';
import { useUserStore } from '@/stores/userStore';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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
  const { tickets, fetchTickets } = useTicketStore();
  const { isAdminView, setIsAdminView } = useUserStore();
  
  // Notification states
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [statusIndicator, setStatusIndicator] = useState<string | null>(null);
  const [hasCheckedNotifications, setHasCheckedNotifications] = useState<boolean>(false);

  const isDev = (() => {
    const url = API_URL?.trim() || '';
    return url.includes('localhost') || url.includes('127.0.0.1') || url.includes('dev-revenue-pro-backend');
  })();
  const initials = (() => {
    const full = (user?.name || '').trim();
    if (!full) return 'U';
    const parts = full.split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] ?? '' : '';
    const value = (first + last).toUpperCase();
    return value || (first || 'U').toUpperCase();
  })();

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    // navigate('/');
  }, [isAdminView])

  const { newTicketsCount, newTicketsStatus } = useMemo(() => {
    if (!(user as any)?.lastAccessAt || hasCheckedNotifications) {
      return { newTicketsCount: 0, newTicketsStatus: null };
    }

    const lastAccessTime = new Date((user as any).lastAccessAt);
    const newTickets = tickets.filter(ticket => {
      const ticketTime = new Date(ticket.createdAt);
      return ticketTime > lastAccessTime;
    });

    if (isAdmin) {
      return { newTicketsCount: newTickets.length, newTicketsStatus: null };
    } else {
      // For non-admin users, get the status of their new tickets
      const userNewTickets = newTickets.filter(ticket => ticket.userId._id === user?._id);
      const statuses = userNewTickets.map(ticket => ticket.status);
      const mostRecentStatus = statuses[statuses.length - 1] || null;
      return { newTicketsCount: 0, newTicketsStatus: mostRecentStatus };
    }
  }, [(user as any)?.lastAccessAt, tickets, isAdmin, user?._id, hasCheckedNotifications]);

  useEffect(() => {
    if (isAdmin) {
      setNotificationCount(newTicketsCount);
    } else {
      setStatusIndicator(newTicketsStatus);
    }
  }, [newTicketsCount, newTicketsStatus, isAdmin]);

  const handleProfileClick = useCallback(async () => {
    try {
      await updateLastAccess();
      setHasCheckedNotifications(true);
      setNotificationCount(0);
      setStatusIndicator(null);
      navigate('/profile');
    } catch (error) {
      console.error("Error updating last access:", error);
      navigate('/profile');
    }
  }, [user, navigate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-orange-500';
      case 'in_progress':
        return 'bg-gray-400';
      case 'closed':
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div className={cn(
      "bg-sidebar text-sidebar-foreground transition-all duration-300 flex flex-col relative",
      isCollapsed ? "w-16" : "w-64"
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

      {/* Admin View Toggle */}
      {/* {isAdmin && (
        <div className={cn("px-2 border-t border-slate-700", isCollapsed && "px-1")}>
          <div className={cn(
            "flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
            isCollapsed && "justify-center"
          )}>
            <Switch
              id="admin-view"
              checked={isAdminView}
              onCheckedChange={setIsAdminView}
              className={cn(
                "flex-shrink-0",
                "data-[state=checked]:bg-white data-[state=unchecked]:bg-white",
                "[&>span]:!bg-primary"
              )}
            />
            {!isCollapsed && (
              <Label htmlFor="admin-view" className="cursor-pointer font-medium text-sm">
                Admin View
              </Label>
            )}
          </div>
        </div>
      )} */}

      {/* Footer - User Section */}
      {/* <div className="p-2 border-t border-slate-700">
        <button
          onClick={handleProfileClick}
          className={cn(
            "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
            "hover:bg-sidebar-accent relative"
          )}
        >
          <div className="relative">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-[11px] font-semibold bg-red-500">
                {initials}
              </AvatarFallback>
            </Avatar>
            {isAdmin && notificationCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-lg">
                {notificationCount}
              </div>
            )}
            {!isAdmin && statusIndicator && (
              <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-sidebar shadow-lg ${getStatusColor(statusIndicator)}`}></div>
            )}
          </div>
          {!isCollapsed && (
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col text-left">
                <span className="text-sm font-medium leading-tight">{user?.name || 'User'}</span>
                <span className="text-xs text-gray-400 leading-tight capitalize">{user?.role.toLowerCase()}</span>
              </div>
            </div>
          )}
        </button>
      </div> */}
    </div>
  );
};
