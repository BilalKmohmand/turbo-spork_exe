@echo off
REM Quick Start Script for Academia Link Desktop App (Windows)
REM Run this script to start both backend and desktop app

cd /d "%~dp0"

echo ==========================================
echo   Academia Link Desktop App Launcher
echo ==========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo WARNING: Dependencies not installed!
    echo Run: npm install
    echo Then: cd welcome-hub-main ^&^& npm install
    pause
    exit /b 1
)

echo Starting Backend Server...
start "Academia Backend" cmd /k "npx tsx -r dotenv/config server/index.ts"

echo Waiting for backend to start...
timeout /t 8 /nobreak >nul

echo Starting Desktop App...
cd welcome-hub-main
npm run desktop:dev

echo.
echo Desktop closed. Backend window will remain open.
echo Close the backend window manually when done.
pause
