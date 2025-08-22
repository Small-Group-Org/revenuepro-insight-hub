import React, { useEffect } from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../components/ui/select";
import { useUserStore } from "../stores/userStore";
import { Users } from "lucide-react";
import { getInitials } from "@/utils/utils";

interface UserSelectProps {
  value?: string;
  onChange?: (userId: string) => void;
  placeholder?: string;
  isCollapsed?: boolean;
}

const UserSelect: React.FC<UserSelectProps> = ({ value, onChange, placeholder, isCollapsed = false }) => {
  const { users, loading, fetchUsers, selectedUserId, setSelectedUserId } = useUserStore();
  const allClients = users.filter(user => user.role !== "ADMIN");
  useEffect(() => {
    if (users?.length === 0) {
      fetchUsers();
    }
  }, []);

  useEffect(() => {
    const firstClientUser = users.find(user => user.role !== "ADMIN");
    if (firstClientUser) {
      setSelectedUserId(firstClientUser.id);
    }
  }, [users])

  // Handle value and onChange
  const handleChange = (userId: string) => {
    setSelectedUserId(userId);
    if (onChange) onChange(userId);
  };

  if (isCollapsed) {
    const selectedUser = users.find(user => user.id === (value ?? selectedUserId));
    
    return (
      <div className="flex justify-center">
        <button
          className="p-1 hover:bg-sidebar-accent rounded-lg transition-colors text-sidebar-foreground"
          title={selectedUser ? `${selectedUser.name || selectedUser.email}` : "User Selection"}
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
    <Select value={value ?? selectedUserId} onValueChange={handleChange} disabled={loading}>
      <SelectTrigger className="w-full rounded-full bg-sidebar border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent">
        <SelectValue placeholder={placeholder || (loading ? "Loading Clients..." : "Select a Client")}/>
      </SelectTrigger>
      <SelectContent className="bg-sidebar border-sidebar-border rounded-md">
        {allClients.map(user => (
          <SelectItem 
            key={user.id} 
            value={user.id}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {user.name || user.email}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default UserSelect;
