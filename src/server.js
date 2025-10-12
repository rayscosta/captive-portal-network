import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import morgan from 'morgan'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import swaggerUi from 'swagger-ui-express'
import swaggerSpecs from './config/swagger.js'
import { ensureDatabase } from './db/connection.js'
import { agentRouter } from './routes/agent.js'
import { assetsRouter } from './routes/assets.js'
import { captiveRouter } from './routes/captive.js'
import { commandsRouter } from './routes/commands.js'

// Configurações iniciais
const app = express()
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

// Static files (frontend leve)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
app.use(express.static(path.join(__dirname, '..', 'public')))

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Captive Portal Network API Docs'
}))

// Rotas principais
app.use('/api/assets', assetsRouter)
app.use('/api/commands', commandsRouter)
app.use('/api/agent', agentRouter)
app.use('/auth', captiveRouter)

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Verifica o status de saúde da API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API está funcionando corretamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 */
app.get('/health', (_req, res) => {
  // Comentário: endpoint simples para verificar a saúde da aplicação
  res.json({ ok: true })
})

// Inicialização do servidor
const port = process.env.PORT || 3000

try {
  // Comentário: inicializa o banco de dados de forma síncrona (better-sqlite3)
  ensureDatabase()
  
  app.listen(port, () => {
    // Comentário: servidor iniciado com sucesso
    console.log(`Server running on http://localhost:${port}`)
    console.log(`API Documentation available at http://localhost:${port}/api-docs`)
  })
} catch (err) {
  console.error('Failed to initialize database', err)
  process.exit(1)
}
