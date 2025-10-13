@echo off
REM Anclora Kairon Terminal Initialization Script for CMD
REM Add this to your CMD auto-run to execute on terminal startup

setlocal enabledelayedexpansion

echo 🚀 Anclora Kairon Auto-Setup
echo ============================
echo.

REM Check if Node.js is available
echo 🔍 Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js not found. Please install Node.js
    goto :error
) else (
    echo ✅ Node.js is available
)

REM Check if we're in the project directory
echo 🔍 Checking project directory...
if exist "package.json" (
    if exist "PUERTOS.md" (
        echo ✅ Project structure verified
    ) else (
        echo ℹ️  PUERTOS.md not found, not in project root
        goto :end
    )
) else (
    echo ℹ️  package.json not found, not in project root
    goto :end
)

REM Run the setup script
echo 🔧 Running development setup...
if exist "src\scripts\auto-setup.js" (
    node src\scripts\auto-setup.js
) else (
    echo ⚠️  Setup script not found
)

goto :success

:error
echo.
echo 🔧 Manual setup required:
echo    cd "path\to\anclora-kairon"
echo    npm run setup              # Check environment
echo    npm run dev:landing        # Start landing page
echo    npm run dev:app           # Start main app
goto :end

:success
echo.
echo 💡 Quick commands:
echo    npm run dev:landing    # Start landing page ^(port 5174^)
echo    npm run dev:app       # Start main app ^(port 5175^)
echo    npm run check-ports   # Check port status
echo    npm run kill-ports    # Force kill occupied ports
echo.
echo 🎯 Ready for development!

:end
echo.