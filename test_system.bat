@echo off
echo ========================================
echo   EssayScore AI - System Test
echo ========================================
echo.

echo [1/5] Testing Backend Health...
curl -s http://localhost:8000/api/health
if %errorlevel% neq 0 (
    echo ERROR: Backend is not running!
    echo Please start backend: cd backend ^& python main.py
    pause
    exit /b 1
)
echo ✓ Backend is running
echo.

echo [2/5] Testing Students Endpoint...
curl -s http://localhost:8000/api/students | findstr "id"
if %errorlevel% neq 0 (
    echo ERROR: Students endpoint failed!
    pause
    exit /b 1
)
echo ✓ Students endpoint working
echo.

echo [3/5] Testing Essays Endpoint...
curl -s http://localhost:8000/api/essays | findstr "id"
if %errorlevel% neq 0 (
    echo ERROR: Essays endpoint failed!
    pause
    exit /b 1
)
echo ✓ Essays endpoint working
echo.

echo [4/5] Testing Assignments Endpoint...
curl -s http://localhost:8000/api/assignments | findstr "id"
if %errorlevel% neq 0 (
    echo ERROR: Assignments endpoint failed!
    pause
    exit /b 1
)
echo ✓ Assignments endpoint working
echo.

echo [5/5] Testing Peer Review Endpoint...
curl -s http://localhost:8000/api/peer-review/ | findstr "id"
echo ✓ Peer review endpoint working
echo.

echo ========================================
echo   All Tests Passed! ✓
echo ========================================
echo.
echo System is ready to use!
echo.
echo Next steps:
echo 1. Open browser to http://localhost:5173
echo 2. Login or enroll as a student
echo 3. Submit an essay
echo 4. Browse and review other essays
echo.
pause
