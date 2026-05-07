@echo off
echo ========================================
echo Essay Scoring System - Deployment Script
echo ========================================
echo.

echo Step 1: Installing Vercel CLI...
call npm install -g vercel
echo.

echo Step 2: Building Frontend...
cd frontend
call npm install
call npm run build
echo.

echo Step 3: Deploying to Vercel...
echo Please follow the prompts to deploy your frontend
call vercel
echo.

echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Note your Vercel URL from above
echo 2. Deploy backend using Railway, Render, or Fly.io
echo 3. Update VITE_API_URL environment variable in Vercel
echo 4. Redeploy with: vercel --prod
echo.
echo See DEPLOYMENT.md for detailed instructions
echo.
pause
