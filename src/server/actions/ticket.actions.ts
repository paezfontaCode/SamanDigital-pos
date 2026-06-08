/**
 * Server Actions para gestión de Tickets de Servicio Técnico
 */
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { promises as fs } from 'fs';
import path from 'path';

interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: Record<string, string[]>;
}

interface TicketItemInput {
  productId: string;
  quantity: number;
  price: number;
}

interface PaymentData {
  amount: number;
  method: 'CASH' | 'CARD' | 'TRANSFER' | 'MIXED';
  amountReceived?: number;
  cashRegisterId?: string;
  userId: string;
}

/**
 * Schema para crear ticket
 */
const createTicketSchema = z.object({
  clientId: z.string().min(1, 'El cliente es requerido'),
  deviceBrand: z.string().min(1, 'La marca es requerida'),
  deviceModel: z.string().min(1, 'El modelo es requerido'),
  deviceSerial: z.string().optional().nullable(),
  devicePassword: z.string().optional().nullable(),
  issue: z.string().min(1, 'La falla reportada es requerida'),
  problemType: z.string().optional().nullable(),
  isWarrantyService: z.boolean().default(false),
  estimatedCost: z.number().min(0).default(0),
  estimatedDays: z.number().int().min(1).default(3),
  notes: z.string().optional().nullable(),
  photos: z.array(z.string()).optional().default([]),
});

/**
 * Schema para diagnóstico del técnico
 */
const diagnosisSchema = z.object({
  diagnosis: z.string().optional().nullable(),
  technicianNotes: z.string().optional().nullable(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
    price: z.number().min(0),
  })).optional().default([]),
  laborCost: z.number().min(0).default(0),
  newEstimatedDays: z.number().int().positive().optional(),
});

/**
 * Schema para entrega de ticket
 */
const deliverTicketSchema = z.object({
  paymentAmount: z.number().min(0),
  paymentMethod: z.enum(['CASH', 'CARD', 'TRANSFER', 'MIXED']),
  isPartialPayment: z.boolean().default(false),
  cashRegisterId: z.string().optional().nullable(),
  userId: z.string(),
});

/**
 * Generar número de ticket correlativo
 */
async function generateTicketNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  
  // Obtener el último número del día
  const lastTicket = await prisma.ticket.findFirst({
    where: {
      number: { startsWith: `TK-${dateStr}-` },
      isDeleted: false,
    },
    orderBy: { createdAt: 'desc' },
  });

  let sequenceNumber = 1;
  if (lastTicket) {
    const lastNum = parseInt(lastTicket.number.split('-')[2] || '0', 10);
    sequenceNumber = lastNum + 1;
  }
  
  return `TK-${dateStr}-${String(sequenceNumber).padStart(3, '0')}`;
}

/**
 * Obtener siguiente posición en cola
 */
async function getNextQueuePosition(): Promise<number> {
  const maxPosition = await prisma.ticket.aggregate({
    where: {
      status: { in: ['PENDING', 'IN_PROGRESS'] },
      isDeleted: false,
    },
    _max: { queuePosition: true },
  });
  
  return (maxPosition._max.queuePosition || 0) + 1;
}

/**
 * Subir fotos al filesystem
 */
async function uploadPhotos(ticketNumber: string, photoData: string[]): Promise<string[]> {
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'tickets', ticketNumber);
  
  try {
    await fs.mkdir(uploadDir, { recursive: true });
    
    const savedPaths: string[] = [];
    for (let i = 0; i < photoData.length; i++) {
      const photoBase64 = photoData[i];
      // Remover prefijo data:image/...;base64,
      const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, '');
      const fileName = `photo_${i + 1}.jpg`;
      const filePath = path.join(uploadDir, fileName);
      
      await fs.writeFile(filePath, Buffer.from(base64Data, 'base64'));
      savedPaths.push(`/uploads/tickets/${ticketNumber}/${fileName}`);
    }
    
    return savedPaths;
  } catch (error) {
    console.error('Error subiendo fotos:', error);
    throw new Error('Error al guardar las fotos');
  }
}

/**
 * Crear un nuevo ticket de servicio técnico
 */
