import { getDb } from '../db/connection.js'

export class CommandRepository {
  // Comentário: acesso a dados de comandos e resultados
  create = async ({ assetId, code }) => {
    const db = getDb()
    const result = db.prepare('INSERT INTO commands (asset_id, code) VALUES (?, ?)').run(assetId, code)
    const created = db.prepare('SELECT * FROM commands WHERE id = ?').get(result.lastInsertRowid)
    return created
  }

  findPendingForAsset = async (assetId) => {
    const db = getDb()
    const row = db.prepare('SELECT * FROM commands WHERE asset_id = ? AND status = "PENDING" ORDER BY id ASC').get(assetId)
    return row
  }

  listByAsset = async (assetId) => {
    const db = getDb()
    const rows = db.prepare('SELECT * FROM commands WHERE asset_id = ? ORDER BY id DESC').all(assetId)
    return rows
  }

  attachResultAndMarkDone = async (commandId, output) => {
    const db = getDb()
    db.prepare('INSERT INTO command_results (command_id, output) VALUES (?, ?)').run(commandId, output)
    db.prepare('UPDATE commands SET status = "DONE" WHERE id = ?').run(commandId)
  }

  findWithAssetToken = async (commandId) => {
    const db = getDb()
    const row = db.prepare('SELECT c.*, a.agent_token FROM commands c JOIN assets a ON a.id = c.asset_id WHERE c.id = ?').get(commandId)
    return row
  }
}
