@echo off
title Subir Proyecto Cuidarte+ a GitHub
color 0b
echo ===================================================================
echo     SUBIENDO PROYECTO CUIDARTE+ A TU REPOSITORIO DE GITHUB
echo     Repositorio: https://github.com/AngelitoSoto/Proyecto_Cuidarte
echo ===================================================================
echo.
cd /d "%~dp0"

echo Verificando estado del repositorio...
git status -s

echo.
echo ===================================================================
echo  Ejecutando: git push -u origin main
echo  * Si se abre una pestana en tu navegador o ventana de GitHub:
echo    Haz clic en "Sign in with your browser" o "Authorize".
echo ===================================================================
echo.
git push -u origin main

echo.
if %errorlevel% equ 0 (
    color 0a
    echo ===================================================================
    echo   [EXITO] Proyecto subido exitosamente a GitHub!
    echo   Puedes revisarlo en: https://github.com/AngelitoSoto/Proyecto_Cuidarte
    echo ===================================================================
) else (
    color 0c
    echo ===================================================================
    echo   [ATENCION] Hubo un inconveniente al subir el repositorio.
    echo   Revisa el mensaje de error anterior.
    echo ===================================================================
)
echo.
pause
