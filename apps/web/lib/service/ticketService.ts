'use server';

import { fetchWithAuth } from '.';
import { GeneralApiResponse } from '../../types/api-response';

export interface Ticket {
  _id: string;
  type: string;
  subject: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Resolved' | 'Closed';
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface TicketComment {
  _id: string;
  ticketId: string;
  message: string;
  attachments: string[];
  createdAt: string;
  userId: string;
}

export interface CreateTicketRequest {
  type: string;
  subject: string;
  description: string;
  attachments?: File[];
}

export interface TicketCommentRequest {
  message: string;
  attachments?: File[];
}

/**
 * Create a new support ticket
 * @param ticket Ticket data to be created
 * @returns newly created ticket
 */
export async function createTicket(
  ticket: CreateTicketRequest,
): Promise<GeneralApiResponse<Ticket>> {
  // const formData = new FormData();
  // formData.append('type', ticket.type);
  // formData.append('subject', ticket.subject);
  // formData.append('description', ticket.description);

  // if (ticket.attachments && ticket.attachments.length > 0) {
  //   ticket.attachments.forEach((file) => {
  //     formData.append('attachments', file);
  //   });
  // }

  return fetchWithAuth<Ticket>(`${process.env.NEXT_PUBLIC_API_URL}/tickets`, {
    method: 'POST',
    body: JSON.stringify(ticket),
    headers: {}, // Explicit empty headers to avoid Content-Type being set
  });
}

/**
 * Get all tickets for the current user
 * @returns list of tickets
 */
export async function getTickets(): Promise<GeneralApiResponse<Ticket[]>> {
  return fetchWithAuth<Ticket[]>(`${process.env.NEXT_PUBLIC_API_URL}/tickets`, {
    method: 'GET',
  });
}

/**
 * Get a specific ticket by ID
 * @param id Ticket ID
 * @returns ticket details
 */
export async function getTicketById(id: string): Promise<GeneralApiResponse<Ticket>> {
  return fetchWithAuth<Ticket>(`${process.env.NEXT_PUBLIC_API_URL}/tickets/${id}`, {
    method: 'GET',
  });
}

/**
 * Update a ticket's status
 * @param id Ticket ID
 * @param status New status
 * @returns updated ticket
 */
export async function updateTicketStatus(
  id: string,
  status: 'Pending' | 'In Progress' | 'Resolved' | 'Closed',
): Promise<GeneralApiResponse<Ticket>> {
  return fetchWithAuth<Ticket>(`${process.env.NEXT_PUBLIC_API_URL}/tickets/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

/**
 * Add a comment to a ticket
 * @param ticketId Ticket ID
 * @param comment Comment data
 * @returns newly created comment
 */
export async function addCommentToTicket(
  ticketId: string,
  comment: TicketCommentRequest,
): Promise<GeneralApiResponse<TicketComment>> {
  return fetchWithAuth<TicketComment>(
    `${process.env.NEXT_PUBLIC_API_URL}/tickets/${ticketId}/comments`,
    {
      method: 'POST',
      body: JSON.stringify(comment),
    },
  );
}

/**
 * Add attachments to a ticket
 * @param ticketId Ticket ID
 * @param files Files to attach
 * @returns updated ticket
 */
export async function addAttachmentsToTicket(
  ticketId: string,
  files: File[],
): Promise<GeneralApiResponse<Ticket>> {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('attachments', file);
  });

  return fetchWithAuth<Ticket>(
    `${process.env.NEXT_PUBLIC_API_URL}/tickets/${ticketId}/attachments`,
    {
      method: 'POST',
      body: formData,
      headers: {}, // Explicit empty headers to avoid Content-Type being set for FormData
    },
  );
}
