import React, { useEffect } from "react";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../components/ui/select";
import { useUserStore } from "../stores/userStore";

interface UserSelectProps {
  value?: string;
  onChange?: (userId: string) => void;
  placeholder?: string;
}

const UserSelect: React.FC<UserSelectProps> = ({ value, onChange, placeholder }) => {
  const { users, loading, fetchUsers } = useUserStore();
  useEffect(() => {
    if (users.length === 0) {
      fetchUsers();
    }
    // eslint-disable-next-line
  }, []);
  return (
    <Select value={value} onValueChange={onChange} disabled={loading}>
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
