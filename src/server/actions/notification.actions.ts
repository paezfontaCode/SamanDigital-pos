/**
 * Server Actions para gestión de Notificaciones
 */
'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db/prisma';

interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Crear una nueva notificación
 */
export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  relatedId?: string,
  relatedType?: string
): Promise<ActionResult> {
  try {
    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        message,
        targetUserId: userId,
        referenceType: relatedType,
        referenceId: relatedId,
        isRead: false,
      },
    });

    return {
      success: true,
      message: 'Notificación creada exitosamente',
      data: notification,
    };
  } catch (error: any) {
    console.error('Error creando notificación:', error);
    return {
      success: false,
      message: error.message || 'Error al crear notificación',
    };
  }
}

/**
 * Marcar notificación como leída
 */
export async function markAsRead(id: string): Promise<ActionResult> {
  try {
    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    revalidatePath('/');
    
    return {
      success: true,
      message: 'Notificación marcada como leída',
    };
  } catch (error: any) {
    console.error('Error marcando notificación como leída:', error);
    return {
      success: false,
      message: error.message || 'Error al marcar notificación',
    };
  }
}

/**
 * Marcar todas las notificaciones de un usuario como leídas
 */
export async function markAllAsRead(userId: string): Promise<ActionResult> {
  try {
    await prisma.notification.updateMany({
      where: {
        targetUserId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    revalidatePath('/');
    
    return {
      success: true,
      message: 'Todas las notificaciones marcadas como leídas',
    };
  } catch (error: any) {
    console.error('Error marcando todas como leídas:', error);
    return {
      success: false,
      message: error.message || 'Error al marcar notificaciones',
    };
  }
}

/**
 * Obtener contador de notificaciones no leídas
 */
export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const count = await prisma.notification.count({
      where: {
        targetUserId: userId,
        isRead: false,
      },
    });

    return count;
  } catch (error) {
    console.error('Error obteniendo contador de no leídas:', error);
    return 0;
  }
}

/**
 * Obtener notificaciones de un usuario
 */
export async function getNotifications(
  userId: string,
  limit: number = 20
): Promise<any[]> {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        targetUserId: userId,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return notifications;
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    return [];
  }
}

/**
 * Obtener notificaciones por rol (para jobs programados)
 */
export async function getNotificationsByRole(role: string): Promise<any[]> {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        targetRole: role,
      },
      orderBy: { createdAt: 'desc' },
    });

    return notifications;
  } catch (error) {
    console.error('Error obteniendo notificaciones por rol:', error);
    return [];
  }
}

/**
 * Eliminar notificación antigua
 */
export async function deleteNotification(id: string): Promise<ActionResult> {
  try {
    await prisma.notification.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Notificación eliminada',
    };
  } catch (error: any) {
    console.error('Error eliminando notificación:', error);
    return {
      success: false,
      message: error.message || 'Error al eliminar notificación',
    };
  }
}
