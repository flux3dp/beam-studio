@echo off
cd /d "%~dp0"

REM Beam Studio web launcher. Double-click to start; close window to stop.
REM Make node + pnpm reachable regardless of the system PATH.

set "PATH=%PATH%;%ProgramFiles%\nodejs;%APPDATA%\npm;%LOCALAPPDATA%\pnpm"

set "NODE="
for /f "delims=" %%i in ('where node 2^>nul') do if not defined NODE set "NODE=%%i"
if not defined NODE if exist "%ProgramFiles%\nodejs\node.exe" set "NODE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" set "NODE=%LOCALAPPDATA%\Programs\nodejs\node.exe"

if not defined NODE (
  echo.
  echo [ERROR] Node.js was not found.
  echo   Install it with:  winget install OpenJS.NodeJS.LTS
  echo   then reopen this window and try again.
  echo.
  pause
  exit /b 1
)

set "NX=%~dp0node_modules\nx\bin\nx.js"
if not exist "%NX%" (
  echo.
  echo [ERROR] Dependencies are not installed - node_modules\nx is missing.
  echo   Open a terminal in this folder and run:  pnpm install
  echo.
  pause
  exit /b 1
)

echo.
echo Starting Beam Studio web app...
echo Using Node: %NODE%
echo The browser opens automatically once it compiles. First run takes 1-2 min.
echo Close this window to stop the server.
echo.

start "" /min powershell -NoProfile -WindowStyle Hidden -Command "while($true){ try { (New-Object Net.Sockets.TcpClient).Connect('localhost',8080); break } catch { Start-Sleep -Seconds 2 } }; Start-Process 'http://localhost:8080'"

"%NODE%" "%NX%" run web:start

echo.
echo Server stopped.
pause
