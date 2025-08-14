#!/bin/bash

echo "🚀 Starting Transcendence Full Stack..."

# Check if we're in the right directory
if [ ! -f "backend/package.json" ] || [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Build the frontend first
echo "🔨 Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Check if backend certificates exist
if [ ! -f "backend/certs/cert.pem" ] || [ ! -f "backend/certs/key.pem" ]; then
    echo "🔐 SSL certificates not found. Generating them..."
    cd backend
    ./generate-certs.sh
    cd ..
fi

# Install backend dependencies if needed
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

# Build the backend
echo "🔨 Building backend..."
cd backend
npm run build
cd ..

# Start the server
echo "🚀 Starting HTTPS server on https://localhost:3000"
echo "⚠️  Note: You may see a browser security warning due to self-signed certificates"
echo "   This is normal for development. Click 'Advanced' and 'Proceed to localhost'"
echo ""
cd backend
npm start
