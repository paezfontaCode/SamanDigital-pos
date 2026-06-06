# 🔧 Saman Digital — Sistema de Gestión POS

Sistema de gestión integral para reparación de teléfonos y venta de accesorios.

## Características

- 📱 **POS táctil** optimizado para tablets
- 🎫 **Gestión de reparaciones** con tickets numerados
- 📦 **Control de inventario** dual (accesorios + repuestos)
- 💰 **Módulo financiero** completo (caja, cuentas, ganancias)
- 🔔 **Notificaciones** vía WhatsApp (sin API de pago)
- 🛡️ **Garantías** con control de 8 días
- 🖨️ **Impresión térmica** (80mm) de tickets y recibos
- 📊 **Reportes** exportables en PDF y CSV
- 🌐 **Local-First** — funciona en red LAN sin internet

## Stack Tecnológico

- **Framework**: Next.js 15 (App Router)
- **UI**: React 19 + TypeScript 5 + Tailwind CSS 4 + shadcn/ui
- **Base de Datos**: SQLite con Prisma ORM 7
- **Auth**: NextAuth.js v5 (3 roles: Admin, Vendedor, Técnico)
- **PDF**: @react-pdf/renderer
- **Gráficos**: Recharts
- **Tests**: Vitest + Playwright

## Instalación Rápida

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con tu configuración

# 3. Generar cliente de Prisma
npx prisma generate

# 4. Ejecutar migraciones
npx prisma migrate dev --name init

# 5. Poblar datos iniciales
npx tsx prisma/seeds/index.ts

# 6. Iniciar servidor de desarrollo
npm run dev
```

## Acceso Inicial

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin@samandigital.com | Admin2026! | Administrador |

## Acceso desde la Red LAN

Una vez iniciado el servidor, otros dispositivos en la misma red pueden acceder:
```
http://[IP-DE-ESTE-PC]:3000
```
Para encontrar la IP: ejecuta `ipconfig` en Windows y busca "Dirección IPv4".

## Backup

```batch
:: Windows
scripts\backup.bat

:: El backup se guarda en: backups\saman-digital-backup-YYYY-MM-DD.zip
```

## Migración a Otro Equipo

1. Copiar la carpeta completa del proyecto a USB
2. En el nuevo equipo: instalar Node.js 22+
3. Ejecutar `npm install`
4. Ejecutar `npx prisma generate`
5. Ejecutar `npm start` (o `pm2 start`)
6. Acceder desde otros dispositivos en la red LAN

## Estructura del Proyecto

Ver [docs/estructura-carpetas.md](docs/estructura-carpetas.md) para la estructura completa.

## Documentación del Agente de Desarrollo

El agente AI que ayuda a desarrollar este proyecto está configurado en `.agent/`:

- `.agent/profiles/agent-profile.md` → Perfil y capacidades del agente
- `.agent/skills/` → Skills especializados por módulo
- `.agent/rules/cursorrules.md` → Reglas del proyecto
- `.agent/context/project-context.md` → Contexto y referencia rápida
- `.cursorrules` → Reglas para Cursor AI (se carga automáticamente)

## Plan de Desarrollo

El sistema se desarrolla en 8 fases (12 semanas estimadas):

| Fase | Módulos | Estado |
|------|---------|--------|
| 0 | Setup, DB, Auth, Layout | ⏳ Pendiente |
| 1 | Inventario + POS | ⏳ Pendiente |
| 2 | Servicios + Reparaciones | ⏳ Pendiente |
| 3 | Finanzas | ⏳ Pendiente |
| 4 | Notificaciones + Garantías | ⏳ Pendiente |
| 5 | Reportes + PDF | ⏳ Pendiente |
| 6 | LAN + Backups + Impresión | ⏳ Pendiente |
| 7 | Testing + Deploy | ⏳ Pendiente |

---

*Desarrollado para Saman Digital · 2026*
