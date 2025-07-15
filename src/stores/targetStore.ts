import { create } from 'zustand';
import { IWeeklyTarget, upsertTarget, getTargets } from '../service/targetService';
import useAuthStore from './authStore';
import { useUserStore } from './userStore';
import { format } from 'date-fns';

interface TargetState {
  currentTarget: IWeeklyTarget | null;
  isLoading: boolean;
  error: string | null;
  setCurrentTarget: (target: IWeeklyTarget | null) => void;
  upsertWeeklyTarget: (target: IWeeklyTarget) => Promise<void>;
  clearError: () => void;
  getTargetsForUser: (queryType?: string, startDate?: string) => Promise<void>;
}

export const useTargetStore = create<TargetState>((set, get) => ({
  currentTarget: null,
  isLoading: false,
  error: null,

  setCurrentTarget: (target) => set({ currentTarget: target }),

  upsertWeeklyTarget: async (target) => {
    set({ isLoading: true, error: null });
    try {
      const authState = useAuthStore.getState();
      const userStore = useUserStore.getState();
      const user = authState.user;
      let userId = user?._id;
      if (user?.role === 'ADMIN') {
        userId = userStore.selectedUserId || user?._id;
      }
      if (!userId) {
        set({ error: 'No user ID found', isLoading: false });
        return;
      }
      const response = await upsertTarget({ ...target, userId });
      if (response.success) {
        set({ currentTarget: response.data });
      } else {
        set({ error: response.message || 'Failed to update target' });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred while updating target' });
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  getTargetsForUser: async (queryType?: string, startDate?: string) => {
    set({ isLoading: true, error: null });
    try {
      const authState = useAuthStore.getState();
      const userStore = useUserStore.getState();
      const user = authState.user;
      let userId = user?._id;
      if (user?.role === 'ADMIN') {
        userId = userStore.selectedUserId || user?._id;
      }
      if (!userId) {
        set({ error: 'No user ID found', isLoading: false });
        return;
      }
      const response = await getTargets(userId, queryType, startDate);
      if (!response.error && response.data) {
        set({ currentTarget: response.data?.data, isLoading: false });
      } else {
        set({ currentTarget: null, error: response.message || 'Failed to fetch targets', isLoading: false });
      }
    } catch (error) {
      set({ currentTarget: null, error: error instanceof Error ? error.message : 'An error occurred while fetching targets', isLoading: false });
    }
  },
}));