@echo off
title Servidor - Catalogo Artesanias 3D
echo ============================================
echo  CHAPARRI - ACOTURCH - Servidor Local
echo ============================================
echo.
echo Abriendo http://localhost:8000 ...
echo Presiona CTRL+C para detener el servidor.
echo.
start http://localhost:8000

:: Intentar con Python 3
python --version >nul 2>&1
if %errorlevel% equ 0 (
    python -m http.server 8000
    goto :end
)

:: Intentar con Python 2
python -c "import SimpleHTTPServer" >nul 2>&1
if %errorlevel% equ 0 (
    python -m SimpleHTTPServer 8000
    goto :end
)

:: Intentar con Node.js (http-server global)
npx --yes http-server -p 8000 --cors 2>nul
if %errorlevel% equ 0 goto :end

:: Intentar con PHP
php -S localhost:8000 2>nul
if %errorlevel% equ 0 goto :end

echo.
echo ERROR: No se encontro Python, Node.js ni PHP.
echo Instala Python desde https://www.python.org/downloads/
echo.
pause

:end
