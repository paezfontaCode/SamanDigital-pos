@echo off
set BACKUP_DIR=backups

echo ========================================
echo SAMAN DIGITAL - RESTAURAR BACKUP
echo ========================================
echo.

REM Listar backups disponibles
echo Backups disponibles:
echo.
dir /b %BACKUP_DIR%\saman-digital-backup-*.zip
echo.

set /p BACKUP_FILE="Ingrese el nombre del archivo de backup a restaurar: "

if not exist "%BACKUP_DIR%\%BACKUP_FILE%" (
    echo ERROR: El archivo especificado no existe.
    pause
    exit /b 1
)

echo.
echo Extrayendo backup...
powershell -command "Expand-Archive -Path '%BACKUP_DIR%\%BACKUP_FILE%' -DestinationPath 'temp_restore' -Force"

echo.
echo Reemplazando base de datos...
if exist "temp_restore\prisma\dev.db" (
    copy /Y "temp_restore\prisma\dev.db" "prisma\dev.db"
    echo Database restaurada.
) else (
    echo ADVERTENCIA: No se encontro dev.db en el backup.
)

echo.
echo Reemplazando archivos subidos...
if exist "temp_restore\public\uploads" (
    xcopy /E /I /Y "temp_restore\public\uploads" "public\uploads"
    echo Archivos subidos restaurados.
) else (
    echo ADVERTENCIA: No se encontro carpeta uploads en el backup.
)

echo.
echo Limpiando archivos temporales...
rmdir /S /Q temp_restore

echo.
echo ========================================
echo RESTAURACION COMPLETADA
echo ========================================
echo.
echo Reinicie el servidor para aplicar los cambios.
echo.
pause
