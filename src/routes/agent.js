import { Router } from 'express'
import { getDb } from '../db/connection.js'

export const agentRouter = Router()

// Heartbeat do agente
agentRouter.post('/heartbeat', async (req, res) => {
  try {
    const { agentToken, ip, mac } = req.body
    const db = await getDb()
    const asset = await db.get('SELECT * FROM assets WHERE agent_token = ?', [agentToken])
    if (!asset) {
      await db.close()
      return res.status(404).json({ error: 'Asset not found' })
    }
    await db.run('UPDATE assets SET ip = ?, mac = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?', [ip, mac, asset.id])
    const nextCmd = await db.get('SELECT * FROM commands WHERE asset_id = ? AND status = "PENDING" ORDER BY id ASC', [asset.id])
    await db.close()
    res.json({ command: nextCmd || null })
  } catch (e) {
    res.status(500).json({ error: 'Heartbeat failed' })
  }
})

// Resultado do comando
agentRouter.post('/result', async (req, res) => {
  try {
    const { commandId, agentToken, output } = req.body
    const db = await getDb()
    const cmd = await db.get('SELECT c.*, a.agent_token FROM commands c JOIN assets a ON a.id = c.asset_id WHERE c.id = ?', [commandId])
    if (!cmd || cmd.agent_token !== agentToken) {
      await db.close()
      return res.status(403).json({ error: 'Invalid token or command' })
    }
    await db.run('INSERT INTO command_results (command_id, output) VALUES (?, ?)', [commandId, output])
    await db.run('UPDATE commands SET status = "DONE" WHERE id = ?', [commandId])
    await db.close()
    res.status(201).json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'Failed to submit result' })
  }
})
