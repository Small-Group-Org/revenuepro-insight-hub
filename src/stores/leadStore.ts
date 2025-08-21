import { create } from "zustand";
import { Lead } from "@/types";
import { 
  getLeads, 
  updateLead,
  GetLeadsPayload, 
  UpdateLeadPayload,
  GetLeadsResponse,
  UpdateLeadResponse
} from "@/service/leadService";
import { getConversionRates, ConversionRateResponse } from "@/service/conversionRateService";
import { ConversionRate } from "@/utils/leadProcessing";


interface LeadStoreState {
  leads: Lead[];
  conversionRates: ConversionRate[];
  loading: boolean;
  error?: string;
  selectedClientId?: string;
  fetchLeads: (clientId?: string, startDate?: string, endDate?: string) => Promise<void>;
  fetchConversionRates: (clientId?: string) => Promise<void>;
  updateLeadData: (payload: UpdateLeadPayload) => Promise<{ error: boolean; message?: string }>;
  updateLeadLocal: (leadId: string, updates: Partial<Lead>) => void;
  clearLeads: () => void;
}

export const useLeadStore = create<LeadStoreState>((set, get) => ({
  leads: [],
  conversionRates: [],
  loading: false,
  error: undefined,
  selectedClientId: undefined,

  fetchLeads: async (clientId?: string, startDate?: string, endDate?: string) => {
    set({ loading: true, error: undefined, selectedClientId: clientId });
    
    try {
      const payload: GetLeadsPayload = {};
      if (clientId) payload.clientId = clientId;
      if (startDate) payload.startDate = startDate;
      if (endDate) payload.endDate = endDate;

      const res = await getLeads(payload);
      
      if (!res.error && res.data && res.data.success && res.data.data) {
        // Map _id to id for compatibility with Lead interface
        const leadsWithId = res.data.data.map((lead: any) => ({
          ...lead,
          id: lead._id || lead.id
        }));
        set({ leads: leadsWithId, loading: false });
      } else {
        set({ error: res.message || res.data?.message || "Failed to fetch leads", loading: false });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "Failed to fetch leads", 
        loading: false 
      });
    }
  },

  fetchConversionRates: async (clientId?: string) => {
    try {
      const payload = clientId ? { clientId } : undefined;
      const res = await getConversionRates(payload);
      
      if (!res.error && res.data && res.data.success && res.data.data) {
        set({ conversionRates: res.data.data });
      } else {
        console.warn('Failed to fetch conversion rates:', res.message || res.data?.message);
        set({ conversionRates: [] });
      }
    } catch (error) {
      console.error('Error fetching conversion rates:', error);
      set({ conversionRates: [] });
    }
  },

  updateLeadData: async (payload: UpdateLeadPayload) => {
    try {
      const res = await updateLead(payload);
      
      if (!res.error && res.data && res.data.success && res.data.data) {
        // Update local state with the updated lead
        const { leads } = get();
        const updatedLead = res.data.data;
        const updatedLeads = leads.map(lead => 
          lead.id === payload._id ? {
            ...lead,
            id: updatedLead._id || updatedLead.id,
            estimateSet: updatedLead.estimateSet,
            unqualifiedLeadReason: updatedLead.unqualifiedLeadReason,
            updatedAt: updatedLead.updatedAt
          } : lead
        );
        set({ leads: updatedLeads });
        
        return { error: false, message: "Lead updated successfully" };
      } else {
        return { error: true, message: res.message || res.data?.message || "Failed to update lead" };
      }
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
    set({ leads: [], conversionRates: [], error: undefined, selectedClientId: undefined });
  },
}));