@echo off
echo.
echo ========================================
echo   Wife Happiness App - Dev Server
echo ========================================
echo.

REM Get the directory where this batch file is located and go to project root
cd /d "%~dp0\.."

echo Checking if servers are already running...
set PORT_WARNING=0
netstat -ano | findstr :5173 >nul
if %errorlevel% == 0 (
    echo.
    echo WARNING: Port 5173 is already in use!
    echo Another Vite server might be running.
    echo.
    set PORT_WARNING=1
)
netstat -ano | findstr :3000 >nul
if %errorlevel% == 0 (
    echo.
    echo WARNING: Port 3000 is already in use!
    echo Another API server might be running.
    echo.
    set PORT_WARNING=1
)
if %PORT_WARNING% == 1 (
    echo Try opening: http://localhost:5173
    echo.
    echo Press any key to continue anyway, or Ctrl+C to cancel...
    pause >nul
)

echo.
echo Starting both servers (API + Vite)...
echo.
echo ========================================
echo   IMPORTANT INSTRUCTIONS:
echo ========================================
echo.
echo 1. Wait for both servers to start:
echo    - API Server: http://localhost:3000
echo    - Vite Server: http://localhost:5173
echo 2. Open http://localhost:5173 in your browser
echo 3. Keep this window OPEN while using the app
echo 4. Press Ctrl+C to stop both servers
echo.
echo NOTE: Your data will be automatically saved to:
echo       data\wife-happiness-data.json
echo.
echo ========================================
echo.

npm run dev:all

if %errorlevel% neq 0 (
    echo.
    echo ========================================
    echo   ERROR: Servers failed to start!
    echo ========================================
    echo.
    echo Possible issues:
    echo - Ports 3000 or 5173 might be in use
    echo - Node.js might not be installed
    echo - Dependencies might not be installed
    echo.
    echo Try running: npm install
    echo.
    pause
)

