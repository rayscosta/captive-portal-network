import { getDb } from '../db/connection.js'

export class UserRepository {
  // Comentário: acesso a dados da entidade User

  list = async () => {
    const db = await getDb()
    const rows = await db.all('SELECT * FROM users ORDER BY id DESC')
    await db.close()
    return rows
  }

  getById = async (id) => {
    const db = await getDb()
    const row = await db.get('SELECT * FROM users WHERE id = ?', [id])
    await db.close()
    return row
  }

  getByProviderAndId = async (provider, providerId) => {
    const db = await getDb()
    const row = await db.get('SELECT * FROM users WHERE provider = ? AND provider_id = ?', [provider, providerId])
    await db.close()
    return row
  }

  create = async ({ provider, providerId, name, email }) => {
    const db = await getDb()
    const result = await db.run(
      'INSERT INTO users (provider, provider_id, name, email) VALUES (?, ?, ?, ?)',
      [provider, providerId, name, email]
    )
    const created = await db.get('SELECT * FROM users WHERE id = ?', [result.lastID])
    await db.close()
    return created
  }

  update = async (id, { name, email }) => {
    const db = await getDb()
    await db.run('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, id])
    const updated = await db.get('SELECT * FROM users WHERE id = ?', [id])
    await db.close()
    return updated
  }

  remove = async (id) => {
    const db = await getDb()
    await db.run('DELETE FROM users WHERE id = ?', [id])
    await db.close()
  }

  // Comentário: métricas de acesso conforme RF1.3
  getAccessMetrics = async (userId) => {
    const db = await getDb()

    // Total de acessos (sessões criadas)
    const totalAccessesResult = await db.get(
      'SELECT COUNT(*) as total FROM captive_sessions WHERE user_id = ?',
      [userId]
    )

    // Tempo médio de conexão (em minutos)
    const avgConnectionTimeResult = await db.get(
      `SELECT 
        AVG((julianday(expires_at) - julianday(started_at)) * 24 * 60) as avg_minutes
       FROM captive_sessions 
       WHERE user_id = ? AND expires_at IS NOT NULL`,
      [userId]
    )

    // Dispositivos conectados (MACs únicos)
    const devicesResult = await db.all(
      'SELECT DISTINCT mac, user_agent FROM captive_sessions WHERE user_id = ? AND mac IS NOT NULL',
      [userId]
    )

    // Sessões ativas no momento
    const activeSessionsResult = await db.get(
      `SELECT COUNT(*) as active 
       FROM captive_sessions 
       WHERE user_id = ? AND datetime('now') < datetime(expires_at)`,
      [userId]
    )

    await db.close()

    return {
      totalAccesses: totalAccessesResult?.total || 0,
      avgConnectionTime: Math.round(avgConnectionTimeResult?.avg_minutes || 0),
      connectedDevices: devicesResult || [],
      deviceCount: devicesResult?.length || 0,
      activeSessions: activeSessionsResult?.active || 0,
    }
  }

  // Comentário: histórico de sessões do usuário
  getSessionHistory = async (userId, limit = 50) => {
    const db = await getDb()
    const rows = await db.all(
      `SELECT * FROM captive_sessions 
       WHERE user_id = ? 
       ORDER BY started_at DESC 
       LIMIT ?`,
      [userId, limit]
    )
    await db.close()
    return rows
  }
}
