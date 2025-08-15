#!/bin/bash

/**
 * Transcendence Full Stack Startup Script
 * 
 * This script automates the complete startup process for the Transcendence project,
 * including both frontend and backend components. It handles dependency installation,
 * building, SSL certificate generation, and server startup in the correct order.
 * 
 * Features:
 * - Automatic dependency installation for both frontend and backend
 * - Frontend build process with webpack
 * - Backend TypeScript compilation
 * - SSL certificate generation if needed
 * - Comprehensive error checking and validation
 * - Clear progress indicators and status messages
 * - Proper directory navigation and management
 * 
 * Prerequisites:
 * - Node.js and npm must be installed
 * - OpenSSL must be available for certificate generation
 * - Script must be run from the project root directory
 * 
 * Usage:
 *   ./start-full-stack.sh
 * 
 * @author Vincent Spinosa
 * @version 1.0.0
 */

# Display startup header with project information
echo "🚀 Starting Transcendence Full Stack..."

# Validate that we're in the correct directory
# This check ensures the script is run from the project root where both
# frontend and backend directories are located
if [ ! -f "backend/package.json" ] || [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    echo "   Expected files: backend/package.json and frontend/package.json"
    echo "   Current directory: $(pwd)"
    exit 1
fi

# Build the frontend first
# Frontend must be built before backend starts since backend serves the frontend files
echo "🔨 Building frontend..."
cd frontend

# Install frontend dependencies if node_modules doesn't exist
# This ensures all required packages are available for the build process
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Build the frontend using webpack
# This creates the production-ready static files that the backend will serve
echo "🔨 Compiling frontend with webpack..."
npm run build

# Return to project root directory
cd ..

# Check if backend SSL certificates exist
# Backend requires SSL certificates to run in HTTPS mode
# If they don't exist, we'll generate them automatically
if [ ! -f "backend/certs/cert.pem" ] || [ ! -f "backend/certs/key.pem" ]; then
    echo "🔐 SSL certificates not found. Generating them..."
    cd backend
    
    # Generate self-signed SSL certificates for development
    # This creates the necessary cryptographic files for HTTPS
    ./generate-certs.sh
    
    # Return to project root directory
    cd ..
fi

# Install backend dependencies if needed
# Backend dependencies are required for TypeScript compilation and runtime
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

# Build the backend TypeScript code
# This compiles the TypeScript source files into JavaScript for Node.js execution
echo "🔨 Building backend..."
cd backend

# Run TypeScript compiler to build the project
# This creates the dist/ directory with compiled JavaScript files
npm run build

# Return to project root directory
cd ..

# Start the HTTPS server
# Display helpful information about the server startup and SSL certificates
echo "🚀 Starting HTTPS server on https://localhost:3000"
echo "⚠️  Note: You may see a browser security warning due to self-signed certificates"
echo "   This is normal for development. Click 'Advanced' and 'Proceed to localhost'"
echo ""

# Navigate to backend directory and start the server
# The server will automatically serve the frontend files and handle API requests
cd backend
npm start
