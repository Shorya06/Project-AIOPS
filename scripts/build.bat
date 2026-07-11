@echo off
cd /d "%~dp0\.."
echo ==========================================
echo Building AIOps Platform Submodules...
echo ==========================================
call mvn clean package -DskipTests
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Maven Build Failed!
    pause
    exit /b %ERRORLEVEL%
)
echo.
echo [SUCCESS] All modules built successfully!
pause
