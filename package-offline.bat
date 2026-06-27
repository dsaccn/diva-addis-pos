@echo off
:: =========================================================
:: Diva Addis POS — Offline Package Creator
:: Run this script on the source PC to package the application
:: into a single zip file for offline transfer.
:: =========================================================

set "POS_DIR=%~dp0"
set "DIST_DIR=%POS_DIR%diva-addis-pos-dist"
set "ZIP_FILE=%POS_DIR%diva-addis-pos-offline.zip"

echo.
echo ==========================================
echo  Diva Addis POS — Create Offline Package
echo ==========================================
echo.

:: Clean up previous runs
if exist "%DIST_DIR%" (
    echo [1/5] Cleaning up old temporary directories...
    rmdir /s /q "%DIST_DIR%"
)
if exist "%ZIP_FILE%" (
    echo [1/5] Removing old zip package...
    del /f /q "%ZIP_FILE%"
)

echo [2/5] Building the Next.js production app...
cd /d "%POS_DIR%"
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed. Please resolve build errors first.
    pause
    exit /b 1
)

echo.
echo [3/5] Copying application files to distribution directory...
mkdir "%DIST_DIR%"
mkdir "%DIST_DIR%\prisma"
mkdir "%DIST_DIR%\public"
mkdir "%DIST_DIR%\src"

:: Copy code and configs
xcopy /E /I /Y "public" "%DIST_DIR%\public" >nul
xcopy /E /I /Y "src" "%DIST_DIR%\src" >nul
xcopy /E /I /Y "prisma" "%DIST_DIR%\prisma" >nul

:: Exclude cache in prisma if any (but keep the diva-addis.db sqlite file)
copy ".env" "%DIST_DIR%\" >nul
copy "package.json" "%DIST_DIR%\" >nul
copy "package-lock.json" "%DIST_DIR%\" >nul
copy "next.config.ts" "%DIST_DIR%\" >nul
copy "postcss.config.mjs" "%DIST_DIR%\" >nul
copy "tsconfig.json" "%DIST_DIR%\" >nul
copy "setup-autostart.bat" "%DIST_DIR%\" >nul
copy "start-pos.bat" "%DIST_DIR%\" >nul
copy "README.md" "%DIST_DIR%\" >nul

:: Copy utility js files in root
copy "*.js" "%DIST_DIR%\" >nul 2>&1

echo.
echo [4/5] Copying node_modules (excluding dev caches)...
mkdir "%DIST_DIR%\node_modules"
xcopy /E /I /Y "node_modules" "%DIST_DIR%\node_modules" >nul

:: Clean up heavy cache directories in node_modules and .next to keep the zip file size smaller
if exist "%DIST_DIR%\node_modules\.cache" (
    rmdir /s /q "%DIST_DIR%\node_modules\.cache"
)
xcopy /E /I /Y ".next" "%DIST_DIR%\.next" >nul
if exist "%DIST_DIR%\.next\cache" (
    rmdir /s /q "%DIST_DIR%\.next\cache"
)

echo.
echo [5/5] Compressing files into %ZIP_FILE%...
powershell -Command "Compress-Archive -Path '%DIST_DIR%\*' -DestinationPath '%ZIP_FILE%' -Force"

if %errorlevel% neq 0 (
    echo ERROR: Failed to compress folder. Make sure PowerShell is available.
    pause
    exit /b 1
)

echo.
echo Cleaning up temporary files...
rmdir /s /q "%DIST_DIR%"

echo.
echo =========================================================
echo  SUCCESS: Offline installation package created!
echo =========================================================
echo  File location: 
echo  %ZIP_FILE%
echo.
echo  Transfer this ZIP file and a Node.js installer to your 
echo  USB drive to install it on the target offline PC.
echo =========================================================
echo.
pause
