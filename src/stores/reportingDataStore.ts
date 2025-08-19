import { create } from 'zustand';
import { IReportingData, IReportingResponse, getReportingData as fetchReportingData, upsertReportingData as saveReportingData } from '../service/reportingServices';
import { IWeeklyTarget } from '../service/targetService';
import useAuthStore from './authStore';
import { useUserStore } from './userStore';

interface ReportingDataState {
  reportingData: IReportingData[] | null;
  targetData: IWeeklyTarget[] | null;
  comparisonData: IReportingData[] | null;
  isLoading: boolean;
  error: string | null;
  setReportingData: (data: IReportingData[] | null) => void;
  setTargetData: (data: IWeeklyTarget[] | null) => void;
  setComparisonData: (data: IReportingData[] | null) => void;
  getReportingData: (startDate: string, endDate: string, queryType: string) => Promise<void>;
  getComparisonData: (startDate: string, endDate: string, queryType: string) => Promise<void>;
  upsertReportingData: (data: IReportingData) => Promise<void>;
  clearError: () => void;
}

export const useReportingDataStore = create<ReportingDataState>((set, get) => ({
  reportingData: null,
  targetData: null,
  comparisonData: null,
  isLoading: false,
  error: null,
  setReportingData: (data) => set({ reportingData: data }),
  setTargetData: (data) => set({ targetData: data }),
  setComparisonData: (data) => set({ comparisonData: data }),

  getReportingData: async (startDate, endDate, queryType) => {
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
      const response = await fetchReportingData(userId, startDate, endDate, queryType);
      if (!response.error && response.data) {
        // Handle new response format: { actual: [...], target: {...} }
        const reportingResponse = response.data.data as IReportingResponse;
        const actualData = Array.isArray(reportingResponse.actual) ? reportingResponse.actual : [reportingResponse.actual];
        const targetRaw = Array.isArray(reportingResponse.target) ? reportingResponse.target : [reportingResponse.target];
        const targetData = Array.isArray(targetRaw) ? targetRaw : (targetRaw ? [targetRaw] : []);
        set({ reportingData: actualData, targetData, isLoading: false });
      } else {
        set({ reportingData: null, targetData: null, error: response.message || 'Failed to fetch reporting data', isLoading: false });
      }
    } catch (error) {
      set({ reportingData: null, targetData: null, error: error instanceof Error ? error.message : 'An error occurred while fetching reporting data', isLoading: false });
    }
  },

  getComparisonData: async (startDate, endDate, queryType) => {
    try {
      const authState = useAuthStore.getState();
      const userStore = useUserStore.getState();
      const user = authState.user;
      let userId = user?._id;
      if (user?.role === 'ADMIN') {
        userId = userStore.selectedUserId || user?._id;
      }
      if (!userId) {
        set({ error: 'No user ID found' });
        return;
      }
      const response = await fetchReportingData(userId, startDate, endDate, queryType);
      if (!response.error && response.data) {
        const reportingResponse = response.data.data as IReportingResponse;
        const actualData = Array.isArray(reportingResponse.actual) ? reportingResponse.actual : [reportingResponse.actual];
        console.log('Comparison data:', actualData);
        set({ comparisonData: actualData });
      } else {
        set({ comparisonData: null, error: response.message || 'Failed to fetch comparison data' });
      }
    } catch (error) {
      set({ comparisonData: null, error: error instanceof Error ? error.message : 'An error occurred while fetching comparison data' });
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
