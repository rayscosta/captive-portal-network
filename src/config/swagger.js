import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Captive Portal Network API',
      version: '0.1.0',
      description: 'Academic system for IT asset management and captive portal with social authentication. Provides endpoints for managing network assets, executing remote commands via agents, and handling captive portal authentication flows.',
      contact: {
        name: 'API Support',
        email: 'support@captiveportal.local'
      },
      license: {
        name: 'Private',
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      },
      {
        url: 'https://api.captiveportal.local',
        description: 'Production server'
      }
    ],
    tags: [
      {
        name: 'Assets',
        description: 'IT asset management operations'
      },
      {
        name: 'Commands',
        description: 'Remote command execution on assets'
      },
      {
        name: 'Agent',
        description: 'Agent communication endpoints'
      },
      {
        name: 'Captive Portal',
        description: 'Authentication and session management'
      },
      {
        name: 'Health',
        description: 'System health check'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for admin authentication'
        },
        AgentToken: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Agent-Token',
          description: 'Agent authentication token'
        }
      },
      schemas: {
        Asset: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Gateway Server' },
            type: { type: 'string', example: 'server', enum: ['router', 'switch', 'server', 'workstation'] },
            ip: { type: 'string', example: '192.168.1.1' },
            mac: { type: 'string', example: 'AA:BB:CC:DD:EE:FF' },
            agent_token: { type: 'string', example: 'abc123def456' },
            last_seen: { type: 'string', format: 'date-time' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Command: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            asset_id: { type: 'integer', example: 1 },
            code: { type: 'string', example: 'UNAME', enum: ['UNAME', 'DF', 'UPTIME', 'LSROOT'] },
            status: { type: 'string', example: 'PENDING', enum: ['PENDING', 'DONE'] },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Error message' }
          }
        }
      }
    }
  },
  // Comentário: caminhos para os arquivos que contêm as anotações JSDoc do Swagger
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js',
    './src/server.js'
  ]
}

const specs = swaggerJsdoc(options)

export default specs
