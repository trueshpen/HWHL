@echo off
echo.
echo ========================================
echo   Wife Happiness App - Dev Server
echo ========================================
echo.

REM Get the directory where this batch file is located
cd /d "%~dp0"

echo Checking if server is already running...
netstat -ano | findstr :5173 >nul
if %errorlevel% == 0 (
    echo.
    echo WARNING: Port 5173 is already in use!
    echo Another server might be running.
    echo.
    echo Try opening: http://localhost:5173
    echo.
    pause
    exit /b
)

echo.
echo Starting development server...
echo.
echo ========================================
echo   IMPORTANT INSTRUCTIONS:
echo ========================================
echo.
echo 1. Wait for the message: "Local: http://localhost:5173"
echo 2. Then open that URL in your browser
echo 3. Keep this window OPEN while using the app
echo 4. Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

npm run dev

if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo   ERROR: Server failed to start!
    echo ========================================
    echo.
    echo Possible issues:
    echo - Port 5173 might be in use
    echo - Node.js might not be installed
    echo - Dependencies might not be installed
    echo.
    echo Try running: npm install
    echo.
    pause
)

