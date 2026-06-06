# sync.ps1 - Script de sincronización para PowerShell
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SINCRONIZANDO CON GITHUB" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar si hay cambios
$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "[INFO] No hay cambios para sincronizar. Tu repositorio está al día." -ForegroundColor Green
    exit 0
}

# Contar cambios
$changesCount = ($status -split '\n').Count
Write-Host "[INFO] Se detectaron $changesCount archivos modificados." -ForegroundColor Yellow
Write-Host ""

# Mostrar resumen
Write-Host "[INFO] Resumen de cambios:" -ForegroundColor Cyan
git status --short
Write-Host ""

# Pedir mensaje de commit
$message = Read-Host "Ingresa el mensaje del commit (o presiona Enter para usar mensaje automático)"
if ([string]::IsNullOrWhiteSpace($message)) {
    $message = "chore: sync changes from Qwen Code Web"
}

Write-Host ""
Write-Host "[STEP 1/3] Agregando cambios..." -ForegroundColor Cyan
git add .
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] No se pudieron agregar los cambios." -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Cambios agregados." -ForegroundColor Green

Write-Host ""
Write-Host "[STEP 2/3] Creando commit: $message" -ForegroundColor Cyan
git commit -m $message
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] No se pudo crear el commit. (¿Olvidaste configurar tu nombre/email en git?)" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Commit creado." -ForegroundColor Green

Write-Host ""
Write-Host "[STEP 3/3] Subiendo cambios a GitHub..." -ForegroundColor Cyan
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[WARNING] Push fallido. Intentando traer cambios remotos primero (pull --rebase)..." -ForegroundColor Yellow
    git pull origin main --rebase
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] No se pudo sincronizar. Hay conflictos que debes resolver manualmente en tu editor." -ForegroundColor Red
        exit 1
    }
    Write-Host "[INFO] Reintentando push..." -ForegroundColor Cyan
    git push origin main
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Push fallido después del pull." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  SINCRONIZACIÓN COMPLETADA CON ÉXITO" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Resumen:"
Write-Host "  - Archivos modificados: $changesCount"
Write-Host "  - Commit: $message"
Write-Host "  - Branch: main"
Write-Host ""
Write-Host "Ahora puedes continuar trabajando con Qwen Code Web." -ForegroundColor Cyan