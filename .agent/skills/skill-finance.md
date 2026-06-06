# 💰 SKILL: MÓDULO FINANCIERO — SAMAN DIGITAL

## Alcance de este Skill
Implementación del control financiero completo: flujo de caja, cuentas por cobrar,
cuentas por pagar y cálculo de ganancias netas.

---

## REGLAS DE NEGOCIO FINANCIERAS (CRÍTICAS)

```
CAJA ÚNICA ACTIVA
→ Solo puede haber 1 CashRegister con status=OPEN a la vez
→ VERIFICAR antes de permitir cualquier venta o cobro

REGISTRO AUTOMÁTICO
→ Cada venta, pago de servicio y abono recibido debe crear CashMovement automáticamente
→ Nunca registrar manualmente si hay un Server Action que lo haga automáticamente

SOFT_DELETE en ventas
→ NUNCA eliminar Sale, Ticket ni CashMovement físicamente
→ Usar deletedAt

CREDIT_BLOCK
→ Si deuda actual del cliente >= creditLimit → bloquear nueva venta a crédito
→ Mostrar advertencia clara al vendedor con el saldo actual del cliente

GARANTÍAS = PÉRDIDA FINANCIERA
→ Reclamo de garantía aprobado → registrar CashMovement tipo EXPENSE > WARRANTY_LOSS
→ Deducir del cálculo de ganancias del período
```

---

## MÓDULO DE CAJA (CashRegister)

### Apertura de Caja
```typescript
// Solo 1 caja abierta a la vez
async function openCashRegister(
  userId: string,
  openingAmount: number,
  notes?: string
): Promise<ActionResult<CashRegister>> {
  // 1. Verificar que no haya caja abierta
  const existingOpen = await prisma.cashRegister.findFirst({
    where: { status: 'OPEN' }
  });
  if (existingOpen) {
    return { success: false, error: 'CASH_REGISTER_ALREADY_OPEN' };
  }
  
  // 2. Crear nueva caja
  const register = await prisma.cashRegister.create({
    data: {
      openedBy: userId,
      openingAmount,
      status: 'OPEN',
      notes
    }
  });
  
  // 3. AuditLog
  await createAuditLog(userId, 'CREATE', 'CashRegister', register.id);
  
  return { success: true, data: register };
}
```

### Cierre de Caja (Solo ADMIN)
```typescript
// El cierre calcula el arqueo automáticamente
async function closeCashRegister(
  userId: string,
  physicalCount: number,  // Lo que el admin cuenta físicamente
  notes?: string
): Promise<ActionResult<CashRegisterSummary>> {
  // 1. Verificar que el usuario es ADMIN
  // 2. Obtener caja abierta
  // 3. Calcular systemClosing: openingAmount + SUM(INCOME) - SUM(EXPENSE)
  // 4. Calcular difference: physicalCount - systemClosing (arqueo)
  // 5. Cerrar caja y crear AuditLog
}
```

---

## MOVIMIENTOS DE CAJA (Automáticos)

Los movimientos se crean automáticamente desde otros módulos:

| Origen | Tipo | Categoría |
|--------|------|-----------|
| Venta de accesorio (completa) | INCOME | PRODUCT_SALE |
| Cobro de servicio de reparación | INCOME | SERVICE_PAYMENT |
| Abono recibido de cliente | INCOME | PARTIAL_PAYMENT |
| Pago a proveedor | EXPENSE | SUPPLIER_PAYMENT |
| Compra de mercadería | EXPENSE | INVENTORY_PURCHASE |
| Gasto fijo (alquiler, etc.) | EXPENSE | FIXED_EXPENSE |
| Salario | EXPENSE | SALARY |
| Garantía aprobada (pérdida) | EXPENSE | WARRANTY_LOSS |

---

## MÓDULO DE CUENTAS POR COBRAR

### Flujo de Creación
```typescript
// Se crea automáticamente cuando:
// 1. Una venta tiene paymentStatus = PARTIAL o PENDING
// 2. Una entrega de equipo tiene pago parcial

async function createAccountReceivable(data: {
  clientId: string;
  saleId?: string;
  ticketId?: string;
  totalAmount: number;
  paidAmount: number;
  dueDate?: Date;
}): Promise<AccountReceivable>
```

### Registro de Abonos
```typescript
async function registerPayment(
  accountId: string,
  data: {
    amount: number;
    paymentMethod: PaymentMethod;
    userId: string;
    notes?: string;
  }
): Promise<ActionResult<Payment>> {
  // 1. Verificar que amount <= balance de la cuenta
  // 2. Crear Payment
  // 3. Actualizar AccountReceivable.paidAmount y .balance
  // 4. Si balance = 0: cambiar status a PAID
  // 5. Crear CashMovement tipo INCOME > PARTIAL_PAYMENT
  // 6. AuditLog
}
```

