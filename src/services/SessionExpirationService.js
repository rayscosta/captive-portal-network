import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { getDb } from '../db/connection.js'

const execFileAsync = promisify(execFile)

export class SessionExpirationService {
  intervalId = null
  checkIntervalMs = 60000 // Verifica a cada 60 segundos

  // Comentário: inicia monitoramento de sessões expiradas
  start = () => {
    if (this.intervalId) {
      console.log('⚠️ SessionExpirationService já está rodando')
      return
    }

    console.log(`🔒 SessionExpirationService iniciado (verifica a cada ${this.checkIntervalMs / 1000}s)`)
    
    this.intervalId = setInterval(() => {
      this.checkExpiredSessions().catch((err) => {
        console.error('❌ Erro ao verificar sessões expiradas:', err.message)
      })
    }, this.checkIntervalMs)
  }

  // Comentário: para monitoramento
  stop = () => {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('🔒 SessionExpirationService parado')
    }
  }

  // Comentário: busca e processa sessões expiradas
  checkExpiredSessions = async () => {
    const db = await getDb()
    
    try {
      // Buscar sessões ativas que já expiraram
      const expiredSessions = await db.all(`
        SELECT id, ip, mac, user_id 
        FROM captive_sessions 
        WHERE status = 'active' 
        AND datetime(expires_at) < datetime('now')
      `)

      if (expiredSessions.length === 0) {
        return
      }

      console.log(`🔒 Encontradas ${expiredSessions.length} sessões expiradas`)

      for (const session of expiredSessions) {
        try {
          // Marcar como expirada no banco
          await db.run(
            'UPDATE captive_sessions SET status = "expired" WHERE id = ?',
            [session.id]
          )

          // Executar script de bloqueio (apenas MAC)
          const scriptPath = 'scripts/block_internet.sh'
          const macAddress = session.mac
          
          if (macAddress) {
            await execFileAsync(scriptPath, [macAddress])
            console.log(`🔒 Sessão #${session.id} expirada e bloqueada (MAC: ${macAddress})`)
          } else {
            console.warn(`⚠️ Sessão #${session.id} sem MAC address, não foi possível bloquear`)
          }
        } catch (scriptErr) {
          console.error(`❌ Erro ao bloquear sessão #${session.id}:`, scriptErr.message)
        }
      }

      return expiredSessions.length
    } finally {
      await db.close()
    }
  }
}
