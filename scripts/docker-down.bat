@echo off
cd /d "%~dp0\.."
echo ==========================================
echo Tearing Down AIOps Platform in Docker...
echo ==========================================
call docker compose down -v
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Docker Compose Down Failed!
    pause
    exit /b %ERRORLEVEL%
)
echo.
echo [SUCCESS] Services stopped and volumes purged successfully!
pause
