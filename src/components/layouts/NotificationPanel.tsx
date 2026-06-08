'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { getUnreadCount, getNotifications, markAsRead, markAllAsRead } from '@/server/actions/notification.actions';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  referenceType?: string | null;
  referenceId?: string | null;
}

interface NotificationPanelProps {
  userId: string;
}

const notificationIcons: Record<string, string> = {
  TICKET_READY: '🔧',
  DELIVERY_REMINDER: '📦',
  WARRANTY_EXPIRING: '⚠️',
  WARRANTY_EXPIRED: '❌',
  STOCK_LOW: '📦',
  ACCOUNT_OVERDUE: '💰',
  PAYMENT_DUE: '💳',
  CASH_REGISTER: '🏦',
  WARRANTY_CLAIM_APPROVED: '✅',
};

export default function NotificationPanel({ userId }: NotificationPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar contador de no leídas
  const loadUnreadCount = async () => {
    const count = await getUnreadCount(userId);
    setUnreadCount(count);
  };

  // Cargar notificaciones
  const loadNotifications = async () => {
    setLoading(true);
    const notifs = await getNotifications(userId, 20);
    setNotifications(notifs);
    setLoading(false);
  };

  // Actualizar al abrir el panel
  useEffect(() => {
    if (isOpen) {
      loadUnreadCount();
      loadNotifications();
    }
  }, [isOpen]);

  // Marcar como leída
  const handleMarkAsRead = async (id: string) => {
    await markAsRead(id);
    loadUnreadCount();
    loadNotifications();
  };

  // Marcar todas como leídas
  const handleMarkAllAsRead = async () => {
    await markAllAsRead(userId);
    loadUnreadCount();
    loadNotifications();
  };

  // Obtener ruta de redirección según tipo de notificación
  const getRedirectPath = (notification: Notification) => {
    switch (notification.referenceType) {
      case 'TICKET':
        return `/servicios/tickets/${notification.referenceId}`;
      case 'WARRANTY':
        return `/garantias/reclamar/${notification.referenceId}`;
      case 'PRODUCT':
        return '/inventario/productos';
      case 'CLIENT':
        return '/vendedor/clientes';
      default:
        return '/';
    }
  };

  // Click en notificación
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }
    
    // Redirigir a la entidad relacionada
    const path = getRedirectPath(notification);
    window.location.href = path;
  };

  // Formatear tiempo transcurrido
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'ahora mismo';
    if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} horas`;
    return `hace ${Math.floor(diffInSeconds / 86400)} días`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-full bg-background p-1 text-muted-foreground hover:text-foreground"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div className="absolute right-0 top-12 z-50 w-80 md:w-96 rounded-md border bg-background shadow-lg">
            <div className="flex items-center justify-between border-b p-4">
              <h3 className="font-semibold">Notificaciones</h3>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <CheckCheck className="h-3 w-3" />
                  Marcar todas
                </button>
              )}
            </div>
            
            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Cargando...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No hay notificaciones
                </div>
              ) : (
                <ul className="divide-y">
                  {notifications.map((notification) => (
                    <li
                      key={notification.id}
                      className={`cursor-pointer p-4 transition-colors hover:bg-muted ${
                        !notification.isRead ? 'bg-muted/50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl">
                          {notificationIcons[notification.type] || '📢'}
                        </span>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <span className="flex h-2 w-2 rounded-full bg-blue-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                            {!notification.isRead && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <Check className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
