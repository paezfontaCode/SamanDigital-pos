/**
 * Schemas de validación para operaciones financieras
 */
import { z } from 'zod';

// Schema para apertura de caja
export const openCashRegisterSchema = z.object({
  openingAmount: z.number().positive('El monto de apertura debe ser mayor a 0'),
  notes: z.string().optional().nullable(),
});

// Schema para cierre de caja
export const closeCashRegisterSchema = z.object({
  closingAmount: z.number().nonnegative('El monto de cierre no puede ser negativo'),
  notes: z.string().optional().nullable(),
});

// Schema para registrar gasto manual
export const registerExpenseSchema = z.object({
  amount: z.number().positive('El monto debe ser mayor a 0'),
  category: z.enum(['FIXED_EXPENSE', 'SALARY', 'SUPPLIES', 'MAINTENANCE', 'OTHER']),
  description: z.string().min(1, 'La descripción es requerida'),
});

// Schema para registrar abono de cliente
export const registerPaymentSchema = z.object({
  accountId: z.string().cuid('ID de cuenta inválido'),
  accountType: z.enum(['RECEIVABLE', 'PAYABLE']),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  method: z.enum(['CASH', 'CARD', 'TRANSFER']),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

// Schema para crear cuenta por pagar
export const createAccountPayableSchema = z.object({
  supplierId: z.string().cuid('Proveedor inválido'),
  invoiceNumber: z.string().min(1, 'Número de factura requerido'),
  amount: z.number().positive('El monto debe ser mayor a 0'),
  dueDate: z.date(),
  description: z.string().min(1, 'Descripción requerida'),
  daysCredit: z.number().int().min(0).optional(),
});

// Schema para gasto fijo recurrente
export const fixedExpenseSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  amount: z.number().positive('Monto debe ser mayor a 0'),
  frequency: z.enum(['WEEKLY', 'MONTHLY']),
  dueDay: z.number().int().min(1).max(31),
  category: z.enum(['RENT', 'UTILITIES', 'SALARY', 'INTERNET', 'INSURANCE', 'OTHER']),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export type OpenCashRegisterInput = z.infer<typeof openCashRegisterSchema>;
export type CloseCashRegisterInput = z.infer<typeof closeCashRegisterSchema>;
export type RegisterExpenseInput = z.infer<typeof registerExpenseSchema>;
export type RegisterPaymentInput = z.infer<typeof registerPaymentSchema>;
export type CreateAccountPayableInput = z.infer<typeof createAccountPayableSchema>;
export type FixedExpenseInput = z.infer<typeof fixedExpenseSchema>;
