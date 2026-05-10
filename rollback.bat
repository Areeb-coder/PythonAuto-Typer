@echo off
setlocal enabledelayedexpansion

if "%~1"=="" (
  echo Usage: rollback.bat v^<number^>
  exit /b 1
)

set "VERSION=%~1"
set "VERSION_DIR=versions\%VERSION%"

if not exist "%VERSION_DIR%" (
  echo Version snapshot not found: %VERSION_DIR%
  exit /b 1
)

echo Restoring files from %VERSION_DIR% ...
for /r "%VERSION_DIR%" %%F in (*) do (
  set "SRC=%%F"
  set "REL=!SRC:%CD%\%VERSION_DIR%\=!"
  for %%D in ("!REL!\..") do if not exist "%%~fD" mkdir "%%~fD"
  copy /y "%%F" "!REL!" >nul
  echo Restored: !REL!
)

echo Rollback to %VERSION% completed.
exit /b 0
