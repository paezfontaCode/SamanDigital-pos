# 🗺️ CONTEXTO DEL PROYECTO — SAMAN DIGITAL

## Archivo de Referencia Rápida para el Agente de Desarrollo

---

## INFORMACIÓN GENERAL

| Campo | Valor |
|-------|-------|
| Nombre del Negocio | Saman Digital |
| Tipo de Negocio | Reparación de teléfonos + Venta de accesorios |
| Tipo de Sistema | POS + Gestión de Reparaciones + Control Financiero |
| Arquitectura | Local-First, LAN, sin nube obligatoria |
| Base de datos | SQLite (archivo único portable) |
| Framework | Next.js 15 + App Router + TypeScript strict |

---

## MÓDULOS DEL SISTEMA (9 módulos + soporte)

| # | Módulo | Ruta | Fase de Dev |
|---|--------|------|-------------|
| 1 | Flujo de Caja | /finanzas/caja | Fase 3 |
| 2 | Inventario Accesorios | /inventario/accesorios | Fase 1 |
| 3 | Inventario Repuestos | /inventario/repuestos | Fase 1 |
| 4 | Control de Servicios (Tickets) | /servicios/tickets | Fase 2 |
| 5 | Control de Garantías | /garantias | Fase 4 |
| 6 | Notificaciones | Sistema global | Fase 4 |
| 7 | Cuentas por Cobrar | /finanzas/cuentas-cobrar | Fase 3 |
| 8 | Cuentas por Pagar | /finanzas/cuentas-pagar | Fase 3 |
| 9 | Facturación y Comprobantes | Integrado en flujos | Fase 5 |
| + | Clientes | /clientes | Fase 1 |
| + | Proveedores | /proveedores | Fase 1 |
| + | Reportes | /reportes | Fase 5 |
| + | Configuración | /configuracion | Fase 0 |
| + | Autenticación | /login | Fase 0 |
| + | POS | /vendedor | Fase 1 |

---

## HOJA DE RUTA (FASES)

```
Fase 0 — Fundamentos y Setup          (1 semana)
  ├── Next.js 15 + TypeScript
  ├── Prisma + SQLite + Migraciones
  ├── NextAuth.js v5 (3 roles)
  └── DashboardLayout con Sidebar

Fase 1 — Inventario y Ventas           (2 semanas)
  ├── CRUD Accesorios + Repuestos
  ├── Alertas de stock bajo
  ├── POS (búsqueda → carrito → cobro → recibo)
  └── CRUD Clientes + Proveedores

Fase 2 — Servicios y Reparaciones      (2 semanas)
  ├── Ingreso de equipos + tickets
  ├── Dashboard técnico
  └── Entrega de equipos + garantías

Fase 3 — Finanzas                      (2 semanas)
  ├── Apertura/cierre de caja
  ├── Cuentas por cobrar (abonos, crédito)
  ├── Cuentas por pagar
  └── Cálculo de ganancias

Fase 4 — Notificaciones y Garantías    (1.5 semanas)
  ├── Sistema de notificaciones (8 tipos)
  ├── WhatsApp (link pre-redactado)
  └── Flujo de reclamos de garantía

Fase 5 — Reportes y PDF                (1.5 semanas)
  ├── Comprobantes en PDF
  ├── Reportes por período
  └── Dashboard KPIs por rol

Fase 6 — LAN, Backups, Impresión       (1 semana)
  ├── Script backup.bat (zip de db + uploads)
  ├── CSS @media print para 80mm
  └── PWA básica (manifest + service worker)

Fase 7 — Pulido, Testing, Deploy       (1 semana)
  ├── Tests unitarios + E2E
  ├── Lighthouse > 90
  └── Documentación de usuario

Total estimado: 12 semanas (3 meses)
```

---

## ENTIDADES DE LA BASE DE DATOS

| Entidad | Descripción |
|---------|-------------|
| User | Usuarios del sistema (Admin, Vendedor, Técnico) |
| Client | Clientes del negocio |
| Supplier | Proveedores de productos y repuestos |
| Product | Accesorios y repuestos del inventario |
| ProductCategory | Categorías de productos |
| InventoryMovement | Historial de cambios en stock |
| Sale | Ventas de accesorios |
| SaleItem | Items individuales de una venta |
| Ticket | Servicio/reparación de un equipo |
| TicketItem | Repuestos y mano de obra de un ticket |
| CashRegister | Caja diaria (apertura/cierre) |
| CashMovement | Movimientos individuales de caja |
| AccountReceivable | Cuentas por cobrar a clientes |
| AccountPayable | Cuentas por pagar a proveedores |
| Payment | Pagos y abonos |
| Warranty | Garantías de reparaciones |
| WarrantyClaim | Reclamos de garantía |
| Notification | Notificaciones del sistema |
| AuditLog | Registro de auditoría |
| BusinessConfig | Configuración del negocio |

---

## CONSTANTES CRÍTICAS DEL NEGOCIO

```typescript
export const BUSINESS_CONSTANTS = {
  WARRANTY_DAYS: 8,                    // Días de garantía desde entrega
  DEFAULT_CREDIT_LIMIT: 0,             // Límite de crédito default
  TICKET_PREFIX: 'TK-',               // Prefijo de tickets
  SALE_PREFIX: 'V-',                   // Prefijo de ventas
  RECEIPT_PREFIX: 'R-',               // Prefijo de recibos
  LOW_STOCK_DEFAULT: 5,               // Stock mínimo por defecto
  PRINT_WIDTH_MM: 80,                  // Ancho para impresora térmica
  SESSION_EXPIRY_HOURS: 8,            // Duración de sesión
  DEBOUNCE_SEARCH_MS: 300,            // Debounce en búsquedas
  PAGE_SIZE: 20,                       // Items por página en tablas
  BACKUP_FOLDER: './backups',          // Carpeta de backups
  UPLOADS_FOLDER: './public/uploads',  // Carpeta de imágenes subidas
} as const;

export const WHATSAPP_BASE_URL = 'https://wa.me/';
```

