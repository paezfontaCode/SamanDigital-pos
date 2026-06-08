/**
 * Server Actions para gestión de productos (inventario)
 */
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { createProductSchema, updateProductSchema } from '@/lib/validators/product.schema';
import type { CreateProductInput, UpdateProductInput } from '@/lib/validators/product.schema';

interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: Record<string, string[]>;
}

/**
 * Crear un nuevo producto
 */
export async function createProduct(data: CreateProductInput): Promise<ActionResult> {
  try {
    // Validar con Zod
    const validatedData = createProductSchema.parse(data);

    // Verificar que precio venta >= precio costo
    if (validatedData.sellPrice < validatedData.costPrice) {
      return {
        success: false,
        message: 'El precio de venta debe ser mayor o igual al precio de costo',
      };
    }

    // Crear producto en transacción
    const product = await prisma.product.create({
      data: {
        ...validatedData,
        technicianPrice: validatedData.technicianPrice ?? null,
        supplierId: validatedData.supplierId ?? null,
        barcode: validatedData.barcode ?? null,
        description: validatedData.description ?? null,
        compatibleModels: validatedData.compatibleModels ?? null,
        restockTime: validatedData.restockTime ?? null,
      },
    });

    // Registrar en AuditLog
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Product',
        entityId: product.id,
        details: JSON.stringify({ name: product.name, type: product.type }),
      },
    });

    revalidatePath('/inventario/accesorios');
    revalidatePath('/inventario/repuestos');

    return {
      success: true,
      message: 'Producto creado exitosamente',
      data: product,
    };
  } catch (error: any) {
    if (error.errors) {
      // Error de validación Zod
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

    console.error('Error creando producto:', error);
    return {
      success: false,
      message: 'Error al crear el producto',
    };
  }
}

/**
 * Actualizar producto existente
 */
export async function updateProduct(id: string, data: UpdateProductInput): Promise<ActionResult> {
  try {
    // Validar con Zod (schema parcial)
    const validatedData = updateProductSchema.parse(data);

    // Si se actualizan precios, verificar que venta >= costo
    if (validatedData.sellPrice !== undefined && validatedData.costPrice !== undefined) {
      if (validatedData.sellPrice < validatedData.costPrice) {
        return {
          success: false,
          message: 'El precio de venta debe ser mayor o igual al precio de costo',
        };
      }
    }

    // Obtener producto actual para comparar cambios
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return {
        success: false,
        message: 'Producto no encontrado',
      };
    }

    if (existingProduct.isDeleted) {
      return {
        success: false,
        message: 'No se puede actualizar un producto eliminado',
      };
    }

    // Actualizar producto
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: validatedData,
    });

    // Registrar cambios en AuditLog
    const changes: Record<string, any> = {};
    Object.keys(validatedData).forEach((key) => {
      const typedKey = key as keyof typeof validatedData;
      if (existingProduct[typedKey] !== validatedData[typedKey]) {
        changes[key] = {
          old: existingProduct[typedKey],
          new: validatedData[typedKey],
        };
      }
    });

    if (Object.keys(changes).length > 0) {
      await prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'Product',
          entityId: id,
          details: JSON.stringify(changes),
        },
      });
    }

    revalidatePath('/inventario/accesorios');
    revalidatePath('/inventario/repuestos');

    return {
      success: true,
      message: 'Producto actualizado exitosamente',
      data: updatedProduct,
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

    console.error('Error actualizando producto:', error);
    return {
      success: false,
      message: 'Error al actualizar el producto',
    };
  }
}

/**
 * Ajustar stock de un producto (entrada, salida o ajuste manual)
 */
export async function adjustStock(
  productId: string,
  quantity: number,
  reason: string,
  userId: string
): Promise<ActionResult> {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || product.isDeleted) {
      return {
        success: false,
        message: 'Producto no encontrado',
      };
    }

    const newStock = product.stock + quantity;

    if (newStock < 0) {
      return {
        success: false,
        message: 'No hay suficiente stock para realizar este ajuste',
      };
    }

    // Determinar tipo de movimiento
    let movementType: 'IN' | 'OUT' | 'ADJUST';
    if (quantity > 0) {
      movementType = 'IN';
    } else if (quantity < 0) {
      movementType = 'OUT';
    } else {
      movementType = 'ADJUST';
    }

    // Transacción: actualizar stock y crear movimiento
    const result = await prisma.$transaction(async (tx) => {
      // Actualizar stock
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { stock: newStock },
      });

      // Crear movimiento de inventario
      const movement = await tx.inventoryMovement.create({
        data: {
          type: movementType,
          quantity: Math.abs(quantity),
          reason,
          productId,
          userId,
        },
      });

      // Verificar si el stock quedó bajo el mínimo y crear notificación
      if (newStock <= product.minStock && newStock > 0) {
        await tx.notification.create({
          data: {
            type: 'LOW_STOCK',
            title: 'Stock Bajo',
            message: `El producto "${product.name}" tiene stock bajo (${newStock} unidades). Mínimo recomendado: ${product.minStock}`,
            targetRole: 'ADMIN',
            referenceType: 'PRODUCT',
            referenceId: productId,
          },
        });
      }

      // Si se agotó completamente
      if (newStock === 0) {
        await tx.notification.create({
          data: {
            type: 'LOW_STOCK',
            title: 'Producto Agotado',
            message: `El producto "${product.name}" está agotado.`,
            targetRole: 'ADMIN',
            referenceType: 'PRODUCT',
            referenceId: productId,
          },
        });
      }

      return { updatedProduct, movement };
    });

    // Registrar en AuditLog
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'Product',
        entityId: productId,
        details: JSON.stringify({
          stockAdjustment: {
            old: product.stock,
            new: newStock,
            quantity,
            reason,
          },
        }),
      },
    });

    revalidatePath('/inventario/accesorios');
    revalidatePath('/inventario/repuestos');

    return {
      success: true,
      message: `Stock ajustado: ${quantity > 0 ? '+' : ''}${quantity} unidades`,
      data: result.movement,
    };
  } catch (error: any) {
    console.error('Error ajustando stock:', error);
    return {
      success: false,
      message: 'Error al ajustar el stock',
    };
  }
}