export async function createTicket(data: z.infer<typeof createTicketSchema>): Promise<ActionResult> {
  try {
    const validatedData = createTicketSchema.parse(data);
    
    // Verificar si el cliente existe y tiene deuda
    const client = await prisma.client.findUnique({
      where: { id: validatedData.clientId },
    });
    
    if (!client) {
      return {
        success: false,
        message: 'Cliente no encontrado',
      };
    }
    
    const hasDebt = client.debtBalance > 0;
    
    // Transacción para crear ticket
    const result = await prisma.$transaction(async (tx) => {
      // Generar número de ticket
      const ticketNumber = await generateTicketNumber();
      
      // Obtener siguiente posición en cola
      const queuePosition = await getNextQueuePosition();
      
      // Subir fotos si existen
      let photoPaths: string[] = [];
      if (validatedData.photos && validatedData.photos.length > 0) {
        photoPaths = await uploadPhotos(ticketNumber, validatedData.photos);
      }
      
      // Calcular fecha estimada de entrega
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + (validatedData.estimatedDays || 3));
      
      // Crear ticket
      const ticket = await tx.ticket.create({
        data: {
          number: ticketNumber,
          clientId: validatedData.clientId,
          deviceBrand: validatedData.deviceBrand,
          deviceModel: validatedData.deviceModel,
          deviceSerial: validatedData.deviceSerial ?? null,
          devicePassword: validatedData.devicePassword ?? null,
          issue: validatedData.issue,
          problemType: validatedData.problemType ?? null,
          isWarrantyService: validatedData.isWarrantyService,
          status: 'PENDING',
          queuePosition,
          estimatedCost: validatedData.estimatedCost,
          finalCost: 0,
          amountPaid: 0,
          notes: validatedData.notes ?? null,
          photos: JSON.stringify(photoPaths),
          warrantyExpiry: null,
        },
        include: {
          client: true,
          createdBy: true,
        },
      });
      
      // Crear notificación para técnicos
      await tx.notification.create({
        data: {
          type: 'TICKET_READY',
          title: 'Nuevo Ticket de Reparación',
          message: `Nuevo ticket ${ticketNumber} ingresado - ${validatedData.deviceBrand} ${validatedData.deviceModel}`,
          targetRole: 'TECNICO',
          referenceType: 'TICKET',
          referenceId: ticket.id,
        },
      });
      
      // Crear AuditLog
      await tx.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'Ticket',
          entityId: ticket.id,
          details: JSON.stringify({
            number: ticket.number,
            client: client.name,
            device: `${validatedData.deviceBrand} ${validatedData.deviceModel}`,
          }),
        },
      });
      
      return { ticket, hasDebt };
    });
    
    revalidatePath('/servicios/tickets');
    revalidatePath('/tecnico');
    revalidatePath('/servicios/ingresar');
    
    return {
      success: true,
      message: 'Ticket creado exitosamente',
      data: { ...result.ticket, hasDebt: result.hasDebt },
    };
  } catch (error: any) {
    console.error('Error creando ticket:', error);
    
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
    
    return {
      success: false,
      message: error.message || 'Error al crear el ticket',
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
 * Crear cliente rápido
 */
export async function quickCreateClient(data: { name: string; phone: string; email?: string | null; address?: string | null }) {
  try {
    const client = await prisma.client.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email ?? null,
        address: data.address ?? null,
        creditLimit: 0,
        debtBalance: 0,
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
    console.error('Error creando cliente:', error);
    return {
      success: false,
      message: error.message || 'Error al crear el cliente',
    };
  }
}

/**
 * Actualizar estado del ticket
 */
export async function updateTicketStatus(
  ticketId: string,
  newStatus: string,
  data?: {
    diagnosis?: string;
    technicianNotes?: string;
    technicianId?: string;
    estimatedDays?: number;
  }
): Promise<ActionResult> {
  try {
    const validTransitions: Record<string, string[]> = {
      'PENDING': ['IN_PROGRESS', 'CANCELLED'],
      'IN_PROGRESS': ['PENDING', 'READY', 'CANCELLED'],
      'READY': ['DELIVERED', 'PENDING'],
      'DELIVERED': [],
      'CANCELLED': [],
    };

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return {
        success: false,
        message: 'Ticket no encontrado',
      };
    }

    // Validar transición de estado
    if (!validTransitions[ticket.status]?.includes(newStatus)) {
      return {
        success: false,
        message: `Transición inválida de ${ticket.status} a ${newStatus}`,
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      // Actualizar ticket
      const updatedTicket = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: newStatus,
          ...(data?.diagnosis && { notes: data.diagnosis }),
          ...(data?.technicianId && { technicianId: data.technicianId }),
          ...(data?.estimatedDays && { 
            warrantyExpiry: new Date(Date.now() + data.estimatedDays * 24 * 60 * 60 * 1000)
          }),
        },
        include: {
          client: true,
          technician: true,
        },
      });

      // Si pasa a READY, notificar al vendedor
      if (newStatus === 'READY') {
        await tx.notification.create({
          data: {
            type: 'TICKET_READY',
            title: 'Equipo Listo para Entrega',
            message: `El ticket ${ticket.number} está listo para entregar al cliente ${updatedTicket.client.name}`,
            targetRole: 'VENDEDOR',
            referenceType: 'TICKET',
            referenceId: ticketId,
          },
        });
      }

      // Crear AuditLog
      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'Ticket',
          entityId: ticketId,
          details: JSON.stringify({
            oldStatus: ticket.status,
            newStatus,
            technician: data?.technicianId,
          }),
        },
      });

      return updatedTicket;
    });

    revalidatePath('/servicios/tickets');
    revalidatePath('/tecnico');

    return {
      success: true,
      message: 'Estado actualizado exitosamente',
      data: result,
    };
  } catch (error: any) {
    console.error('Error actualizando estado:', error);
    return {
      success: false,
      message: error.message || 'Error al actualizar el estado',
    };
  }
}

