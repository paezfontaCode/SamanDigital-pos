/**
 * Schema de validación para proveedores
 */
import { z } from 'zod';

export const supplierSchema = z.object({
  document: z.string().optional().nullable(),
  name: z.string().min(1, 'El nombre es requerido'),
  contact: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
});

export const createSupplierSchema = supplierSchema;
export const updateSupplierSchema = supplierSchema.partial();

export type SupplierInput = z.infer<typeof supplierSchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;
