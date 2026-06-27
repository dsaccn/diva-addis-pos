@echo off
:: =========================================================
:: Diva Addis POS — Offline Installer
:: Run this ONCE on a new PC after copying the folder.
:: It builds the app and sets it to auto-start on boot.
:: Run as Administrator (right-click > "Run as administrator")
:: =========================================================

set "POS_DIR=%~dp0"
cd /d "%POS_DIR%"
set "TASK_NAME=DivaAddis POS Server"
set "BAT_FILE=%POS_DIR%start-pos.bat"

echo.
echo ==========================================
echo  Diva Addis POS — Offline Installer
echo ==========================================
echo.

:: ── Step 0: Admin check ─────────────────────────────────
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Please right-click this file and choose "Run as administrator".
    pause
    exit /b 1
)

:: ── Step 1: Node.js check ────────────────────────────────
echo [1/4] Checking for Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Node.js is not installed on this computer.
    echo.
    echo  1. Install Node.js from:  https://nodejs.org/en/download
    echo     (choose the "Windows Installer" LTS version)
    echo  2. After installing, RESTART this computer.
    echo  3. Then run install-offline.bat again.
    echo.
    pause
    exit /b 1
)
echo    Node.js found: OK
echo.

:: ── Step 2: Install/verify dependencies ─────────────────
echo [2/4] Installing dependencies (node_modules)...
if exist "node_modules\" (
    echo    node_modules already present — skipping npm install.
) else (
    echo    node_modules not found. Running npm install...
    echo    (This needs internet ONCE for the first install)
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: npm install failed.
        echo Make sure the PC is connected to the internet for the first install.
        pause
        exit /b 1
    )
)
echo.

:: ── Step 3: Generate Prisma client ──────────────────────
echo [3/4] Generating database client (Prisma)...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ERROR: Prisma generate failed.
    pause
    exit /b 1
)
echo.

:: ── Step 4: Build production app ────────────────────────
echo [4/4] Building the POS app for production...
echo    This may take 3-5 minutes on first run...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed. See errors above.
    pause
    exit /b 1
)
echo.

:: ── Step 5: Register auto-start task ────────────────────
echo [5/5] Registering auto-start with Windows Task Scheduler...
schtasks /delete /tn "%TASK_NAME%" /f >nul 2>&1

schtasks /create ^
  /tn "%TASK_NAME%" ^
  /tr "cmd.exe /c \"%BAT_FILE%\"" ^
  /sc ONSTART ^
  /delay 0000:30 ^
  /ru SYSTEM ^
  /rl HIGHEST ^
  /f

if %errorlevel% neq 0 (
    echo ERROR: Could not register auto-start task.
    echo You can still start the server manually by running start-pos.bat
    pause
    exit /b 1
)
echo.

:: ── Done ────────────────────────────────────────────────
echo ==========================================
echo  Installation complete!
echo ==========================================
echo.
echo  The POS server will now start automatically
echo  every time this computer turns on.
echo.
echo  To open the app RIGHT NOW without rebooting:
echo    Double-click  start-pos.bat
echo    Then open a browser and go to:  http://localhost:3000
echo.
echo  Other devices (tablets, phones) can connect using:
echo    http://[THIS PC's IP address]:3000
echo.
echo  To find this PC's IP:  Open Command Prompt and type  ipconfig
echo    Look for "IPv4 Address" under the WiFi or Ethernet adapter.
echo.
echo ==========================================
pause
