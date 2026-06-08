/**
 * Server Actions para gestión de caja y movimientos financieros
 */
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { openCashRegisterSchema, closeCashRegisterSchema, registerExpenseSchema } from '@/lib/validators/finance.schema';

interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: Record<string, string[]>;
}

/**
 * Abrir una nueva caja
 */
export async function openCashRegister(data: { openingAmount: number; notes?: string | null }, userId: string): Promise<ActionResult> {
  try {
    const validatedData = openCashRegisterSchema.parse(data);

    // Verificar que no haya otra caja abierta para este usuario
    const existingOpen = await prisma.cashRegister.findFirst({
      where: {
        status: 'OPEN',
        openedById: userId,
      },
    });

    if (existingOpen) {
      return {
        success: false,
        message: 'Ya tienes una caja abierta. Ciérrala antes de abrir una nueva.',
      };
    }

    // Crear la caja
    const cashRegister = await prisma.cashRegister.create({
      data: {
        openedById: userId,
        openingBalance: validatedData.openingAmount,
        status: 'OPEN',
        notes: validatedData.notes,
      },
    });

    // Registrar movimiento inicial de apertura
    await prisma.cashMovement.create({
      data: {
        type: 'INCOME',
        category: 'OPENING',
        amount: validatedData.openingAmount,
        description: 'Apertura de caja',
        cashRegisterId: cashRegister.id,
        userId,
      },
    });

    // AuditLog
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'CashRegister',
        entityId: cashRegister.id,
        details: JSON.stringify({ openingAmount: validatedData.openingAmount }),
        userId,
      },
    });

    revalidatePath('/finanzas/caja');

    return {
      success: true,
      message: 'Caja abierta exitosamente',
      data: cashRegister,
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

    console.error('Error abriendo caja:', error);
    return {
      success: false,
      message: error.message || 'Error al abrir la caja',
    };
  }
}

/**
 * Cerrar caja (solo ADMIN)
 */
export async function closeCashRegister(
  cashRegisterId: string,
  data: { closingAmount: number; notes?: string | null },
  userId: string
): Promise<ActionResult> {
  try {
    const validatedData = closeCashRegisterSchema.parse(data);

    // Verificar que la caja existe y está abierta
    const cashRegister = await prisma.cashRegister.findUnique({
      where: { id: cashRegisterId },
      include: {
        movements: {
          where: { type: 'EXPENSE' },
          select: { amount: true },
        },
      },
    });

    if (!cashRegister) {
      return {
        success: false,
        message: 'Caja no encontrada',
      };
    }

    if (cashRegister.status !== 'OPEN') {
      return {
        success: false,
        message: 'La caja ya está cerrada',
      };
    }

    // Calcular balance esperado
    const totalIncome = await prisma.cashMovement.aggregate({
      where: {
        cashRegisterId,
        type: 'INCOME',
      },
      _sum: { amount: true },
    });

    const totalExpenses = cashRegister.movements.reduce((sum, m) => sum + m.amount, 0);
    const expectedBalance = cashRegister.openingBalance + (totalIncome._sum.amount || 0) - totalExpenses;
    const difference = validatedData.closingAmount - expectedBalance;

    // Actualizar caja
    const updated = await prisma.cashRegister.update({
      where: { id: cashRegisterId },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
        closingBalance: validatedData.closingAmount,
        expectedBalance,
        difference,
        notes: validatedData.notes ? `${cashRegister.notes || ''}\n\nCIERRE:\n${validatedData.notes}` : cashRegister.notes,
      },
    });

    // AuditLog
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'CashRegister',
        entityId: cashRegisterId,
        details: JSON.stringify({
          closingAmount: validatedData.closingAmount,
          expectedBalance,
          difference,
        }),
        userId,
      },
    });

    revalidatePath('/finanzas/caja');

    return {
      success: true,
      message: `Caja cerrada. ${difference >= 0 ? 'Sobrante' : 'Faltante'}: ${difference}`,
      data: { ...updated, difference },
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

    console.error('Error cerrando caja:', error);
    return {
      success: false,
      message: error.message || 'Error al cerrar la caja',
    };
  }
}

/**
 * Registrar gasto manual desde caja
 */
