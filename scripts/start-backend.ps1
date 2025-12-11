# scripts/start-backend.ps1
# Script para iniciar el backend de MIMS (Django) fácilmente

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       MIMS - Iniciando Backend         " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Crear entorno virtual si no existe
if (-not (Test-Path .\venv\Scripts\python.exe)) {
    Write-Host "Creando entorno virtual (venv)..." -ForegroundColor Yellow
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error al crear el entorno virtual. Asegurate de tener Python instalado." -ForegroundColor Red
        exit 1
    }
    Write-Host "Entorno virtual creado correctamente." -ForegroundColor Green
    Write-Host ""
}

# 2. Activar el entorno virtual
Write-Host "Activando entorno virtual..." -ForegroundColor Yellow
& .\venv\Scripts\Activate.ps1
if ($?) {
    Write-Host "Entorno virtual activado." -ForegroundColor Green
} else {
    Write-Host "Error al activar el entorno virtual." -ForegroundColor Red
    exit 1
}
Write-Host ""

# 3. Instalar dependencias si aún no están
if (-not (Test-Path .\venv\installed.txt)) {
    Write-Host "Instalando dependencias desde requirements.txt..." -ForegroundColor Yellow
    pip install --upgrade pip
    pip install -r requirements.txt
    if ($LASTEXITCODE -eq 0) {
        "instalado" | Out-File -FilePath .\venv\installed.txt -Encoding utf8
        Write-Host "Dependencias instaladas correctamente." -ForegroundColor Green
    } else {
        Write-Host "Error al instalar las dependencias." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Las dependencias ya estaban instaladas." -ForegroundColor Gray
}
Write-Host ""

# 4. Aplicar migraciones
Write-Host "Aplicando migraciones de la base de datos..." -ForegroundColor Yellow
python manage.py migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al aplicar migraciones." -ForegroundColor Red
    exit 1
}
Write-Host "Migraciones aplicadas correctamente." -ForegroundColor Green
Write-Host ""

# 5. Iniciar el servidor Django
Write-Host "Iniciando servidor Django en http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host "Presiona Ctrl+C para detener el servidor" -ForegroundColor Cyan
Write-Host ""

python manage.py runserver 127.0.0.1:8000