/**
 * Agregar diagnóstico y repuestos al ticket
 */
export async function addTicketDiagnosis(
  ticketId: string,
  diagnosis: string,
  technicianNotes: string,
  items: TicketItemInput[],
  laborCost: number
): Promise<ActionResult> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Verificar stock de repuestos
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });
        
        if (!product) {
          throw new Error(`Repuesto no encontrado: ${item.productId}`);
        }
        
        if (product.stock < item.quantity) {
          throw new Error(`Stock insuficiente para "${product.name}". Disponible: ${product.stock}`);
        }
      }

      // Actualizar diagnóstico del ticket
      const updatedTicket = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          notes: diagnosis,
        },
      });

      // Agregar items al ticket (sin descontar stock aún)
      for (const item of items) {
        await tx.ticketItem.create({
          data: {
            ticketId,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity,
          },
        });
      }

      // Agregar mano de obra como item si hay costo
      if (laborCost > 0) {
        // Buscar o crear servicio de mano de obra
        let laborProduct = await tx.product.findFirst({
          where: { type: 'SERVICIO_MANO_OBRA' },
        });

        if (!laborProduct) {
          laborProduct = await tx.product.create({
            data: {
              name: 'Mano de Obra',
              type: 'SERVICIO_MANO_OBRA',
              costPrice: 0,
              sellPrice: laborCost,
              stock: 9999,
              minStock: 0,
              categoryId: (await tx.productCategory.findFirst({ where: { type: 'SERVICIO' } }))?.id || '',
            },
          });
        }

        await tx.ticketItem.create({
          data: {
            ticketId,
            productId: laborProduct.id,
            quantity: 1,
            price: laborCost,
            subtotal: laborCost,
          },
        });
      }

      // Calcular costo final estimado
      const totalItems = items.reduce((sum, item) => sum + (item.price * item.quantity), 0) + laborCost;
      await tx.ticket.update({
        where: { id: ticketId },
        data: {
          finalCost: totalItems,
        },
      });

      return updatedTicket;
    });

    revalidatePath('/servicios/tickets');
    revalidatePath('/tecnico');

    return {
      success: true,
      message: 'Diagnóstico y repuestos agregados',
      data: result,
    };
  } catch (error: any) {
    console.error('Error agregando diagnóstico:', error);
    return {
      success: false,
      message: error.message || 'Error al agregar diagnóstico',
    };
  }
}

/**
 * Entregar ticket y procesar pago
 */
