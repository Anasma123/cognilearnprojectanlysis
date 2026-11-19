@echo off
echo ========================================================
echo   Cognilearn Portal - Clean Development Server Start
echo ========================================================
echo.
echo [1/3] Terminating any stuck background Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 1 /nobreak >nul

echo [2/3] Clearing old .next cache to prevent chunk collisions...
if exist .next rmdir /s /q .next

echo [3/3] Starting Cognilearn Dev Server on http://localhost:3000...
npm run dev
