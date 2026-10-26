@echo off
title Cuidarte+ - Sistema de Examenes Medicos
echo ===================================================
echo     INICIANDO SISTEMA CUIDARTE+ (DUOC UC)
echo ===================================================
echo.
echo [1/3] Iniciando Servidor Backend (Puerto 5000)...
start "Cuidarte+ Backend API (Puerto 5000)" cmd /k "cd /d "%~dp0backend" && npm start"

timeout /t 3 /nobreak >nul

echo [2/3] Iniciando Cliente Frontend React (Puerto 3000)...
start "Cuidarte+ Frontend SPA (Puerto 3000)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

timeout /t 3 /nobreak >nul

echo [3/3] Abriendo aplicacion en el navegador...
start http://localhost:3000

echo.
echo ===================================================
echo   SISTEMA ACTIVO:
echo   - Frontend: http://localhost:3000
echo   - Backend API: http://localhost:5000
echo   - Swagger Docs: http://localhost:5000/api-docs
echo ===================================================
echo.
pause
