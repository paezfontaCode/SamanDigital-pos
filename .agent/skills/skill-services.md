# 📦 SKILL: MÓDULO DE SERVICIOS Y TICKETS — SAMAN DIGITAL

## Alcance de este Skill
Implementación completa del flujo de reparaciones: ingreso de equipos, gestión del
técnico, entrega al cliente y activación de garantías.

---

## CONTEXTO DEL NEGOCIO

El módulo de servicios es el **corazón de Saman Digital**. Gestiona el ciclo
completo de una reparación:

```
Cliente llega → Ingreso del equipo → Técnico repara → Notificación → Entrega → Garantía (8 días)
```

---

## ESTADOS DEL TICKET

```typescript
enum TicketStatus {
  RECIBIDO,           // Equipo recibido, en cola
  EN_REVISION,        // Técnico lo está evaluando
  EN_REPARACION,      // En proceso de reparación activa
  EN_ESPERA_REPUESTO, // Esperando que llegue un repuesto
  REPARADO,           // Reparación completada
  LISTO_ENTREGAR,     // Listo para entrega (notificado al vendedor)
  ENTREGADO,          // Entregado al cliente
  NO_REPARABLE        // Sin solución posible
}
```

### Transiciones Válidas
```
RECIBIDO → EN_REVISION
EN_REVISION → EN_REPARACION | EN_ESPERA_REPUESTO | NO_REPARABLE
EN_REPARACION → REPARADO
EN_ESPERA_REPUESTO → EN_REPARACION
REPARADO → LISTO_ENTREGAR (automático o manual)
LISTO_ENTREGAR → ENTREGADO (solo vendedor)
```

---

## FORMATO DE NÚMERO DE TICKET

```typescript
// TK-YYYYMMDD-NNN
// Ejemplo: TK-20260606-001

async function generateTicketNumber(): Promise<string> {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  
  const count = await prisma.ticket.count({
    where: {
      createdAt: {
        gte: new Date(today.setHours(0, 0, 0, 0)),
        lt: new Date(today.setHours(23, 59, 59, 999))
      }
    }
  });
  
  const seq = String(count + 1).padStart(3, '0');
  return `TK-${dateStr}-${seq}`;
}
```

---

## SERVER ACTIONS REQUERIDAS

```typescript
// /src/server/actions/services/tickets.ts
'use server'

// Crear nuevo ticket (vendedor)
export async function createTicket(data: CreateTicketInput): Promise<ActionResult<Ticket>>

// Actualizar estado del ticket (técnico)
export async function updateTicketStatus(
  ticketId: string,
  newStatus: TicketStatus,
  data?: {
    diagnosis?: string;
    technicianNotes?: string;
    laborCost?: number;
    partsUsed?: Array<{ productId: string; quantity: number }>;
  }
): Promise<ActionResult<Ticket>>

// Registrar uso de repuestos (técnico)
export async function addTicketParts(
  ticketId: string,
  parts: Array<{ productId: string; quantity: number; unitPrice: number }>
): Promise<ActionResult<void>>

// Entregar equipo (vendedor)
export async function deliverTicket(
  ticketId: string,
  payment: {
    amount: number;
    method: PaymentMethod;
    isPartial: boolean;
  }
): Promise<ActionResult<{ receiptNumber: string }>>

// Buscar ticket por número o cliente
export async function searchTicket(query: string): Promise<Ticket[]>
```

---

## FLUJO DE INGRESO (VENDEDOR)

```typescript
// Pasos del formulario de ingreso de equipo:

// 1. Buscar o crear cliente
//    - Input: nombre o teléfono
//    - Si no existe: mini-formulario inline (nombre + teléfono)
//    - Mostrar indicador de deuda pendiente al seleccionar

// 2. Datos del equipo
//    - marca (required)
//    - modelo (required)
//    - color (required)
//    - serial/IMEI (optional)

// 3. Tipo de problema
//    - problemType: SCREEN_CHANGE | CHARGE_PIN | GENERAL_REVIEW | OTHER
//    - Si SCREEN_CHANGE: checkbox "¿Es por garantía?"
//    - problem: textarea descripción libre

// 4. Información adicional
//    - Fotos del equipo (upload local → /public/uploads/tickets/)
//    - estimatedCost: número
//    - estimatedDays: número

// 5. Al guardar:
//    - generateTicketNumber()
//    - Calcular queuePosition (MAX(queuePosition) + 1 de tickets no entregados)
//    - status = RECIBIDO
//    - Crear Notification tipo EQUIPMENT_READY para técnico (cuando cambie a REPARADO)
```

---

## FLUJO DEL TÉCNICO

