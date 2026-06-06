# 📏 REGLAS DEL PROYECTO — SAMAN DIGITAL
# Archivo: .cursorrules (copiar este contenido a la raíz del proyecto)
# Actualizado: 2026

---

## IDENTIDAD DEL PROYECTO

Este es el sistema de gestión integral para **Saman Digital**, un negocio de
reparación de teléfonos y venta de accesorios. El sistema opera **Local-First**
en red LAN, sin dependencias de servicios en la nube de pago.

---

## STACK TECNOLÓGICO

```
Next.js 15 (App Router)     → Framework principal
React 19                    → UI components
TypeScript 5.x (strict)     → Tipado en TODO el código
Tailwind CSS 4.x            → Estilos, responsive
shadcn/ui (latest)          → Componentes base del design system
Prisma 7.x                  → ORM y migraciones
SQLite                      → Base de datos en archivo único
NextAuth.js v5              → Autenticación y sesiones
Zod                         → Validación de TODOS los inputs
@react-pdf/renderer         → Generación de PDFs
Recharts                    → Gráficos en dashboards
```

---

## REGLAS DE TYPESCRIPT (OBLIGATORIAS)

```typescript
// ❌ PROHIBIDO — nunca usar 'any'
const processData = (data: any) => { ... }

// ✅ CORRECTO — siempre tipos explícitos
const processInventoryItem = (item: InventoryItem): ProcessedItem => { ... }

// ❌ PROHIBIDO — type assertion sin validación
const user = data as User;

// ✅ CORRECTO — siempre validar con Zod primero
const parsed = userSchema.safeParse(data);
if (!parsed.success) return { success: false, error: parsed.error };
const user = parsed.data;
```

---

## REGLAS DE REACT / NEXT.JS (OBLIGATORIAS)

```typescript
// ❌ PROHIBIDO — useEffect para datos del servidor
useEffect(() => { fetchInventory(); }, []);

// ✅ CORRECTO — Server Components para carga inicial
export default async function InventoryPage() {
  const inventory = await prisma.inventoryItem.findMany();
  return <InventoryClient initialData={inventory} />;
}

// ❌ PROHIBIDO — props drilling más de 2 niveles
// ✅ CORRECTO — Context o Server Actions para flujos complejos

// ❌ PROHIBIDO — spinners solos
// ✅ CORRECTO — Skeleton loaders siempre
```

---

## REGLAS DE ORGANIZACIÓN DE CÓDIGO

```
✅ Organización por FEATURE (dominio de negocio):
   /features/inventory/components
   /features/services/components
   /features/finance/components
   /features/pos/components

❌ PROHIBIDO — organización por tipo:
   /components/buttons
   /components/cards
   /components/forms
```

```
✅ Convenciones de nombres:
   - Componentes:  PascalCase      → TicketCard, InventoryTable
   - Funciones:    camelCase       → calculateProfit, filterInventory
   - Constantes:   UPPER_SNAKE    → MAX_CREDIT_LIMIT, WARRANTY_DAYS
   - Páginas:      kebab-case     → ticket-detail/page.tsx
   - Tipos:        PascalCase     → InventoryItem, TicketStatus

✅ Límite de archivo: 200 líneas por componente
✅ Extraer lógica reutilizable a custom hooks en /hooks
✅ Separar Server Components de Client Components explícitamente
```

---

## REGLAS DE BASE DE DATOS (PRISMA)

```
✅ Migrations para TODOS los cambios de schema
   npx prisma migrate dev --name <descripcion>

✅ Transacciones para operaciones que afectan múltiples tablas
   await prisma.$transaction([...])

✅ Soft delete: campo deletedAt en lugar de borrado físico

✅ Índices obligatorios en campos de búsqueda frecuente:
   - Client.phone, Client.name
   - Product.name, Product.barcode
   - Ticket.number, Ticket.serial, Ticket.status
   - AuditLog.createdAt

❌ PROHIBIDO — borrado físico de registros críticos
❌ PROHIBIDO — queries sin límite en tablas grandes (siempre paginar)
```

---

## REGLAS DE SEGURIDAD (OBLIGATORIAS)

```
1. NUNCA confiar en datos del cliente
   → Validar TODO con Zod en Server Actions

2. NUNCA exponer IDs internos en URLs
   → Usar slugs o IDs hasheados cuando sea posible

3. SIEMPRE verificar permisos del usuario
   → Middleware de NextAuth en cada ruta protegida

4. SIEMPRE sanitizar inputs del usuario
   → Zod + escape en renders

5. NUNCA almacenar contraseñas en texto plano
   → bcrypt con salt rounds 12+

6. SIEMPRE audit log en acciones críticas
   → CREATE/UPDATE/DELETE en Sale, Ticket, CashMovement, User

7. SIEMPRE rate-limiting en operaciones sensibles
   → Login, registro, eliminación
```

