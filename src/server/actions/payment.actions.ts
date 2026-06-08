/**
 * Server Actions para gestión de pagos y cuentas por cobrar
 */
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { registerPaymentSchema } from '@/lib/validators/finance.schema';

interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: Record<string, string[]>;
}

/**
 * Registrar un abono/pago a una cuenta por cobrar
 */
export async function registerPayment(
  data: {
    accountId: string;
    accountType: 'RECEIVABLE' | 'PAYABLE';
    amount: number;
    method: 'CASH' | 'CARD' | 'TRANSFER';
    reference?: string | null;
    notes?: string | null;
  },
  userId: string
): Promise<ActionResult> {
  try {
    const validatedData = registerPaymentSchema.parse(data);

    return await prisma.$transaction(async (tx) => {
      let account;
      let client;
      let supplier;

      if (validatedData.accountType === 'RECEIVABLE') {
        // Cuenta por cobrar (cliente)
        account = await tx.accountReceivable.findUnique({
          where: { id: validatedData.accountId },
          include: { client: true },
        });

        if (!account) {
          throw new Error('Cuenta por cobrar no encontrada');
        }

        if (account.status === 'PAID') {
          throw new Error('Esta cuenta ya está totalmente pagada');
        }

        client = account.client;

        // Verificar que el monto no exceda el saldo
        if (validatedData.amount > account.balance) {
          throw new Error(`El monto excede el saldo pendiente. Saldo: ${account.balance}`);
        }

        // Actualizar cuenta por cobrar
        const newBalance = account.balance - validatedData.amount;
        const newStatus = newBalance === 0 ? 'PAID' : 'PARTIAL';

        account = await tx.accountReceivable.update({
          where: { id: validatedData.accountId },
          data: {
            balance: newBalance,
            status: newStatus,
          },
        });

        // Actualizar deuda del cliente
        await tx.client.update({
          where: { id: account.clientId },
          data: {
            debtBalance: client.debtBalance - validatedData.amount,
          },
        });

        // Crear Payment asociado a AccountReceivable
        const payment = await tx.payment.create({
          data: {
            amount: validatedData.amount,
            method: validatedData.method,
            reference: validatedData.reference,
            arId: validatedData.accountId,
            // Asociar también a la venta/ticket original si existe
            saleId: account.referenceType === 'SALE' ? account.referenceId : null,
            ticketId: account.referenceType === 'TICKET' ? account.referenceId : null,
          },
        });

        // Buscar caja abierta para registrar movimiento
        const cashRegister = await tx.cashRegister.findFirst({
          where: { status: 'OPEN' },
          orderBy: { openedAt: 'desc' },
        });

        if (cashRegister) {
          // Crear CashMovement INCOME
          await tx.cashMovement.create({
            data: {
              type: 'INCOME',
              category: 'PARTIAL_PAYMENT',
              amount: validatedData.amount,
              description: `Abono de ${client.name} - ${account.referenceType === 'SALE' ? 'Venta' : 'Servicio'}`,
              cashRegisterId: cashRegister.id,
              userId,
              referenceId: payment.id,
            },
          });
        }

        // AuditLog
        await tx.auditLog.create({
          data: {
            action: 'CREATE',
            entity: 'Payment',
            entityId: payment.id,
            details: JSON.stringify({
              amount: validatedData.amount,
              method: validatedData.method,
              client: client.name,
              remainingBalance: newBalance,
            }),
            userId,
          },
        });

        revalidatePath('/finanzas/cobrar');
        revalidatePath('/vendedor/clientes');

        return {
          success: true,
          message: 'Abono registrado exitosamente',
          data: { payment, account },
        };
      } else {
        // Cuenta por pagar (proveedor)
        account = await tx.accountPayable.findUnique({
          where: { id: validatedData.accountId },
          include: { supplier: true },
        });

        if (!account) {
          throw new Error('Cuenta por pagar no encontrada');
        }

        if (account.status === 'PAID') {
          throw new Error('Esta cuenta ya está totalmente pagada');
        }

        supplier = account.supplier;

        // Verificar que el monto no exceda el saldo
        if (validatedData.amount > account.balance) {
          throw new Error(`El monto excede el saldo pendiente. Saldo: ${account.balance}`);
        }

        // Actualizar cuenta por pagar
        const newBalance = account.balance - validatedData.amount;
        const newStatus = newBalance === 0 ? 'PAID' : 'PARTIAL';

        account = await tx.accountPayable.update({
          where: { id: validatedData.accountId },
          data: {
            balance: newBalance,
            status: newStatus,
          },
        });

        // Crear Payment asociado a AccountPayable
        const payment = await tx.payment.create({
          data: {
            amount: validatedData.amount,
            method: validatedData.method,
            reference: validatedData.reference,
            apId: validatedData.accountId,
          },
        });

        // Buscar caja abierta para registrar movimiento
        const cashRegister = await tx.cashRegister.findFirst({
          where: { status: 'OPEN' },
          orderBy: { openedAt: 'desc' },
        });

        if (cashRegister) {
          // Crear CashMovement EXPENSE
          await tx.cashMovement.create({
            data: {
              type: 'EXPENSE',
              category: 'SUPPLIER_PAYMENT',
              amount: validatedData.amount,
              description: `Pago a proveedor: ${supplier.name}`,
              cashRegisterId: cashRegister.id,
              userId,
              referenceId: payment.id,
            },
          });
        }

        // AuditLog
        await tx.auditLog.create({
          data: {
            action: 'CREATE',
            entity: 'Payment',
            entityId: payment.id,
            details: JSON.stringify({
              amount: validatedData.amount,
              method: validatedData.method,
              supplier: supplier.name,
              remainingBalance: newBalance,
            }),
            userId,
          },
        });

        revalidatePath('/finanzas/pagar');

        return {
          success: true,
          message: 'Pago a proveedor registrado exitosamente',
          data: { payment, account },
        };
      }
    });
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

    console.error('Error registrando pago:', error);
    return {
      success: false,
      message: error.message || 'Error al registrar el pago',
    };
  }
}

