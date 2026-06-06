# 📦 SKILL: MÓDULO DE INVENTARIO — SAMAN DIGITAL

## Alcance de este Skill
Guía completa para implementar el módulo de inventario dual (accesorios + repuestos)
de Saman Digital. Incluye CRUD, alertas de stock, exportación y gestión de categorías.

---

## CONTEXTO DEL NEGOCIO

El inventario de Saman Digital tiene **DOS tipos separados** de productos:

| Tipo | Enum | Descripción | Ejemplos |
|------|------|-------------|---------|
| Accesorio | `ACCESSORY` | Para venta directa al público | Forros, audífonos, cargadores, cables, protectores |
| Repuesto | `REPLACEMENT` | Para uso en reparaciones | Pantallas, pines de carga, baterías, flex, cámaras |

**⚠️ IMPORTANTE**: Estos inventarios NUNCA se mezclan en la UI ni en los reportes.

---

## ENTIDADES INVOLUCRADAS

```typescript
// Product — entidad principal
interface Product {
  id: string;
  name: string;
  category: string;           // FK lógico a ProductCategory
  type: 'ACCESSORY' | 'REPLACEMENT';
  costPrice: number;
  salePrice: number;
  technicianPrice?: number;   // Solo para repuestos
  stock: number;
  minStock: number;           // Threshold para alerta
  supplierId?: string;
  compatibleModels?: string;  // Solo para repuestos (JSON o texto libre)
  restockTime?: number;       // Días estimados de reposición
  barcode?: string;
  active: boolean;
  deletedAt?: Date;           // Soft delete
}

// Campos calculados (no en BD):
// margin = (salePrice - costPrice) / salePrice * 100
// isLowStock = stock <= minStock
// needsRestock = stock <= minStock
```

---

## CATEGORÍAS PREDEFINIDAS (SEED)

```typescript
// Accesorios
const ACCESSORY_CATEGORIES = [
  'Forros', 'Audífonos', 'Cargadores', 'Cables',
  'Protectores de Pantalla', 'Fundas', 'Otros'
];

// Repuestos
const REPLACEMENT_CATEGORIES = [
  'Pantallas', 'Pines de Carga', 'Baterías',
  'Flex', 'Cámaras', 'Botones', 'Otros'
];
```

---

## SERVER ACTIONS REQUERIDAS

```typescript
// /src/server/actions/inventory/products.ts
'use server'

// Crear producto
export async function createProduct(data: CreateProductInput): Promise<ActionResult<Product>>

// Actualizar producto
export async function updateProduct(id: string, data: UpdateProductInput): Promise<ActionResult<Product>>

// Ajustar stock manualmente (admin)
export async function adjustStock(
  productId: string,
  quantity: number,
  reason: MovementReason,
  notes?: string
): Promise<ActionResult<void>>

// Soft delete de producto
export async function deactivateProduct(id: string): Promise<ActionResult<void>>

// Generar lista de reposición
export async function generateRestockList(
  type?: 'ACCESSORY' | 'REPLACEMENT',
  format?: 'TXT' | 'CSV'
): Promise<ActionResult<string>>
```

---

## QUERIES DE LECTURA

```typescript
// /src/server/queries/inventory.ts

// Lista de productos con filtros
export async function getProducts(filters: {
  type?: 'ACCESSORY' | 'REPLACEMENT';
  category?: string;
  search?: string;
  stockStatus?: 'ok' | 'low' | 'out';
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResult<ProductWithCategory>>

// Obtener producto por ID con movimientos
export async function getProductWithHistory(id: string): Promise<ProductDetail | null>

// Productos con stock bajo (para notificaciones y sidebar badge)
export async function getLowStockProducts(): Promise<Product[]>

// Categorías por tipo
export async function getCategoriesByType(type: 'ACCESSORY' | 'REPLACEMENT'): Promise<ProductCategory[]>
```

---

## COMPONENTES UI REQUERIDOS

### Página Principal de Inventario
```
/src/app/(dashboard)/inventario/accesorios/page.tsx   → Server Component
/src/app/(dashboard)/inventario/repuestos/page.tsx    → Server Component
```

**Layout esperado**:
- Header: título + botón "Nuevo Producto" + buscador + filtros
- Tabla con columnas: Nombre | Categoría | Costo | Precio Venta | Stock | Stock Mín. | Acciones
- Badge de stock: Verde (OK) | Amarillo (bajo) | Rojo (agotado)
- Paginación (20 items por página)

### Formulario Modal de Producto
```
/src/features/inventory/components/ProductFormModal.tsx  → Client Component
```

