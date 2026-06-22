@echo off
set "ROOT=%~dp0"

REM Beam Studio web launcher - runs webpack directly via node (no pnpm/nx).

set "NODE="
for /f "delims=" %%i in ('where node 2^>nul') do if not defined NODE set "NODE=%%i"
if not defined NODE if exist "%ProgramFiles%\nodejs\node.exe" set "NODE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE if exist "%LOCALAPPDATA%\Programs\nodejs\node.exe" set "NODE=%LOCALAPPDATA%\Programs\nodejs\node.exe"

if not defined NODE (
  echo.
  echo [ERROR] Node.js was not found. Install with: winget install OpenJS.NodeJS.LTS
  echo.
  pause
  exit /b 1
)

REM put node's own folder on PATH so the webpack shim can find node
for %%D in ("%NODE%") do set "PATH=%%~dpD;%PATH%"

cd /d "%ROOT%apps\web"

if not exist "node_modules\.bin\webpack.cmd" (
  echo.
  echo [ERROR] Dependencies are not installed. Run  pnpm install  in the beam-studio folder.
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

call "node_modules\.bin\webpack.cmd" serve --config webpack.dev.js

echo.
echo Server stopped.
pause
