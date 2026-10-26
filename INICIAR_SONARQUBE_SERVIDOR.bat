@echo off
title Levantar Servidor SonarQube - Cuidarte+
echo ===================================================
echo     LEVANTANDO SERVIDOR SONARQUBE EN DOCKER
echo ===================================================
echo.
echo Verificando contenedor de SonarQube...
docker ps -a --filter "name=sonarqube" --format "{{.Names}}" | findstr /i "sonarqube" >nul

if %errorlevel% equ 0 (
    echo El contenedor 'sonarqube' ya existe. Iniciandolo...
    docker start sonarqube
) else (
    echo Creando e iniciando contenedor SonarQube LTS...
    docker run -d --name sonarqube -p 9000:9000 sonarqube:lts-community
)

echo.
echo Esperando a que el servidor SonarQube termine de iniciar...
echo (Esto puede tardar entre 40 a 60 segundos en una PC nueva)
echo.

:wait_loop
timeout /t 5 /nobreak >nul
curl -s http://127.0.0.1:9000/api/system/status | findstr /i "UP" >nul
if %errorlevel% equ 0 (
    goto ready
)
echo Esperando inicializacion del motor de SonarQube...
goto wait_loop

:ready
echo.
echo ===================================================
echo   SONARQUBE ESTA OPERATIVO!
echo   Abriendo: http://localhost:9000
echo ===================================================
start http://localhost:9000
echo.
pause
