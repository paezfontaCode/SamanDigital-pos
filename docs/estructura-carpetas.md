# 🗺️ ESTRUCTURA DEL PROYECTO — SAMAN DIGITAL
# Este archivo documenta la estructura completa de carpetas

```
saman-digital/                          ← Raíz del proyecto
│
├── .agent/                             ← Configuración del agente de desarrollo
│   ├── profiles/
│   │   └── agent-profile.md            ← Perfil completo del agente AI
│   ├── skills/
│   │   ├── skill-inventory.md          ← Skill: Módulo de Inventario
│   │   ├── skill-services.md           ← Skill: Módulo de Servicios/Tickets
│   │   ├── skill-finance.md            ← Skill: Módulo Financiero
│   │   └── skill-pos.md               ← Skill: Punto de Venta (POS)
│   ├── rules/
│   │   └── cursorrules.md              ← Reglas detalladas del proyecto
│   └── context/
│       └── project-context.md          ← Contexto rápido para el agente
│
├── .cursorrules                         ← Reglas para Cursor AI (copia de rules/)
│
├── src/
│   ├── app/
│   │   ├── (auth)/                     ← Rutas públicas (sin autenticación)
│   │   │   └── login/                  ← Página de login
│   │   ├── (dashboard)/                ← Rutas protegidas (requieren auth)
│   │   │   ├── admin/                  ← Dashboard exclusivo admin
│   │   │   ├── vendedor/               ← Dashboard del vendedor (POS)
│   │   │   ├── tecnico/                ← Dashboard del técnico
│   │   │   ├── inventario/
│   │   │   │   ├── accesorios/         ← Gestión de accesorios
│   │   │   │   └── repuestos/          ← Gestión de repuestos
│   │   │   ├── servicios/
│   │   │   │   ├── tickets/            ← Lista y detalle de tickets
│   │   │   │   └── entregas/           ← Cola de equipos para entregar
│   │   │   ├── finanzas/
│   │   │   │   ├── caja/               ← Apertura/cierre de caja
│   │   │   │   ├── cuentas-cobrar/     ← Cuentas por cobrar
│   │   │   │   ├── cuentas-pagar/      ← Cuentas por pagar
│   │   │   │   └── ganancias/          ← Dashboard de ganancias
│   │   │   ├── clientes/               ← CRUD de clientes
│   │   │   ├── proveedores/            ← CRUD de proveedores
│   │   │   ├── garantias/              ← Gestión de garantías y reclamos
│   │   │   ├── reportes/               ← Reportes exportables
│   │   │   └── configuracion/          ← Config del negocio, usuarios
│   │   └── api/
│   │       ├── auth/                   ← NextAuth endpoints
│   │       └── notifications/          ← WebSocket o polling notificaciones
│   │
│   ├── features/                       ← Lógica organizada por dominio
│   │   ├── auth/
│   │   │   ├── components/             ← LoginForm, etc.
│   │   │   ├── hooks/                  ← useSession, usePermission
│   │   │   └── schemas/                ← loginSchema.ts
│   │   ├── inventory/
│   │   │   ├── components/             ← ProductTable, ProductFormModal, StockBadge
│   │   │   ├── hooks/                  ← useProducts, useLowStock
│   │   │   └── schemas/                ← productSchema.ts
│   │   ├── services/
│   │   │   ├── components/             ← TicketCard, NewTicketForm, TechnicianQueue
│   │   │   ├── hooks/                  ← useTickets, useTicketStatus
│   │   │   └── schemas/                ← ticketSchema.ts
│   │   ├── finance/
│   │   │   ├── components/             ← CashRegisterPanel, PaymentForm
│   │   │   ├── hooks/                  ← useCashRegister, useProfitSummary
│   │   │   └── schemas/                ← paymentSchema.ts
│   │   ├── notifications/
│   │   │   ├── components/             ← NotificationBell, NotificationPanel
│   │   │   └── hooks/                  ← useNotifications
│   │   ├── reports/
│   │   │   ├── components/             ← ReportFilter, ReportTable
│   │   │   └── templates/              ← PDFReceipt, PDFReport
│   │   ├── clients/
│   │   │   ├── components/             ← ClientSearch, ClientFormModal, DebtBadge
│   │   │   └── hooks/                  ← useClients, useClientDebt
│   │   ├── suppliers/
│   │   │   └── components/             ← SupplierFormModal, SupplierList
│   │   ├── warranties/
│   │   │   ├── components/             ← WarrantyCard, ClaimForm
│   │   │   └── hooks/                  ← useWarranties
│   │   ├── settings/
│   │   │   └── components/             ← BusinessConfigForm, UserManagement
│   │   └── pos/
│   │       ├── components/             ← ProductSearch, Cart, PaymentSection
│   │       └── hooks/                  ← useCart, usePOSSession
│   │
│   ├── components/
│   │   ├── ui/                         ← shadcn/ui (NO editar directamente)
│   │   ├── shared/                     ← Componentes custom reutilizables
│   │   │   ├── StatCard.tsx            ← KPI card para dashboards
│   │   │   ├── DataTable.tsx           ← Tabla genérica con paginación
│   │   │   ├── SearchInput.tsx         ← Input búsqueda con debounce
│   │   │   ├── StatusBadge.tsx         ← Badge semántico de estado
│   │   │   └── ConfirmDialog.tsx       ← Modal de confirmación
│   │   ├── layouts/
│   │   │   ├── DashboardLayout.tsx     ← Layout principal con sidebar
│   │   │   ├── Sidebar.tsx             ← Nav por rol
│   │   │   └── Header.tsx             ← Notificaciones, avatar, búsqueda global
│   │   └── print/
│   │       ├── TicketPrint.tsx         ← Ticket 80mm para impresora térmica
│   │       ├── ReceiptPrint.tsx        ← Recibo de venta/servicio
│   │       └── DeliveryReceiptPrint.tsx ← Comprobante de entrega
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   └── prisma.ts               ← Prisma client singleton
│   │   ├── validators/
│   │   │   └── index.ts                ← Re-exports de todos los schemas Zod
│   │   ├── utils/
│   │   │   ├── formatters.ts           ← formatCurrency, formatDate, formatTicket
│   │   │   ├── whatsapp.ts             ← generateWhatsAppLink
│   │   │   └── export.ts              ← generateCSV, generateTXT
│   │   ├── constants/
│   │   │   └── index.ts                ← BUSINESS_CONSTANTS
│   │   └── pdf/
│   │       └── templates.tsx           ← Templates PDF con @react-pdf/renderer
│   │
│   ├── server/
│   │   ├── actions/
│   │   │   ├── inventory/              ← createProduct, updateProduct, adjustStock
│   │   │   ├── services/               ← createTicket, updateStatus, deliverTicket
│   │   │   ├── finance/                ← openCashRegister, registerPayment
│   │   │   ├── clients/                ← createClient, updateClient
│   │   │   ├── auth/                   ← login, logout, createUser
│   │   │   └── notifications/          ← createNotification, markAsRead
│   │   ├── queries/                    ← Funciones de lectura por módulo
│   │   └── services/                   ← Lógica de negocio pura (sin DB directa)
│   │       ├── warranty.service.ts     ← calculateWarrantyExpiry, validateClaim
│   │       ├── profit.service.ts       ← calculateProfit, calculateLoss
│   │       └── notification.service.ts ← sendNotification, scheduleWarningAlert
│   │
│   ├── hooks/                          ← Custom hooks globales
│   │   └── useDebounce.ts
│   │
│   └── types/                          ← Tipos globales e interfaces
│       ├── index.ts                    ← Re-exports de todos los tipos
│       ├── actions.ts                  ← ActionResult<T> type
│       └── business.ts                 ← Tipos de negocio compartidos
│
├── prisma/
│   ├── schema.prisma                   ← Schema completo de la BD
│   ├── migrations/                     ← Migraciones generadas por Prisma
│   └── seeds/
│       ├── index.ts                    ← Runner del seed
│       ├── users.ts                    ← Admin inicial: admin@samandigital.com
│       ├── categories.ts               ← Categorías predefinidas
│       └── config.ts                   ← Configuración inicial del negocio
│
├── public/
│   ├── uploads/
│   │   ├── tickets/                    ← Fotos de equipos (TK-xxx-1.jpg)
│   │   └── warranties/                 ← Fotos de reclamos de garantía
│   └── icons/                          ← Iconos de la PWA
│
├── scripts/
│   ├── backup.bat                      ← Backup para Windows
│   ├── backup.sh                       ← Backup para Mac/Linux
│   └── seed.ts                         ← Seed inicial (alias)
│
├── backups/                            ← Carpeta donde van los .zip de backup
│
├── docs/
│   ├── setup.md                        ← Guía de instalación
│   ├── migration.md                    ← Cómo migrar a otro equipo
│   ├── backup.md                       ← Cómo hacer backup y restore
│   ├── manual-admin.md                 ← Manual de usuario: Admin
│   ├── manual-vendedor.md              ← Manual de usuario: Vendedor
│   └── manual-tecnico.md               ← Manual de usuario: Técnico
│
└── tests/
    ├── unit/                           ← Tests unitarios (Vitest)
    │   ├── warranty.test.ts
    │   ├── profit.test.ts
    │   └── inventory.test.ts
    ├── integration/                    ← Tests de integración
    │   ├── cash-register.test.ts
    │   └── pos-flow.test.ts
    └── e2e/                            ← Tests E2E (Playwright)
        ├── login.spec.ts
        ├── sale.spec.ts
        └── repair-flow.spec.ts
```
