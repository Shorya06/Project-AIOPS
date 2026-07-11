@echo off
cd /d "%~dp0\.."
echo ==========================================
echo Launching AIOps Platform in Docker...
echo ==========================================
call docker compose up -d --build
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Docker Compose Up Failed!
    pause
    exit /b %ERRORLEVEL%
)
echo.
echo [SUCCESS] Docker services started and running in the background!
pause