/**
 * Soft delete de producto
 */
export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return {
        success: false,
        message: 'Producto no encontrado',
      };
    }

    // Verificar si tiene ventas asociadas (no permitir eliminar)
    const salesCount = await prisma.saleItem.count({
      where: { productId: id },
    });

    if (salesCount > 0) {
      return {
        success: false,
        message: 'No se puede eliminar un producto con ventas registradas',
      };
    }

    // Soft delete
    await prisma.product.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    // Registrar en AuditLog
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'Product',
        entityId: id,
        details: JSON.stringify({ name: product.name }),
      },
    });

    revalidatePath('/inventario/accesorios');
    revalidatePath('/inventario/repuestos');

    return {
      success: true,
      message: 'Producto eliminado exitosamente',
    };
  } catch (error: any) {
    console.error('Error eliminando producto:', error);
    return {
      success: false,
      message: 'Error al eliminar el producto',
    };
  }
}

/**
 * Buscar productos por nombre o código de barras
 */
export async function searchProducts(query: string, type?: string) {
  try {
    const products = await prisma.product.findMany({
      where: {
        isDeleted: false,
        type: type ? type : undefined,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { barcode: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        category: true,
        supplier: true,
      },
      take: 50,
    });

    return products;
  } catch (error) {
    console.error('Error buscando productos:', error);
    return [];
  }
}

/**
 * Obtener productos con paginación y filtros
 */
export async function getProducts({
  page = 1,
  limit = 20,
  type,
  categoryId,
  search,
  availability,
}: {
  page?: number;
  limit?: number;
  type?: string;
  categoryId?: string;
  search?: string;
  availability?: 'in-stock' | 'low-stock' | 'out-of-stock';
}) {
  try {
    const skip = (page - 1) * limit;

    const where: any = {
      isDeleted: false,
    };

    if (type) {
      where.type = type;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filtros por disponibilidad
    if (availability === 'in-stock') {
      where.stock = { gt: 0 };
    } else if (availability === 'low-stock') {
      where.AND = [
        { stock: { lte: prisma.product.fields.minStock } },
        { stock: { gt: 0 } },
      ];
    } else if (availability === 'out-of-stock') {
      where.stock = 0;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          supplier: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    };
  } catch (error) {
    console.error('Error obteniendo productos:', error);
    return { products: [], total: 0, pages: 0, currentPage: page };
  }
}

/**
 * Obtener un producto por ID
 */
export async function getProductById(id: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        supplier: true,
        movements: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    return product;
  } catch (error) {
    console.error('Error obteniendo producto:', error);
    return null;
  }
}

/**
 * Obtener movimientos de inventario de un producto
 */
export async function getProductMovements(productId: string) {
  try {
    const movements = await prisma.inventoryMovement.findMany({
      where: { productId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return movements;
  } catch (error) {
    console.error('Error obteniendo movimientos:', error);
    return [];
  }
}

/**
 * Obtener conteo de productos con stock bajo
 */
export async function getLowStockCount(type?: string) {
  try {
    const where: any = {
      isDeleted: false,
      stock: { lte: prisma.product.fields.minStock },
    };

    if (type) {
      where.type = type;
    }

    const count = await prisma.product.count({ where });
    return count;
  } catch (error) {
    console.error('Error contando stock bajo:', error);
    return 0;
  }
}

/**
 * Generar CSV de reposición
 */
export async function generateRestockCSV(type?: string): Promise<string> {
  try {
    const products = await prisma.product.findMany({
      where: {
        isDeleted: false,
        stock: { lte: prisma.product.fields.minStock },
        ...(type && { type }),
      },
      include: {
        category: true,
        supplier: true,
      },
      orderBy: { name: 'asc' },
    });

    // Encabezados CSV
    const headers = ['Nombre', 'Categoría', 'Stock Actual', 'Stock Mínimo', 'Cantidad a Reponer', 'Proveedor'];
    
    // Filas
    const rows = products.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.category?.name?.replace(/"/g, '""') || ''}"`,
      p.stock.toString(),
      p.minStock.toString(),
      (p.minStock * 2 - p.stock).toString(), // Sugerencia: reponer hasta 2x el mínimo
      `"${p.supplier?.name?.replace(/"/g, '""') || 'N/A'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    
    return csvContent;
  } catch (error) {
    console.error('Error generando CSV:', error);
    return '';
  }
}
