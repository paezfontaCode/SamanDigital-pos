/**
 * Schema de validación para tickets de servicio técnico
 */
import { z } from 'zod';

export const ticketSchema = z.object({
  deviceBrand: z.string().min(1, 'La marca es requerida'),
  deviceModel: z.string().min(1, 'El modelo es requerido'),
  deviceSerial: z.string().optional().nullable(),
  devicePassword: z.string().optional().nullable(),
  issue: z.string().min(1, 'La falla reportada es requerida'),
  notes: z.string().optional().nullable(),
  problemType: z.string().optional().nullable(),
  isWarrantyService: z.boolean().default(false),
  relatedTicketId: z.string().optional().nullable(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'READY', 'DELIVERED', 'CANCELLED', 'WARRANTY']),
  queuePosition: z.number().int().optional().nullable(),
  estimatedCost: z.number().min(0).default(0),
  finalCost: z.number().min(0).default(0),
  amountPaid: z.number().min(0).default(0),
  warrantyExpiry: z.date().optional().nullable(),
  photos: z.string().optional().nullable(),
  clientId: z.string().min(1, 'El cliente es requerido'),
  technicianId: z.string().optional().nullable(),
});

export const createTicketSchema = ticketSchema;
export const updateTicketSchema = ticketSchema.partial();

export type TicketInput = z.infer<typeof ticketSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
