import { Router } from 'express'
import { getDb } from '../db/connection.js'
import { basicAuthMiddleware } from '../utils/auth.js'

const ALLOWED_COMMANDS = new Set(['UNAME', 'DF', 'UPTIME', 'LSROOT'])

export const commandsRouter = Router()

// Enfileirar comando para um ativo
commandsRouter.post('/', basicAuthMiddleware, async (req, res) => {
  try {
    const { assetId, code } = req.body
    if (!ALLOWED_COMMANDS.has(code)) return res.status(400).json({ error: 'Invalid command' })
    const db = await getDb()
    const asset = await db.get('SELECT id FROM assets WHERE id = ?', [assetId])
    if (!asset) {
      await db.close()
      return res.status(404).json({ error: 'Asset not found' })
    }
    const result = await db.run('INSERT INTO commands (asset_id, code) VALUES (?, ?)', [assetId, code])
    const created = await db.get('SELECT * FROM commands WHERE id = ?', [result.lastID])
    await db.close()
    res.status(201).json(created)
  } catch (e) {
    res.status(500).json({ error: 'Failed to enqueue command' })
  }
})

// Listar comandos por ativo
commandsRouter.get('/asset/:assetId', basicAuthMiddleware, async (req, res) => {
  try {
    const db = await getDb()
    const rows = await db.all('SELECT * FROM commands WHERE asset_id = ? ORDER BY id DESC', [req.params.assetId])
    await db.close()
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: 'Failed to list commands' })
  }
})
