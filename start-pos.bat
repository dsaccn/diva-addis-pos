@echo off
:: =========================================================
:: Diva Addis POS — Auto-Start Script
:: This runs when Windows boots (via Task Scheduler)
:: =========================================================

set "POS_DIR=%~dp0"
cd /d "%POS_DIR%"

echo [%date% %time%] Starting Diva Addis POS server... >> "%POS_DIR%pos-server.log"

:: Start the production Next.js server on port 3000
:: Make sure to run `npm run build` first before using this
npm run start >> "%POS_DIR%pos-server.log" 2>&1
