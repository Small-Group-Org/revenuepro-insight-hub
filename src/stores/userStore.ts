import { create } from "zustand";
import { getAllUsers, User } from "@/service/userService";

interface UserStoreState {
  users: User[];
  loading: boolean;
  error?: string;
  selectedUserId?: string;
  fetchUsers: () => Promise<void>;
  setSelectedUserId: (id: string) => void;
}

export const useUserStore = create<UserStoreState>((set) => ({
  users: [],
  loading: false,
  error: undefined,
  selectedUserId: undefined,
  fetchUsers: async () => {
    set({ loading: true, error: undefined });
    const res = await getAllUsers();
    if (!res.error && Array.isArray(res.data.data)) {
      const users = res.data.data;
      set({ users, loading: false, selectedUserId: users.length > 0 ? users[0].id : undefined });
    } else {
      set({ error: res.message || "Failed to fetch users", loading: false });
    }
  },
  setSelectedUserId: (id: string) => set({ selectedUserId: id }),
}));
