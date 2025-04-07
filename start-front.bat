@echo off
echo =======================================================
echo = Demarrage du frontend de Gource-Tools               =
echo =======================================================
echo.

set FRONTEND_DIR=%~dp0gource-web\frontend
echo Chemin du frontend: %FRONTEND_DIR%

if not exist "%FRONTEND_DIR%" (
    echo ERREUR: Le repertoire %FRONTEND_DIR% n'existe pas.
    echo Verifiez que vous etes dans le bon repertoire.
    pause
    exit /b 1
)

cd /d "%FRONTEND_DIR%"

echo Verification des dependances...
if not exist package.json (
    echo ERREUR: Fichier package.json introuvable.
    echo Repertoire actuel:
    cd
    dir
    pause
    exit /b 1
)

echo.
echo Demarrage du serveur frontend (React)...
echo.
echo Le frontend sera accessible a l'adresse: http://localhost:3000
echo Pour arreter le serveur, appuyez sur Ctrl+C
echo.

start cmd /k "cd /d %FRONTEND_DIR% && npm start"

echo.
echo Le frontend a ete lance dans une nouvelle fenetre de commande.
echo Ne fermez pas cette fenetre jusqu'a ce que vous ayez termine d'utiliser l'application.
echo.
pause 