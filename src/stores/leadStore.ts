import { create } from "zustand";
import { Lead } from "@/types";
import { 
  getLeads, 
  updateLead,
  getPaginatedLeads,
  getFilterOptions,
  GetLeadsPayload, 
  UpdateLeadPayload,
  GetPaginatedLeadsPayload,
  GetFilterOptionsPayload,
  PaginationInfo,
  FilterOptions,
  StatusCounts,
  exportAllFilteredLeads
} from "@/service/leadService";

interface LeadStoreState {
  leads: Lead[];
  loading: boolean;
  error?: string;
  selectedClientId?: string;
  
  // Pagination state
  pagination: PaginationInfo | null;
  
  // Filter options state
  filterOptions: FilterOptions | null;
  statusCounts: StatusCounts | null;
  filterOptionsLoading: boolean;
  
  // Current filters and sorting
  currentFilters: {
    adSetName?: string;
    adName?: string;
    status?: string;
    unqualifiedLeadReason?: string;
  };
  currentSorting: {
    sortBy: 'date' | 'score';
    sortOrder: 'asc' | 'desc';
  };
  
  // Actions
  fetchLeads: (clientId?: string, startDate?: string, endDate?: string) => Promise<void>;
  fetchPaginatedLeads: (payload: GetPaginatedLeadsPayload) => Promise<void>;
  fetchFilterOptions: (payload: GetFilterOptionsPayload) => Promise<void>;
  updateLeadData: (payload: UpdateLeadPayload) => Promise<{ error: boolean; message?: string }>;
  updateLeadLocal: (leadId: string, updates: Partial<Lead>) => void;
  clearLeads: () => void;
  setFilters: (filters: Partial<{ adSetName?: string; adName?: string; status?: string; unqualifiedLeadReason?: string }>) => void;
  setSorting: (sortBy: 'date' | 'score', sortOrder: 'asc' | 'desc') => void;
  clearFilters: () => void;
  exportAllFilteredLeads: (payload: GetPaginatedLeadsPayload) => Promise<{ error: boolean; data?: Lead[]; message?: string }>;
}

export const useLeadStore = create<LeadStoreState>((set, get) => ({
  leads: [],
  loading: false,
  error: undefined,
  selectedClientId: undefined,
  
  // Pagination state
  pagination: null,
  
  // Filter options state
  filterOptions: null,
  statusCounts: null,
  filterOptionsLoading: false,
  
  // Current filters and sorting
  currentFilters: {
    adSetName: undefined,
    adName: undefined,
    status: undefined,
    unqualifiedLeadReason: undefined
  },
  currentSorting: {
    sortBy: 'date',
    sortOrder: 'desc'
  },

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

  fetchPaginatedLeads: async (payload: GetPaginatedLeadsPayload) => {
    set({ loading: true, error: undefined, selectedClientId: payload.clientId });
    
    try {
      const res = await getPaginatedLeads(payload);
      
      if (!res.error && res.data && res.data.success) {
        // Map _id to id for compatibility with Lead interface
        const leadsWithId = res.data.data.map((lead: any) => ({
          ...lead,
          id: lead._id || lead.id
        }));
        
        set({ 
          leads: leadsWithId, 
          pagination: res.data.pagination,
          loading: false 
        });
      } else {
        set({ 
          error: res.message || res.data?.message || "Failed to fetch leads", 
          loading: false 
        });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "Failed to fetch leads", 
        loading: false 
      });
    }
  },

  fetchFilterOptions: async (payload: GetFilterOptionsPayload) => {
    set({ filterOptionsLoading: true });
    
    try {
      const res = await getFilterOptions(payload);
      
      if (!res.error && res.data && res.data.success) {
        set({ 
          filterOptions: res.data.data.filterOptions,
          statusCounts: res.data.data.statusCounts,
          filterOptionsLoading: false 
        });
      } else {
        set({ 
          error: res.message || res.data?.message || "Failed to fetch filter options", 
          filterOptionsLoading: false 
        });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "Failed to fetch filter options", 
        filterOptionsLoading: false 
      });
    }
  },

  exportAllFilteredLeads: async (payload: GetPaginatedLeadsPayload) => {
    try {
      const res = await exportAllFilteredLeads(payload);
      
      if (!res.error && res.data && res.data.success) {
        // Map _id to id for compatibility with Lead interface
        const leadsWithId = res.data.data.map((lead: any) => ({
          ...lead,
          id: lead._id || lead.id
        }));
        
        return { error: false, data: leadsWithId };
      } else {
        return { error: true, message: res.message || res.data?.message || "Failed to export leads" };
      }
    } catch (error) {
      return { 
        error: true, 
        message: error instanceof Error ? error.message : "Failed to export leads" 
      };
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

  setFilters: (filters) => {
    const { currentFilters } = get();
    set({ 
      currentFilters: { ...currentFilters, ...filters }
    });
  },

  setSorting: (sortBy, sortOrder) => {
    set({ 
      currentSorting: { sortBy, sortOrder }
    });
  },

  clearFilters: () => {
    set({ 
      currentFilters: {
        adSetName: undefined,
        adName: undefined,
        status: undefined,
        unqualifiedLeadReason: undefined
      },
      currentSorting: {
        sortBy: 'date',
        sortOrder: 'desc'
      }
    });
  },

  clearLeads: () => {
    set({ 
      leads: [], 
      error: undefined, 
      selectedClientId: undefined,
      pagination: null,
      filterOptions: null,
      statusCounts: null,
      currentFilters: {
        adSetName: undefined,
        adName: undefined,
        status: undefined,
        unqualifiedLeadReason: undefined
      },
      currentSorting: {
        sortBy: 'date',
        sortOrder: 'desc'
      }
    });
  },
}));