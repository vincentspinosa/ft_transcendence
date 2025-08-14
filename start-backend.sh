#!/bin/bash

echo "🚀 Starting Transcendence Backend..."

# Check if we're in the right directory
if [ ! -f "backend/package.json" ] || [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Navigate to backend directory
cd backend

# Check if certificates exist
if [ ! -f "certs/cert.pem" ] || [ ! -f "certs/key.pem" ]; then
    echo "🔐 SSL certificates not found. Generating them..."
    ./generate-certs.sh
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the backend
echo "🔨 Building backend..."
npm run build

# Start the server
echo "🚀 Starting HTTPS server on https://localhost:3000"
echo "⚠️  Note: You may see a browser security warning due to self-signed certificates"
echo "   This is normal for development. Click 'Advanced' and 'Proceed to localhost'"
echo ""
npm start