### Control de Crédito
```typescript
async function checkCreditAvailability(clientId: string): Promise<{
  canGetCredit: boolean;
  currentDebt: number;
  creditLimit: number;
  available: number;
}> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      accountsReceivable: {
        where: { status: { not: 'PAID' } }
      }
    }
  });
  
  const currentDebt = client?.accountsReceivable.reduce(
    (sum, ar) => sum + ar.balance, 0
  ) ?? 0;
  
  return {
    canGetCredit: currentDebt < (client?.creditLimit ?? 0),
    currentDebt,
    creditLimit: client?.creditLimit ?? 0,
    available: Math.max(0, (client?.creditLimit ?? 0) - currentDebt)
  };
}
```

---

## CÁLCULO DE GANANCIAS

```typescript
// Ganancia por venta de accesorio:
// profit = SUM(SaleItem.profit) donde SaleItem.profit = qty * (unitPrice - costPrice)

// Ganancia por servicio:
// profit = SUM(TicketItem.profit) 
// donde TicketItem.profit = qty * (unitPrice - costPrice) para repuestos
//       + laborCost para mano de obra (laborCost tiene 100% de margen)

// Pérdida por garantía (ya registrada como EXPENSE en CashMovement):
// loss = SUM(CashMovement.amount WHERE category = WARRANTY_LOSS AND period)

// Ganancia neta:
// netProfit = grossProfit - FIXED_EXPENSE - SALARY - OTHER_EXPENSE

interface ProfitSummary {
  period: { from: Date; to: Date };
  
  // Ingresos
  productSalesRevenue: number;
  serviceRevenue: number;
  totalRevenue: number;
  
  // Costos directos
  productSalesCost: number;
  servicePartsCost: number;
  warrantyLosses: number;
  totalDirectCost: number;
  
  // Ganancia bruta
  grossProfit: number;
  grossMargin: number; // %
  
  // Gastos operativos
  fixedExpenses: number;
  salaries: number;
  otherExpenses: number;
  totalOperationalExpenses: number;
  
  // Ganancia neta
  netProfit: number;
  netMargin: number; // %
}
```

---

## DASHBOARD FINANCIERO POR ROL

### Dashboard Admin
```
Fila 1 (KPI Cards):
- 💰 Ganancia Neta del Mes
- 📈 Ventas del Día
- 🔧 Ingresos por Servicios del Día
- ⚠️ Cuentas por Cobrar Vencidas (monto total)

Fila 2 (Gráficos):
- Gráfico de barras: Ingresos vs Egresos (últimos 30 días)
- Gráfico de torta: Ventas vs Servicios vs Garantías

Fila 3 (Tablas):
- Movimientos de caja del día (últimos 10)
- Cuentas vencidas prioritarias (top 5)
```

---

## GASTOS FIJOS RECURRENTES

```typescript
// Permitir registro de gastos fijos que se repiten periódicamente
interface RecurringExpense {
  name: string;           // "Alquiler", "Electricidad", "Salario Juan"
  amount: number;
  category: 'FIXED_EXPENSE' | 'SALARY';
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  dayOfMonth?: number;    // Para frecuencia mensual
  active: boolean;
}

// Al aplicar un gasto recurrente: crear CashMovement automáticamente
```

---

## REPORTES FINANCIEROS

Todos los reportes deben ser:
- Filtrables por fecha (desde - hasta)
- Exportables a PDF y CSV
- Visibles solo para ADMIN (y parcialmente VENDEDOR)

```typescript
const FINANCIAL_REPORTS = [
  'reporte-ventas',        // Ventas por período con desglose
  'reporte-servicios',     // Servicios por período con ganancias
  'reporte-caja',          // Movimientos de caja con arqueo
  'reporte-cuentas-cobrar', // Estado de cuentas por cliente
  'reporte-ganancias',     // Ganancia bruta y neta con comparativo
  'reporte-garantias'      // Reclamos, aprobados, rechazados, pérdidas
];
```

---

## TESTS OBLIGATORIOS

```typescript
describe('Finance Logic', () => {
  test('Cannot open cash register if one is already open')
  test('Cash register closing calculates correct difference')
  test('Payment correctly reduces account receivable balance')
  test('Account status changes to PAID when balance reaches 0')
  test('Credit block activates when debt >= creditLimit')
  test('Gross profit calculation is correct (revenue - cost)')
  test('Warranty loss is deducted from net profit')
  test('CashMovement is created automatically on sale completion')
})
```
