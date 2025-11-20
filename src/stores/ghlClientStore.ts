import { create } from "zustand";
import { getAllGhlClients, GhlClient } from "@/service/ghlClientService";

interface GhlClientStoreState {
  clients: GhlClient[];
  loading: boolean;
  error?: string;
  fetchClients: () => Promise<void>;
  getClientByRevenueProId: (revenueProClientId: string) => GhlClient | undefined;
  getActiveClients: () => GhlClient[];
  clearClients: () => void;
}

export const useGhlClientStore = create<GhlClientStoreState>((set, get) => ({
  clients: [],
  loading: false,
  error: undefined,
  fetchClients: async () => {
    set({ loading: true, error: undefined });
    const res = await getAllGhlClients();
    if (!res.error && res.data) {
      set({ clients: res.data, loading: false });
    } else {
      set({ error: res.message || "Failed to fetch GHL clients", loading: false });
    }
  },
  getClientByRevenueProId: (revenueProClientId: string) => {
    return get().clients.find((client) => client.revenueProClientId === revenueProClientId);
  },
  getActiveClients: () => {
    return get().clients.filter((client) => client.status === "active");
  },
  clearClients: () => {
    set({ clients: [], loading: false, error: undefined });
  },
}));

