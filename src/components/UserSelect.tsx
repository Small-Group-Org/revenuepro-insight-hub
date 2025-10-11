import React, { useEffect } from "react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../components/ui/select";
import { useUserStore } from "../stores/userStore";
import { Users } from "lucide-react";
import { getInitials } from "@/utils/utils";

interface UserSelectProps {
  value?: string;
  onChange?: (userId: string) => void;
  placeholder?: string;
  isCollapsed?: boolean;
}

const UserSelect: React.FC<UserSelectProps> = ({
  value,
  onChange,
  placeholder,
  isCollapsed = false,
}) => {
  const { users, loading, fetchUsers, selectedUserId, setSelectedUserId } =
    useUserStore();
  // Exclude ADMINs and any users marked as inactive from the sidebar selection
  const allClients = users.filter(
    (user) =>
      user.role !== "ADMIN" && (user.status || "").toLowerCase() !== "inactive"
  );
  useEffect(() => {
    if (users?.length === 0) {
      fetchUsers();
    }
  }, []);

  useEffect(() => {
    // If there's an existing selection, make sure it refers to an active client.
    // If it doesn't (for example persisted id points to an inactive user), pick the first active client.
    if (selectedUserId) {
      const selectedIsActive = users.some(
        (u) =>
          u.id === selectedUserId &&
          u.role !== "ADMIN" &&
          (u.status || "").toLowerCase() !== "inactive"
      );
      if (selectedIsActive) return;
    }
    const firstClientUser = users.find(
      (user) =>
        user.role !== "ADMIN" &&
        (user.status || "").toLowerCase() !== "inactive"
    );
    if (firstClientUser) setSelectedUserId(firstClientUser.id);
  }, [users]);

  // Handle value and onChange
  const handleChange = (userId: string) => {
    setSelectedUserId(userId);
    if (onChange) onChange(userId);
  };

  if (isCollapsed) {
    // Only show avatar if the selected user exists and is not inactive
    const selectedUser = users.find(
      (user) =>
        user.id === (value ?? selectedUserId) &&
        (user.status || "").toLowerCase() !== "inactive"
    );

    return (
      <div className="flex justify-center">
        <button
          className="p-1 hover:bg-sidebar-accent rounded-lg transition-colors text-sidebar-foreground"
          title={
            selectedUser
              ? `${selectedUser.name || selectedUser.email}`
              : "User Selection"
          }
        >
          {selectedUser ? (
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-sm font-medium text-primary-foreground">
              {getInitials(selectedUser.name || selectedUser.email)}
            </div>
          ) : (
            <Users size={20} />
          )}
        </button>
      </div>
    );
  }

  return (
    <Select
      value={value ?? selectedUserId}
      onValueChange={handleChange}
      disabled={loading}
    >
      <SelectTrigger className="w-full rounded-full bg-sidebar border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent">
        <SelectValue
          placeholder={
            placeholder || (loading ? "Loading Clients..." : "Select a Client")
          }
        />
      </SelectTrigger>
      <SelectContent className="bg-sidebar border-sidebar-border rounded-md">
        {allClients.map((user) => (
          <SelectItem
            key={user.id}
            value={user.id}
            className="text-sidebar-foreground hover:bg-sidebar-accent focus:bg-sidebar-accent data-[highlighted]:bg-sidebar-accent data-[highlighted]:text-sidebar-foreground"
          >
            {user.name || user.email}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default UserSelect;
