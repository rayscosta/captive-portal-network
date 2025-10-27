import swaggerJsdoc from 'swagger-jsdoc'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Captive Portal Network API',
      version: '1.0.0',
      description: 'Sistema acadêmico de gerenciamento de ativos de TI e captive portal com autenticação social',
      contact: {
        name: 'API Support',
        email: 'support@cpn.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de Desenvolvimento'
      },
      {
        url: 'https://api.cpn.com',
        description: 'Servidor de Produção'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT para autenticação de administradores'
        },
        AgentToken: {
          type: 'apiKey',
          in: 'header',
          name: 'X-Agent-Token',
          description: 'Token único do agente para autenticação'
        }
      },
      schemas: {
        Asset: {
          type: 'object',
          required: ['name', 'type', 'agentToken'],
          properties: {
            id: {
              type: 'integer',
              description: 'ID único do ativo',
              example: 1
            },
            name: {
              type: 'string',
              description: 'Nome do ativo',
              example: 'Server-01'
            },
            type: {
              type: 'string',
              enum: ['linux', 'windows', 'router', 'switch'],
              description: 'Tipo do ativo',
              example: 'linux'
            },
            ip: {
              type: 'string',
              description: 'Endereço IP do ativo',
              example: '192.168.1.100'
            },
            mac: {
              type: 'string',
              description: 'Endereço MAC do ativo',
              example: '00:11:22:33:44:55'
            },
            agent_token: {
              type: 'string',
              description: 'Token único para autenticação do agente',
              example: 'a1b2c3d4e5f6g7h8i9j0'
            },
            last_seen: {
              type: 'string',
              format: 'date-time',
              description: 'Última vez que o agente fez heartbeat',
              example: '2025-10-27T19:30:00.000Z'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação do ativo',
              example: '2025-10-27T10:00:00.000Z'
            }
          }
        },
        Command: {
          type: 'object',
          required: ['assetId', 'code'],
          properties: {
            id: {
              type: 'integer',
              description: 'ID único do comando',
              example: 1
            },
            asset_id: {
              type: 'integer',
              description: 'ID do ativo que receberá o comando',
              example: 1
            },
            code: {
              type: 'string',
              enum: ['UNAME', 'DF', 'UPTIME', 'LSROOT'],
              description: 'Código do comando a ser executado',
              example: 'UNAME'
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'EXECUTING', 'DONE', 'FAILED'],
              description: 'Status do comando',
              example: 'PENDING'
            },
            output: {
              type: 'string',
              description: 'Resultado da execução do comando',
              example: 'Linux server-01 5.15.0-91-generic'
            },
            executed_at: {
              type: 'string',
              format: 'date-time',
              description: 'Data de execução do comando',
              example: '2025-10-27T19:35:00.000Z'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação do comando',
              example: '2025-10-27T19:30:00.000Z'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único do usuário',
              example: 1
            },
            name: {
              type: 'string',
              description: 'Nome do usuário',
              example: 'Admin Sistema'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email do usuário',
              example: 'admin@cpn.com'
            },
            role: {
              type: 'string',
              enum: ['admin', 'user'],
              description: 'Papel do usuário no sistema',
              example: 'admin'
            },
            provider: {
              type: 'string',
              enum: ['local', 'google', 'facebook'],
              description: 'Provedor de autenticação',
              example: 'local'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Data de criação do usuário',
              example: '2025-10-27T10:00:00.000Z'
            }
          }
        },
        CaptiveSession: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'ID único da sessão',
              example: 1
            },
            user_id: {
              type: 'integer',
              description: 'ID do usuário',
              example: 1
            },
            ip: {
              type: 'string',
              description: 'Endereço IP do cliente',
              example: '192.168.1.50'
            },
            mac: {
              type: 'string',
              description: 'Endereço MAC do cliente',
              example: 'aa:bb:cc:dd:ee:ff'
            },
            user_agent: {
              type: 'string',
              description: 'User-Agent do navegador',
              example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            },
            started_at: {
              type: 'string',
              format: 'date-time',
              description: 'Data de início da sessão',
              example: '2025-10-27T19:00:00.000Z'
            },
            expires_at: {
              type: 'string',
              format: 'date-time',
              description: 'Data de expiração da sessão',
              example: '2025-10-27T23:00:00.000Z'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Mensagem de erro',
              example: 'Recurso não encontrado'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Endpoints de autenticação e autorização'
      },
      {
        name: 'Assets',
        description: 'Gerenciamento de ativos de TI'
      },
      {
        name: 'Commands',
        description: 'Envio e monitoramento de comandos remotos'
      },
      {
        name: 'Agent',
        description: 'Endpoints para comunicação com agentes'
      },
      {
        name: 'Users',
        description: 'Gerenciamento de usuários'
      },
      {
        name: 'Captive Portal',
        description: 'Endpoints do portal captivo'
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/controllers/*.js']
}

export const swaggerSpec = swaggerJsdoc(options)
