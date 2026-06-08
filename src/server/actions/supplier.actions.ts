/**
 * Server Actions para gestión de proveedores y cuentas por pagar
 */
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { createAccountPayableSchema } from '@/lib/validators/finance.schema';

interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: Record<string, string[]>;
}

/**
 * Crear una cuenta por pagar (factura de proveedor)
 */
export async function createAccountPayable(
  data: {
    supplierId: string;
    invoiceNumber: string;
    amount: number;
    dueDate: Date;
    description: string;
    daysCredit?: number;
  },
  userId: string
): Promise<ActionResult> {
  try {
    const validatedData = createAccountPayableSchema.parse(data);

    // Verificar que el proveedor existe
    const supplier = await prisma.supplier.findUnique({
      where: { id: validatedData.supplierId },
    });

    if (!supplier) {
      return {
        success: false,
        message: 'Proveedor no encontrado',
      };
    }

    // Calcular fecha de vencimiento si se proporcionan días de crédito
    let finalDueDate = validatedData.dueDate;
    if (validatedData.daysCredit && !validatedData.dueDate) {
      finalDueDate = new Date();
      finalDueDate.setDate(finalDueDate.getDate() + validatedData.daysCredit);
    }

    // Crear cuenta por pagar
    const account = await prisma.accountPayable.create({
      data: {
        supplierId: validatedData.supplierId,
        amount: validatedData.amount,
        balance: validatedData.amount,
        status: 'PENDING',
        dueDate: finalDueDate,
        description: `${validatedData.invoiceNumber} - ${validatedData.description}`,
      },
    });

    // AuditLog
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'AccountPayable',
        entityId: account.id,
        details: JSON.stringify({
          invoiceNumber: validatedData.invoiceNumber,
          amount: validatedData.amount,
          supplier: supplier.name,
          dueDate: finalDueDate,
        }),
        userId,
      },
    });

    revalidatePath('/finanzas/pagar');

    return {
      success: true,
      message: 'Factura de proveedor registrada exitosamente',
      data: account,
    };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string[]> = {};
      error.errors.forEach((err: any) => {
        if (err.path) {
          fieldErrors[err.path[0]] = [err.message];
        }
      });
      return {
        success: false,
        message: 'Error de validación',
        errors: fieldErrors,
      };
    }

    console.error('Error creando cuenta por pagar:', error);
    return {
      success: false,
      message: error.message || 'Error al registrar la factura',
    };
  }
}

/**
 * Pagar a un proveedor (parcial o totalmente)
 */
export async function paySupplier(
  accountId: string,
  amount: number,
  method: 'CASH' | 'CARD' | 'TRANSFER',
  reference?: string | null,
  userId?: string
): Promise<ActionResult> {
  try {
    // Importar registerPayment para usar su lógica
    const { registerPayment } = await import('./payment.actions');

    return await registerPayment(
      {
        accountId,
        accountType: 'PAYABLE',
        amount,
        method,
        reference: reference || null,
        notes: null,
      },
      userId || 'system'
    );
  } catch (error: any) {
    console.error('Error pagando a proveedor:', error);
    return {
      success: false,
      message: error.message || 'Error al realizar el pago',
    };
  }
}

/**
 * Obtener lista de cuentas por pagar con filtros
 */
export async function getAccountsPayable(filters?: {
  supplierId?: string;
  status?: 'PENDING' | 'PARTIAL' | 'PAID';
  overdue?: boolean;
}) {
  try {
    const where: any = {};

    if (filters?.supplierId) {
      where.supplierId = filters.supplierId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    // Filtrar por vencidas
    if (filters?.overdue) {
      where.AND = [
        ...(where.AND || []),
        {
          status: { not: 'PAID' },
          dueDate: { lt: new Date() },
        },
      ];
    }

    const accounts = await prisma.accountPayable.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            contact: true,
            phone: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' },
        { dueDate: 'asc' },
      ],
    });

    // Calcular días restantes/vencidos
    const accountsWithDays = accounts.map((account) => {
      const now = new Date();
      const dueDate = account.dueDate ? new Date(account.dueDate) : null;
      let daysUntilDue: number | null = null;
      let isOverdue = false;
      let urgency: 'ok' | 'warning' | 'danger' = 'ok';

      if (dueDate) {
        const diffTime = dueDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        daysUntilDue = diffDays;
        isOverdue = diffDays < 0;

        if (isOverdue) {
          urgency = 'danger';
        } else if (diffDays <= 3 && account.status !== 'PAID') {
          urgency = 'warning';
        }
      }

      return {
        ...account,
        daysUntilDue,
        isOverdue,
        urgency,
      };
    });

    return accountsWithDays;
  } catch (error) {
    console.error('Error obteniendo cuentas por pagar:', error);
    return [];
  }
}

/**
 * Obtener detalle de una cuenta por pagar
 */
export async function getAccountPayableDetail(accountId: string) {
  try {
    const account = await prisma.accountPayable.findUnique({
      where: { id: accountId },
      include: {
        supplier: true,
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return account;
  } catch (error) {
    console.error('Error obteniendo detalle de cuenta por pagar:', error);
    return null;
  }
}

/**
 * Obtener resumen de cuentas por pagar de un proveedor
 */
export async function getSupplierAccountsSummary(supplierId: string) {
  try {
    const [accounts, totalPending, supplier] = await Promise.all([
      prisma.accountPayable.findMany({
        where: { supplierId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.accountPayable.aggregate({
        where: { supplierId, status: { not: 'PAID' } },
        _sum: { balance: true },
      }),
      prisma.supplier.findUnique({
        where: { id: supplierId },
      }),
    ]);

    return {
      supplier,
      accounts,
      totalPending: totalPending._sum.balance || 0,
    };
  } catch (error) {
    console.error('Error obteniendo resumen de proveedor:', error);
    return null;
  }
}

/**
 * Obtener todos los proveedores
 */
export async function getSuppliers() {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' },
    });

    return suppliers;
  } catch (error) {
    console.error('Error obteniendo proveedores:', error);
    return [];
  }
}
