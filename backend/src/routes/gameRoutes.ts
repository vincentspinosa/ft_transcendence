/**
 * Transcendence Backend Game Routes
 * 
 * This module defines all game-related API endpoints for the Transcendence backend.
 * It handles game setup for different modes (1v1, 2v2, tournament).
 * 
 * Features:
 * - Game setup endpoints for 1v1, 2v2, and tournament modes
 * - Input validation using both JSON schemas and custom validation functions
 * - Comprehensive error handling and logging
 * - Structured response formats for consistent API behavior
 * 
 * API Endpoints:
 * - POST /api/game/1v1 - Create a 1v1 game
 * - POST /api/game/2v2 - Create a 2v2 game
 * - POST /api/game/tournament - Create a tournament
 * 
 * @author Vincent Spinosa
 * @version 1.0.0
 */

// Import required types and functions from Fastify and validation modules
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  GameSettings,                    // Interface for 1v1 game configuration
  FourPlayerGameSettings,          // Interface for 2v2 game configuration
  TournamentSettings,              // Interface for tournament configuration
  validateGameSettings,            // Validation function for 1v1 games
  validateFourPlayerGameSettings,  // Validation function for 2v2 games
  validateTournamentSettings,      // Validation function for tournaments
  gameSettingsSchema,              // JSON schema for 1v1 game requests
  fourPlayerGameSettingsSchema,    // JSON schema for 2v2 game requests
  tournamentSettingsSchema         // JSON schema for tournament requests
} from '../validation';

/**
 * Game Routes Plugin
 * 
 * This function registers all game-related routes with the Fastify instance.
 * It's called by the main server to set up the game API endpoints.
 * 
 * @param fastify - The Fastify instance to register routes with
 * @returns Promise<void> - Resolves when all routes are registered
 */
