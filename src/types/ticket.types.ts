// Ticket status types
export type TicketStatus = 'open' | 'in_progress' | 'closed';

// Ticket priority types
export type TicketPriority = 'low' | 'medium' | 'high';

// User interface for ticket
export interface TicketUser {
  _id: string;
  email: string;
  name: string;
}

// Ticket interface
export interface Ticket {
  _id: string;
  userId: TicketUser;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// Create ticket payload
export interface CreateTicketPayload {
  title: string;
  description: string;
}

// Update ticket payload
export interface UpdateTicketPayload {
  _id: string;
  status?: TicketStatus;
  priority?: TicketPriority;
}

// API response interfaces
export interface TicketResponse {
  success: boolean;
  data: Ticket[];
  count: number;
}

export interface CreateTicketResponse {
  success: boolean;
  message: string;
  data: Ticket;
}

export interface UpdateTicketResponse {
  success: boolean;
  message: string;
  data: Ticket;
}