```typescript
// Dashboard del técnico: lista ordenada por queuePosition ASC
// Filtros: estado, tipo de problema

// Al marcar "En Reparación":
// 1. Verificar disponibilidad de repuestos necesarios
// 2. Si hay stock: reservar soft (opcional para v1)
// 3. Si no hay: cambiar a EN_ESPERA_REPUESTO + notificar admin

// Al marcar "Reparado":
// 1. Calcular costo total: SUM(TicketItems.total) + laborCost
// 2. Descontar repuestos del inventario (crear InventoryMovement tipo SERVICE_USE)
// 3. Crear Notification tipo EQUIPMENT_READY para vendedor
// 4. Programar Notification tipo DELIVERY_REMINDER para mañana
```

---

## FLUJO DE ENTREGA (VENDEDOR)

```typescript
// Al entregar:
// 1. Mostrar resumen: problema, repuestos, costo total
// 2. Procesar pago (completo o parcial)
// 3. Si parcial: crear AccountReceivable con saldo pendiente
// 4. Registrar CashMovement tipo INCOME > SERVICE_PAYMENT
// 5. Cambiar status a ENTREGADO
// 6. Crear Warranty:
//    - startDate = now()
//    - endDate = now() + 8 días
//    - isScreenReplacement = (ticket.problemType === 'SCREEN_CHANGE')
// 7. Programar Notification tipo WARRANTY_EXPIRING para día 7
// 8. Generar comprobante de entrega (vista de impresión)
```

---

## COMPONENTES UI REQUERIDOS

### Dashboard del Técnico
```
/src/app/(dashboard)/tecnico/page.tsx
```
- Lista de tickets ordenada por `queuePosition`
- Badge de estado con colores
- Click en ticket → modal de diagnóstico y cambio de estado
- Filtros por estado y tipo de problema

### Formulario de Ingreso de Equipo
```
/src/features/services/components/NewTicketForm.tsx
```
- Multi-step o scroll largo con secciones
- Búsqueda de cliente con autocomplete
- Upload de fotos (input file, preview inmediato)
- Cálculo automático de posición en cola

### Modal de Cambio de Estado
```
/src/features/services/components/TicketStatusModal.tsx
```
- Solo estados válidos según transición actual
- Para REPARADO: formulario de repuestos usados y costo de mano de obra
- Textarea de diagnóstico y notas internas

### Vista de Entrega
```
/src/features/services/components/TicketDelivery.tsx
```
- Resumen del servicio
- Formulario de pago
- Indicador de cambio si es efectivo
- Vista previa del comprobante

---

## TICKET DE IMPRESIÓN (80mm TÉRMICA)

```css
@media print {
  body { width: 80mm; margin: 0; padding: 0; }
  .no-print { display: none !important; }
  
  .ticket-header { text-align: center; font-weight: bold; }
  .ticket-divider { border-top: 1px dashed #000; margin: 4px 0; }
  .ticket-number { font-size: 24px; font-weight: 900; text-align: center; }
  .ticket-field { display: flex; justify-content: space-between; font-size: 10px; }
}
```

**Contenido del ticket impreso**:
1. Logo/nombre de Saman Digital (centrado)
2. Número de ticket en grande (TK-20260606-001)
3. Fecha y hora de ingreso
4. ─────────────────
5. CLIENTE: nombre / teléfono
6. ─────────────────
7. EQUIPO: marca + modelo + color
8. IMEI: serial (si existe)
9. PROBLEMA: descripción
10. ─────────────────
11. Costo estimado: $ XXX.XX
12. Entrega estimada: X días
13. ─────────────────
14. GARANTÍA: 8 días desde entrega
15. Condiciones de garantía

---

## NOTIFICACIONES WHATSAPP (SIN API DE PAGO)

```typescript
function generateWhatsAppMessage(ticket: Ticket, client: Client): string {
  return encodeURIComponent(
    `Hola ${client.name}! 👋\n\n` +
    `Tu equipo *${ticket.brand} ${ticket.model}* ya está listo.\n` +
    `🎫 Ticket: ${ticket.number}\n` +
    `🔧 Servicio: ${ticket.problem}\n` +
    `💰 Total: $${ticket.finalCost}\n\n` +
    `Puedes pasar a retirarlo en nuestro local.\n` +
    `*Saman Digital* 📱`
  );
}

function getWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  return `https://wa.me/${cleanPhone}?text=${message}`;
}
```

UI: Botón "📱 Enviar por WhatsApp" que abre `window.open(whatsappLink, '_blank')`

---

## TESTS OBLIGATORIOS

```typescript
describe('Ticket Logic', () => {
  test('generateTicketNumber follows TK-YYYYMMDD-NNN format')
  test('Warranty startDate equals deliveryDate')
  test('Warranty endDate is exactly 8 days after startDate')
  test('Queue position increments correctly')
  test('STATUS transitions are validated (invalid transition throws)')
  test('Delivery deducts parts from inventory')
  test('Partial payment creates AccountReceivable')
})
```
