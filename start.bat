@echo off
setlocal ENABLEDELAYEDEXPANSION
title Smart Internship Platform - One Click Launcher
cd /d "%~dp0"

REM --- Check for repository updates from GitHub ----------------------------
where git >nul 2>nul
if not errorlevel 1 (
  git rev-parse --is-inside-work-tree >nul 2>nul
  if not errorlevel 1 (
    echo [info] Checking for updates from GitHub...
    git fetch --quiet >nul 2>nul
    if not errorlevel 1 (
      set "BEHIND=0"
      for /f %%i in ('git rev-list --count HEAD..origin/main 2^>nul') do set /a "BEHIND=%%i"
      if !BEHIND! gtr 0 (
        echo.
        echo ============================================================
        echo   [UPDATE AVAILABLE] A new update is available on GitHub.
        echo   Your local repository is behind by !BEHIND! commits.
        echo ============================================================
        echo.
        set /p "UPDATE_CHOICE=Do you want to download and apply the update? (y/n): "
        if /i "!UPDATE_CHOICE!"=="y" (
          echo.
          echo [info] Updating repository...
          git fetch --all
          git reset --hard origin/main
          echo.
          echo [info] Update successfully applied! Restarting launcher...
          echo ============================================================
          echo.
          timeout /t 3 >nul 2>nul
          start "" "%~f0"
          exit /b 0
        ) else (
          echo [info] Update skipped. Starting current version...
          echo.
        )
      ) else (
        echo [info] Repository is up to date.
        echo.
      )
    ) else (
      echo [warning] Could not check for updates - remote repository unreachable.
      echo.
    )
  )
)

echo ============================================================
echo   Smart Internship Platform - One Click Setup ^& Run
echo ============================================================
echo.

REM --- Pre-flight checks --------------------------------------------------
where py >nul 2>nul
if errorlevel 1 (
  where python >nul 2>nul
  if errorlevel 1 (
    echo [ERROR] Python is not installed or not on PATH.
    echo         Install Python 3.10+ from https://www.python.org/downloads/
    pause
    exit /b 1
  )
  set "PYLAUNCHER=python"
) else (
  set "PYLAUNCHER=py -3"
)

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed or not on PATH.
  echo         Install Node.js 20+ from https://nodejs.org/
  pause
  exit /b 1
)

REM --- Pick a JS package manager (pnpm preferred, fallback to npm) --------
set "PKG="
where pnpm >nul 2>nul
if not errorlevel 1 set "PKG=pnpm"
if "%PKG%"=="" (
  where npm >nul 2>nul
  if errorlevel 1 (
    echo [ERROR] Neither pnpm nor npm found on PATH.
    pause
    exit /b 1
  )
  set "PKG=npm"
)
echo [info] Using package manager: %PKG%
echo.

REM --- Backend setup ------------------------------------------------------
echo [1/4] Preparing backend virtual environment...
REM Detect a stale/copied venv (paths inside venvs are absolute and break when moved).
if not exist "backend\.venv\Scripts\python.exe" goto :create_venv
"backend\.venv\Scripts\python.exe" -c "import sys" >nul 2>nul
if not errorlevel 1 goto :venv_ok
echo [info] Existing virtual environment is broken (likely copied from another PC). Recreating...
rmdir /s /q "backend\.venv"

:create_venv
pushd backend
%PYLAUNCHER% -m venv .venv
if errorlevel 1 (
  echo [ERROR] Failed to create Python virtual environment.
  popd
  pause
  exit /b 1
)
popd

:venv_ok

echo [2/4] Installing backend dependencies (this may take a few minutes the first time)...
pushd backend
call ".venv\Scripts\activate.bat"
python -m pip install --upgrade pip >nul
pip install -e .
if errorlevel 1 (
  echo [ERROR] Backend dependency install failed.
  popd
  pause
  exit /b 1
)

REM --- Seed the database if missing --------------------------------------
if not exist "smart.db" (
  echo [info] Seeding initial data...
  python -m app.infra.seed.seeder
)
call ".venv\Scripts\deactivate.bat" >nul 2>nul
popd

REM --- Frontend setup ----------------------------------------------------
echo [3/4] Installing frontend dependencies...
pushd frontend
if not exist "node_modules" (
  call %PKG% install
  if errorlevel 1 (
    echo [ERROR] Frontend dependency install failed.
    popd
    pause
    exit /b 1
  )
) else (
  echo [info] node_modules already present, skipping install.
)
popd

REM --- Launch services in separate windows -------------------------------
echo [4/4] Launching backend and frontend...
pushd "%~dp0backend"
start "Smart Internship - Backend" cmd /k "call .\.venv\Scripts\activate && uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
popd

pushd "%~dp0frontend"
start "Smart Internship - Frontend" cmd /k "%PKG% run dev"
popd


echo.
echo Waiting for services to come online...
powershell -NoProfile -Command "$u='http://localhost:3000'; for($i=0;$i -lt 60;$i++){try{$r=Invoke-WebRequest -UseBasicParsing -Uri $u -TimeoutSec 2; if($r.StatusCode){break}}catch{Start-Sleep -Seconds 1}}"

REM --- Open Chrome (fallback to default browser) -------------------------
set "CHROME="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if "%CHROME%"=="" if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if "%CHROME%"=="" if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"

if not "%CHROME%"=="" (
  start "" "%CHROME%" "http://localhost:3000" "http://localhost:8000/docs"
) else (
  start "" "http://localhost:3000"
  start "" "http://localhost:8000/docs"
)

echo.
echo ============================================================
echo   Smart Internship Platform is running:
echo     Frontend : http://localhost:3000
echo     Backend  : http://localhost:8000/docs
echo   Close the two opened terminal windows to stop the servers.
echo ============================================================
echo.
endlocal
exit /b 0
