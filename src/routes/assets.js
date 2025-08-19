import { Router } from 'express'
import { getDb } from '../db/connection.js'
import { basicAuthMiddleware } from '../utils/auth.js'

export const assetsRouter = Router()

// Lista ativos
assetsRouter.get('/', basicAuthMiddleware, async (_req, res) => {
  try {
    const db = await getDb()
    const rows = await db.all('SELECT * FROM assets ORDER BY id DESC')
    await db.close()
    res.json(rows)
  } catch (e) {
    res.status(500).json({ error: 'Failed to list assets' })
  }
})

// Cria ativo
assetsRouter.post('/', basicAuthMiddleware, async (req, res) => {
  try {
    const { name, type, ip, mac, agentToken } = req.body
    const db = await getDb()
    const result = await db.run(
      'INSERT INTO assets (name, type, ip, mac, agent_token) VALUES (?, ?, ?, ?, ?)',
      [name, type, ip, mac, agentToken]
    )
    const created = await db.get('SELECT * FROM assets WHERE id = ?', [result.lastID])
    await db.close()
    res.status(201).json(created)
  } catch (e) {
    res.status(500).json({ error: 'Failed to create asset' })
  }
})

// Detalhe de ativo
assetsRouter.get('/:id', basicAuthMiddleware, async (req, res) => {
  try {
    const db = await getDb()
    const asset = await db.get('SELECT * FROM assets WHERE id = ?', [req.params.id])
    if (!asset) {
      await db.close()
      return res.status(404).json({ error: 'Asset not found' })
    }
    const history = await db.all(
      `SELECT c.*, r.output, r.executed_at
       FROM commands c LEFT JOIN command_results r ON r.command_id = c.id
       WHERE c.asset_id = ? ORDER BY c.id DESC`,
      [req.params.id]
    )
    await db.close()
    res.json({ asset, history })
  } catch (e) {
    res.status(500).json({ error: 'Failed to load asset' })
  }
})

// Atualiza ativo
assetsRouter.put('/:id', basicAuthMiddleware, async (req, res) => {
  try {
    const { name, type, ip, mac, agentToken } = req.body
    const db = await getDb()
    await db.run(
      'UPDATE assets SET name = ?, type = ?, ip = ?, mac = ?, agent_token = ? WHERE id = ?',
      [name, type, ip, mac, agentToken, req.params.id]
    )
    const updated = await db.get('SELECT * FROM assets WHERE id = ?', [req.params.id])
    await db.close()
    res.json(updated)
  } catch (e) {
    res.status(500).json({ error: 'Failed to update asset' })
  }
})

// Remove ativo
assetsRouter.delete('/:id', basicAuthMiddleware, async (req, res) => {
  try {
    const db = await getDb()
    await db.run('DELETE FROM assets WHERE id = ?', [req.params.id])
    await db.close()
    res.status(204).end()
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete asset' })
  }
})
