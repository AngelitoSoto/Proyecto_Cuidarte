@echo off
title Escaneo SonarQube - Cuidarte+
echo ===================================================
echo   EJECUTANDO ESCANEO DE CODIGO CON SONARQUBE
echo ===================================================
echo.
cd /d "%~dp0backend"
npm run sonar
echo.
echo ===================================================
echo   Resultados en: http://localhost:9000/dashboard?id=cuidarte-plus
echo ===================================================
pause
