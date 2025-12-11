# start-all.ps1
# Opens two new PowerShell windows (prefers pwsh) to run backend and frontend
# Usage: .\scripts\start-all.ps1
#
# Ejecutar desde la raíz del repositorio (ejemplo concreto en tu máquina):
# pwsh -NoProfile -ExecutionPolicy Bypass -File 'C:\Rikolino\proyecto-main\scripts\start-all.ps1'
# O desde PowerShell clásico:
# powershell -NoProfile -ExecutionPolicy Bypass -File 'C:\Rikolino\proyecto-main\scripts\start-all.ps1'
#
# El script determina automáticamente la ubicación del repo y abre dos ventanas:
#  - una para `start-backend.ps1` (activa venv, instala requirements, migra y ejecuta Django)
#  - otra para `npm run dev` dentro de `frontend`

Set-StrictMode -Version Latest

# Resuelve la ruta absoluta a la carpeta raíz del repo (uno arriba de scripts/)
$repo = (Resolve-Path -Path (Join-Path $PSScriptRoot '..')).Path

# Rutas completas a scripts/proyectos
$backendScript = Join-Path $repo 'scripts\start-backend.ps1'
$frontendFolder = Join-Path $repo 'frontend'

# Detectar ejecutables de PowerShell
$pwshExe = (Get-Command pwsh -ErrorAction SilentlyContinue)?.Path
$psExe = (Get-Command powershell -ErrorAction SilentlyContinue)?.Path

function Start-TerminalProcess {
    param(
        [string]$exePath,
        [string[]]$args,
        [string]$workingDir
    )

    if (-not (Test-Path $exePath)) { throw "Executable not found: $exePath" }
    $startInfo = @{
        FilePath = $exePath
        ArgumentList = $args
        WorkingDirectory = $workingDir
        NoNewWindow = $false
    }
    Start-Process @startInfo
}

if ($pwshExe) {
    # Use -File for the backend script so the script path is executed directly.
    Start-TerminalProcess -exePath $pwshExe -args @('-NoExit','-File',$backendScript) -workingDir $repo
    # For frontend we want to run npm in the frontend folder
    Start-TerminalProcess -exePath $pwshExe -args @('-NoExit','-Command','npm run dev') -workingDir $frontendFolder
} elseif ($psExe) {
    Start-TerminalProcess -exePath $psExe -args @('-NoExit','-File',$backendScript) -workingDir $repo
    Start-TerminalProcess -exePath $psExe -args @('-NoExit','-Command','npm run dev') -workingDir $frontendFolder
} else {
    Write-Error "No PowerShell executable found to start processes in new windows. Run scripts individually instead.`nExamples:`n  pwsh -NoProfile -ExecutionPolicy Bypass -File '$backendScript'`n  cd '$frontendFolder'; npm run dev"
}
