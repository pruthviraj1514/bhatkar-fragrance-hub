#!/bin/bash

# Image Format Update Setup Script

echo "🚀 Starting Image Format Enhancement Setup..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "📦 Installing/Updating Dependencies..."
cd backend
npm install
cd ..

echo ""
echo "🔄 Running Database Migration..."
cd backend
node src/database/scripts/addImageFormatColumn.js
MIGRATION_STATUS=$?
cd ..

if [ $MIGRATION_STATUS -eq 0 ]; then
    echo "✅ Database migration completed successfully!"
else
    echo "⚠️  Database migration had issues. Please check the output above."
fi

echo ""
echo "📝 Important Next Steps:"
echo "1. Restart your backend server"
echo "2. Clear frontend cache (Ctrl+F5)"
echo "3. Re-upload product images with proper formats"
echo "4. Test image display on product pages"
echo ""
echo "✨ Setup complete! Check IMAGE_FORMAT_UPDATE.md for detailed information."
