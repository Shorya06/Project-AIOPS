@echo off
cd /d "%~dp0\.."
echo ==========================================
echo Cleaning AIOps Platform Target Files...
echo ==========================================
call mvn clean
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Maven Clean Failed!
    pause
    exit /b %ERRORLEVEL%
)
echo.
echo [SUCCESS] Clean completed successfully!
pause
