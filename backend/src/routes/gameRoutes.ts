import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import {
  GameSettings,
  FourPlayerGameSettings,
  TournamentSettings,
  validateGameSettings,
  validateFourPlayerGameSettings,
  validateTournamentSettings,
  gameSettingsSchema,
  fourPlayerGameSettingsSchema,
  tournamentSettingsSchema
} from '../validation';

export async function gameRoutes(fastify: FastifyInstance) {
  // 1v1 Game Setup
  fastify.post('/api/game/1v1', {
    schema: gameSettingsSchema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const settings = request.body as GameSettings;
        
        // Additional backend validation (beyond JSON schema)
        validateGameSettings(settings);
        
        // Here you would typically save to database or start the game
        // For now, we'll just return success
        
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
        request.log.error('Error in 1v1 game setup:', error as any);
        throw error;
      }
    }
  });

  // 2v2 Game Setup
  fastify.post('/api/game/2v2', {
    schema: fourPlayerGameSettingsSchema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const settings = request.body as FourPlayerGameSettings;
        
        // Additional backend validation (beyond JSON schema)
        validateFourPlayerGameSettings(settings);
        
        // Here you would typically save to database or start the game
        // For now, we'll just return success
        
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
        request.log.error('Error in 2v2 game setup:', error as any);
        throw error;
      }
    }
  });

  // Tournament Setup
  fastify.post('/api/game/tournament', {
    schema: tournamentSettingsSchema,
    handler: async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const settings = request.body as TournamentSettings;
        
        // Additional backend validation (beyond JSON schema)
        validateTournamentSettings(settings);
        
        // Here you would typically save to database or start the tournament
        // For now, we'll just return success
        
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
        request.log.error('Error in tournament setup:', error as any);
        throw error;
      }
    }
  });

  // Get available colors
  fastify.get('/api/game/colors', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({
      success: true,
      data: {
        colors: ['white', 'lightblue', 'red', 'lightgreen']
      }
    });
  });

  // Get available player types
  fastify.get('/api/game/player-types', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({
      success: true,
      data: {
        playerTypes: ['human', 'ai']
      }
    });
  });

  // Get score limit constraints
  fastify.get('/api/game/score-limits', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(200).send({
      success: true,
      data: {
        minScore: 1,
        maxScore: 21
      }
    });
  });

  // Validate a single player name
  fastify.post('/api/game/validate-name', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { name, playerLabel } = request.body as { name: string; playerLabel: string };
      
      if (!name || name.trim().length === 0) {
        return reply.status(400).send({
          success: false,
          error: 'Name cannot be empty',
          field: 'name'
        });
      }
      
      if (name.length > 20) {
        return reply.status(400).send({
          success: false,
          error: `Name cannot exceed 20 characters`,
          field: 'name'
        });
      }
      
      // Check for potentially dangerous characters
      if (/[<>\"'&]/.test(name)) {
        return reply.status(400).send({
          success: false,
          error: 'Name contains invalid characters',
          field: 'name'
        });
      }
      
      return reply.status(200).send({
        success: true,
        message: 'Name is valid',
        data: { name: name.trim() }
      });
    } catch (error) {
      request.log.error('Error in name validation:', error as any);
      return reply.status(500).send({
        success: false,
        error: 'Internal server error'
      });
    }
  });
}
