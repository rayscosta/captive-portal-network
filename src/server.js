import cors from 'cors'
import 'dotenv/config'
import express from 'express'
import morgan from 'morgan'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ensureDatabase } from './db/connection.js'
import { agentRouter } from './routes/agent.js'
import { assetsRouter } from './routes/assets.js'
import { authRouter } from './routes/auth.js'
import { captiveRouter } from './routes/captive.js'
import { commandsRouter } from './routes/commands.js'
import { usersRouter } from './routes/users.js'
import { logOAuthConfig } from './utils/oauth.js'

// Configurações iniciais
const app = express()
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

// Static files (frontend leve)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
app.use(express.static(path.join(__dirname, '..', 'public')))

// Rotas principais
app.use('/api/auth', authRouter)
app.use('/api/assets', assetsRouter)
app.use('/api/commands', commandsRouter)
app.use('/api/agent', agentRouter)
app.use('/api/users', usersRouter)
app.use('/captive', captiveRouter)
app.use('/auth', captiveRouter)  // Manter compatibilidade com rotas antigas

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
  // Comentário: inicializa database de forma síncrona (better-sqlite3)
  ensureDatabase()
  
  app.listen(port, () => {
    // Comentário: servidor iniciado com sucesso
    console.log(`🚀 Server running on http://localhost:${port}`)
    console.log(`📚 API Docs: http://localhost:${port}/api-docs`)
    
    // Comentário: exibe configuração OAuth
    logOAuthConfig()
  })
} catch (err) {
  console.error('Failed to initialize database', err)
  process.exit(1)
}
