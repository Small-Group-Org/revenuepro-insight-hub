import { create } from "zustand";
import { Lead } from "@/types";
import { getLeads, updateLead, GetLeadsPayload, UpdateLeadPayload } from "@/service/leadService";
import { getDummyLeadsForUser } from "@/utils/dummyLeads";

interface LeadStoreState {
  leads: Lead[];
  loading: boolean;
  error?: string;
  selectedUserId?: string;
  fetchLeads: (userId: string) => Promise<void>;
  updateLeadData: (payload: UpdateLeadPayload) => Promise<{ error: boolean; message?: string }>;
  updateLeadLocal: (leadId: string, updates: Partial<Lead>) => void;
  clearLeads: () => void;
}

export const useLeadStore = create<LeadStoreState>((set, get) => ({
  leads: [],
  loading: false,
  error: undefined,
  selectedUserId: undefined,

  fetchLeads: async (userId: string) => {
    set({ loading: true, error: undefined, selectedUserId: userId });
    
    try {
      // For now, use dummy data since API is not ready
      const dummyLeads = getDummyLeadsForUser(userId);
      set({ leads: dummyLeads, loading: false });
      
      // TODO: Replace with actual API call when backend is ready
      // const res = await getLeads({ userId });
      // if (!res.error && res.data?.leads) {
      //   set({ leads: res.data.leads, loading: false });
      // } else {
      //   set({ error: res.message || "Failed to fetch leads", loading: false });
      // }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "Failed to fetch leads", 
        loading: false 
      });
    }
  },

  updateLeadData: async (payload: UpdateLeadPayload) => {
    try {
      // For now, just update locally since API is not ready
      const { leads } = get();
      const updatedLeads = leads.map(lead => 
        lead.id === payload.id ? {
          ...lead,
          estimateSet: payload.estimateSet,
          unqualifiedLeadReason: payload.unqualifiedLeadReason
        } : lead
      );
      set({ leads: updatedLeads });
      
      return { error: false, message: "Lead updated successfully" };
      
      // TODO: Replace with actual API call when backend is ready
      // const res = await updateLead(payload);
      // if (!res.error) {
      //   // Update local state optimistically
      //   const { leads } = get();
      //   const updatedLeads = leads.map(lead => 
      //     lead.id === payload.id ? {
      //       ...lead,
      //       estimateSet: payload.estimateSet,
      //       unqualifiedLeadReason: payload.unqualifiedLeadReason
      //     } : lead
      //   );
      //   set({ leads: updatedLeads });
      //   return { error: false, message: "Lead updated successfully" };
      // } else {
      //   return { error: true, message: res.message || "Failed to update lead" };
      // }
    } catch (error) {
      return { 
        error: true, 
        message: error instanceof Error ? error.message : "Failed to update lead" 
      };
    }
  },

  updateLeadLocal: (leadId: string, updates: Partial<Lead>) => {
    const { leads } = get();
    const updatedLeads = leads.map(lead => 
      lead.id === leadId ? { ...lead, ...updates } : lead
    );
    set({ leads: updatedLeads });
  },

  clearLeads: () => {
    set({ leads: [], error: undefined, selectedUserId: undefined });
  },
}));