export async function deliverTicket(
  ticketId: string,
  paymentData: PaymentData
): Promise<ActionResult> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Obtener ticket con datos completos
      const ticket = await tx.ticket.findUnique({
        where: { id: ticketId },
        include: {
          client: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!ticket) {
        throw new Error('Ticket no encontrado');
      }

      if (!['READY', 'PENDING'].includes(ticket.status)) {
        throw new Error('El ticket debe estar en estado READY o PENDING para entregar');
      }

      const totalCost = ticket.finalCost || ticket.estimatedCost;
      const { paymentAmount, paymentMethod, isPartialPayment, cashRegisterId, userId } = paymentData;

      // Validar pago
      if (!isPartialPayment && paymentAmount < totalCost) {
        throw new Error(`El pago debe cubrir el total: ${totalCost}`);
      }

      // Descontar repuestos del inventario definitivamente
      for (const item of ticket.items) {
        if (item.product.type === 'REPUESTO' || item.product.type === 'ACCESORIO') {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: item.product.stock - item.quantity,
            },
          });

          // Crear movimiento de inventario
          await tx.inventoryMovement.create({
            data: {
              type: 'OUT',
              quantity: item.quantity,
              reason: `Ticket ${ticket.number} - Reparación`,
              productId: item.productId,
              userId,
              referenceId: ticketId,
            },
          });

          // Verificar stock bajo
          const newStock = item.product.stock - item.quantity;
          if (newStock <= item.product.minStock && newStock >= 0) {
            await tx.notification.create({
              data: {
                type: 'LOW_STOCK',
                title: 'Stock Bajo',
                message: `El producto "${item.product.name}" tiene stock bajo (${newStock} unidades)`,
                targetRole: 'ADMIN',
                referenceType: 'PRODUCT',
                referenceId: item.productId,
              },
            });
          }
        }
      }

      // Crear CashMovement (INCOME)
      if (cashRegisterId) {
        await tx.cashMovement.create({
          data: {
            type: 'INCOME',
            category: 'TICKET',
            amount: paymentAmount,
            description: `Pago Ticket ${ticket.number} - ${ticket.client.name}`,
            cashRegisterId,
            userId,
            referenceId: ticketId,
          },
        });
      }

      // Procesar pago
      await tx.payment.create({
        data: {
          amount: paymentAmount,
          method: paymentMethod,
          ticketId,
        },
      });

      // Actualizar monto pagado
      const newAmountPaid = (ticket.amountPaid || 0) + paymentAmount;

      // Si es pago parcial, crear AccountReceivable
      if (isPartialPayment || paymentAmount < totalCost) {
        const pendingAmount = totalCost - newAmountPaid;
        
        await tx.accountReceivable.create({
          data: {
            amount: pendingAmount,
            balance: pendingAmount,
            status: 'PENDING',
            clientId: ticket.clientId,
            referenceType: 'TICKET',
            referenceId: ticketId,
          },
        });

        // Actualizar deuda del cliente
        await tx.client.update({
          where: { id: ticket.clientId },
          data: {
            debtBalance: ticket.client.debtBalance + pendingAmount,
          },
        });
      }

      // Crear Warranty (8 días desde hoy)
      const warrantyEnd = new Date();
      warrantyEnd.setDate(warrantyEnd.getDate() + 8);

      await tx.warranty.create({
        data: {
          startDate: new Date(),
          endDate: warrantyEnd,
          status: 'ACTIVE',
          ticketId,
          clientId: ticket.clientId,
          isScreenReplacement: ticket.problemType === 'PANTALLA' || ticket.issue.toLowerCase().includes('pantalla'),
        },
      });

      // Programar notificaciones de garantía
      const warrantyExpiringDate = new Date();
      warrantyExpiringDate.setDate(warrantyExpiringDate.getDate() + 7);

      await tx.notification.create({
        data: {
          type: 'WARRANTY_EXPIRING',
          title: 'Garantía Expirando Pronto',
          message: `La garantía del ticket ${ticket.number} expira mañana`,
          targetRole: 'ADMIN',
          referenceType: 'TICKET',
          referenceId: ticketId,
          scheduledFor: warrantyExpiringDate,
        },
      });

      // Actualizar ticket a ENTREGADO
      const updatedTicket = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          status: 'DELIVERED',
          deliveredAt: new Date(),
          amountPaid: newAmountPaid,
        },
      });

      // Crear AuditLog
      await tx.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'Ticket',
          entityId: ticketId,
          details: JSON.stringify({
            status: 'DELIVERED',
            paymentAmount,
            totalCost,
            isPartialPayment,
          }),
        },
      });

      return updatedTicket;
    });

    revalidatePath('/servicios/tickets');
    revalidatePath('/servicios/entregar');

    return {
      success: true,
      message: 'Ticket entregado exitosamente',
      data: result,
    };
  } catch (error: any) {
    console.error('Error entregando ticket:', error);
    return {
      success: false,
      message: error.message || 'Error al entregar el ticket',
    };
  }
}

