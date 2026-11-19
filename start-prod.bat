@echo off
echo ========================================================
echo   Cognilearn Portal - Production Server Start
echo ========================================================
echo.
echo [1/3] Terminating any stuck background Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 1 /nobreak >nul

echo [2/3] Building clean production app...
if exist .next rmdir /s /q .next
call npm run build

echo [3/3] Starting Cognilearn Production Server on http://localhost:3000...
npm run start
