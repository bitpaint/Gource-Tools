@echo off
echo =======================================================
echo = Demarrage du backend de Gource-Tools                =
echo =======================================================
echo.

set BACKEND_DIR=%~dp0gource-web\backend
echo Chemin du backend: %BACKEND_DIR%

if not exist "%BACKEND_DIR%" (
    echo ERREUR: Le repertoire %BACKEND_DIR% n'existe pas.
    echo Verifiez que vous etes dans le bon repertoire.
    pause
    exit /b 1
)

cd /d "%BACKEND_DIR%"

echo Verification des dependances...
if not exist requirements.txt (
    echo ERREUR: Fichier requirements.txt introuvable.
    echo Repertoire actuel:
    cd
    dir
    pause
    exit /b 1
)

echo.
echo Demarrage du serveur backend (Flask)...
echo.
echo Le serveur sera accessible a l'adresse: http://localhost:5000
echo Pour arreter le serveur, appuyez sur Ctrl+C
echo.

start cmd /k "cd /d %BACKEND_DIR% && python app.py"

echo.
echo Le backend a ete lance dans une nouvelle fenetre de commande.
echo Ne fermez pas cette fenetre jusqu'a ce que vous ayez termine d'utiliser l'application.
echo.
pause 