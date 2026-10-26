@echo off
title Pruebas Automatizadas Jest - Cuidarte+
echo ===================================================
echo   EJECUTANDO BATERIA DE 25 PRUEBAS (JEST)
echo ===================================================
echo.
cd /d "%~dp0backend"
npm test
echo.
pause
