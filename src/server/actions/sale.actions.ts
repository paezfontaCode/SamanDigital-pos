/**
 * Server Actions para gestión de ventas (POS)
 */
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}

interface SaleData {
  items: CartItem[];
  customerId?: string;
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'CREDIT' | 'MIXED';
  amountReceived?: number;
  discount?: number;
  cashRegisterId?: string;
  userId: string;
}

interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: Record<string, string[]>;
}

/**
 * Schema para crear cliente rápido desde POS
 */
const quickClientSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  phone: z.string().min(1, 'El teléfono es requerido'),
  email: z.string().email().optional().nullable(),
  creditLimit: z.number().default(0),
});

/**
 * Crear una venta (transacción completa)
 */
export async function createSale(data: SaleData): Promise<ActionResult> {
  const { items, customerId, paymentMethod, amountReceived, discount = 0, cashRegisterId, userId } = data;

  try {
    // Validar que haya items
    if (!items || items.length === 0) {
      return {
        success: false,
        message: 'La venta debe tener al menos un producto',
      };
    }

    // Obtener productos y validar stock en transacción
    const result = await prisma.$transaction(async (tx) => {
      // Obtener todos los productos del carrito
      const productIds = items.map((item) => item.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        include: { category: true },
      });

      // Validar stock de cada producto
      for (const item of items) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) {
          throw new Error(`Producto no encontrado: ${item.productId}`);
        }
        if (product.stock < item.quantity) {
          throw new Error(`Stock insuficiente para "${product.name}". Disponible: ${product.stock}`);
        }
        if (product.isDeleted) {
          throw new Error(`El producto "${product.name}" está eliminado`);
        }
      }

      // Si hay cliente, verificar límite de crédito si es pago a crédito
      let client = null;
      if (customerId) {
        client = await tx.client.findUnique({
          where: { id: customerId },
        });

        if (!client) {
          throw new Error('Cliente no encontrado');
        }

        // Calcular total de la venta
        const subtotal = items.reduce((sum, item) => {
          const product = products.find((p) => p.id === item.productId)!;
          return sum + product.sellPrice * item.quantity;
        }, 0);
        const total = subtotal - discount;

        // Si es crédito o pago parcial, verificar límite
        if (paymentMethod === 'CREDIT' || (amountReceived !== undefined && amountReceived < total)) {
          const newDebt = client.debtBalance + (total - (amountReceived || 0));
          if (client.creditLimit > 0 && newDebt > client.creditLimit) {
            throw new Error(
              `El cliente excedería su límite de crédito. Límite: ${client.creditLimit}, Deuda actual: ${client.debtBalance}, Nueva deuda: ${newDebt}`
            );
          }
        }
      }

      // Calcular totales
      const subtotal = items.reduce((sum, item) => {
        const product = products.find((p) => p.id === item.productId)!;
        return sum + product.sellPrice * item.quantity;
      }, 0);
      const tax = 0; // Por ahora sin impuestos
      const total = subtotal - discount;

      // Generar número correlativo
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
      
      // Obtener el último número del día
      const lastSale = await tx.sale.findFirst({
        where: {
          number: { startsWith: `V-${dateStr}-` },
          isDeleted: false,
        },
        orderBy: { createdAt: 'desc' },
      });

      let sequenceNumber = 1;
      if (lastSale) {
        const lastNum = parseInt(lastSale.number.split('-')[2] || '0', 10);
        sequenceNumber = lastNum + 1;
      }
      const saleNumber = `V-${dateStr}-${String(sequenceNumber).padStart(3, '0')}`;

      // Crear venta
      const sale = await tx.sale.create({
        data: {
          number: saleNumber,
          status: paymentMethod === 'CREDIT' || (amountReceived !== undefined && amountReceived < total) ? 'CREDIT' : 'COMPLETED',
          subtotal,
          tax,
          discount,
          total,
          paymentMethod,
          clientId: customerId ?? null,
          userId,
          cashRegisterId: cashRegisterId ?? null,
        },
      });

      // Crear items de venta y descontar stock
      for (const item of items) {
        const product = products.find((p) => p.id === item.productId)!;
        
        // Crear item de venta
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            quantity: item.quantity,
            price: product.sellPrice,
            subtotal: product.sellPrice * item.quantity,
          },
        });

        // Descontar stock
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: product.stock - item.quantity },
        });

        // Crear movimiento de inventario (salida por venta)
        await tx.inventoryMovement.create({
          data: {
            type: 'OUT',
            quantity: item.quantity,
            reason: `Venta ${saleNumber}`,
            productId: item.productId,
            userId,
            referenceId: sale.id,
          },
        });

        // Verificar si el stock quedó bajo mínimo
        const newStock = product.stock - item.quantity;
        if (newStock <= product.minStock && newStock > 0) {
          await tx.notification.create({
            data: {
              type: 'LOW_STOCK',
              title: 'Stock Bajo',
              message: `El producto "${product.name}" tiene stock bajo (${newStock} unidades). Mínimo recomendado: ${product.minStock}`,
              targetRole: 'ADMIN',
              referenceType: 'PRODUCT',
              referenceId: product.id,
            },
          });
        } else if (newStock === 0) {
          await tx.notification.create({
            data: {
              type: 'LOW_STOCK',
              title: 'Producto Agotado',
              message: `El producto "${product.name}" está agotado.`,
              targetRole: 'ADMIN',
              referenceType: 'PRODUCT',
              referenceId: product.id,
            },
          });
        }
      }

      // Crear CashMovement (INCOME)
      const amountToRegister = amountReceived !== undefined ? amountReceived : total;
      if (cashRegisterId) {
        await tx.cashMovement.create({
          data: {
            type: 'INCOME',
            category: 'SALE',
            amount: amountToRegister,
            description: `Venta ${saleNumber}${customerId ? ` - ${client?.name}` : ''}`,
            cashRegisterId,
            userId,
            referenceId: sale.id,
          },
        });
      }

      // Si es pago parcial o crédito, crear AccountReceivable
      if (paymentMethod === 'CREDIT' || (amountReceived !== undefined && amountReceived < total)) {
        const pendingAmount = total - (amountReceived || 0);
        await tx.accountReceivable.create({
          data: {
            amount: pendingAmount,
            balance: pendingAmount,
            status: pendingAmount === total ? 'PENDING' : 'PARTIAL',
            clientId: customerId!,
            referenceType: 'SALE',
            referenceId: sale.id,
          },
        });

        // Actualizar deuda del cliente
        if (customerId) {
          await tx.client.update({
            where: { id: customerId },
            data: {
              debtBalance: client!.debtBalance + pendingAmount,
            },
          });
        }
      }

      // Registrar en AuditLog
      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'Sale',
          entityId: sale.id,
          details: JSON.stringify({
            number: sale.number,
            total,
            items: items.length,
            customer: client?.name || 'Sin cliente',
          }),
        },
      });

      return sale;
    });

    revalidatePath('/vendedor/pos');
    revalidatePath('/inventario/accesorios');

    return {
      success: true,
      message: 'Venta completada exitosamente',
      data: result,
    };
  } catch (error: any) {
    console.error('Error creando venta:', error);
    return {
      success: false,
      message: error.message || 'Error al completar la venta',
    };
  }
}

