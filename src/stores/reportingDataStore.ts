import { create } from 'zustand';
import { IReportingData, getReportingData as fetchReportingData, upsertReportingData as saveReportingData } from '../service/reportingServices';
import useAuthStore from './authStore';
import { useUserStore } from './userStore';

interface ReportingDataState {
  reportingData: IReportingData[] | null;
  isLoading: boolean;
  error: string | null;
  setReportingData: (data: IReportingData[] | null) => void;
  getReportingData: (startDate: string, endDate: string) => Promise<void>;
  upsertReportingData: (data: IReportingData) => Promise<void>;
  clearError: () => void;
}

export const useReportingDataStore = create<ReportingDataState>((set, get) => ({
  reportingData: null,
  isLoading: false,
  error: null,
  setReportingData: (data) => set({ reportingData: data }),

  getReportingData: async (startDate, endDate) => {
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
      const response = await fetchReportingData(userId, startDate, endDate);
      if (!response.error && response.data) {
        const data = Array.isArray(response.data?.data) ? response.data?.data : [response.data?.data];
        console.log("[]", data);
        
        set({ reportingData: data, isLoading: false });
      } else {
        set({ reportingData: null, error: response.message || 'Failed to fetch reporting data', isLoading: false });
      }
    } catch (error) {
      set({ reportingData: null, error: error instanceof Error ? error.message : 'An error occurred while fetching reporting data', isLoading: false });
    }
  },

  upsertReportingData: async (data) => {
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
      const response = await saveReportingData({ ...data, userId });
      if (response && !response.error) {
        set({ reportingData: Array.isArray(response.data) ? response.data : [response.data] });
      } else {
        set({ error: response?.message || 'Failed to upsert reporting data' });
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'An error occurred while upserting reporting data' });
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
