@echo off
echo Testing Backend Configuration...
echo.

cd backend

echo [1/3] Testing Python imports...
python -c "print('Python OK')" 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Python not found or not working
    pause
    exit /b 1
)
echo ✓ Python working

echo.
echo [2/3] Testing config file...
python -c "from config import settings; print('Config OK'); print('CORS Origins:', settings.allowed_origins_list)" 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Config file has issues
    echo.
    echo Trying to show the error:
    python -c "from config import settings"
    pause
    exit /b 1
)
echo ✓ Config file working

echo.
echo [3/3] Testing main.py imports...
python -c "from main import app; print('Main OK')" 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Main.py has issues
    echo.
    echo Trying to show the error:
    python -c "from main import app"
    pause
    exit /b 1
)
echo ✓ Main.py working

echo.
echo ========================================
echo   All Tests Passed! ✓
echo ========================================
echo.
echo Backend is ready to start!
echo Run: python main.py
echo.
pause