/**
 * Obtener lista de cuentas por cobrar con filtros
 */
export async function getAccountsReceivable(filters?: {
  clientId?: string;
  status?: 'PENDING' | 'PARTIAL' | 'PAID';
  overdue?: boolean;
}) {
  try {
    const where: any = {};

    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    // Filtrar por vencidas (solo las no pagadas)
    if (filters?.overdue) {
      where.AND = [
        ...(where.AND || []),
        {
          status: { not: 'PAID' },
          dueDate: { lt: new Date() },
        },
      ];
    }

    const accounts = await prisma.accountReceivable.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            creditLimit: true,
            debtBalance: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // PENDING primero
        { dueDate: 'asc' }, // Más antiguas primero
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
    console.error('Error obteniendo cuentas por cobrar:', error);
    return [];
  }
}

/**
 * Obtener detalle de una cuenta por cobrar específica
 */
export async function getAccountDetail(accountId: string, type: 'RECEIVABLE' | 'PAYABLE') {
  try {
    if (type === 'RECEIVABLE') {
      const account = await prisma.accountReceivable.findUnique({
        where: { id: accountId },
        include: {
          client: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              address: true,
              creditLimit: true,
              debtBalance: true,
            },
          },
          payments: {
            include: {
              // No incluir datos sensibles de otras relaciones
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!account) {
        return null;
      }

      // Obtener ventas/tickets relacionados si existen
      let relatedSales = [];
      let relatedTickets = [];

      if (account.referenceType === 'SALE') {
        relatedSales = await prisma.sale.findMany({
          where: { id: account.referenceId },
          include: {
            items: {
              include: {
                product: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        });
      } else if (account.referenceType === 'TICKET') {
        relatedTickets = await prisma.ticket.findMany({
          where: { id: account.referenceId },
          include: {
            items: {
              include: {
                product: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        });
      }

      return {
        account,
        relatedSales,
        relatedTickets,
      };
    } else {
      // PAYABLE
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
    }
  } catch (error) {
    console.error('Error obteniendo detalle de cuenta:', error);
    return null;
  }
}

/**
 * Obtener resumen de cuentas por cobrar de un cliente
 */
export async function getClientAccountsSummary(clientId: string) {
  try {
    const [accounts, totalDebt, client] = await Promise.all([
      prisma.accountReceivable.findMany({
        where: { clientId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.accountReceivable.aggregate({
        where: { clientId, status: { not: 'PAID' } },
        _sum: { balance: true },
      }),
      prisma.client.findUnique({
        where: { id: clientId },
        select: {
          id: true,
          name: true,
          creditLimit: true,
          debtBalance: true,
        },
      }),
    ]);

    return {
      client,
      accounts,
      totalPending: totalDebt._sum.balance || 0,
      availableCredit: client?.creditLimit ? client.creditLimit - client.debtBalance : 0,
    };
  } catch (error) {
    console.error('Error obteniendo resumen de cliente:', error);
    return null;
  }
}
