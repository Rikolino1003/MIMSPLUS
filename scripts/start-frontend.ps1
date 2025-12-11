# scripts\start-frontend.ps1  ← Versión 100% funcional (instala Vite si falta)

Write-Host "=========================================" -ForegroundColor Magenta
Write-Host "     MIMS - Iniciando Frontend (Vite)    " -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Magenta
Write-Host ""

# Cambia a la carpeta frontend
Push-Location $PSScriptRoot\..\frontend

# SIEMPRE fuerza la instalación o actualización de dependencias (así nunca falta vite)
Write-Host "Instalando/actualizando dependencias del frontend (incluye Vite)..." -ForegroundColor Yellow
npm install

# Si por alguna razón falla npm install, avisa y sale
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Falló la instalación de dependencias" -ForegroundColor Red
    Pop-Location
    pause
    exit 1
}
Write-Host "Todas las dependencias instaladas correctamente (incluido Vite)" -ForegroundColor Green
Write-Host ""

# Arranca Vite usando npx → esto funciona aunque falle el PATH
Write-Host "Iniciando servidor Vite en http://localhost:5173" -ForegroundColor Cyan
Write-Host "Presiona Ctrl+C para detener" -ForegroundColor Gray
Write-Host ""

npx vite

# Vuelve a la carpeta raíz
Pop-Location