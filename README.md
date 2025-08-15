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
make all
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

## 🛠️ Development

### Frontend Development
```bash
npm run watch
```

### Backend Development
```bash
cd backend
npm run dev      # Auto-reload
npm run watch    # File watching
```

## 🐳 Docker

### Quick Commands

```bash
make help          # Show all available commands
make all           # Quick start (check, ssl, build, start)
make start         # Start the application
make stop          # Stop the application
make logs          # View application logs
make status        # Show container status
make clean         # Clean up Docker resources
make rebuild       # Rebuild everything from scratch
```

### Development vs Production

```bash
make dev           # Start in development mode
make prod          # Start in production mode
```

### Manual Docker Compose

```bash
docker-compose up --build
```

## 📁 Project Structure

```
transcendence/
├── frontend/            # Frontend application
│   ├── src/            # TypeScript source files
│   ├── index.html      # Main HTML file
│   ├── main.css        # Main CSS file
│   ├── package.json    # Frontend dependencies
│   ├── webpack.config.js # Webpack configuration
│   ├── tailwind.config.js # Tailwind CSS configuration
│   ├── tsconfig.json   # TypeScript configuration
│   ├── Makefile        # Frontend build commands
│   └── Dockerfile      # Frontend Docker configuration
├── backend/             # Backend server
│   ├── src/            # Backend TypeScript source
│   ├── certs/          # SSL certificates
│   ├── package.json    # Backend dependencies
│   ├── tsconfig.json   # Backend TypeScript configuration
│   └── Makefile        # Backend build commands
├── Makefile            # Project management commands
├── docker-compose.yml  # Docker orchestration
```



## 🔧 Configuration

### SSL Certificates

The backend requires SSL certificates. For development, self-signed certificates are automatically generated. For production, replace them with proper certificates.

**Important**: SSL certificates in `backend/certs/` are excluded from version control for security. They will be generated automatically when running the startup scripts.

## 📚 Available Commands

### Project Management (Root Level)
- `make help` - Show all available commands
- `make all` - Quick start (check, ssl, build, start)
- `make start` - Start the application
- `make stop` - Stop the application
- `make logs` - View application logs
- `make status` - Show container status
- `make clean` - Clean up Docker resources
- `make rebuild` - Rebuild everything from scratch

### Development Modes
- `make dev` - Start in development mode
- `make prod` - Start in production mode
- `make local-dev` - Start local development without Docker

### Frontend (Individual Directory)
- `cd frontend && make help` - Show all available commands
- `cd frontend && make setup` - Complete setup
- `cd frontend && make build` - Build for production
- `cd frontend && make watch` - Development with file watching
- `cd frontend && make start` - Build and serve with live-server

### Backend (Individual Directory)
- `cd backend && make help` - Show all available commands
- `cd backend && make setup` - Complete setup
- `cd backend && make start` - Start production server
- `cd backend && make dev` - Start development server
