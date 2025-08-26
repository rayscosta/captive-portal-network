import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import morgan from 'morgan'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
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

// Rotas principais
app.use('/api/assets', assetsRouter)
app.use('/api/commands', commandsRouter)
app.use('/api/agent', agentRouter)
app.use('/auth', captiveRouter)

// Healthcheck
app.get('/health', (_req, res) => {
  // Comentário: endpoint simples para verificar a saúde da aplicação
  res.json({ ok: true })
})

// Inicialização do servidor
const port = process.env.PORT || 3000
ensureDatabase()
  .then(() => {
    app.listen(port, () => {
      // Comentário: servidor iniciado com sucesso
      console.log(`Server running on http://localhost:${port}`)
    })
  })
  .catch((err) => {
    console.error('Failed to initialize database', err)
    process.exit(1)
  })
