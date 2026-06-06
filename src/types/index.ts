/**
 * Tipos globales - Saman Digital POS
 */

import type {
  User,
  Client,
  Supplier,
  Product,
  ProductCategory,
  InventoryMovement,
  Sale,
  SaleItem,
  Ticket,
  TicketItem,
  CashRegister,
  CashMovement,
  AccountReceivable,
  AccountPayable,
  Payment,
  Warranty,
  WarrantyClaim,
  Notification,
  AuditLog,
  BusinessConfig,
} from '@prisma/client'

// Re-exportar tipos de Prisma
export type {
  User,
  Client,
  Supplier,
  Product,
  ProductCategory,
  InventoryMovement,
  Sale,
  SaleItem,
  Ticket,
  TicketItem,
  CashRegister,
  CashMovement,
  AccountReceivable,
  AccountPayable,
  Payment,
  Warranty,
  WarrantyClaim,
  Notification,
  AuditLog,
  BusinessConfig,
}

// Tipos con relaciones expandidas
export type SaleWithRelations = Sale & {
  items: SaleItem[]
  client: Client | null
  user: User
  cashRegister: CashRegister | null
  payments: Payment[]
}

export type TicketWithRelations = Ticket & {
  items: TicketItem[]
  client: Client
  createdBy: User
  technician: User | null
  cashRegister: CashRegister | null
  warranties: Warranty[]
  payments: Payment[]
}

export type ProductWithRelations = Product & {
  category: ProductCategory
  supplier: Supplier | null
}

export type ClientWithRelations = Client & {
  sales: Sale[]
  tickets: Ticket[]
  accountsReceivable: AccountReceivable[]
  warranties: Warranty[]
}

export type CashRegisterWithRelations = CashRegister & {
  openedBy: User
  movements: CashMovement[]
  sales: Sale[]
  tickets: Ticket[]
}

export type AccountReceivableWithRelations = AccountReceivable & {
  client: Client
  payments: Payment[]
}

export type AccountPayableWithRelations = AccountPayable & {
  supplier: Supplier
  payments: Payment[]
}

export type PaymentWithRelations = Payment & {
  sale: Sale | null
  ticket: Ticket | null
  accountReceivable: AccountReceivable | null
  accountPayable: AccountPayable | null
}

export type WarrantyWithRelations = Warranty & {
  ticket: Ticket
  client: Client
  claims: WarrantyClaim[]
}

export type NotificationWithTarget = Notification & {
  targetUser: User | null
}

// Tipos para formularios
export interface SaleFormData {
  clientId?: string
  paymentMethod: string
  items: {
    productId: string
    quantity: number
    price: number
  }[]
  discount?: number
}

export interface TicketFormData {
  clientId: string
  deviceBrand: string
  deviceModel: string
  deviceSerial?: string
  devicePassword?: string
  issue: string
  notes?: string
  estimatedCost: number
  technicianId?: string
}

export interface ClientFormData {
  document?: string
  name: string
  phone: string
  email?: string
  address?: string
  creditLimit?: number
}

export interface SupplierFormData {
  document?: string
  name: string
  contact?: string
  phone?: string
  email?: string
  address?: string
}

export interface ProductFormData {
  barcode?: string
  name: string
  description?: string
  type: string
  costPrice: number
  sellPrice: number
  stock?: number
  minStock?: number
  categoryId: string
  supplierId?: string
}

export interface CashMovementFormData {
  type: string
  category: string
  amount: number
  description: string
  referenceId?: string
}

// Tipos para respuestas de API
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Tipos para filtros y búsqueda
export interface PaginationParams {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface SearchParams extends PaginationParams {
  query?: string
  filters?: Record<string, string | number | boolean>
}

// Tipos para dashboard
export interface DashboardStats {
  totalSales: number
  totalTickets: number
  pendingTickets: number
  lowStockProducts: number
  totalRevenue: number
  pendingReceivables: number
  overdueReceivables: number
}

export interface KPICard {
  title: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  icon: string
}

// Tipos para notificaciones
export interface ToastMessage {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
}

// Tipos para acciones del servidor
export type ServerActionResponse<T> = Promise<{
  success: boolean
  data?: T
  error?: string
  validationErrors?: Record<string, string[]>
}>