**Campos del formulario**:
- name (required): Input texto
- category (required): Select con categorías filtradas por tipo
- costPrice (required): Input numérico con formato monetario
- salePrice (required): Input numérico (debe ser >= costPrice)
- margin: Calculado automáticamente (readonly)
- stock (required): Input numérico entero >= 0
- minStock (required): Input numérico entero >= 0
- supplierId: Select de proveedores activos
- technicianPrice: Solo visible si type = REPLACEMENT
- compatibleModels: Solo visible si type = REPLACEMENT (textarea)
- restockTime: Input numérico (días)
- barcode: Input texto (opcional)

### Vista de Detalle del Producto
```
/src/features/inventory/components/ProductDetail.tsx
```
- Info del producto
- Historial de movimientos (tabla con filtro por tipo)
- Botón de ajuste de stock (solo admin)

---

## LÓGICA DE ALERTAS DE STOCK

```typescript
// Trigger de alerta en cada movimiento de salida:
async function checkAndCreateStockAlert(productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return;
  
  if (product.stock <= product.minStock) {
    // 1. Crear notificación de tipo STOCK_LOW para admin
    await createNotification({
      userId: adminUserId,
      type: 'STOCK_LOW',
      title: `Stock bajo: ${product.name}`,
      message: `Quedan ${product.stock} unidades. Mínimo: ${product.minStock}`,
      relatedId: productId,
      relatedType: 'PRODUCT'
    });
    
    // 2. Agregar a lista de reposición automática
    // (simplemente filtrando productos con stock <= minStock al exportar)
  }
}
```

---

## EXPORTACIÓN DE LISTA DE REPOSICIÓN

```typescript
// Formato CSV esperado:
// nombre,categoria,tipo,stock_actual,stock_minimo,cantidad_reponer,proveedor,tiempo_reposicion
// "Forro Samsung A15","Forros","ACCESSORY",2,5,3,"Proveedor XYZ",7

// Formato TXT esperado:
// ============================================
// LISTA DE REPOSICIÓN — SAMAN DIGITAL
// Fecha: 06/06/2026
// ============================================
// 1. Forro Samsung A15
//    Categoría: Forros | Stock: 2/5 | Reponer: 3 uds
//    Proveedor: Proveedor XYZ | Tiempo: 7 días
// ============================================
```

---

## VALIDACIÓN ZOD

```typescript
// /src/lib/validators/inventory.ts
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(2, 'Nombre muy corto').max(100),
  category: z.string().min(1, 'Categoría requerida'),
  type: z.enum(['ACCESSORY', 'REPLACEMENT']),
  costPrice: z.number().min(0, 'El precio de costo no puede ser negativo'),
  salePrice: z.number().min(0),
  technicianPrice: z.number().min(0).optional(),
  stock: z.number().int().min(0),
  minStock: z.number().int().min(0),
  supplierId: z.string().uuid().optional(),
  compatibleModels: z.string().optional(),
  restockTime: z.number().int().min(0).optional(),
  barcode: z.string().optional(),
}).refine(data => data.salePrice >= data.costPrice, {
  message: 'El precio de venta debe ser mayor o igual al costo',
  path: ['salePrice'],
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
```

---

## MOVIMIENTOS DE INVENTARIO

Cada cambio en el stock debe registrar un `InventoryMovement`:

| Razón | Tipo | Origen |
|-------|------|--------|
| PURCHASE | IN | Compra a proveedor |
| SALE | OUT | Venta de accesorio |
| SERVICE_USE | OUT | Uso de repuesto en reparación |
| WARRANTY | OUT | Reemplazo por garantía |
| ADJUSTMENT | IN/OUT | Ajuste manual (solo admin) |
| DAMAGE | OUT | Merma o daño |

---

## TESTS OBLIGATORIOS

```typescript
// /tests/unit/inventory.test.ts
describe('Inventory Logic', () => {
  test('isLowStock returns true when stock <= minStock')
  test('margin calculates correctly')
  test('adjustStock creates InventoryMovement record')
  test('generateRestockList includes only products with stock <= minStock')
  test('sale deducts correct quantity from stock')
  test('createProduct validates salePrice >= costPrice')
})
```

---

## ORDEN DE IMPLEMENTACIÓN

1. Schema Prisma + migración
2. Seeds de categorías predefinidas
3. Server Actions (CRUD básico)
4. Queries con filtros y paginación
5. Página de lista (Server Component)
6. Modal de formulario (Client Component con validación Zod)
7. Alerta de stock bajo en sidebar badge
8. Exportación TXT/CSV de reposición
9. Tests unitarios
