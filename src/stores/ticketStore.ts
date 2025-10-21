import { create } from "zustand";
import { Ticket, CreateTicketPayload, UpdateTicketPayload } from "@/types/ticket.types";
import { getTickets, createTicket, updateTicket } from "@/service/ticketService";

interface TicketStoreState {
  tickets: Ticket[];
  loading: boolean;
  error?: string;
  
  // Actions
  fetchTickets: () => Promise<void>;
  createNewTicket: (payload: CreateTicketPayload) => Promise<{ error: boolean; message?: string }>;
  updateTicketData: (payload: UpdateTicketPayload) => Promise<{ error: boolean; message?: string }>;
  updateTicketLocal: (ticketId: string, updates: Partial<Ticket>) => void;
  clearTickets: () => void;
}

export const useTicketStore = create<TicketStoreState>((set, get) => ({
  tickets: [],
  loading: false,
  error: undefined,

  fetchTickets: async () => {
    set({ loading: true, error: undefined });
    
    try {
      const res = await getTickets();
      
      if (!res.error && res.data && res.data.success) {
        set({ 
          tickets: res.data.data, 
          loading: false 
        });
      } else {
        set({ 
          error: res.message || "Failed to fetch tickets", 
          loading: false 
        });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "Failed to fetch tickets", 
        loading: false 
      });
    }
  },

  createNewTicket: async (payload: CreateTicketPayload) => {
    try {
      const res = await createTicket(payload);
      
      if (!res.error && res.data && res.data.success) {
        // Add the new ticket to the local state
        const { tickets } = get();
        set({ tickets: [...tickets, res.data.data] });
        
        return { error: false, message: res.data.message || "Ticket created successfully" };
      } else {
        return { error: true, message: res.message || "Failed to create ticket" };
      }
    } catch (error) {
      return { 
        error: true, 
        message: error instanceof Error ? error.message : "Failed to create ticket" 
      };
    }
  },

  updateTicketData: async (payload: UpdateTicketPayload) => {
    try {
      const res = await updateTicket(payload);
      
      if (!res.error && res.data && res.data.success) {
        // Update local state with the updated ticket
        const { tickets } = get();
        const updatedTicket = res.data.data;
        const updatedTickets = tickets.map(ticket => 
          ticket._id === payload._id ? {
            ...ticket,
            status: updatedTicket.status,
            priority: updatedTicket.priority,
            updatedAt: updatedTicket.updatedAt
          } : ticket
        );
        set({ tickets: updatedTickets });
        
        return { error: false, message: res.data.message || "Ticket updated successfully" };
      } else {
        return { error: true, message: res.message || "Failed to update ticket" };
      }
    } catch (error) {
      return { 
        error: true, 
        message: error instanceof Error ? error.message : "Failed to update ticket" 
      };
    }
  },

  updateTicketLocal: (ticketId: string, updates: Partial<Ticket>) => {
    const { tickets } = get();
    const updatedTickets = tickets.map(ticket => 
      ticket._id === ticketId ? { ...ticket, ...updates } : ticket
    );
    set({ tickets: updatedTickets });
  },

  clearTickets: () => {
    set({ 
      tickets: [], 
      error: undefined 
    });
  },
}));
