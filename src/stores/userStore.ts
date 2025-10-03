import { create } from "zustand";
import { getAllUsers, User, CreateUserPayload, UpdateUserPayload, UpdatePasswordPayload, createUser as createUserService, updateUser as updateUserService, deleteUser as deleteUserService, updatePassword as updatePasswordService } from "@/service/userService";
import { getValue, setValue, STORAGE_KEYS } from "@/utils/storage";

interface UserStoreState {
  users: User[];
  loading: boolean;
  error?: string;
  selectedUserId?: string;
  fetchUsers: (role?: string) => Promise<void>;
  setSelectedUserId: (id: string) => void;
  createUser: (payload: CreateUserPayload) => Promise<{ error: boolean; message?: string }>;
  updateUser: (payload: UpdateUserPayload) => Promise<{ error: boolean; message?: string }>;
  deleteUser: (userId: string) => Promise<{ error: boolean; message?: string }>;
  updatePassword: (payload: UpdatePasswordPayload) => Promise<{ error: boolean; message?: string }>;
}

export const useUserStore = create<UserStoreState>((set, get) => ({
  users: [],
  loading: false,
  error: undefined,
  selectedUserId: getValue(STORAGE_KEYS.SELECTED_USER_ID) || undefined,
  fetchUsers: async (role?: string) => {
    set({ loading: true, error: undefined });
    const res = await getAllUsers(role);
    if (!res.error && Array.isArray(res.data.data)) {
      const users = res.data.data.sort((a, b) => a.name.localeCompare(b.name));
      // Decide selected user ID prioritizing persisted value if valid
      const persistedId = getValue(STORAGE_KEYS.SELECTED_USER_ID) || undefined;
      const currentSelected = get().selectedUserId;
      const candidateId = [persistedId, currentSelected, users.length > 0 ? users[0].id : undefined]
        .find((id) => !!id && users.some((u) => u.id === id));
      set({ users, loading: false, selectedUserId: candidateId });
    } else {
      set({ error: res.message || "Failed to fetch users", loading: false });
    }
  },
  setSelectedUserId: (id: string) => {
    setValue(STORAGE_KEYS.SELECTED_USER_ID, id);
    set({ selectedUserId: id });
  },
  createUser: async (payload) => {
    set({ loading: true, error: undefined });
    const res = await createUserService(payload);
    if (!res.error) {
      get().fetchUsers(); // Refresh users after creation
    } else {
      set({ error: res.message || "Failed to create user", loading: false });
    }
    set({ loading: false });
    return { error: res.error, message: res.message };
  },
  updateUser: async (payload) => {
    set({ loading: true, error: undefined });
    const res = await updateUserService(payload);
    if (!res.error) {
      get().fetchUsers(); // Refresh users after update
    } else {
      set({ error: res.message || "Failed to update user", loading: false });
    }
    set({ loading: false });
    return { error: res.error, message: res.message };
  },
  deleteUser: async (userId) => {
    set({ loading: true, error: undefined });
    const res = await deleteUserService(userId);
    if (!res.error) {
      get().fetchUsers(); // Refresh users after deletion
    } else {
      set({ error: res.message || "Failed to delete user", loading: false });
    }
    set({ loading: false });
    return { error: res.error, message: res.message };
  },
  updatePassword: async (payload) => {
    set({ loading: true, error: undefined });
    const res = await updatePasswordService(payload);
    if (res.error) {
      set({ error: res.message || "Failed to update password", loading: false });
    }
    set({ loading: false });
    return { error: res.error, message: res.message };
  },
}));
