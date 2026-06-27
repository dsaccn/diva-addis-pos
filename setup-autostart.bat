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

echo [1/3] Checking dependencies and building the production app...
cd /d "%POS_DIR%"

where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Node.js / NPM was not found on this computer.
    echo.
    echo Troubleshooting:
    echo 1. Make sure you have downloaded and installed Node.js from: https://nodejs.org
    echo 2. If you JUST installed Node.js, you MUST close this Command Prompt window
    echo    and run setup-autostart.bat again so Windows can load the new path.
    echo 3. If it still fails, restart the computer.
    echo.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo node_modules not found. Installing dependencies (this may take 1-2 minutes)...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: npm install failed. Make sure you have a working internet connection.
        pause
        exit /b 1
    )
)

echo Building the Next.js production app (this may take 2-3 minutes)...
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
