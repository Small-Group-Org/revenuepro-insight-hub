import { create } from "zustand";
import { getAllUsers, User } from "@/service/userService";

interface UserStoreState {
  users: User[];
  loading: boolean;
  error?: string;
  fetchUsers: () => Promise<void>;
}

export const useUserStore = create<UserStoreState>((set) => ({
  users: [],
  loading: false,
  error: undefined,
  fetchUsers: async () => {
    set({ loading: true, error: undefined });
    const res = await getAllUsers();
    if (!res.error && Array.isArray(res.data.data)) {
      set({ users: res.data.data, loading: false });
    } else {
      set({ error: res.message || "Failed to fetch users", loading: false });
    }
  },
}));
