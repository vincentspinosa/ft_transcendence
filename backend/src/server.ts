/**
 * Transcendence Backend Server
 * 
 * This is the main entry point for the Transcendence game backend server.
 * It sets up an HTTPS server using Fastify, configures middleware, routes,
 * and handles both API requests and static file serving for the frontend.
 * 
 * Features:
 * - HTTPS server with SSL certificates
 * - CORS support for cross-origin requests
 * - Static file serving for the frontend SPA
 * - Game API routes for 1v1, 2v2, and tournament modes
 * - Health check endpoint
 * - Graceful shutdown handling
 * - Comprehensive error handling
 * - SPA routing support (fallback to index.html)
 * 
 * @author Vincent Spinosa
 * @version 1.0.0
 */

// Import required dependencies
import Fastify, { FastifyInstance } from 'fastify';  // Fastify web framework for high-performance Node.js applications
import fastifyStatic from '@fastify/static';          // Plugin for serving static files
import cors from '@fastify/cors';                     // Plugin for Cross-Origin Resource Sharing
import * as fs from 'fs';                            // Node.js file system module for reading SSL certificates
import * as path from 'path';                        // Node.js path module for cross-platform path handling
import { errorHandler } from './errorHandler';        // Custom error handling middleware
import { gameRoutes } from './routes/gameRoutes';     // Game-related API routes

/**
 * Server configuration interface
 * Defines the structure for server configuration including port, host, and HTTPS settings
 */
interface ServerConfig {
  port: number;                    // Port number the server will listen on
  host: string;                    // Host address to bind to (0.0.0.0 for all interfaces)
  https: {
    key: Buffer;                   // Private key buffer for HTTPS
    cert: Buffer;                  // SSL certificate buffer for HTTPS
  };
}

/**
 * HTTPS Server Class
 * 
 * Main server class that encapsulates all server functionality including:
 * - Server initialization and configuration
 * - Plugin setup (CORS, static files, routes)
 * - Route configuration
 * - Server lifecycle management (start/stop)
 * - Error handling setup
 */
class HTTPServer {
  private fastify: FastifyInstance;  // Fastify server instance
  private config: ServerConfig;      // Server configuration object

  /**
   * Constructor
   * 
   * Initializes the server with configuration and creates the Fastify instance.
   * Sets up HTTPS with SSL certificates and configures logging.
   */
  constructor() {
    // Initialize server configuration with environment variables or defaults
    this.config = {
      port: parseInt(process.env.PORT || '3000'),           // Use PORT env var or default to 3000
      host: process.env.HOST || '0.0.0.0',                 // Use HOST env var or default to all interfaces
      https: {
        // Read SSL certificate files from the certs directory
        key: fs.readFileSync(path.join(__dirname, '../certs/key.pem')),    // Private key file
        cert: fs.readFileSync(path.join(__dirname, '../certs/cert.pem'))   // SSL certificate file
      }
    };

    // Create Fastify instance with HTTPS configuration
    this.fastify = Fastify({
      https: this.config.https,     // Enable HTTPS with SSL certificates
      logger: {
        level: 'info'               // Set logging level to info for production-like logging
      }
    });
  }

