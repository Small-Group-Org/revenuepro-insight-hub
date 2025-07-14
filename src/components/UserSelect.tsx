import React, { useEffect } from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../components/ui/select";
import { useUserStore } from "../stores/userStore";

interface UserSelectProps {
  value?: string;
  onChange?: (userId: string) => void;
  placeholder?: string;
}

const UserSelect: React.FC<UserSelectProps> = ({ value, onChange, placeholder }) => {
  const { users, loading, fetchUsers, selectedUserId, setSelectedUserId } = useUserStore();
  useEffect(() => {
    if (users?.length === 0) {
      fetchUsers();
    }
  }, []);

  // Handle value and onChange
  const handleChange = (userId: string) => {
    setSelectedUserId(userId);
    if (onChange) onChange(userId);
  };

  return (
    <Select value={value ?? selectedUserId} onValueChange={handleChange} disabled={loading}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder || (loading ? "Loading users..." : "Select a user")}/>
      </SelectTrigger>
      <SelectContent>
        {users.map(user => (
          <SelectItem key={user.id} value={user.id}>
            {user.name || user.email}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default UserSelect;
