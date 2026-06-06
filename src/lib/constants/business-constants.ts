/**
 * Constantes de Negocio - Saman Digital POS
 * Estas constantes definen las reglas principales del negocio
 */

export const BUSINESS_CONSTANTS = {
  // Garantías
  WARRANTY_DAYS: 8,                    // Días de garantía desde entrega
  
  // Límites y valores por defecto
  DEFAULT_CREDIT_LIMIT: 0,             // Límite de crédito default
  LOW_STOCK_DEFAULT: 5,               // Stock mínimo por defecto
  
  // Prefijos de documentos
  TICKET_PREFIX: 'TK-',               // Prefijo de tickets
  SALE_PREFIX: 'V-',                   // Prefijo de ventas
  RECEIPT_PREFIX: 'R-',               // Prefijo de recibos
  
  // Impresión
  PRINT_WIDTH_MM: 80,                  // Ancho para impresora térmica
  
  // Sesiones
  SESSION_EXPIRY_HOURS: 8,            // Duración de sesión
  
  // Búsquedas
  DEBOUNCE_SEARCH_MS: 300,            // Debounce en búsquedas
  
  // Paginación
  PAGE_SIZE: 20,                       // Items por página en tablas
  
  // Rutas
  BACKUP_FOLDER: './backups',          // Carpeta de backups
  UPLOADS_FOLDER: './public/uploads',  // Carpeta de imágenes subidas
} as const

// WhatsApp (sin API de pago - solo links pre-redactados)
export const WHATSAPP_BASE_URL = 'https://wa.me/'

// Roles de usuario
export const USER_ROLES = {
  ADMIN: 'ADMIN',
  VENDEDOR: 'VENDEDOR',
  TECNICO: 'TECNICO',
} as const

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]

// Estados de ticket
export const TICKET_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  READY: 'READY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  WARRANTY: 'WARRANTY',
} as const

export type TicketStatus = (typeof TICKET_STATUS)[keyof typeof TICKET_STATUS]

// Estados de venta
export const SALE_STATUS = {
  COMPLETED: 'COMPLETED',
  CREDIT: 'CREDIT',
  CANCELLED: 'CANCELLED',
} as const

export type SaleStatus = (typeof SALE_STATUS)[keyof typeof SALE_STATUS]

// Métodos de pago
export const PAYMENT_METHODS = {
  CASH: 'CASH',
  CARD: 'CARD',
  TRANSFER: 'TRANSFER',
  CREDIT: 'CREDIT',
  MIXED: 'MIXED',
} as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS]

// Tipos de producto
export const PRODUCT_TYPES = {
  ACCESORIO: 'ACCESORIO',
  REPUESTO: 'REPUESTO',
  SERVICIO_MANO_OBRA: 'SERVICIO_MANO_OBRA',
} as const

export type ProductType = (typeof PRODUCT_TYPES)[keyof typeof PRODUCT_TYPES]

// Tipos de categoría
export const CATEGORY_TYPES = {
  ACCESORIO: 'ACCESORIO',
  REPUESTO: 'REPUESTO',
  SERVICIO: 'SERVICIO',
} as const

// Tipos de movimiento de inventario
export const INVENTORY_MOVEMENT_TYPES = {
  IN: 'IN',
  OUT: 'OUT',
  ADJUST: 'ADJUST',
  RETURN: 'RETURN',
} as const

// Tipos de movimiento de caja
export const CASH_MOVEMENT_TYPES = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
} as const

// Categorías de movimiento de caja
export const CASH_MOVEMENT_CATEGORIES = {
  SALE: 'SALE',
  TICKET: 'TICKET',
  PAYMENT: 'PAYMENT',
  SALARY: 'SALARY',
  SUPPLIES: 'SUPPLIES',
  WITHDRAWAL: 'WITHDRAWAL',
  OTHER: 'OTHER',
} as const

// Estados de caja
export const CASH_REGISTER_STATUS = {
  OPEN: 'OPEN',
  CLOSED: 'CLOSED',
} as const

// Estados de cuenta por cobrar/pagar
export const ACCOUNT_STATUS = {
  PENDING: 'PENDING',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
} as const

// Estados de garantía
export const WARRANTY_STATUS = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  VOIDED: 'VOIDED',
} as const

// Estados de reclamo de garantía
export const WARRANTY_CLAIM_STATUS = {
  PENDING: 'PENDING',
  RESOLVED: 'RESOLVED',
} as const

export const WARRANTY_CLAIM_RESOLUTION = {
  REPAIRED: 'REPAIRED',
  REPLACED: 'REPLACED',
  REJECTED: 'REJECTED',
} as const

// Tipos de notificación
export const NOTIFICATION_TYPES = {
  LOW_STOCK: 'LOW_STOCK',
  WARRANTY_EXPIRING: 'WARRANTY_EXPIRING',
  TICKET_READY: 'TICKET_READY',
  DEBT_OVERDUE: 'DEBT_OVERDUE',
} as const

// Tipos de acción de auditoría
export const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
} as const
