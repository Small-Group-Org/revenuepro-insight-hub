import { cn } from '@/lib/utils'
import React from 'react'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { useUserContext } from '@/utils/UserContext';

type ProfileProps = {
    isAdmin: boolean;
    notificationCount: number;
    statusIndicator: string;
    handleProfileClick: () => void;
    initials: string;
    getStatusColor: (status: string) => string;
} 

const ProfileIcon = (props: ProfileProps) => {
    const { isAdmin, notificationCount, statusIndicator, handleProfileClick, initials, getStatusColor } = props;
    const { user } = useUserContext();

  return (
    <button
        className={cn(
          "flex items-center gap-3 py-[6px] px-[12px] rounded-lg transition-all duration-200",
          "hover:bg-sidebar-accent relative border border-sidebar-border rounded-full"
        )}
        onClick={handleProfileClick}
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
            <div
              className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-sidebar shadow-lg ${getStatusColor(
                statusIndicator
              )}`}
            ></div>
          )}
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[12px] font-medium leading-tight">
            {user?.name || "User"}
          </span>
          <span className="text-[10px] text-gray-400 leading-tight capitalize">
            {user?.role.toLowerCase()}
          </span>
        </div>
      </button>
  )
}

export default ProfileIcon