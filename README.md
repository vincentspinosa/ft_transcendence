# Transcendence

A TypeScript-based Pong game with a Fastify HTTPS backend for secure frontend serving.

## 🎮 Frontend

The frontend is a TypeScript Pong game built with:
- TypeScript
- Webpack
- Tailwind CSS
- HTML5 Canvas

## 🔒 Backend

A Fastify-based HTTPS server that serves the frontend with:
- HTTPS-only connections
- Static file serving
- CORS support
- Health monitoring
- SPA routing support

## 🚀 Quick Start

### Option 1: Using Docker Compose (Recommended)

```bash
make
```

This command will:
1. Check prerequisites (Docker, Docker Compose)
2. Generate SSL certificates if needed
3. Build the Docker containers
4. Start the application

### Option 2: Manual Docker setup

1. **Generate SSL certificates:**
   ```bash
   cd backend
   ./generate-certs.sh
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Build the backend:**
   ```bash
   npm run build
   ```

4. **Start the server:**
   ```bash
   npm start
   ```

## 🌐 Access

Once running, access your application at:
- **Frontend**: https://localhost:3000
- **Health Check**: https://localhost:3000/health

## ⚠️ SSL Certificate Warning

During development, you'll see a browser security warning due to self-signed certificates. This is normal and expected. To proceed:

1. Click "Advanced" in the warning
2. Click "Proceed to localhost (unsafe)"
3. Your game will load securely over HTTPS
```

## 🐳 Docker

### Launch the project

```bash
make
```

### Manual Docker Compose

```bash
docker-compose up --build
```

## 🔧 SSL Certificates

The backend requires SSL certificates. For development, self-signed certificates are automatically generated. For production, replace them with proper certificates.

**Important**: SSL certificates in `backend/certs/` are excluded from version control for security. They will be generated automatically when running the startup scripts.