export async function registerExpense(
  data: { amount: number; category: string; description: string },
  userId: string
): Promise<ActionResult> {
  try {
    const validatedData = registerExpenseSchema.parse(data);

    // Buscar caja abierta del usuario
    const cashRegister = await prisma.cashRegister.findFirst({
      where: {
        status: 'OPEN',
        openedById: userId,
      },
      orderBy: { openedAt: 'desc' },
    });

    if (!cashRegister) {
      return {
        success: false,
        message: 'No hay una caja abierta. Abre una caja antes de registrar gastos.',
      };
    }

    // Crear movimiento de egreso
    const movement = await prisma.cashMovement.create({
      data: {
        type: 'EXPENSE',
        category: validatedData.category,
        amount: validatedData.amount,
        description: validatedData.description,
        cashRegisterId: cashRegister.id,
        userId,
      },
    });

    // AuditLog
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'CashMovement',
        entityId: movement.id,
        details: JSON.stringify({
          type: 'EXPENSE',
          amount: validatedData.amount,
          category: validatedData.category,
        }),
        userId,
      },
    });

    revalidatePath('/finanzas/caja');

    return {
      success: true,
      message: 'Gasto registrado exitosamente',
      data: movement,
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

    console.error('Error registrando gasto:', error);
    return {
      success: false,
      message: error.message || 'Error al registrar el gasto',
    };
  }
}

/**
 * Obtener resumen completo de una caja
 */
export async function getCashRegisterSummary(cashRegisterId: string) {
  try {
    const cashRegister = await prisma.cashRegister.findUnique({
      where: { id: cashRegisterId },
      include: {
        openedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!cashRegister) {
      return null;
    }

    // Calcular totales por categoría
    const incomeByCategory = await prisma.cashMovement.groupBy({
      by: ['category'],
      where: {
        cashRegisterId,
        type: 'INCOME',
      },
      _sum: { amount: true },
    });

    const expenseByCategory = await prisma.cashMovement.groupBy({
      by: ['category'],
      where: {
        cashRegisterId,
        type: 'EXPENSE',
      },
      _sum: { amount: true },
    });

    // Total ingresos
    const totalIncome = await prisma.cashMovement.aggregate({
      where: {
        cashRegisterId,
        type: 'INCOME',
      },
      _sum: { amount: true },
    });

    // Total egresos
    const totalExpenses = await prisma.cashMovement.aggregate({
      where: {
        cashRegisterId,
        type: 'EXPENSE',
      },
      _sum: { amount: true },
    });

    // Saldo actual
    const currentBalance =
      cashRegister.openingBalance +
      (totalIncome._sum.amount || 0) -
      (totalExpenses._sum.amount || 0);

    // Últimos 20 movimientos
    const recentMovements = await prisma.cashMovement.findMany({
      where: { cashRegisterId },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      cashRegister,
      summary: {
        openingBalance: cashRegister.openingBalance,
        totalIncome: totalIncome._sum.amount || 0,
        totalExpenses: totalExpenses._sum.amount || 0,
        currentBalance,
        expectedClosing: currentBalance,
        incomeByCategory: incomeByCategory.map((c) => ({
          category: c.category,
          total: c._sum.amount || 0,
        })),
        expenseByCategory: expenseByCategory.map((c) => ({
          category: c.category,
          total: c._sum.amount || 0,
        })),
      },
      recentMovements,
    };
  } catch (error) {
    console.error('Error obteniendo resumen de caja:', error);
    return null;
  }
}

/**
 * Obtener caja abierta actual del usuario
 */
export async function getCurrentCashRegister(userId: string) {
  try {
    const cashRegister = await prisma.cashRegister.findFirst({
      where: {
        status: 'OPEN',
        openedById: userId,
      },
      orderBy: { openedAt: 'desc' },
    });

    return cashRegister || null;
  } catch (error) {
    console.error('Error obteniendo caja actual:', error);
    return null;
  }
}

/**
 * Obtener historial de cajas cerradas
 */
export async function getClosedCashRegisters(page: number = 1, limit: number = 10) {
  try {
    const skip = (page - 1) * limit;

    const [registers, total] = await Promise.all([
      prisma.cashRegister.findMany({
        where: { status: 'CLOSED' },
        include: {
          openedBy: {
            select: { id: true, name: true },
          },
        },
        orderBy: { closedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.cashRegister.count({
        where: { status: 'CLOSED' },
      }),
    ]);

    return {
      registers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    };
  } catch (error) {
    console.error('Error obteniendo historial de cajas:', error);
    return { registers: [], totalPages: 0, currentPage: page, total: 0 };
  }
}
