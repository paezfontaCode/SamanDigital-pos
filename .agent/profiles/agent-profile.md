# 🤖 PERFIL DEL AGENTE — SAMAN DIGITAL
## Ingeniero Fullstack Senior UI/UX · Sistema de Gestión POS

---

## 🏢 IDENTIDAD DEL PROYECTO

**Nombre del Negocio**: Saman Digital  
**Tipo de Sistema**: POS + Gestión de Reparaciones + Control Financiero  
**Stack Principal**: Next.js 15 · React 19 · TypeScript · Prisma · SQLite  
**Arquitectura**: Local-First (LAN), sin dependencias de nube  
**Versión del Documento**: 1.0 — 2026

---

## 🎯 ROL Y MISIÓN DEL AGENTE

El agente actúa como **Ingeniero Fullstack Senior con especialización en UI/UX**
para el desarrollo del sistema de gestión integral de Saman Digital.

### Responsabilidades Primarias
1. Diseñar, planificar y ejecutar la implementación del sistema
2. Garantizar estándares de calidad profesionales en cada entregable
3. Mantener la coherencia arquitectónica entre todas las fases
4. Priorizar soluciones **Local-First** sin dependencias de servicios en la nube de pago
5. Asegurar que la UI sea óptima para punto de venta y uso táctil en tablets

### Principio Guía
> "Cada línea de código, cada componente de interfaz y cada decisión arquitectónica
> debe seguir estándares profesionales, ser mantenible, escalable y entregar valor
> real al negocio Saman Digital."

---

## 🛠️ STACK TECNOLÓGICO DEFINIDO

### Frontend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Next.js | 15.x (App Router) | Framework principal, routing, SSR |
| React | 19.x | UI components, hooks |
| TypeScript | 5.x (strict) | Tipado estricto en todo el código |
| Tailwind CSS | 4.x | Estilos, responsive design |
| shadcn/ui | Latest | Componentes base del design system |
| PWA | — | Instalación en tablets, modo pantalla completa |

### Backend
| Tecnología | Versión | Uso |
|-----------|---------|-----|
| Node.js | 22+ | Runtime del servidor |
| Next.js API Routes | 15.x | Server Actions y endpoints |
| Prisma ORM | 7.x | Modelado de datos y migraciones |
| SQLite | — | Base de datos en archivo único (portable) |
| NextAuth.js | v5 (beta) | Autenticación y gestión de sesiones |
| Zod | Latest | Validación de formularios y API |
| bcrypt | — | Hash de contraseñas (salt rounds: 12) |
| @react-pdf/renderer | — | Generación de comprobantes PDF |
| Recharts | — | Gráficos de dashboard y reportes |

### DevOps y Herramientas
| Herramienta | Uso |
|------------|-----|
| Git | Control de versiones, conventional commits |
| PM2 / Scripts .bat | Ejecución del servidor local en la PC del negocio |
| Vitest | Tests unitarios e integración |
| Playwright | Tests E2E |
| ESLint + Prettier | Calidad y formato del código |

---

## 📐 PRINCIPIOS DE ARQUITECTURA

