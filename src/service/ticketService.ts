import { doGET, doPOST, doPUT } from "@/utils/HttpUtils";
import { API_ENDPOINTS } from "@/utils/constant";
import {
  Ticket,
  CreateTicketPayload,
  UpdateTicketPayload,
  TicketResponse,
  CreateTicketResponse,
  UpdateTicketResponse,
} from "@/types/ticket.types";

// Get all tickets (admin) or user's tickets
export const getTickets = async (): Promise<{ error: boolean; data?: TicketResponse; message?: string }> => {
  try {
    const response = await doGET(API_ENDPOINTS.TICKETS_GET);
    
    if ((response.status === 200 || response.status === 201) && response.data?.success) {
      return { error: false, data: response.data };
    } else {
      return { error: true, message: response.message || "Failed to fetch tickets" };
    }
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return { 
      error: true, 
      message: error instanceof Error ? error.message : "Failed to fetch tickets" 
    };
  }
};

// Create a new ticket
export const createTicket = async (payload: CreateTicketPayload): Promise<{ error: boolean; data?: CreateTicketResponse; message?: string }> => {
  try {
    const response = await doPOST(API_ENDPOINTS.TICKETS_CREATE, payload);
    
    if ((response.status === 200 || response.status === 201) && response.data?.success) {
      return { error: false, data: response.data };
    } else {
      return { error: true, message: response.message || "Failed to create ticket" };
    }
  } catch (error) {
    console.error("Error creating ticket:", error);
    return { 
      error: true, 
      message: error instanceof Error ? error.message : "Failed to create ticket" 
    };
  }
};

// Update ticket (admin only)
export const updateTicket = async (payload: UpdateTicketPayload): Promise<{ error: boolean; data?: UpdateTicketResponse; message?: string }> => {
  try {
    const response = await doPUT(`${API_ENDPOINTS.TICKETS_UPDATE}/${payload._id}`, {
      status: payload.status,
      priority: payload.priority,
    });
    
    if ((response.status === 200 || response.status === 201) && response.data?.success) {
      return { error: false, data: response.data };
    } else {
      return { error: true, message: response.message || "Failed to update ticket" };
    }
  } catch (error) {
    console.error("Error updating ticket:", error);
    return { 
      error: true, 
      message: error instanceof Error ? error.message : "Failed to update ticket" 
    };
  }
};