export async function gameRoutes(fastify: FastifyInstance) {
  
  /**
   * 1v1 Game Setup Endpoint
   * 
   * Creates a new 1v1 game with the specified player configurations and game settings.
   * This endpoint handles head-to-head matches between two players.
   * 
   * Route: POST /api/game/1v1
   * 
   * Request Body: GameSettings object containing:
   * - player1: First player configuration (name, color, type)
   * - player2: Second player configuration (name, color, type)
   * - scoreLimit: Score required to win the game
   * - enablePowerUps: Whether power-ups are enabled
   * 
   * Response: Success confirmation with validated game settings
   */
  fastify.post('/game/1v1', {
    schema: gameSettingsSchema,  // Use JSON schema for automatic request validation
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Extract game settings from request body
        const settings = request.body as GameSettings;
        
        // Perform additional backend validation beyond JSON schema
        // This ensures business logic rules are enforced
        validateGameSettings(settings);
        
        // TODO: Here you would typically save to database or start the game
        // For now, we'll just return success confirmation
        
        // Return successful response with validated game data
        return reply.status(200).send({
          success: true,
          message: '1v1 game settings validated successfully',
          data: {
            gameType: '1v1',
            player1: {
              name: settings.player1.name,
              color: settings.player1.color,
              type: settings.player1.type
            },
            player2: {
              name: settings.player2.name,
              color: settings.player2.color,
              type: settings.player2.type
            },
            scoreLimit: settings.scoreLimit,
            enablePowerUps: settings.enablePowerUps
          }
        });
      } catch (error) {
        // Log error for debugging and monitoring
        request.log.error('Error in 1v1 game setup:', error as any);
        // Re-throw error to be handled by the global error handler
        throw error;
      }
    }
  });

  /**
   * 2v2 Game Setup Endpoint
   * 
   * Creates a new 2v2 team game with four players divided into two teams.
   * This endpoint handles team-based matches with two players per team.
   * 
   * Route: POST /api/game/2v2
   * 
   * Request Body: FourPlayerGameSettings object containing:
   * - player1, player2: First team configuration
   * - player3, player4: Second team configuration
   * - scoreLimit: Score required to win the game
   * - enablePowerUps: Whether power-ups are enabled
   * 
   * Response: Success confirmation with validated game settings organized by teams
   */
  fastify.post('/game/2v2', {
    schema: fourPlayerGameSettingsSchema,  // Use JSON schema for automatic request validation
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Extract game settings from request body
        const settings = request.body as FourPlayerGameSettings;
        
        // Perform additional backend validation beyond JSON schema
        // This ensures business logic rules are enforced
        validateFourPlayerGameSettings(settings);
        
        // TODO: Here you would typically save to database or start the game
        // For now, we'll just return success confirmation
        
        // Return successful response with validated game data organized by teams
        return reply.status(200).send({
          success: true,
          message: '2v2 game settings validated successfully',
          data: {
            gameType: '2v2',
            team1: {
              player1: {
                name: settings.player1.name,
                color: settings.player1.color,
                type: settings.player1.type
              },
              player2: {
                name: settings.player2.name,
                color: settings.player2.color,
                type: settings.player2.type
              }
            },
            team2: {
              player3: {
                name: settings.player3.name,
                color: settings.player3.color,
                type: settings.player3.type
              },
              player4: {
                name: settings.player4.name,
                color: settings.player4.color,
                type: settings.player4.type
              }
            },
            scoreLimit: settings.scoreLimit,
            enablePowerUps: settings.enablePowerUps
          }
        });
      } catch (error) {
        // Log error for debugging and monitoring
        request.log.error('Error in 2v2 game setup:', error as any);
        // Re-throw error to be handled by the global error handler
        throw error;
      }
    }
  });

  /**
   * Tournament Setup Endpoint
   * 
   * Creates a new tournament with four players competing in a bracket format.
   * This endpoint handles tournament-style competitions with multiple rounds.
   * 
   * Route: POST /api/game/tournament
   * 
   * Request Body: TournamentSettings object containing:
   * - player1, player2, player3, player4: All tournament participants
   * - scoreLimit: Score required to win individual matches
   * - enablePowerUps: Whether power-ups are enabled
   * 
   * Response: Success confirmation with validated tournament settings and bracket structure
   */
  fastify.post('/game/tournament', {
    schema: tournamentSettingsSchema,  // Use JSON schema for automatic request validation
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Extract tournament settings from request body
        const settings = request.body as TournamentSettings;
        
        // Perform additional backend validation beyond JSON schema
        // This ensures business logic rules are enforced
        validateTournamentSettings(settings);
        
        // TODO: Here you would typically save to database or start the tournament
        // For now, we'll just return success confirmation
        
        // Return successful response with validated tournament data and bracket structure
        return reply.status(200).send({
          success: true,
          message: 'Tournament settings validated successfully',
          data: {
            gameType: 'tournament',
            players: [
              {
                name: settings.player1.name,
                color: settings.player1.color,
                type: settings.player1.type
              },
              {
                name: settings.player2.name,
                color: settings.player2.color,
                type: settings.player2.type
              },
              {
                name: settings.player3.name,
                color: settings.player3.color,
                type: settings.player3.type
              },
              {
                name: settings.player4.name,
                color: settings.player4.color,
                type: settings.player4.type
              }
            ],
            scoreLimit: settings.scoreLimit,
            enablePowerUps: settings.enablePowerUps,
            tournamentStructure: {
              semiFinal1: `${settings.player1.name} vs ${settings.player2.name}`,
              semiFinal2: `${settings.player3.name} vs ${settings.player4.name}`,
              final: 'Winner of Semi-Final 1 vs Winner of Semi-Final 2'
            }
          }
        });
      } catch (error) {
        // Log error for debugging and monitoring
        request.log.error('Error in tournament setup:', error as any);
        // Re-throw error to be handled by the global error handler
        throw error;
      }
    }
  });
}
