# Transcendence Backend

A Fastify-based HTTPS server that serves the Transcendence frontend with secure connections.

## Features

- 🔒 **HTTPS Only**: All connections are encrypted using SSL/TLS
- 🚀 **Fastify**: High-performance Node.js web framework
- 📁 **Static File Serving**: Serves the built frontend files
- 🔄 **CORS Support**: Cross-origin resource sharing enabled
- 📊 **Health Check**: Built-in health monitoring endpoint
- 🎯 **SPA Support**: Handles single-page application routing

## Prerequisites

- Node.js 18+ 
- OpenSSL (for certificate generation)

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Generate SSL Certificates

```bash
./generate-certs.sh
```

This creates self-signed certificates for development. For production, use proper SSL certificates.

### 3. Build the Backend

```bash
npm run build
```

### 4. Start the Server

```bash
npm start
```

The server will start on `https://localhost:3000`

## Development

For development with auto-reload:

```bash
npm run dev
```

For development with file watching:

```bash
npm run watch
```

## Environment Variables

- `PORT`: Server port (default: 3000)
- `HOST`: Server host (default: 0.0.0.0)

## API Endpoints

- `GET /health` - Health check endpoint
- `GET /*` - Serves the frontend (SPA routing)

## SSL Certificates

The backend requires SSL certificates to run. The `generate-certs.sh` script creates self-signed certificates for development.

**Important**: Self-signed certificates will trigger browser security warnings. This is normal for development environments.

## Frontend Integration

The backend serves the frontend files from the `../frontend/` directory. Make sure to:
1. Build the frontend first: `cd ../frontend && npm run build`
2. Ensure the frontend build output is accessible

## Production Deployment

For production:

1. Replace the self-signed certificates with proper SSL certificates
2. Set appropriate environment variables
3. Use a reverse proxy (nginx, Apache) if needed
4. Consider using Let's Encrypt for free SSL certificates

## Troubleshooting

### Certificate Errors
- Ensure certificates exist in the `certs/` directory
- Check file permissions (key.pem should be 600, cert.pem should be 644)
- Regenerate certificates if needed: `./generate-certs.sh`

### Port Already in Use
- Change the PORT environment variable
- Check if another service is using the port

### Frontend Not Loading
- Ensure the frontend is built and accessible
- Check the static file serving configuration
- Verify the index.html file exists in the parent directory
