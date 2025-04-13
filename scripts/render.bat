@echo off
setlocal enabledelayedexpansion

:: Simple wrapper script for run-gource.js with default for rendering in 4K

:: Get directory paths
set "CURRENT_DIR=%~dp0"
set "PROJECT_ROOT=%CURRENT_DIR%.."

:: Check for Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Error: Node.js is required but not installed.
    exit /b 1
)

:: Check for ffmpeg
where ffmpeg >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Error: ffmpeg is required but not installed.
    exit /b 1
)

:: Check for gource
where gource >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Error: gource is required but not installed.
    exit /b 1
)

:: Set default timestamp
for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
set "TIMESTAMP=%dt:~0,8%_%dt:~8,6%"
set "OUTPUT_FILE=%PROJECT_ROOT%\exports\renders\gource-%TIMESTAMP%.mp4"

:: Default values
set "LOG_FILE="
set "PRESET=4k"
set "TIME_RANGE="

:: Helper function to show usage
:showHelp
    echo Gource Rendering Script
    echo Usage: %0 [options] ^<log-file^>
    echo.
    echo Options:
    echo   -p, --preset ^<preset^>   Use a preset (hd, 4k, preview)
    echo   -o, --output ^<file^>     Specify output file
    echo   -t, --time ^<range^>      Time range (week, month, year)
    echo   -h, --help              Show this help
    echo.
    echo Example:
    echo   %0 -p hd -t month logs\project.log
    exit /b 0

:: Parse command line arguments
:parseArgs
if "%~1"=="" goto checkLogFile
if "%~1"=="-h" goto showHelp
if "%~1"=="--help" goto showHelp

if "%~1"=="-p" (
    set "PRESET=%~2"
    shift /1
    shift /1
    goto parseArgs
)
if "%~1"=="--preset" (
    set "PRESET=%~2"
    shift /1
    shift /1
    goto parseArgs
)

if "%~1"=="-o" (
    set "OUTPUT_FILE=%~2"
    shift /1
    shift /1
    goto parseArgs
)
if "%~1"=="--output" (
    set "OUTPUT_FILE=%~2"
    shift /1
    shift /1
    goto parseArgs
)

if "%~1"=="-t" (
    set "TIME_RANGE=%~2"
    shift /1
    shift /1
    goto parseArgs
)
if "%~1"=="--time" (
    set "TIME_RANGE=%~2"
    shift /1
    shift /1
    goto parseArgs
)

:: Assume it's the log file
set "LOG_FILE=%~1"
shift /1
goto parseArgs

:checkLogFile
if "%LOG_FILE%"=="" (
    echo Error: No log file specified
    call :showHelp
    exit /b 1
)

:: Build the command
set "CMD=node "%CURRENT_DIR%run-gource.js""

:: Add options
set "CMD=!CMD! --preset %PRESET%"
set "CMD=!CMD! --output "%OUTPUT_FILE%""

if not "%TIME_RANGE%"=="" (
    set "CMD=!CMD! --time-range %TIME_RANGE%"
)

:: Add log file
set "CMD=!CMD! "%LOG_FILE%""

:: Echo the command to be executed
echo Executing: !CMD!

:: Execute the command
%CMD%

exit /b %ERRORLEVEL% 