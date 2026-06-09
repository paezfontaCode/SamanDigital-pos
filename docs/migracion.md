# Migración a Nuevo Equipo

## Requisitos Previos

- **Node.js 22+** instalado ([Descargar](https://nodejs.org/))
- **npm** o **pnpm** (incluido con Node.js)
- Acceso de administrador para instalar dependencias
- Conexión de red local (para modo multi-dispositivo)

---

## Pasos de Migración

### 1. Copiar el Proyecto

Copiar la carpeta completa del proyecto a una memoria USB o compartir por red:

```
saman-digital/
├── prisma/
├── public/
├── src/
├── package.json
└── ... (resto de archivos)
```

**Importante:** Incluir todos los archivos, especialmente:
- `prisma/dev.db` (base de datos con toda la información)
- `public/uploads/` (fotos de productos y otros archivos)

---

### 2. En el Nuevo Equipo

#### a) Clonar/Copiar la Carpeta

Colocar la carpeta en la ubicación deseada del nuevo equipo:

```bash
# Ejemplo: copiar a Documentos
cp -r /ruta/al/backup/saman-digital ~/Documentes/saman-digital
cd ~/Documentes/saman-digital
```

#### b) Instalar Dependencias

```bash
npm install
```

O si usas pnpm:

```bash
pnpm install
```

#### c) Restaurar Base de Datos (si aplica)

Si tienes un backup reciente:

**Windows:**
```bat
scripts\restore.bat
```

**Mac/Linux:**
```bash
chmod +x scripts/restore.sh
./scripts/restore.sh
```

O copiar manualmente:
```bash
cp /ruta/al/backup/prisma/dev.db prisma/dev.db
```

#### d) Generar Prisma Client

```bash
npx prisma generate
```

#### e) Compilar el Proyecto

```bash
npm run build
```

---

### 3. Iniciar el Servidor

#### Opción A: Modo Desarrollo

```bash
npm start
```

#### Opción B: Producción con PM2 (Recomendado)

Instalar PM2 globalmente:

```bash
npm install -g pm2
```

Iniciar el servidor:

```bash
pm2 start npm --name "saman-pos" -- start
pm2 save
pm2 startup
```

**Ventajas de PM2:**
- Reinicio automático si el servidor se detiene
- Logs centralizados
- Inicio automático al boot del sistema

---

### 4. Configurar Red Local

#### Obtener IP del Servidor

**Windows:**
```bat
ipconfig
```

**Mac/Linux:**
```bash
ifconfig
# o
ip addr show
```

Buscar la IP local (ej: `192.168.1.100`)

#### Acceder desde Otros Dispositivos

En tablets, celulares u otras computadoras en la misma red:

```
http://[IP_DEL_SERVIDOR]:3000
```

Ejemplo: `http://192.168.1.100:3000`

---

### 5. Configurar Firewall (si es necesario)

Permitir el puerto 3000 en el firewall del servidor:

**Windows:**
```bat
netsh advfirewall firewall add rule name="Saman POS" dir=in action=allow protocol=TCP localport=3000
```

**Linux (UFW):**
```bash
sudo ufw allow 3000/tcp
```

---

## Tiempo Estimado

| Paso | Tiempo |
|------|--------|
| Copia de archivos | 2-5 min |
| Instalación dependencias | 3-5 min |
| Configuración inicial | 2-3 min |
| Pruebas de funcionamiento | 3-5 min |
| **TOTAL** | **~15 minutos** |

---

## Verificación Post-Migración

Marcar cada ítem completado:

- [ ] El servidor inicia sin errores
- [ ] Se puede acceder desde localhost:3000
- [ ] Se puede acceder desde otros dispositivos en la red
- [ ] La base de datos contiene todos los productos/clientes
- [ ] Las fotos de productos se muestran correctamente
- [ ] Los backups se pueden generar y restaurar
- [ ] La impresión de tickets funciona correctamente

---

## Solución de Problemas Comunes

### Error: "Cannot find module"

```bash
rm -rf node_modules
npm install
npx prisma generate
```

### Error: "Database not found"

Verificar que `prisma/dev.db` existe:

```bash
ls prisma/dev.db
```

Si no existe, restaurar desde backup.

### No puedo acceder desde otros dispositivos

1. Verificar que el servidor esté corriendo
2. Confirmar que están en la misma red WiFi/cableada
3. Verificar configuración del firewall
4. Intentar desactivar temporalmente el antivirus

### La impresora térmica no imprime bien

1. Verificar que el CSS de impresión esté cargado
2. Probar con otro navegador (Chrome recomendado)
3. Asegurar que el ancho de papel esté configurado en 80mm
4. Revisar configuración de márgenes en el diálogo de impresión

---

## Backup Recomendado Antes de Migrar

Antes de migrar, crear un backup completo:

**Windows:**
```bat
scripts\backup.bat
```

**Mac/Linux:**
```bash
chmod +x scripts/backup.sh
./scripts/backup.sh
```

Guardar el archivo `.zip` generado en un lugar seguro (USB, nube, etc.).

---

## Soporte

Para asistencia adicional, consultar la documentación completa o contactar al equipo de soporte técnico.
