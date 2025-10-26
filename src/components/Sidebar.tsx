import {  Menu, X, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from "react-router-dom";
import { useUserContext } from "../utils/UserContext";
import UserSelect from './UserSelect';
import { menuItems, API_URL } from '@/utils/constant';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTicketStore } from '@/stores/ticketStore';
import { updateLastAccess } from '@/service/userService';

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

  // Fetch tickets on component mount
  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Calculate notifications and status indicators based on lastAccessAt
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

  // Update notification states
  useEffect(() => {
    if (isAdmin) {
      setNotificationCount(newTicketsCount);
    } else {
      setStatusIndicator(newTicketsStatus);
    }
  }, [newTicketsCount, newTicketsStatus, isAdmin]);

  // Handle profile click - update last access and clear notifications
  const handleProfileClick = useCallback(async () => {
    try {
      await updateLastAccess();
      setHasCheckedNotifications(true);
      setNotificationCount(0);
      setStatusIndicator(null);
      
      // Navigate to profile page
      navigate('/profile');
    } catch (error) {
      console.error("Error updating last access:", error);
      // Still navigate to profile even if API call fails
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
      {isAdmin && location.pathname !== "/user-managment" && (
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
              onClick={() => navigate('/user-managment')}
                          className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200",
              "hover:bg-sidebar-accent",
              location.pathname === '/user-managment'
                ? "bg-gradient-accent shadow-md"
                : "text-sidebar-foreground"
            )}
            >
              <UserPlus size={isCollapsed ? 24 : 20} />
              {!isCollapsed && (
                <span className="font-medium">User Management</span>
              )}
            </button>
          )}
        </div>
      </nav>

      {isDev && (
        <div
          className={cn(
            "absolute left-2 right-2",
            isCollapsed ? "bottom-20" : "bottom-24"
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

      {/* Footer - User Section */}
      <div className="p-2 border-t border-slate-700">
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
            {/* Notification badge for both admin and client */}
            {isAdmin && notificationCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-lg">
                {notificationCount}
              </div>
            )}
            {/* Client status indicator - also in upper right */}
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
      </div>
    </div>
  );
};
