import { getDb } from '../db/connection.js'

export class CommandRepository {
  // Comentário: acesso a dados de comandos e resultados
  create = async ({ assetId, code }) => {
    const db = await getDb()
    const result = await db.run('INSERT INTO commands (asset_id, code) VALUES (?, ?)', [assetId, code])
    const created = await db.get('SELECT * FROM commands WHERE id = ?', [result.lastID])
    await db.close()
    return created
  }

  findPendingForAsset = async (assetId) => {
    const db = await getDb()
    const row = await db.get('SELECT * FROM commands WHERE asset_id = ? AND status = "PENDING" ORDER BY id ASC', [assetId])
    await db.close()
    return row
  }

  listByAsset = async (assetId) => {
    const db = await getDb()
    const rows = await db.all('SELECT * FROM commands WHERE asset_id = ? ORDER BY id DESC', [assetId])
    await db.close()
    return rows
  }

  attachResultAndMarkDone = async (commandId, output) => {
    const db = await getDb()
    await db.run('INSERT INTO command_results (command_id, output) VALUES (?, ?)', [commandId, output])
    await db.run('UPDATE commands SET status = "DONE" WHERE id = ?', [commandId])
    await db.close()
  }

  findWithAssetToken = async (commandId) => {
    const db = await getDb()
    const row = await db.get('SELECT c.*, a.agent_token FROM commands c JOIN assets a ON a.id = c.asset_id WHERE c.id = ?', [commandId])
    await db.close()
    return row
  }
}