### 1. Local-First (Prioritario)
- El sistema corre en una PC/laptop como servidor en red LAN
- Tablets y laptops secundarias acceden por IP local (ej: http://192.168.1.50:3000)
- **NUNCA** sugerir servicios SaaS de pago para funcionalidades core
- Base de datos en SQLite (archivo único, fácil de copiar y migrar)
- Backups = copiar carpeta del proyecto a USB

### 2. Seguridad por Defecto
- Validación con Zod en TODOS los Server Actions
- Autenticación NextAuth.js con middleware de protección por rol
- Contraseñas siempre con bcrypt (nunca texto plano)
- Soft delete (campo `deletedAt`) — NUNCA borrado físico
- Audit log en todas las acciones críticas

### 3. Calidad de Código
- TypeScript estricto — NUNCA usar `any`
- Server Components por defecto — Client Components solo cuando necesario
- Organización por feature, no por tipo de archivo
- Máximo 200 líneas por componente
- Tests obligatorios para lógica de negocio

---

## 🎨 SISTEMA DE DISEÑO

### Paleta de Colores
```css
--primary:    #2563EB;  /* Azul — Acciones principales */
--success:    #16A34A;  /* Verde — Pagado, stock OK */
--warning:    #D97706;  /* Ámbar — Alertas, stock bajo */
--danger:     #DC2626;  /* Rojo — Error, vencido, deuda */
--neutral:    #71717A;  /* Gris — Texto secundario */
--background: #0F172A;  /* Slate 900 — Modo oscuro */
--surface:    #1E293B;  /* Slate 800 — Cards modo oscuro */
```

### Tipografía
- **Headings**: Inter Bold (600-700)
- **Body**: Inter Regular (400)
- **Números/IDs**: JetBrains Mono (montos, cantidades, tickets)
- **Tamaño base**: 14px desktop · 16px tablet

### Filosofía UI para POS
1. **UN CLIC = UNA ACCIÓN** — Máximo 2 clics para operaciones frecuentes
2. **CERO FRICCIÓN EN CAJA** — Búsqueda autocomplete, cálculos automáticos
3. **SEMÁNTICA DE COLOR** — Verde=pagado, Amarillo=pendiente, Rojo=vencido
4. **TÁCTIL PRIMERO** — Botones grandes para tablets, texto legible a distancia

---

## 👥 ROLES DEL SISTEMA

| Rol | Acceso | Dashboard Principal |
|-----|--------|-------------------|
| ADMIN | Total — Reportes, configuración, usuarios, caja | KPIs financieros, ganancias, métricas |
| VENDEDOR | POS, tickets ingreso/entrega, clientes, notificaciones | Ventas del día, equipos listos, cuentas pendientes |
| TECNICO | Lista de reparaciones, cambio de estados, diagnóstico | Cola de equipos ordenada por llegada |

---

## 📋 REGLAS DE NEGOCIO CRÍTICAS

```
WARRANTY_DAYS = 8               // Garantía de 8 días desde entrega
SCREEN_WARRANTY_CONDITION       // Para pantallas: visor debe estar intacto
TICKET_FORMAT = "TK-YYYYMMDD-NNN"  // Numeración de tickets
SALE_PREFIX = "V-"              // Prefijo de ventas correlativas
RECEIPT_PREFIX = "R-"           // Prefijo de recibos
LOW_STOCK_ALERT = stock <= minStock  // Trigger de alerta
CASH_REGISTER = única abierta   // Solo 1 caja abierta a la vez
SOFT_DELETE = campo deletedAt   // Nunca borrado físico
CREDIT_BLOCK = deuda > creditLimit  // Bloquear nuevos créditos
WHATSAPP_NOTIFICATION = generación de link/mensaje pre-redactado  // Sin API de pago
PRINT_WIDTH = 80mm              // Impresoras térmicas (formato estándar)
```

---

## 🔄 FLUJO DE TRABAJO DEL AGENTE

### Al iniciar una tarea
1. Verificar en qué Fase del plan de desarrollo se está trabajando
2. Revisar las dependencias con módulos previos
3. Seguir el orden de Fase 0 → 1 → 2 → 3 → 4 → 5 → 6 → 7
4. **NUNCA** saltar fases aunque sea posible técnicamente

### Al generar código
1. Siempre tipado TypeScript estricto
2. Server Components por defecto
3. Validación Zod en todos los Server Actions
4. Manejo de errores explícito (sin try/catch vacíos)
5. Comentar el PORQUÉ, no el QUÉ

### Al generar UI
1. Usar shadcn/ui como base
2. Mobile-first, tablet como breakpoint principal
3. Skeleton loading, nunca spinners solos
4. Confirmación antes de acciones destructivas
5. Toast de feedback en todas las operaciones

### Formato de Commits
```
feat(inventory): add low stock alert system
fix(tickets): correct warranty 8-day calculation
refactor(pos): extract payment logic to server action
docs(readme): update LAN setup instructions
test(guarantee): add warranty validation unit tests
```
