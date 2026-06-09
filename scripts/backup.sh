#!/bin/bash
# ============================================================
# SCRIPT DE BACKUP — SAMAN DIGITAL
# Genera un archivo .zip con la base de datos y las imágenes
# ============================================================
# Uso: ./scripts/backup.sh

BACKUP_DIR="backups"
DATE=$(date +%Y-%m-%d)
HOUR=$(date +%H-%M-%S)
FILE="saman-digital-backup-$DATE-$HOUR.zip"

echo ""
echo "================================================"
echo " SAMAN DIGITAL — SISTEMA DE BACKUP"
echo "================================================"
echo "  Fecha: $DATE"
echo "  Destino: $BACKUP_DIR/$FILE"
echo "================================================"
echo ""

# Crear carpeta backups si no existe
mkdir -p $BACKUP_DIR

# Verificar que existe la base de datos
if [ ! -f "prisma/dev.db" ]; then
    echo "[ERROR] No se encontró la base de datos en prisma/dev.db"
    echo "Asegúrate de ejecutar este script desde la raíz del proyecto."
    exit 1
fi

echo "Comprimiendo base de datos y archivos..."
echo ""

# Comprimir archivos
zip -r "$BACKUP_DIR/$FILE" prisma/dev.db public/uploads/ 2>/dev/null

if [ $? -eq 0 ]; then
    echo "[OK] Backup creado exitosamente:"
    echo "     $BACKUP_DIR/$FILE"
    echo ""
    # Mostrar tamaño del archivo
    SIZE=$(ls -lh "$BACKUP_DIR/$FILE" | awk '{print $5}')
    echo "  Tamaño: $SIZE"
    echo ""
    echo "  IMPORTANTE: Guarda este archivo en un lugar seguro."
    echo "  Para restaurar: copia este .zip y extrae en la misma"
    echo "  estructura de carpetas del proyecto."
else
    echo "[ERROR] Ocurrió un error al crear el backup."
    exit 1
fi

echo ""
echo "Eliminando backups antiguos (más de 7 días)..."
find $BACKUP_DIR -name "saman-digital-backup-*.zip" -mtime +7 -delete
echo "Backups antiguos eliminados."

echo ""
echo "================================================"

