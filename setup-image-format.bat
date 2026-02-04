@echo off
REM Image Format Update Setup Script for Windows

echo.
echo 🚀 Starting Image Format Enhancement Setup...
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the project root.
    pause
    exit /b 1
)

echo 📦 Installing/Updating Dependencies...
cd backend
call npm install
cd ..

echo.
echo 🔄 Running Database Migration...
cd backend
call node src/database/scripts/addImageFormatColumn.js
if %ERRORLEVEL% equ 0 (
    echo ✅ Database migration completed successfully!
) else (
    echo ⚠️  Database migration had issues. Please check the output above.
)
cd ..

echo.
echo 📝 Important Next Steps:
echo 1. Restart your backend server
echo 2. Clear frontend cache (Ctrl+F5)
echo 3. Re-upload product images with proper formats
echo 4. Test image display on product pages
echo.
echo ✨ Setup complete! Check IMAGE_FORMAT_UPDATE.md for detailed information.
echo.
pause
