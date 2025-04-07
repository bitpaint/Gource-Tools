@echo off
echo.
echo  +-----------------------------------------+
echo  ^|              GOURCE-TOOLS               ^|
echo  ^|              Installation               ^|
echo  +-----------------------------------------+
echo.

echo Checking prerequisites...

:: Check Python
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Python is not installed or not in PATH.
    echo Please install it from https://www.python.org/downloads/
    goto :EOF
)

:: Check Node.js/npm
npm --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Node.js/npm is not installed or not in PATH.
    echo Please install it from https://nodejs.org/
    goto :EOF
)

:: Check Git
git --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Git is not installed or not in PATH.
    echo Please install it from https://git-scm.com/downloads
    goto :EOF
)

:: Check Gource (optional)
gource --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Gource is not installed or not in PATH.
    echo It will be needed for visualization.
    echo Please install it from https://github.com/acaudwell/Gource/releases
)

:: Check FFmpeg (optional)
ffmpeg -version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Warning: FFmpeg is not installed or not in PATH.
    echo It will be needed for video rendering.
    echo Please install it from https://ffmpeg.org/download.html
)

echo.
echo Creating necessary directories...
if not exist repos mkdir repos
if not exist logs mkdir logs
if not exist avatars mkdir avatars
if not exist renders mkdir renders
if not exist config mkdir config

echo.
echo Installing Python dependencies for backend...
cd gource-web\backend
pip install -r requirements.txt
cd ..\..

echo.
echo Installing Node.js dependencies for frontend...
cd gource-web\frontend
npm install
cd ..\..

echo.
echo Installation completed successfully!
echo To start the application, run: run.bat
echo.
pause 