---

## PERMISOS POR ROL

| Acción | ADMIN | VENDEDOR | TECNICO |
|--------|-------|----------|---------|
| Ver dashboard | ✅ | ✅ | ✅ |
| Gestionar usuarios | ✅ | ❌ | ❌ |
| Configuración del negocio | ✅ | ❌ | ❌ |
| CRUD Inventario | ✅ | ❌ | ❌ |
| Ver Inventario | ✅ | ✅ | ✅ |
| Ajustar stock manualmente | ✅ | ❌ | ❌ |
| Crear ticket de ingreso | ✅ | ✅ | ❌ |
| Cambiar estado del ticket | ✅ | ❌ | ✅ |
| Entregar equipo | ✅ | ✅ | ❌ |
| Vender accesorio (POS) | ✅ | ✅ | ❌ |
| Abrir caja | ✅ | ✅ | ❌ |
| Cerrar caja | ✅ | ❌ | ❌ |
| Ver reportes financieros | ✅ | ❌ | ❌ |
| Ver cuentas por cobrar | ✅ | ✅ | ❌ |
| Gestionar garantías | ✅ | ✅ | ❌ |
| CRUD Clientes | ✅ | ✅ | ❌ |
| CRUD Proveedores | ✅ | ❌ | ❌ |
| Backup de datos | ✅ | ❌ | ❌ |

---

## ARCHIVOS DE CONFIGURACIÓN CLAVE

```
saman-digital/
├── .agent/
│   ├── profiles/
│   │   └── agent-profile.md       ← Perfil completo del agente
│   ├── skills/
│   │   ├── skill-inventory.md     ← Skill de inventario
│   │   ├── skill-services.md      ← Skill de servicios/tickets
│   │   ├── skill-finance.md       ← Skill financiero
│   │   └── skill-pos.md           ← Skill de POS (pendiente)
│   ├── rules/
│   │   └── cursorrules.md         ← Reglas del proyecto (copiar a .cursorrules)
│   └── context/
│       └── project-context.md     ← Este archivo
├── docs/
│   ├── setup.md                   ← Guía de instalación
│   ├── migration.md               ← Guía de migración LAN
│   └── backup.md                  ← Guía de backup y restore
├── scripts/
│   ├── backup.bat                 ← Script de backup Windows
│   ├── backup.sh                  ← Script de backup Mac/Linux
│   └── seed.ts                    ← Datos iniciales
└── prisma/
    ├── schema.prisma              ← Schema de base de datos
    └── seeds/
        ├── users.ts               ← Usuario admin inicial
        ├── categories.ts          ← Categorías predefinidas
        └── config.ts              ← Configuración inicial del negocio
```

---

## FLUJOS PRINCIPALES

### Flujo de Venta de Accesorio
```
Buscar producto → Verificar stock → Agregar al carrito → 
Buscar/crear cliente → Verificar deuda pendiente → 
Procesar pago (contado/crédito) → Descontar inventario → 
Registrar en caja → Generar recibo → Toast confirmación
```

### Flujo de Reparación Completo
```
Ingreso: Datos cliente + equipo → Generar ticket → Cola técnico
Técnico: Ver lista → Cambiar estado → Diagnóstico → Usar repuestos
Listo: Notificar vendedor → Procesar pago → Entregar → 
Activar garantía (8 días) → Programar notificación día 7
```

### Flujo de Reclamo de Garantía
```
Buscar ticket original → Verificar dentro de 8 días →
Si pantalla: verificar visor intacto →
APROBADO: crear nuevo ticket + registrar pérdida financiera
RECHAZADO: registrar motivo + cotizar como servicio normal
```

---

## INTEGRACIÓN WHATSAPP (SIN API DE PAGO)

El sistema genera mensajes pre-redactados que el vendedor envía manualmente:

1. **Botón en detalle del ticket**: "📱 Enviar por WhatsApp"
2. Al hacer clic: abre `wa.me/{telefono}?text={mensaje_codificado}`
3. El vendedor envía manualmente desde WhatsApp Web/Desktop

**Tipos de mensajes**:
- Equipo listo para retirar
- Recordatorio de entrega estimada
- Recordatorio de vencimiento de garantía
- Saldo pendiente del cliente

---

## GUÍA DE BACKUP (PARA DOCUMENTAR)

```batch
:: backup.bat — Windows
@echo off
SET fecha=%date:~-4%-%date:~3,2%-%date:~0,2%
SET nombre=saman-digital-backup-%fecha%
echo Creando backup: %nombre%.zip...
powershell Compress-Archive -Path "prisma\dev.db","public\uploads" -DestinationPath "backups\%nombre%.zip"
echo Backup completado: backups\%nombre%.zip
pause
```

**Migración a nuevo equipo**:
1. Copiar carpeta `saman-digital/` a USB
2. En el nuevo equipo: instalar Node.js 22+
3. Ejecutar: `npm install`
4. Ejecutar: `npx prisma generate`
5. Ejecutar: `npm run start` o `pm2 start`
6. Acceder desde otros dispositivos: `http://IP_LOCAL:3000`
