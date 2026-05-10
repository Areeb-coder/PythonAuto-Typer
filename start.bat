@echo off
REM Smart Auto Typer - Quick Start Script for Windows

echo.
echo 🚀 Starting Smart Auto Typer...
echo.

python apps\desktop-runtime\launcher.py

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Failed to start services
    echo.
    echo Make sure you have:
    echo - Node.js installed
    echo - Python installed
    echo - Ran setup.bat first
    pause
)
