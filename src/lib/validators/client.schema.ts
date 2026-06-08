/**
 * Schema de validación para clientes
 */
import { z } from 'zod';

export const clientSchema = z.object({
  document: z.string().optional().nullable(),
  name: z.string().min(1, 'El nombre es requerido'),
  phone: z.string().min(1, 'El teléfono es requerido'),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  creditLimit: z.number().min(0).default(0),
  debtBalance: z.number().min(0).default(0),
});

export const createClientSchema = clientSchema;
export const updateClientSchema = clientSchema.partial();

export type ClientInput = z.infer<typeof clientSchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