/**
 * Buscar cliente por nombre o teléfono
 */
export async function searchClient(query: string) {
  try {
    if (!query || query.length < 2) {
      return [];
    }

    const clients = await prisma.client.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        debtBalance: true,
        creditLimit: true,
      },
      take: 10,
    });

    return clients;
  } catch (error) {
    console.error('Error buscando cliente:', error);
    return [];
  }
}

/**
 * Crear cliente rápido desde POS
 */
export async function quickCreateClient(data: z.infer<typeof quickClientSchema>) {
  try {
    const validatedData = quickClientSchema.parse(data);

    const client = await prisma.client.create({
      data: {
        ...validatedData,
        email: validatedData.email ?? null,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Client',
        entityId: client.id,
        details: JSON.stringify({ name: client.name, phone: client.phone }),
      },
    });

    return {
      success: true,
      message: 'Cliente creado exitosamente',
      data: client,
    };
  } catch (error: any) {
    if (error.errors) {
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

    console.error('Error creando cliente:', error);
    return {
      success: false,
      message: 'Error al crear el cliente',
    };
  }
}

/**
 * Obtener categorías de productos
 */
export async function getProductCategories(type?: string) {
  try {
    const where: any = {};
    if (type) {
      where.type = type;
    }

    const categories = await prisma.productCategory.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return categories;
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    return [];
  }
}

/**
 * Obtener proveedores
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

/**
 * Obtener caja abierta actual
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

    return cashRegister;
  } catch (error) {
    console.error('Error obteniendo caja:', error);
    return null;
  }
}
