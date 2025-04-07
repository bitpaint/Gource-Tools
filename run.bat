@echo off
echo.
echo  +-----------------------------------------+
echo  ^|              GOURCE-TOOLS               ^|
echo  ^|              Starting                   ^|
echo  +-----------------------------------------+
echo.

:: Check if necessary directories exist
if not exist gource-web\backend (
    echo Error: Incomplete project structure. Please run install.bat first
    goto :EOF
)

if not exist gource-web\frontend (
    echo Error: Incomplete project structure. Please run install.bat first
    goto :EOF
)

:: Start the backend in a new window
echo Starting backend (Flask)...
start "Gource-Tools Backend" cmd /c "cd gource-web\backend && python app.py"

:: Wait for backend to be ready
echo Waiting for backend to start...
timeout /t 5 /nobreak > nul

:: Start the frontend in a new window
echo Starting frontend (React)...
start "Gource-Tools Frontend" cmd /c "cd gource-web\frontend && npm start"

echo.
echo Gource-Tools is running!
echo.
echo Backend (Flask): http://localhost:5000
echo Frontend (React): http://localhost:3000
echo.
echo To stop the application, close the terminal windows.
echo.
echo Press any key to close this window (the application will continue running).
pause > nul 