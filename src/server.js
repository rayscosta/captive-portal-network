import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import morgan from 'morgan'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './config/swagger.js'
import { ensureDatabase } from './db/connection.js'
import { agentRouter } from './routes/agent.js'
import { assetsRouter } from './routes/assets.js'
import { authRouter } from './routes/auth.js'
import { captiveRouter } from './routes/captive.js'
import { commandsRouter } from './routes/commands.js'
import { usersRouter } from './routes/users.js'
import { TimeoutMonitorService } from './services/TimeoutMonitorService.js'

// Configurações iniciais
const app = express()
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

// Static files (frontend leve)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
app.use(express.static(path.join(__dirname, '..', 'public')))

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'CPN API Documentation'
}))

// Endpoint para baixar spec OpenAPI
app.get('/api-docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

// Rotas principais
app.use('/api/auth', authRouter)
app.use('/api/assets', assetsRouter)
app.use('/api/commands', commandsRouter)
app.use('/api/agent', agentRouter)
app.use('/api/users', usersRouter)
app.use('/captive', captiveRouter)
app.use('/auth', captiveRouter)  // Manter compatibilidade com rotas antigas

// Healthcheck
app.get('/health', (_req, res) => {
  // Comentário: endpoint simples para verificar a saúde da aplicação
  res.json({ ok: true })
})

// Inicialização do servidor
const port = process.env.PORT || 3000
const timeoutMonitor = new TimeoutMonitorService()

ensureDatabase()
  .then(() => {
    app.listen(port, () => {
      // Comentário: servidor iniciado com sucesso
      console.log(`Server running on http://localhost:${port}`)
      
      // Iniciar monitor de timeouts de comandos
      timeoutMonitor.start()
    })
  })
  .catch((err) => {
    console.error('Failed to initialize database', err)
    process.exit(1)
  })

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, encerrando gracefully...')
  timeoutMonitor.stop()
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('\nSIGINT recebido, encerrando gracefully...')
  timeoutMonitor.stop()
  process.exit(0)
})
