/**
 * Job programado para verificaciones diarias de notificaciones
 * Se ejecuta al iniciar la app y cada hora
 */

import { prisma } from '@/lib/db/prisma';

/**
 * Verificar garantías por vencer (faltan 2 días)
 */
async function checkExpiringWarranties() {
  try {
    const today = new Date();
    const inTwoDays = new Date(today);
    inTwoDays.setDate(today.getDate() + 2);

    // Garantías que expiran en 2 días (fecha fin = hoy + 2 días)
    const expiringWarranties = await prisma.warranty.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: today,
          lte: inTwoDays,
        },
      },
      include: {
        ticket: true,
        client: true,
      },
    });

    for (const warranty of expiringWarranties) {
      // Crear notificación para el vendedor/admin
      await prisma.notification.create({
        data: {
          type: 'WARRANTY_EXPIRING',
          title: 'Garantía Expirando Pronto',
          message: `La garantía del ticket ${warranty.ticket.number} (${warranty.client.name}) expira en 2 días`,
          targetRole: 'VENDEDOR',
          referenceType: 'WARRANTY',
          referenceId: warranty.id,
        },
      });
    }

    console.log(`Notificaciones de garantía por vencer: ${expiringWarranties.length}`);
    return expiringWarranties.length;
  } catch (error) {
    console.error('Error verificando garantías por vencer:', error);
    return 0;
  }
}

/**
 * Verificar garantías vencidas (ayer fue la fecha fin)
 */
async function checkExpiredWarranties() {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Garantías que vencieron ayer
    const expiredWarranties = await prisma.warranty.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: yesterday,
          lt: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate() + 1),
        },
      },
      include: {
        ticket: true,
        client: true,
      },
    });

    for (const warranty of expiredWarranties) {
      // Actualizar estado a EXPIRED
      await prisma.warranty.update({
        where: { id: warranty.id },
        data: { status: 'EXPIRED' },
      });

      // Crear notificación
      await prisma.notification.create({
        data: {
          type: 'WARRANTY_EXPIRED',
          title: 'Garantía Vencida',
          message: `La garantía del ticket ${warranty.ticket.number} (${warranty.client.name}) ha vencido`,
          targetRole: 'VENDEDOR',
          referenceType: 'WARRANTY',
          referenceId: warranty.id,
        },
      });
    }

    console.log(`Garantías vencidas actualizadas: ${expiredWarranties.length}`);
    return expiredWarranties.length;
  } catch (error) {
    console.error('Error verificando garantías vencidas:', error);
    return 0;
  }
}

/**
 * Verificar cuentas por cobrar vencidas
 */
async function checkOverdueAccountsReceivable() {
  try {
    const today = new Date();

    const overdueAccounts = await prisma.accountReceivable.findMany({
      where: {
        status: { in: ['PENDING', 'PARTIAL'] },
        dueDate: {
          lt: today,
        },
      },
      include: {
        client: true,
      },
    });

    for (const account of overdueAccounts) {
      await prisma.notification.create({
        data: {
          type: 'ACCOUNT_OVERDUE',
          title: 'Cuenta por Cobrar Vencida',
          message: `El cliente ${account.client.name} tiene una cuenta vencida de $${account.balance}`,
          targetRole: 'VENDEDOR',
          referenceType: 'ACCOUNT_RECEIVABLE',
          referenceId: account.id,
        },
      });
    }

    console.log(`Cuentas por cobrar vencidas: ${overdueAccounts.length}`);
    return overdueAccounts.length;
  } catch (error) {
    console.error('Error verificando cuentas vencidas:', error);
    return 0;
  }
}

/**
 * Verificar pagos a proveedores próximos a vencer (3 días)
 */
async function checkUpcomingPayments() {
  try {
    const today = new Date();
    const inThreeDays = new Date(today);
    inThreeDays.setDate(today.getDate() + 3);

    const upcomingPayments = await prisma.accountPayable.findMany({
      where: {
        status: { in: ['PENDING', 'PARTIAL'] },
        dueDate: {
          gte: today,
          lte: inThreeDays,
        },
      },
      include: {
        supplier: true,
      },
    });

    for (const payment of upcomingPayments) {
      await prisma.notification.create({
        data: {
          type: 'PAYMENT_DUE',
          title: 'Pago a Proveedor Próximo',
          message: `Pago de $${payment.balance} a ${payment.supplier.name} vence en ${Math.ceil((payment.dueDate!.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} días`,
          targetRole: 'ADMIN',
          referenceType: 'ACCOUNT_PAYABLE',
          referenceId: payment.id,
        },
      });
    }

    console.log(`Pagos a proveedores próximos: ${upcomingPayments.length}`);
    return upcomingPayments.length;
  } catch (error) {
    console.error('Error verificando pagos próximos:', error);
    return 0;
  }
}

/**
 * Verificar stock bajo de productos/repuestos
 */
async function checkLowStock() {
  try {
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: {
          lte: prisma.product.fields.minStock,
        },
        isDeleted: false,
      },
    });

    for (const product of lowStockProducts) {
      // Verificar si ya existe una notificación reciente de este producto
      const existingNotification = await prisma.notification.findFirst({
        where: {
          type: 'STOCK_LOW',
          referenceType: 'PRODUCT',
          referenceId: product.id,
          isRead: false,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // últimas 24 horas
          },
        },
      });

      if (!existingNotification) {
        await prisma.notification.create({
          data: {
            type: 'STOCK_LOW',
            title: 'Stock Bajo',
            message: `El producto "${product.name}" tiene stock bajo (${product.stock} unidades, mínimo: ${product.minStock})`,
            targetRole: 'ADMIN',
            referenceType: 'PRODUCT',
            referenceId: product.id,
          },
        });
      }
    }

    console.log(`Productos con stock bajo: ${lowStockProducts.length}`);
    return lowStockProducts.length;
  } catch (error) {
    console.error('Error verificando stock bajo:', error);
    return 0;
  }
}

/**
 * Ejecutar todas las verificaciones
 */
export async function runNotificationJobs() {
  console.log('=== Iniciando jobs de notificaciones ===');
  
  const results = await Promise.all([
    checkExpiringWarranties(),
    checkExpiredWarranties(),
    checkOverdueAccountsReceivable(),
    checkUpcomingPayments(),
    checkLowStock(),
  ]);

  console.log('=== Jobs de notificaciones completados ===');
  console.log(`Total: ${results.reduce((a, b) => a + b, 0)} notificaciones generadas`);
  
  return {
    expiringWarranties: results[0],
    expiredWarranties: results[1],
    overdueAccounts: results[2],
    upcomingPayments: results[3],
    lowStock: results[4],
  };
}

/**
 * Iniciar job programado (se llama desde el layout o middleware)
 */
export function startNotificationScheduler() {
  // Ejecutar inmediatamente al iniciar
  runNotificationJobs();

  // Ejecutar cada hora
  const intervalId = setInterval(() => {
    runNotificationJobs();
  }, 60 * 60 * 1000); // 1 hora

  // Guardar el intervalId para poder limpiarlo si es necesario
  return intervalId;
}
