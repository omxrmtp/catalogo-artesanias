Write-Host "=== Compresor de Modelos 3D (Draco + WebP + Quantize) ===" -ForegroundColor Green
Write-Host ""

# Check if Node.js is available
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "ERROR: Node.js no está instalado." -ForegroundColor Red
    Write-Host "Descárgalo desde: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}
Write-Host "Node.js detectado: $nodeVersion" -ForegroundColor Cyan

# Check if dependencies are installed
$hasDeps = Test-Path "..\node_modules\@gltf-transform\core"
if (-not $hasDeps) {
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    Push-Location ..
    npm install @gltf-transform/core @gltf-transform/functions @gltf-transform/extensions sharp draco3d
    Pop-Location
}

# Find GLB files not yet compressed (files over 10 MB likely uncompressed)
$glbFiles = Get-ChildItem -Path "..\assets\*.glb" | Where-Object { $_.Length -gt 10MB -or $_.Length -eq 0 }
$count = ($glbFiles | Measure-Object).Count

if ($count -eq 0) {
    Write-Host "No se encontraron modelos sin comprimir en assets/." -ForegroundColor Green
    Write-Host "Todos los modelos ya están comprimidos." -ForegroundColor Gray
    exit 0
}

Write-Host "Se encontraron $count modelo(s) sin comprimir:" -ForegroundColor Yellow
$glbFiles | ForEach-Object {
    Write-Host "  - $($_.Name) ($([math]::Round($_.Length/1MB,1)) MB)" -ForegroundColor Gray
}
Write-Host ""

$confirm = Read-Host "¿Comprimir estos modelos? (s/n)"
if ($confirm -ne "s") {
    Write-Host "Operación cancelada." -ForegroundColor Red
    exit 0
}

# Run compression
Write-Host ""
Write-Host "Comprimiendo..." -ForegroundColor Green
Push-Location ..
$glbFiles | ForEach-Object {
    $name = $_.Name
    Write-Host "`nProcesando: $name" -ForegroundColor Cyan
    node scripts/comprimir.js "assets/$name"
}
Pop-Location

Write-Host ""
Write-Host "=== Compresión completada ===" -ForegroundColor Green
Write-Host ""
Write-Host "Para verificar: revisa los tamaños en assets/" -ForegroundColor Gray
