<#
Start-With-Backup.ps1

Descripción:
- Realiza un respaldo del archivo `db.sqlite3` (si existe) en `backups/` con timestamp.
- Ejecuta `python manage.py migrate --noinput` para asegurar esquema sin tocar datos.
- Arranca el servidor Django y el frontend (Vite) en background SOLO si los puertos 8000 / 5173 están libres.
- No borra datos existentes. Si los puertos están ocupados, informa y no reinicia procesos.

Uso:
Desde la raíz del repo (donde está `manage.py`):
pwsh -ExecutionPolicy Bypass -File .\scripts\start-with-backup.ps1

#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host "== Start-With-Backup: inicio de proceso de arranque con respaldo ==" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$repoRoot = Resolve-Path (Join-Path $scriptDir "..")
$repoRoot = $repoRoot.Path

Write-Host "Repositorio: $repoRoot"

# Paths
$dbFile = Join-Path $repoRoot 'db.sqlite3'
$backupDir = Join-Path $repoRoot 'backups'
$venvActivate = Join-Path $repoRoot 'venv\Scripts\Activate.ps1'
$frontendDir = Join-Path $repoRoot 'frontend'

if (-not (Test-Path $backupDir)) {
    New-Item -Path $backupDir -ItemType Directory | Out-Null
}

if (Test-Path $dbFile) {
    $ts = Get-Date -Format 'yyyyMMdd_HHmmss'
    $backupFile = Join-Path $backupDir "db_$ts.sqlite3"
    Write-Host "Creando respaldo de base de datos: $backupFile"
    Copy-Item -Path $dbFile -Destination $backupFile -Force
} else {
    Write-Host "No se encontró db.sqlite3 en la raíz; se omite respaldo." -ForegroundColor Yellow
}

function Test-PortInUse {
    param(
        [int]$Port
    )
    try {
        $res = Test-NetConnection -ComputerName 127.0.0.1 -Port $Port -WarningAction SilentlyContinue
        return [bool]$res.TcpTestSucceeded
    } catch {
        # Fallback si Test-NetConnection no está disponible
        $out = netstat -ano | Select-String ":$Port " -SimpleMatch
        return -not [string]::IsNullOrEmpty($out)
    }
}

Write-Host "Aplicando migraciones (no destructivas)..." -ForegroundColor Cyan
# Nos aseguramos de ejecutar migrate desde la raíz del repo
Push-Location -Path $repoRoot
try {
    if (Test-Path $venvActivate) {
        & $venvActivate
    } else {
        Write-Host "Advertencia: no se encontró entorno virtual en $venvActivate" -ForegroundColor Yellow
    }
    python manage.py migrate --noinput
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: 'python manage.py migrate' finalizó con código $LASTEXITCODE" -ForegroundColor Red
    } else {
        Write-Host "Migraciones aplicadas." -ForegroundColor Green
    }
} catch {
    Write-Host "Error al intentar aplicar migraciones: $_" -ForegroundColor Red
} finally {
    Pop-Location
}

# Levantar Django si puerto 8000 libre
$djangoPort = 8000
if (Test-PortInUse -Port $djangoPort) {
    Write-Host "Puerto $djangoPort está en uso. No se iniciará Django." -ForegroundColor Yellow
} else {
    Write-Host "Iniciando servidor Django en http://0.0.0.0:$djangoPort" -ForegroundColor Green
    $djangoCmd = "& '$venvActivate'; python manage.py runserver 0.0.0.0:$djangoPort"
    Start-Process pwsh -ArgumentList '-NoExit','-Command',$djangoCmd -WorkingDirectory $repoRoot -WindowStyle Minimized
}

# Levantar frontend si puerto 5173 libre
$frontendPort = 5173
if (Test-PortInUse -Port $frontendPort) {
    Write-Host "Puerto $frontendPort está en uso. No se iniciará frontend (Vite)." -ForegroundColor Yellow
} else {
    # Preferimos dev para hot-reload; cambiar a 'preview' si prefieres servir build
    Write-Host "Iniciando frontend (Vite) en puerto $frontendPort (dev)" -ForegroundColor Green
    $frontendCmd = "cd '$frontendDir'; npm run dev -- --host"
    Start-Process pwsh -ArgumentList '-NoExit','-Command',$frontendCmd -WorkingDirectory $frontendDir -WindowStyle Minimized
}

Write-Host "== Start-With-Backup: proceso finalizado. Comprueba logs en las terminales abiertas. ==" -ForegroundColor Cyan

Write-Host "Si necesitas iniciar manualmente:"
Write-Host " - Django: & .\venv\Scripts\Activate.ps1; python manage.py runserver 0.0.0.0:8000"
Write-Host " - Frontend: cd frontend; npm run dev" 
