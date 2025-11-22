import { create } from "zustand";
import { getFeatureRequests, updateFeatureRequest, type FeatureRequest } from "@/service/featureRequestService";

interface FeatureRequestState {
  featureRequests: FeatureRequest[];
  loading: boolean;
  error: string | null;
  fetchFeatureRequests: (filters?: { status?: string }) => Promise<void>;
  updateFeatureRequestStatus: (data: { _id: string; status: string }) => Promise<{ error: boolean; message?: string }>;
}

export const useFeatureRequestStore = create<FeatureRequestState>((set, get) => ({
  featureRequests: [],
  loading: false,
  error: null,

  fetchFeatureRequests: async (filters) => {
    set({ loading: true, error: null });
    try {
      const result = await getFeatureRequests(filters);
      if (result.error) {
        set({ error: result.message || "Failed to fetch feature requests", loading: false });
      } else {
        set({ featureRequests: result.data?.data || [], loading: false });
      }
    } catch (error) {
      set({ error: "Failed to fetch feature requests", loading: false });
    }
  },

  updateFeatureRequestStatus: async (data) => {
    try {
      const result = await updateFeatureRequest(data._id, { status: data.status });
      if (result.error) {
        return { error: true, message: result.message };
      } else {
        // Refresh the list after update
        await get().fetchFeatureRequests();
        return { error: false };
      }
    } catch (error) {
      return { error: true, message: "Failed to update feature request" };
    }
  },
}));
