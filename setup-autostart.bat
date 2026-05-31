@echo off
:: =========================================================
:: Diva Addis POS — Setup Auto-Start on Windows Boot
:: Run this script ONCE as Administrator to register the
:: POS server to start automatically after power restore.
:: =========================================================

set "POS_DIR=%~dp0"
set "TASK_NAME=DivaAddis POS Server"
set "BAT_FILE=%POS_DIR%start-pos.bat"

echo.
echo ==========================================
echo  Diva Addis POS — Auto-Start Setup
echo ==========================================
echo.

:: Check for admin privileges
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Please run this script as Administrator.
    echo Right-click setup-autostart.bat and choose "Run as administrator"
    pause
    exit /b 1
)

echo [1/3] Building the production app (this may take 2-3 minutes)...
cd /d "%POS_DIR%"
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed. Fix any errors above and try again.
    pause
    exit /b 1
)

echo.
echo [2/3] Registering Windows Task Scheduler task...

:: Delete existing task if it exists (fresh install)
schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1

:: Create task to run at system startup with a 30-second delay
:: (delay lets network initialize before the server tries to sync)
schtasks /create ^
  /tn "%TASK_NAME%" ^
  /tr "cmd.exe /c \"%BAT_FILE%\"" ^
  /sc ONSTART ^
  /delay 0000:30 ^
  /ru SYSTEM ^
  /rl HIGHEST ^
  /f

if %errorlevel% neq 0 (
    echo ERROR: Failed to create scheduled task.
    pause
    exit /b 1
)

echo.
echo [3/3] Done!
echo.
echo ==========================================
echo  Auto-start is now configured!
echo.
echo  The POS server will automatically start
echo  30 seconds after the computer turns on.
echo.
echo  To access the app, open a browser and go to:
echo    http://localhost:3000
echo.
echo  To remove auto-start, run:
echo    schtasks /delete /tn "%TASK_NAME%" /f
echo ==========================================
echo.
pause
