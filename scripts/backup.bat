@echo off
:: ============================================================
:: SCRIPT DE BACKUP — SAMAN DIGITAL
:: Genera un archivo .zip con la base de datos y las imágenes
:: ============================================================
:: Uso: Doble clic en este archivo o ejecutar desde cmd

setlocal enabledelayedexpansion

:: Obtener fecha actual en formato YYYY-MM-DD
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set FECHA=!datetime:~0,4!-!datetime:~4,2!-!datetime:~6,2!
set HORA=!datetime:~8,2!-!datetime:~10,2!

set NOMBRE=saman-digital-backup-!FECHA!-!HORA!
set DESTINO=backups\!NOMBRE!.zip

echo.
echo  ================================================
echo   SAMAN DIGITAL — SISTEMA DE BACKUP
echo  ================================================
echo   Fecha: !FECHA!
echo   Destino: !DESTINO!
echo  ================================================
echo.

:: Crear carpeta backups si no existe
if not exist "backups" mkdir backups

:: Verificar que existe la base de datos
if not exist "prisma\dev.db" (
  echo  [ERROR] No se encontró la base de datos en prisma\dev.db
  echo  Asegúrate de ejecutar este script desde la raíz del proyecto.
  pause
  exit /b 1
)

echo  Comprimiendo base de datos y archivos...
echo.

:: Comprimir con PowerShell (disponible en Windows 10+)
powershell -Command ^
  "$files = @(); " ^
  "if (Test-Path 'prisma\dev.db') { $files += 'prisma\dev.db' }; " ^
  "if (Test-Path 'public\uploads') { $files += 'public\uploads' }; " ^
  "Compress-Archive -Path $files -DestinationPath '%DESTINO%' -Force"

if %errorlevel% == 0 (
  echo  [OK] Backup creado exitosamente:
  echo       !DESTINO!
  echo.
  :: Mostrar tamaño del archivo
  for %%A in ("!DESTINO!") do echo   Tamaño: %%~zA bytes
  echo.
  echo  IMPORTANTE: Guarda este archivo en un lugar seguro.
  echo  Para restaurar: copia este .zip y extrae en la misma
  echo  estructura de carpetas del proyecto.
) else (
  echo  [ERROR] Ocurrió un error al crear el backup.
  echo  Verifica que PowerShell tenga permisos de escritura.
)

echo.
echo  ================================================
pause
