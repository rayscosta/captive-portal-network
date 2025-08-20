import { getDb } from '../db/connection.js'

export class AssetRepository {
  // Comentário: acesso a dados da entidade Asset
  list = async () => {
    const db = await getDb()
    const rows = await db.all('SELECT * FROM assets ORDER BY id DESC')
    await db.close()
    return rows
  }

  getById = async (id) => {
    const db = await getDb()
    const row = await db.get('SELECT * FROM assets WHERE id = ?', [id])
    await db.close()
    return row
  }

  getByToken = async (token) => {
    const db = await getDb()
    const row = await db.get('SELECT * FROM assets WHERE agent_token = ?', [token])
    await db.close()
    return row
  }

  create = async ({ name, type, ip, mac, agentToken }) => {
    const db = await getDb()
    const result = await db.run(
      'INSERT INTO assets (name, type, ip, mac, agent_token) VALUES (?, ?, ?, ?, ?)',
      [name, type, ip, mac, agentToken]
    )
    const created = await db.get('SELECT * FROM assets WHERE id = ?', [result.lastID])
    await db.close()
    return created
  }

  update = async (id, { name, type, ip, mac, agentToken }) => {
    const db = await getDb()
    await db.run(
      'UPDATE assets SET name = ?, type = ?, ip = ?, mac = ?, agent_token = ? WHERE id = ?',
      [name, type, ip, mac, agentToken, id]
    )
    const updated = await db.get('SELECT * FROM assets WHERE id = ?', [id])
    await db.close()
    return updated
  }

  remove = async (id) => {
    const db = await getDb()
    await db.run('DELETE FROM assets WHERE id = ?', [id])
    await db.close()
  }

  history = async (assetId) => {
    const db = await getDb()
    const rows = await db.all(
      `SELECT c.*, r.output, r.executed_at
       FROM commands c LEFT JOIN command_results r ON r.command_id = c.id
       WHERE c.asset_id = ? ORDER BY c.id DESC`,
      [assetId]
    )
    await db.close()
    return rows
  }
}
