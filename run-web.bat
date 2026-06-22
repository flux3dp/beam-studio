@echo off
REM ============================================================
REM  Beam Studio (web) launcher - double-click to start the app
REM  Runs the dev server and opens http://localhost:8080 when ready.
REM  Close this window to stop the server.
REM ============================================================

cd /d "%~dp0"

REM Make sure Node + pnpm are on PATH (in case this runs in a bare shell)
set "PATH=%PATH%;C:\Program Files\nodejs;%APPDATA%\npm"

where pnpm >nul 2>nul
if errorlevel 1 (
  echo.
  echo [ERROR] pnpm was not found.
  echo   Install Node first:  winget install OpenJS.NodeJS.LTS
  echo   Then install pnpm:   npm install -g pnpm
  echo.
  pause
  exit /b 1
)

echo.
echo Starting Beam Studio (web) ...
echo The browser will open automatically once it has compiled (first run ~1-2 min).
echo Close this window to stop the server.
echo.

REM In the background: wait for port 8080, then open the browser once.
start "" /min powershell -NoProfile -WindowStyle Hidden -Command ^
  "while($true){ try { (New-Object Net.Sockets.TcpClient).Connect('localhost',8080); break } catch { Start-Sleep -Seconds 2 } }; Start-Process 'http://localhost:8080'"

REM Run the dev server in this window (foreground).
call pnpm nx run web:start

echo.
echo Server stopped.
pause
