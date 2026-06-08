/**
 * Server Actions para gestión de Garantías
 */
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  errors?: Record<string, string[]>;
}

/**
 * Schema para crear reclamo de garantía
 */
const warrantyClaimSchema = z.object({
  issue: z.string().min(10, 'Describa el problema con al menos 10 caracteres'),
  isScreenIntact: z.boolean().optional(), // Para garantías de pantalla
  photos: z.array(z.string()).optional(),
  isApproved: z.boolean(), // true = aprobar, false = rechazar
  rejectionReason: z.string().optional(), // Si se rechaza
});

/**
 * Obtener garantía por ticket
 */
export async function getWarrantyByTicket(ticketId: string) {
  try {
    const warranty = await prisma.warranty.findUnique({
      where: { ticketId },
      include: {
        ticket: {
          include: {
            client: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        client: true,
        claims: true,
      },
    });

    return warranty;
  } catch (error) {
    console.error('Error obteniendo garantía:', error);
    return null;
  }
}

/**
 * Obtener historial de garantías por cliente
 */
export async function getWarrantyClientHistory(clientId: string) {
  try {
    const warranties = await prisma.warranty.findMany({
      where: { clientId },
      include: {
        ticket: true,
        claims: {
          include: {
            warranty: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return warranties;
  } catch (error) {
    console.error('Error obteniendo historial de garantías:', error);
    return [];
  }
}

/**
 * Crear reclamo de garantía
 * Transacción que:
 * 1. Valida días de garantía
 * 2. Si es pantalla: valida visor intacto
 * 3. Crea WarrantyClaim
 * 4. Si aprobado: crea nuevo ticket vinculado + registra pérdida
 * 5. Si rechazado: registra motivo
 * 6. Actualiza status de Warranty
 */
export async function createWarrantyClaim(
  warrantyId: string,
  data: z.infer<typeof warrantyClaimSchema>,
  userId: string
): Promise<ActionResult> {
  try {
    const validatedData = warrantyClaimSchema.parse(data);

    const result = await prisma.$transaction(async (tx) => {
      // Obtener garantía con datos completos
      const warranty = await tx.warranty.findUnique({
        where: { id: warrantyId },
        include: {
          ticket: {
            include: {
              client: true,
              items: {
                include: {
                  product: true,
                },
              },
            },
          },
          client: true,
        },
      });

      if (!warranty) {
        throw new Error('Garantía no encontrada');
      }

      // Verificar si ya hay un reclamo pendiente
      const existingClaim = await tx.warrantyClaim.findFirst({
        where: {
          warrantyId,
          status: 'PENDING',
        },
      });

      if (existingClaim) {
        throw new Error('Ya existe un reclamo pendiente para esta garantía');
      }

      // Verificar si está dentro de los 8 días
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const endDate = new Date(warranty.endDate);
      endDate.setHours(0, 0, 0, 0);

      if (today > endDate) {
        // Fuera de plazo - rechazo automático
        const claim = await tx.warrantyClaim.create({
          data: {
            warrantyId,
            issue: validatedData.issue,
            resolution: 'REJECTED',
            status: 'RESOLVED',
          },
        });

        await tx.warranty.update({
          where: { id: warrantyId },
          data: { status: 'REJECTED' },
        });

        return {
          success: true,
          message: 'Reclamo rechazado: Fuera del período de garantía',
          claim,
        };
      }

      // Si es reemplazo de pantalla, verificar estado del visor
      if (warranty.isScreenReplacement) {
        if (validatedData.isScreenIntact === false) {
          const claim = await tx.warrantyClaim.create({
            data: {
              warrantyId,
              issue: validatedData.issue,
              resolution: 'REJECTED',
              status: 'RESOLVED',
            },
          });

          await tx.warranty.update({
            where: { id: warrantyId },
            data: { status: 'REJECTED' },
          });

          return {
            success: true,
            message: 'Reclamo rechazado: Visor dañado - no cubierto por garantía',
            claim,
          };
        }
      }

      // Procesar según aprobación/rechazo
      if (validatedData.isApproved) {
        // === APROBADO ===
        
        // Calcular costo de pérdida (suma de repuestos del ticket original)
        let lossAmount = 0;
        for (const item of warranty.ticket.items) {
          if (item.product.type === 'REPUESTO') {
            lossAmount += item.product.costPrice * item.quantity;
          }
        }

        // Crear WarrantyClaim
        const claim = await tx.warrantyClaim.create({
          data: {
            warrantyId,
            issue: validatedData.issue,
            resolution: 'REPAIRED',
            status: 'PENDING',
          },
        });

        // Actualizar warranty a CLAIMED
        await tx.warranty.update({
          where: { id: warrantyId },
          data: { status: 'CLAIMED' },
        });

        // Generar número de ticket para garantía
        const ticketNumber = await generateWarrantyTicketNumber(tx);

        // Crear nuevo ticket vinculado (sin costo)
        const newTicket = await tx.ticket.create({
          data: {
            number: ticketNumber,
            clientId: warranty.clientId,
            deviceBrand: warranty.ticket.deviceBrand,
            deviceModel: warranty.ticket.deviceModel,
            deviceSerial: warranty.ticket.deviceSerial,
            issue: `Garantía: ${validatedData.issue}`,
            status: 'PENDING',
            problemType: warranty.ticket.problemType,
            isWarrantyService: true,
            estimatedCost: 0, // Sin costo para el cliente
            finalCost: 0,
            relatedTicketId: warranty.ticketId, // Vincular al ticket original
            notes: `Servicio de garantía - Ticket original: ${warranty.ticket.number}. Pérdida registrada: $${lossAmount}`,
          },
        });

        // Actualizar WarrantyClaim con el nuevo ticket
        await tx.warrantyClaim.update({
          where: { id: claim.id },
          data: {
            newTicketId: newTicket.id,
          },
        });

        // Registrar pérdida en finanzas (si hay costo de repuesto)
        if (lossAmount > 0) {
          // Crear movimiento de caja como EXPENSE
          const cashRegister = await tx.cashRegister.findFirst({
            where: {
              status: 'OPEN',
              openedById: userId,
            },
            orderBy: { openedAt: 'desc' },
          });

          if (cashRegister) {
            await tx.cashMovement.create({
              data: {
                type: 'EXPENSE',
                category: 'OTHER',
                amount: lossAmount,
                description: `Pérdida por garantía - Ticket ${newTicket.number}`,
                cashRegisterId: cashRegister.id,
                userId,
                referenceId: newTicket.id,
              },
            });
          }
        }

        // Crear notificación
        await tx.notification.create({
          data: {
            type: 'WARRANTY_CLAIM_APPROVED',
            title: 'Garantía Aprobada',
            message: `Garantía aprobada para ticket ${warranty.ticket.number}. Nuevo ticket creado: ${newTicket.number}`,
            targetRole: 'TECNICO',
            referenceType: 'TICKET',
            referenceId: newTicket.id,
          },
        });

        return {
          success: true,
          message: 'Garantía aprobada. Nuevo ticket de servicio creado sin costo.',
          claim,
          newTicket,
          lossAmount,
        };
      } else {
        // === RECHAZADO ===
        
        const claim = await tx.warrantyClaim.create({
          data: {
            warrantyId,
            issue: validatedData.issue,
            resolution: 'REJECTED',
            status: 'RESOLVED',
          },
        });

        await tx.warranty.update({
          where: { id: warrantyId },
          data: { status: 'REJECTED' },
        });

        return {
          success: true,
          message: validatedData.rejectionReason || 'Garantía rechazada',
          claim,
        };
      }
    });

    revalidatePath('/garantias');
    revalidatePath('/servicios/tickets');

    return {
      success: true,
      message: result.message,
      data: result,
    };
  } catch (error: any) {
    console.error('Error creando reclamo de garantía:', error);
    return {
      success: false,
      message: error.message || 'Error al procesar reclamo de garantía',
    };
  }
}

/**
 * Generar número de ticket para garantía
 */
async function generateWarrantyTicketNumber(tx: any): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

  const lastTicket = await tx.ticket.findFirst({
    where: {
      number: { startsWith: `GW-${dateStr}-` },
      isDeleted: false,
    },
    orderBy: { createdAt: 'desc' },
  });

  let sequenceNumber = 1;
  if (lastTicket) {
    const lastNum = parseInt(lastTicket.number.split('-')[2] || '0', 10);
    sequenceNumber = lastNum + 1;
  }

  return `GW-${dateStr}-${String(sequenceNumber).padStart(3, '0')}`;
}

/**
 * Obtener todas las garantías con filtros
 */
export async function getWarranties(
  filters?: {
    status?: string;
    clientId?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  },
  page: number = 1,
  limit: number = 20
) {
  try {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters?.startDate && filters?.endDate) {
      where.startDate = {
        gte: filters.startDate,
        lte: filters.endDate,
      };
    }

    if (filters?.search) {
      where.OR = [
        {
          ticket: {
            number: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
        },
        {
          client: {
            name: {
              contains: filters.search,
              mode: 'insensitive',
            },
          },
        },
      ];
    }

    const skip = (page - 1) * limit;

    const [warranties, total] = await Promise.all([
      prisma.warranty.findMany({
        where,
        include: {
          ticket: {
            include: {
              client: true,
            },
          },
          client: true,
          claims: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.warranty.count({ where }),
    ]);

    return { warranties, total, page, totalPages: Math.ceil(total / limit) };
  } catch (error) {
    console.error('Error obteniendo garantías:', error);
    return { warranties: [], total: 0, page: 1, totalPages: 0 };
  }
}

/**
 * Obtener reporte de pérdidas por garantías en un período
 */
export async function getWarrantyLossReport(
  startDate: Date,
  endDate: Date
) {
  try {
    // Obtener todos los tickets de garantía en el período
    const warrantyTickets = await prisma.ticket.findMany({
      where: {
        isWarrantyService: true,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        isDeleted: false,
      },
      include: {
        relatedTicket: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
          },
        },
        client: true,
      },
    });

    // Calcular pérdidas
    let totalLoss = 0;
    const losses = warrantyTickets.map((ticket) => {
      let lossAmount = 0;
      
      if (ticket.relatedTicket) {
        for (const item of ticket.relatedTicket.items) {
          if (item.product.type === 'REPUESTO') {
            lossAmount += item.product.costPrice * item.quantity;
          }
        }
      }

      totalLoss += lossAmount;

      return {
        ticketNumber: ticket.number,
        originalTicket: ticket.relatedTicket?.number || 'N/A',
        client: ticket.client.name,
        date: ticket.createdAt,
        lossAmount,
        issue: ticket.issue,
      };
    });

    return {
      totalLoss,
      count: warrantyTickets.length,
      losses,
      period: { startDate, endDate },
    };
  } catch (error) {
    console.error('Error obteniendo reporte de pérdidas:', error);
    return {
      totalLoss: 0,
      count: 0,
      losses: [],
      period: { startDate, endDate },
    };
  }
}

/**
 * Resolver reclamo de garantía (para técnicos)
 */
export async function resolveWarrantyClaim(
  claimId: string,
  resolution: 'REPAIRED' | 'REPLACED',
  userId: string
): Promise<ActionResult> {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Actualizar claim
      const claim = await tx.warrantyClaim.update({
        where: { id: claimId },
        data: {
          resolution,
          status: 'RESOLVED',
        },
      });

      // Obtener warranty y ticket
      const warranty = await tx.warranty.findUnique({
        where: { id: claim.warrantyId },
        include: {
          ticket: true,
        },
      });

      if (!warranty) {
        throw new Error('Garantía no encontrada');
      }

      // Crear nueva garantía para el ticket de garantía (8 días desde hoy)
      const newWarrantyEnd = new Date();
      newWarrantyEnd.setDate(newWarrantyEnd.getDate() + 8);

      await tx.warranty.create({
        data: {
          startDate: new Date(),
          endDate: newWarrantyEnd,
          status: 'ACTIVE',
          ticketId: claim.newTicketId!,
          clientId: warranty.clientId,
          isScreenReplacement: warranty.isScreenReplacement,
        },
      });

      // Actualizar ticket a READY
      if (claim.newTicketId) {
        await tx.ticket.update({
          where: { id: claim.newTicketId },
          data: {
            status: 'READY',
            finalCost: 0,
          },
        });
      }

      return claim;
    });

    revalidatePath('/garantias');
    revalidatePath('/tecnico');

    return {
      success: true,
      message: 'Reclamo de garantía resuelto exitosamente',
      data: result,
    };
  } catch (error: any) {
    console.error('Error resolviendo reclamo:', error);
    return {
      success: false,
      message: error.message || 'Error al resolver reclamo',
    };
  }
}
