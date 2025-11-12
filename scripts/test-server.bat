@echo off
echo.
echo ========================================
echo   Testing Server Connection
echo ========================================
echo.

REM Get the directory where this batch file is located and go to project root
cd /d "%~dp0\.."

echo Checking if server is running on port 5173...
netstat -ano | findstr :5173
if %errorlevel% == 0 (
    echo.
    echo ✓ Server appears to be running!
    echo.
    echo Try opening: http://localhost:5173
    echo.
    echo If it still doesn't work:
    echo 1. Make sure you typed: http://localhost:5173 (with http://)
    echo 2. Try a different browser
    echo 3. Check Windows Firewall settings
    echo.
) else (
    echo.
    echo ✗ Server is NOT running!
    echo.
    echo Please run scripts\start-server.bat first
    echo.
)

pause

