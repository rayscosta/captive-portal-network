import { getDb } from '../db/connection.js'

export class AuditRepository {
  // Comentário: acesso a dados da entidade AuditLog

  create = async ({ actor, action, details }) => {
    const db = await getDb()
    const result = await db.run(
      'INSERT INTO audit_logs (actor, action, details) VALUES (?, ?, ?)',
      [actor, action, details]
    )
    const created = await db.get('SELECT * FROM audit_logs WHERE id = ?', [result.lastID])
    await db.close()
    return created
  }

  list = async (limit = 100, offset = 0) => {
    const db = await getDb()
    const rows = await db.all(
      'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    )
    await db.close()
    return rows
  }

  getByActor = async (actor, limit = 50) => {
    const db = await getDb()
    const rows = await db.all(
      'SELECT * FROM audit_logs WHERE actor = ? ORDER BY created_at DESC LIMIT ?',
      [actor, limit]
    )
    await db.close()
    return rows
  }

  getByAction = async (action, limit = 50) => {
    const db = await getDb()
    const rows = await db.all(
      'SELECT * FROM audit_logs WHERE action = ? ORDER BY created_at DESC LIMIT ?',
      [action, limit]
    )
    await db.close()
    return rows
  }

  getByDateRange = async (startDate, endDate, limit = 100) => {
    const db = await getDb()
    const rows = await db.all(
      'SELECT * FROM audit_logs WHERE created_at BETWEEN ? AND ? ORDER BY created_at DESC LIMIT ?',
      [startDate, endDate, limit]
    )
    await db.close()
    return rows
  }

  count = async () => {
    const db = await getDb()
    const result = await db.get('SELECT COUNT(*) as total FROM audit_logs')
    await db.close()
    return result?.total || 0
  }

  // Comentário: limpar logs antigos (retenção configurável)
  deleteOlderThan = async (daysToKeep) => {
    const db = await getDb()
    await db.run(
      'DELETE FROM audit_logs WHERE created_at < datetime("now", ?)',
      [`-${daysToKeep} days`]
    )
    await db.close()
  }
}
