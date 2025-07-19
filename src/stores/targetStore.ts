import { create } from 'zustand';
import { IWeeklyTarget, upsertTarget, upsertBulkTargets, getTargets } from '../service/targetService';
import useAuthStore from './authStore';
import { useUserStore } from './userStore';
import { format } from 'date-fns';

interface TargetState {
  currentTarget: IWeeklyTarget[] | null;
  isLoading: boolean;
  error: string | null;
  setCurrentTarget: (target: IWeeklyTarget[] | null) => void;
  upsertWeeklyTarget: (target: IWeeklyTarget) => Promise<void>;
  upsertBulkWeeklyTargets: (targets: IWeeklyTarget[]) => Promise<void>;
  clearError: () => void;
  getTargetsForUser: (queryType: string, startDate: string, endDate:string) => Promise<void>;
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

  upsertBulkWeeklyTargets: async (targets) => {
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
      
      // Add userId to each target
      const targetsWithUserId = targets.map(target => ({ ...target, userId }));
      
      try {
        // Try to use bulk endpoint first
        const response = await upsertBulkTargets(targetsWithUserId);
        if (response.success) {
          set({ currentTarget: response.data?.[0] || null });
        } else {
          set({ error: response.message || 'Failed to update targets' });
        }
      } catch (bulkError) {
        // Fallback to individual calls if bulk endpoint fails
        console.warn('Bulk endpoint failed, falling back to individual calls:', bulkError);
        const promises = targetsWithUserId.map(target => upsertTarget(target));
        const responses = await Promise.all(promises);
        
        // Check if all responses are successful
        const allSuccessful = responses.every(response => response.success);
        if (allSuccessful) {
          // Set the first target as current target (or you could set the last one)
          set({ currentTarget: responses[0]?.data || null });
        } else {
          const failedResponses = responses.filter(response => !response.success);
          set({ error: failedResponses[0]?.message || 'Failed to update some targets' });
        }
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred while updating targets' });
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  getTargetsForUser: async (queryType: string, startDate: string, endDate: string) => {
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
      const response = await getTargets(userId, queryType, startDate, endDate);
      if (!response.error && response.data) {
        const data = Array.isArray(response.data?.data) ? response.data?.data : [response.data?.data];
        set({ currentTarget: data, isLoading: false });
      } else {
        set({ currentTarget: null, error: response.message || 'Failed to fetch targets', isLoading: false });
      }
    } catch (error) {
      set({ currentTarget: null, error: error instanceof Error ? error.message : 'An error occurred while fetching targets', isLoading: false });
    }
  },
}));