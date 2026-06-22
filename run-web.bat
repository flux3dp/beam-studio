@echo off
cd /d "%~dp0"

REM Beam Studio (web) launcher - double-click to start. Close window to stop.

set "PATH=%PATH%;C:\Program Files\nodejs;%APPDATA%\npm"

set "PNPM="
where pnpm >nul 2>nul && set "PNPM=pnpm"
if not defined PNPM if exist "%APPDATA%\npm\pnpm.cmd" set "PNPM=%APPDATA%\npm\pnpm.cmd"

if not defined PNPM (
  echo.
  echo [ERROR] pnpm was not found.
  echo   Install Node first:  winget install OpenJS.NodeJS.LTS
  echo   Then install pnpm:   npm install -g pnpm
  echo.
  pause
  exit /b 1
)

echo.
echo Starting Beam Studio web app...
echo The browser opens automatically once it compiles. First run takes ~1-2 min.
echo Close this window to stop the server.
echo.

start "" /min powershell -NoProfile -WindowStyle Hidden -Command "while($true){ try { (New-Object Net.Sockets.TcpClient).Connect('localhost',8080); break } catch { Start-Sleep -Seconds 2 } }; Start-Process 'http://localhost:8080'"

call "%PNPM%" nx run web:start

echo.
echo Server stopped.
pause
