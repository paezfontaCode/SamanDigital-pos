#!/bin/bash
BACKUP_DIR="backups"

echo "========================================"
echo "SAMAN DIGITAL - RESTAURAR BACKUP"
echo "========================================"
echo ""

# Listar backups disponibles
echo "Backups disponibles:"
echo ""
ls -la $BACKUP_DIR/saman-digital-backup-*.zip 2>/dev/null
echo ""

read -p "Ingrese el nombre del archivo de backup a restaurar: " BACKUP_FILE

if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    echo "ERROR: El archivo especificado no existe."
    exit 1
fi

echo ""
echo "Extrayendo backup..."
unzip -o "$BACKUP_DIR/$BACKUP_FILE" -d temp_restore

echo ""
echo "Reemplazando base de datos..."
if [ -f "temp_restore/prisma/dev.db" ]; then
    cp "temp_restore/prisma/dev.db" "prisma/dev.db"
    echo "Database restaurada."
else
    echo "ADVERTENCIA: No se encontro dev.db en el backup."
fi

echo ""
echo "Reemplazando archivos subidos..."
if [ -d "temp_restore/public/uploads" ]; then
    cp -r "temp_restore/public/uploads"/* "public/uploads/" 2>/dev/null || true
    echo "Archivos subidos restaurados."
else
    echo "ADVERTENCIA: No se encontro carpeta uploads en el backup."
fi

echo ""
echo "Limpiando archivos temporales..."
rm -rf temp_restore

echo ""
echo "========================================"
echo "RESTAURACION COMPLETADA"
echo "========================================"
echo ""
echo "Reinicie el servidor para aplicar los cambios."
echo ""
