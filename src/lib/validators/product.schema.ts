/**
 * Schema de validación para productos
 */
import { z } from 'zod';

export const productSchema = z.object({
  barcode: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  type: z.enum(['ACCESORIO', 'REPUESTO', 'SERVICIO_MANO_OBRA']),
  costPrice: z.number().positive('El costo debe ser positivo'),
  sellPrice: z.number().positive('El precio de venta debe ser positivo'),
  technicianPrice: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0).default(0),
  minStock: z.number().int().min(0).default(5),
  compatibleModels: z.string().optional(),
  restockTime: z.string().optional(),
  categoryId: z.string().min(1, 'La categoría es requerida'),
  supplierId: z.string().optional().nullable(),
});

export const createProductSchema = productSchema;
export const updateProductSchema = productSchema.partial();

export type ProductInput = z.infer<typeof productSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