  /**
   * Setup Plugins and Middleware
   * 
   * Configures all necessary plugins and middleware for the server:
   * - CORS for cross-origin requests
   * - Game API routes
   * - Static file serving for frontend
   * - SPA routing fallback
   * 
   * @returns Promise<void> - Resolves when all plugins are registered
   */
  private async setupPlugins(): Promise<void> {
    // Enable Cross-Origin Resource Sharing (CORS)
    // This allows the frontend to make requests to the backend from different origins
    await this.fastify.register(cors, {
      origin: true,                 // Allow all origins (can be restricted in production)
      credentials: true             // Allow credentials (cookies, authorization headers)
    });

    // Register game-related API routes with /api prefix
    // This includes endpoints for 1v1, 2v2, and tournament game modes
    await this.fastify.register(gameRoutes, { prefix: '/api' });

    // Serve static files from the frontend directory
    // This allows the backend to serve the built frontend application
    await this.fastify.register(fastifyStatic, {
      root: path.join(__dirname, '../frontend'),  // Path to frontend directory in Docker container
      prefix: '/',                                // Serve files from root path
      decorateReply: false,                       // Don't modify the reply object
      
      // Custom header handling for different file types
      setHeaders: (res, filePath) => {
        // HTML files should not be cached to ensure fresh content
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
        // Set proper MIME types for CSS files
        if (filePath.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css');
        }
        // Set proper MIME types for JavaScript files
        if (filePath.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript');
        }
      }
    });

    // SPA (Single Page Application) fallback handler
    // This ensures that any route that doesn't match a static file
    // will serve the index.html file, enabling client-side routing
    this.fastify.setNotFoundHandler(async (request, reply) => {
      // Try multiple possible paths for index.html in Docker container
      const possiblePaths = [
        path.join(__dirname, '../frontend/index.html'),             // Docker volume mount path
        path.join(__dirname, '../frontend/dist/index.html'),        // Built frontend path
      ];
      
      for (const indexPath of possiblePaths) {
        if (fs.existsSync(indexPath)) {
          console.log(`Found index.html at: ${indexPath}`);
          // Use reply.sendFile from @fastify/static plugin
          return reply.sendFile('index.html', path.dirname(indexPath));
        }
      }
      
      console.log('index.html not found. Searched paths:', possiblePaths);
      return reply.code(404).send({ error: 'Not Found - Frontend files not available' });  // Fallback 404 response
    });
  }

  /**
   * Setup Basic Routes
   * 
   * Configures basic server routes that are not part of the game API:
   * - Health check endpoint for monitoring and load balancers
   * 
   * Note: Game routes are handled by the gameRoutes plugin
   */
  private setupRoutes(): void {
    // Health check endpoint for monitoring and load balancer health checks
    // Returns server status and current timestamp
    this.fastify.get('/health', async (request, reply) => {
      return { 
        status: 'ok', 
        timestamp: new Date().toISOString() 
      };
    });
  }

  /**
   * Start the Server
   * 
   * Initializes all plugins, sets up routes, configures error handling,
   * and starts listening for incoming connections.
   * 
   * @returns Promise<void> - Resolves when server is successfully started
   * @throws Error if server fails to start
   */
  public async start(): Promise<void> {
    try {
      // Setup all plugins and middleware
      await this.setupPlugins();
      
      // Setup basic routes
      this.setupRoutes();
      
      // Configure global error handler for consistent error responses
      this.fastify.setErrorHandler(errorHandler);
      
      // Start listening for incoming connections
      await this.fastify.listen({
        port: this.config.port,
        host: this.config.host
      });

      // Log successful server startup with useful information
      console.log(`🚀 Server running on https://${this.config.host}:${this.config.port}`);
      console.log(`📁 Serving frontend from: ${path.join(__dirname, '../../frontend')}`);
      console.log(`🔒 HTTPS enabled with SSL certificates`);
      console.log(`🎮 Game API endpoints available at /api/game/*`);
    } catch (err) {
      // Log error and exit process if server fails to start
      this.fastify.log.error(err);
      process.exit(1);
    }
  }

  /**
   * Stop the Server
   * 
   * Gracefully shuts down the server by closing all connections
   * and cleaning up resources.
   * 
   * @returns Promise<void> - Resolves when server is successfully stopped
   */
  public async stop(): Promise<void> {
    await this.fastify.close();
  }
}

// Graceful shutdown handling
// These event handlers ensure the server shuts down cleanly when
// the process receives termination signals

// Handle SIGINT (Ctrl+C) - graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

// Handle SIGTERM (termination signal) - graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Create server instance and start it
// This is the entry point that gets executed when the script runs
const server = new HTTPServer();
server.start().catch(console.log);  // Start server and handle any startup errors
