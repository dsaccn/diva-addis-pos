@echo off
:: =========================================================
:: Diva Addis POS — Source Code Packager (for Online Setup)
:: Run this script on the source PC to package the application
:: into a tiny zip file. Since the target PC has internet,
:: dependencies will be downloaded there.
:: =========================================================

set "POS_DIR=%~dp0"
set "DIST_DIR=%POS_DIR%diva-addis-pos-source"
set "ZIP_FILE=%POS_DIR%diva-addis-pos-online-setup.zip"

echo.
echo ==========================================
echo  Diva Addis POS — Create Online Package
echo ==========================================
echo.

:: Clean up previous runs
if exist "%DIST_DIR%" (
    echo [1/4] Cleaning up old temporary directories...
    rmdir /s /q "%DIST_DIR%"
)
if exist "%ZIP_FILE%" (
    echo [1/4] Removing old zip package...
    del /f /q "%ZIP_FILE%"
)

echo [2/4] Copying source files to distribution directory...
mkdir "%DIST_DIR%"
mkdir "%DIST_DIR%\prisma"
mkdir "%DIST_DIR%\public"
mkdir "%DIST_DIR%\src"

:: Copy code and configs (excluding node_modules and .next)
xcopy /E /I /Y "public" "%DIST_DIR%\public" >nul
xcopy /E /I /Y "src" "%DIST_DIR%\src" >nul
xcopy /E /I /Y "prisma" "%DIST_DIR%\prisma" >nul

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
echo [3/4] Compressing source files into %ZIP_FILE%...
powershell -Command "Compress-Archive -Path '%DIST_DIR%\*' -DestinationPath '%ZIP_FILE%' -Force"

if %errorlevel% neq 0 (
    echo ERROR: Failed to compress folder. Make sure PowerShell is available.
    pause
    exit /b 1
)

echo.
echo [4/4] Cleaning up temporary files...
rmdir /s /q "%DIST_DIR%"

echo.
echo =========================================================
echo  SUCCESS: Online Setup ZIP package created!
echo =========================================================
echo  File location: 
echo  %ZIP_FILE%
echo.
echo  This file is very small because it does not include 
echo  node_modules. Transfer it to the target PC.
echo =========================================================
echo.
pause
