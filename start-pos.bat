@echo off
:: =========================================================
:: Diva Addis POS — Start Server
:: This runs when Windows boots (via Task Scheduler).
:: The server binds to 0.0.0.0 so every device (tablet,
:: phone, PC) on the same WiFi/LAN can open the POS app
:: in their browser at http://<this-pc-ip>:3000
:: =========================================================

set "POS_DIR=%~dp0"
cd /d "%POS_DIR%"

echo [%date% %time%] Starting Diva Addis POS server... >> "%POS_DIR%pos-server.log"

:: Bind to ALL network interfaces on port 3000
npm run start -- -H 0.0.0.0 -p 3000 >> "%POS_DIR%pos-server.log" 2>&1