/**
 * Obtener ticket por ID
 */
export async function getTicketById(id: string) {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        client: true,
        createdBy: true,
        technician: true,
        items: {
          include: {
            product: true,
          },
        },
        warranties: true,
      },
    });

    return ticket;
  } catch (error) {
    console.error('Error obteniendo ticket:', error);
    return null;
  }
}

/**
 * Obtener lista de tickets con filtros
 */
export async function getTickets(filters?: {
  status?: string;
  clientId?: string;
  technicianId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const where: any = {
      isDeleted: false,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters?.technicianId) {
      where.technicianId = filters.technicianId;
    }

    if (filters?.search) {
      where.OR = [
        { number: { contains: filters.search, mode: 'insensitive' } },
        { deviceBrand: { contains: filters.search, mode: 'insensitive' } },
        { deviceModel: { contains: filters.search, mode: 'insensitive' } },
        { deviceSerial: { contains: filters.search, mode: 'insensitive' } },
        { client: { name: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          client: true,
          technician: true,
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.ticket.count({ where }),
    ]);

    return { tickets, total, page, totalPages: Math.ceil(total / limit) };
  } catch (error) {
    console.error('Error obteniendo tickets:', error);
    return { tickets: [], total: 0, page: 1, totalPages: 0 };
  }
}

/**
 * Obtener tickets para el dashboard del técnico
 */
export async function getTechnicianTickets(status?: string) {
  try {
    const where: any = {
      isDeleted: false,
      status: {
        in: status ? [status] : ['PENDING', 'IN_PROGRESS', 'READY'],
      },
    };

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        client: true,
        technician: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' }, // Más antiguo primero
    });

    return tickets;
  } catch (error) {
    console.error('Error obteniendo tickets del técnico:', error);
    return [];
  }
}

/**
 * Obtener historial de reparaciones por cliente
 */
export async function getClientTicketHistory(clientId: string) {
  try {
    const tickets = await prisma.ticket.findMany({
      where: { clientId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        warranties: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return tickets;
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    return [];
  }
}

/**
 * Buscar ticket por IMEI/número de serie
 */
export async function searchTicketBySerial(serial: string) {
  try {
    const tickets = await prisma.ticket.findMany({
      where: {
        deviceSerial: {
          contains: serial,
          mode: 'insensitive',
        },
        isDeleted: false,
      },
      include: {
        client: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tickets;
  } catch (error) {
    console.error('Error buscando por serial:', error);
    return [];
  }
}

/**
 * Agregar fotos adicionales al ticket
 */
export async function addTicketPhotos(ticketId: string, photoData: string[]): Promise<ActionResult> {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return {
        success: false,
        message: 'Ticket no encontrado',
      };
    }

    // Obtener fotos existentes
    const existingPhotos = ticket.photos ? JSON.parse(ticket.photos) : [];
    
    // Subir nuevas fotos
    const newPaths = await uploadPhotos(ticket.number, photoData);
    
    // Combinar fotos
    const allPhotos = [...existingPhotos, ...newPaths];

    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        photos: JSON.stringify(allPhotos),
      },
    });

    revalidatePath('/servicios/tickets');

    return {
      success: true,
      message: 'Fotos agregadas exitosamente',
      data: updatedTicket,
    };
  } catch (error: any) {
    console.error('Error agregando fotos:', error);
    return {
      success: false,
      message: error.message || 'Error al agregar fotos',
    };
  }
}

/**
 * Obtener productos repuestos disponibles
 */
export async function getSpareParts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        type: 'REPUESTO',
        isDeleted: false,
      },
      include: {
        category: true,
        supplier: true,
      },
      orderBy: { name: 'asc' },
    });

    return products;
  } catch (error) {
    console.error('Error obteniendo repuestos:', error);
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
