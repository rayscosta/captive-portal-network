import { getDb } from '../db/connection.js'

export class CommandRepository {
  // Comentário: acesso a dados de comandos e resultados
  create = async ({ assetId, code, timeoutSeconds = 30 }) => {
    const db = await getDb()
    const result = await db.run(
      'INSERT INTO commands (asset_id, code, timeout_seconds) VALUES (?, ?, ?)', 
      [assetId, code, timeoutSeconds]
    )
    const created = await db.get('SELECT * FROM commands WHERE id = ?', [result.lastID])
    await db.close()
    return created
  }

  findPendingForAsset = async (assetId) => {
    const db = await getDb()
    const row = await db.get(
      'SELECT * FROM commands WHERE asset_id = ? AND status = "PENDING" ORDER BY id ASC', 
      [assetId]
    )
    await db.close()
    return row
  }

  markAsExecuting = async (commandId) => {
    const db = await getDb()
    await db.run(
      'UPDATE commands SET status = "EXECUTING", executed_at = CURRENT_TIMESTAMP WHERE id = ?', 
      [commandId]
    )
    const updated = await db.get('SELECT * FROM commands WHERE id = ?', [commandId])
    await db.close()
    return updated
  }

  markAsDone = async (commandId) => {
    const db = await getDb()
    await db.run('UPDATE commands SET status = "DONE" WHERE id = ?', [commandId])
    await db.close()
  }

  markAsFailed = async (commandId, errorMessage = null) => {
    const db = await getDb()
    await db.run('UPDATE commands SET status = "FAILED" WHERE id = ?', [commandId])
    if (errorMessage) {
      await db.run(
        'INSERT INTO command_results (command_id, output) VALUES (?, ?)', 
        [commandId, `ERROR: ${errorMessage}`]
      )
    }
    await db.close()
  }

  listByAsset = async (assetId) => {
    const db = await getDb()
    const rows = await db.all(
      'SELECT * FROM commands WHERE asset_id = ? ORDER BY id DESC', 
      [assetId]
    )
    await db.close()
    return rows
  }

  attachResult = async (commandId, output) => {
    const db = await getDb()
    await db.run(
      'INSERT INTO command_results (command_id, output) VALUES (?, ?)', 
      [commandId, output]
    )
    await db.close()
  }

  attachResultAndMarkDone = async (commandId, output) => {
    const db = await getDb()
    await db.run(
      'INSERT INTO command_results (command_id, output) VALUES (?, ?)', 
      [commandId, output]
    )
    await db.run('UPDATE commands SET status = "DONE" WHERE id = ?', [commandId])
    await db.close()
  }

  findWithAssetToken = async (commandId) => {
    const db = await getDb()
    const row = await db.get(
      'SELECT c.*, a.agent_token FROM commands c JOIN assets a ON a.id = c.asset_id WHERE c.id = ?', 
      [commandId]
    )
    await db.close()
    return row
  }

  findTimedOutCommands = async () => {
    const db = await getDb()
    // Comentário: busca comandos EXECUTING que excederam o timeout
    const rows = await db.all(`
      SELECT * FROM commands 
      WHERE status = 'EXECUTING' 
      AND datetime(executed_at, '+' || timeout_seconds || ' seconds') < datetime('now')
    `)
    await db.close()
    return rows
  }
}
