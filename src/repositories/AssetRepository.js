import { getDb } from '../db/connection.js'

export class AssetRepository {
  // Comentário: acesso a dados da entidade Asset
  list = async () => {
    const db = getDb()
    const rows = db.prepare('SELECT * FROM assets ORDER BY id DESC').all()
    return rows
  }

  getById = async (id) => {
    const db = getDb()
    const row = db.prepare('SELECT * FROM assets WHERE id = ?').get(id)
    return row
  }

  getByToken = async (token) => {
    const db = getDb()
    const row = db.prepare('SELECT * FROM assets WHERE agent_token = ?').get(token)
    return row
  }

  create = async ({ name, type, ip, mac, agentToken }) => {
    const db = getDb()
    const result = db.prepare(
      'INSERT INTO assets (name, type, ip, mac, agent_token) VALUES (?, ?, ?, ?, ?)'
    ).run(name, type, ip, mac, agentToken)
    const created = db.prepare('SELECT * FROM assets WHERE id = ?').get(result.lastInsertRowid)
    return created
  }

  update = async (id, { name, type, ip, mac, agentToken }) => {
    const db = getDb()
    db.prepare(
      'UPDATE assets SET name = ?, type = ?, ip = ?, mac = ?, agent_token = ? WHERE id = ?'
    ).run(name, type, ip, mac, agentToken, id)
    const updated = db.prepare('SELECT * FROM assets WHERE id = ?').get(id)
    return updated
  }

  remove = async (id) => {
    const db = getDb()
    db.prepare('DELETE FROM assets WHERE id = ?').run(id)
  }

  history = async (assetId) => {
    const db = getDb()
    const rows = db.prepare(
      `SELECT c.*, r.output, r.executed_at
       FROM commands c LEFT JOIN command_results r ON r.command_id = c.id
       WHERE c.asset_id = ? ORDER BY c.id DESC`
    ).all(assetId)
    return rows
  }
}
