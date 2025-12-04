import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useUserContext } from "../../utils/UserContext";
import { adminRoutes } from "@/utils/constant";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useTicketStore } from "@/stores/ticketStore";
import { updateLastAccess } from "@/service/userService";
import { useUserStore } from "@/stores/userStore";
import ProfileIcon from "./ProfileIcon";

interface UserWithRole {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

export const TopBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUserContext();
  const userWithRole = user as UserWithRole | null;
  const isAdmin = userWithRole && userWithRole.role === "ADMIN";
  const { tickets, fetchTickets } = useTicketStore();
  const { isAdminView } = useUserStore();

  // Notification states
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [statusIndicator, setStatusIndicator] = useState<string | null>(null);
  const [hasCheckedNotifications, setHasCheckedNotifications] =
    useState<boolean>(false);

  const initials = (() => {
    const full = (user?.name || "").trim();
    if (!full) return "U";
    const parts = full.split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts.length > 1 ? parts[parts.length - 1][0] || "" : "";
    const value = (first + last).toUpperCase();
    return value || (first || "U").toUpperCase();
  })();

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const { newTicketsCount, newTicketsStatus } = useMemo(() => {
    if (!(user as any)?.lastAccessAt || hasCheckedNotifications) {
      return { newTicketsCount: 0, newTicketsStatus: null };
    }

    const lastAccessTime = new Date((user as any).lastAccessAt);
    const newTickets = tickets.filter((ticket) => {
      const ticketTime = new Date(ticket.createdAt);
      return ticketTime > lastAccessTime;
    });

    if (isAdmin) {
      return { newTicketsCount: newTickets.length, newTicketsStatus: null };
    } else {
      // For non-admin users, get the status of their new tickets
      const userNewTickets = newTickets.filter(
        (ticket) => ticket.userId._id === user?._id
      );
      const statuses = userNewTickets.map((ticket) => ticket.status);
      const mostRecentStatus = statuses[statuses.length - 1] || null;
      return { newTicketsCount: 0, newTicketsStatus: mostRecentStatus };
    }
  }, [
    (user as any)?.lastAccessAt,
    tickets,
    isAdmin,
    user?._id,
    hasCheckedNotifications,
  ]);

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
      navigate("/profile");
    } catch (error) {
      console.error("Error updating last access:", error);
      navigate("/profile");
    }
  }, [user, navigate]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-orange-500";
      case "in_progress":
        return "bg-gray-400";
      case "closed":
        return "bg-green-500";
      default:
        return "bg-gray-300";
    }
  };

  return (
    <div className="bg-sidebar text-sidebar-foreground border-b border-sidebar-border mb-8 px-4 py-3 h-[60px] flex-shrink-0 gap-6 flex  items-center justify-end">
      {/* Admin Routes Navigation */}
      <div className="flex items-center gap-2">
        {isAdmin &&
          adminRoutes.map(({ id, label, icon: Icon, path }) => (
            <button
              key={id}
              onClick={() => navigate(path)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200",
                "hover:scale-105",
                location.pathname === path
                  ? "scale-105 shadow-md text-[16px] underline"
                  : "text-sidebar-foreground text-[14px]"
              )}
            >
              <span className="font-medium">{label}</span>
            </button>
          ))}
      </div>

      <ProfileIcon 
        isAdmin={isAdmin}
        notificationCount={notificationCount}
        statusIndicator={statusIndicator}
        handleProfileClick={handleProfileClick}
        initials={initials}
        getStatusColor={getStatusColor}
      />
    </div>
  );
};
