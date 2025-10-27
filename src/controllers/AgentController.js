import { AssetRepository } from '../repositories/AssetRepository.js'
import { CommandService } from '../services/CommandService.js'
import { AuditService } from '../services/AuditService.js'

export class AgentController {
  service = new CommandService()
  assets = new AssetRepository()
  auditService = new AuditService()

  heartbeat = async (req, res) => {
    try {
      const { agentToken, ip, mac } = req.body
      const asset = await this.assets.getByToken(agentToken)
      if (!asset) return res.status(404).json({ error: 'Asset not found' })
      
      // Atualiza last_seen e IP/MAC
      await this.assets.update(asset.id, { name: asset.name, type: asset.type, ip, mac, agentToken })
      
      // Comentário: log de auditoria do heartbeat
      await this.auditService.logAssetHeartbeat(agentToken, ip, mac)
      
      const nextCmd = await this.service.nextForToken(agentToken)
      res.json({ command: nextCmd || null })
    } catch (e) {
      res.status(500).json({ error: 'Heartbeat failed' })
    }
  }

  submitResult = async (req, res) => {
    try {
      const { commandId, agentToken, output } = req.body
      await this.service.submitResult({ commandId, agentToken, output })
      
      // Comentário: log de auditoria da conclusão do comando
      const success = !output.includes('error') && !output.includes('failed')
      await this.auditService.logCommandCompleted(agentToken, commandId, success)
      
      res.status(201).json({ ok: true })
    } catch (e) {
      if (e.message === 'FORBIDDEN') return res.status(403).json({ error: 'Invalid token or command' })
      res.status(500).json({ error: 'Failed to submit result' })
    }
  }
}