---

## REGLAS DE UI (DESIGN SYSTEM)

```
✅ Usar shadcn/ui como base SIEMPRE
✅ Tailwind classes directamente (NO CSS custom salvo excepciones)
✅ Mobile-first (tablet como breakpoint principal para POS)
✅ Accesibilidad: labels en forms, aria-labels en icon buttons
✅ Loading: skeleton loaders SIEMPRE, NUNCA spinners solos
✅ Confirmación modal antes de acciones destructivas
✅ Toast de feedback en TODAS las operaciones (éxito y error)
✅ Colores semánticos: verde=pagado, amarillo=pendiente, rojo=vencido
✅ Botón de acción principal: grande y visible (mínimo h-12 en tablet)
```

---

## REGLAS DE NEGOCIO (CRÍTICAS)

```
WARRANTY_DAYS = 8
→ Garantía siempre desde fecha de ENTREGA, no de reparación
→ Para cambio de pantalla: verificar visor intacto

TICKET_NUMBER = "TK-YYYYMMDD-NNN"
→ Formato: TK-20260606-001

CASH_REGISTER = única activa
→ Solo puede haber UNA caja OPEN a la vez
→ Verificar antes de permitir ventas

SOFT_DELETE obligatorio
→ Agregar deletedAt en lugar de eliminar registros de ventas/tickets

CREDIT_BLOCK automático
→ Bloquear nuevos créditos si deuda actual >= creditLimit del cliente

WHATSAPP_INTEGRATION = sin API de pago
→ Generar mensaje pre-redactado con botón "Copiar y abrir WhatsApp"
→ NUNCA usar Meta API o servicios de pago para notificaciones

PRINT_CSS = 80mm de ancho
→ Usar @media print con width: 80mm para impresoras térmicas
→ Ocultar sidebar, header, botones en modo impresión

LOCAL_FIRST = prioridad absoluta
→ NUNCA sugerir servicios en la nube de pago para funcionalidad core
→ SQLite, archivos locales, red LAN
→ Backup = zip de /prisma/dev.db + /public/uploads
```

---

## ESTRUCTURA DE CARPETAS

```
/src
  /app
    /(auth)          → Login (rutas públicas)
    /(dashboard)     → App protegida
      /admin
      /vendedor
      /tecnico
      /inventario
        /accesorios
        /repuestos
      /servicios
        /tickets
        /entregas
      /finanzas
        /caja
        /cuentas-cobrar
        /cuentas-pagar
        /ganancias
      /clientes
      /proveedores
      /garantias
      /reportes
      /configuracion
    /api
  /features          → Lógica por dominio de negocio
    /auth
    /inventory
    /services
    /finance
    /notifications
    /reports
    /clients
    /suppliers
    /warranties
    /settings
    /pos
  /components
    /ui              → shadcn/ui (NO editar directamente)
    /shared          → Componentes compartidos custom
    /layouts         → DashboardLayout, Sidebar, Header
    /print           → Componentes de impresión (@media print)
  /lib
    /db              → Prisma client singleton
    /validators      → Zod schemas
    /utils           → Utilidades generales
    /constants       → Constantes del negocio
    /pdf             → Templates de PDF
  /server
    /actions         → Server Actions por feature
    /queries         → Queries de lectura
    /services        → Lógica de negocio pura
  /hooks             → Custom React hooks
  /types             → Tipos globales e interfaces
```

---

## FORMATO DE COMMITS

```
feat(inventory):        add low-stock alert badge in sidebar
fix(tickets):           correct 8-day warranty calculation
fix(pos):               prevent sale when cash register is closed
refactor(cash-flow):    extract movement categorization to service
docs(setup):            add LAN migration guide for Windows
test(warranty):         add claim validation edge cases
chore(deps):            update Next.js to 15.x
style(dashboard):       improve KPI cards responsive layout
```

---

## REGLAS PARA AI-ASSISTED DEVELOPMENT

```
1. NUNCA aceptar código generado sin revisión manual
2. SIEMPRE verificar que NO usa 'any' ni ignora tipos
3. NUNCA generar todo el módulo de una vez → iterar componente por componente
4. SIEMPRE mantener tests pasando después de cada integración
5. SIEMPRE seguir el orden de fases: 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7
6. NUNCA saltar fases
7. SIEMPRE documentar decisiones de diseño importantes
8. NUNCA usar soluciones que oculten errores (try/catch vacíos)
9. SIEMPRE priorizar soluciones Local-First
10. SIEMPRE que se genere vista de impresión: CSS @media print optimizado para 80mm
```
