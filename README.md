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

### Option 1: Using the startup script (Recommended)

```bash
./start-backend.sh
```

This script will:
1. Generate SSL certificates if needed
2. Install backend dependencies
3. Build the backend
4. Start the HTTPS server

### Option 2: Manual setup

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

Run with Docker Compose:
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
├── start-backend.sh    # Quick start script
├── start-full-stack.sh # Full stack startup script
├── docker-compose.yml  # Docker orchestration
├── .gitignore         # Git ignore rules
└── .dockerignore      # Docker ignore rules
```



## 🔧 Configuration

### SSL Certificates

The backend requires SSL certificates. For development, self-signed certificates are automatically generated. For production, replace them with proper certificates.

## 🚀 Production Deployment

1. Replace self-signed certificates with proper SSL certificates
2. Set appropriate environment variables
3. Use a reverse proxy (nginx, Apache) if needed
4. Consider using Let's Encrypt for free SSL certificates

## 📝 Version Control

The project includes comprehensive ignore files:

- **`.gitignore`**: Excludes build outputs, dependencies, SSL certificates, logs, and other development files
- **`.dockerignore`**: Optimizes Docker builds by excluding unnecessary files

**Important**: SSL certificates in `backend/certs/` are excluded from version control for security. They will be generated automatically when running the startup scripts.

## 📚 Available Commands

### Frontend
- `cd frontend && make help` - Show all available commands
- `cd frontend && make setup` - Complete setup
- `cd frontend && make build` - Build for production
- `cd frontend && make watch` - Development with file watching
- `cd frontend && make start` - Build and serve with live-server

### Backend
- `cd backend && make help` - Show all available commands
- `cd backend && make setup` - Complete setup
- `cd backend && make start` - Start production server
- `cd backend && make dev` - Start development server

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
