pp@echo off
REM Smart Auto Typer - Quick Setup Script for Windows

echo.
echo 🚀 Smart Auto Typer - Setup
echo ================================
echo.

REM Check prerequisites
echo Checking prerequisites...

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js not found. Install from https://nodejs.org/
    exit /b 1
)

where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Python not found. Install from https://www.python.org/
    exit /b 1
)

where pnpm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ⚠️  pnpm not found. Installing...
    call npm install -g pnpm
)

echo ✓ Node.js version:
node --version
echo ✓ Python version:
python --version
echo ✓ pnpm version:
pnpm --version
echo.

REM Install dependencies
echo Installing dependencies...
call pnpm install

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

echo ✓ Dependencies installed
echo.

REM Setup database
echo Setting up database...
call pnpm db:push

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to setup database
    exit /b 1
)

echo ✓ Database setup complete
echo.

REM Install Python dependencies
echo Installing Python dependencies...
cd apps\typing-engine
call pip install -r requirements.txt

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install Python dependencies
    exit /b 1
)

echo ✓ Python dependencies installed
cd ..\..
echo.

echo ================================
echo ✓ Setup complete!
echo.
echo To start all services, run:
echo   python apps\desktop-runtime\launcher.py
echo.
echo Or manually:
echo   Terminal 1: pnpm --filter backend dev
echo   Terminal 2: python apps\typing-engine\engine.py
echo   Terminal 3: pnpm --filter web dev
echo.
echo Then open: http://localhost:3000
echo.
pause
