import Fastify, { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import cors from '@fastify/cors';
import * as fs from 'fs';
import * as path from 'path';
import { errorHandler } from './errorHandler';
import { gameRoutes } from './routes/gameRoutes';

interface ServerConfig {
  port: number;
  host: string;
  https: {
    key: Buffer;
    cert: Buffer;
  };
}

class HTTPServer {
  private fastify: FastifyInstance;
  private config: ServerConfig;

  constructor() {
    this.config = {
      port: parseInt(process.env.PORT || '3000'),
      host: process.env.HOST || '0.0.0.0',
      https: {
        key: fs.readFileSync(path.join(__dirname, '../certs/key.pem')),
        cert: fs.readFileSync(path.join(__dirname, '../certs/cert.pem'))
      }
    };

    this.fastify = Fastify({
      https: this.config.https,
      logger: {
        level: 'info'
      }
    });
  }

  private async setupPlugins(): Promise<void> {
    // Enable CORS
    await this.fastify.register(cors, {
      origin: true,
      credentials: true
    });

    // Register game routes
    await this.fastify.register(gameRoutes, { prefix: '/api' });

    // Serve static files from the frontend directory
    await this.fastify.register(fastifyStatic, {
      root: path.join(__dirname, '../../frontend'),
      prefix: '/',
      decorateReply: false,
      // Handle SPA routing by serving index.html for non-file routes
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
        // Set proper MIME types for CSS and JS files
        if (filePath.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css');
        }
        if (filePath.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript');
        }
      }
    });

    // SPA fallback - serve index.html for any route that doesn't match a file
    this.fastify.setNotFoundHandler(async (request, reply) => {
      const indexPath = path.join(__dirname, '../../frontend/index.html');
      if (fs.existsSync(indexPath)) {
        return reply.sendFile('index.html');
      }
      return reply.code(404).send({ error: 'Not Found' });
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.fastify.get('/health', async (request, reply) => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });
  }

  public async start(): Promise<void> {
    try {
      await this.setupPlugins();
      this.setupRoutes();
      
      // Set error handler
      this.fastify.setErrorHandler(errorHandler);
      
      await this.fastify.listen({
        port: this.config.port,
        host: this.config.host
      });

      console.log(`🚀 Server running on https://${this.config.host}:${this.config.port}`);
      console.log(`📁 Serving frontend from: ${path.join(__dirname, '../../frontend')}`);
      console.log(`🔒 HTTPS enabled with SSL certificates`);
      console.log(`🎮 Game API endpoints available at /api/game/*`);
    } catch (err) {
      this.fastify.log.error(err);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    await this.fastify.close();
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the server
const server = new HTTPServer();
server.start().catch(console.error);
