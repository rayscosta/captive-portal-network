import { AssetRepository } from '../repositories/AssetRepository.js'
import { CommandRepository } from '../repositories/CommandRepository.js'

const ALLOWED_COMMANDS = new Set(['UNAME', 'DF', 'UPTIME', 'LSROOT'])

export class CommandService {
  repo = new CommandRepository()
  assets = new AssetRepository()

  // Comentário: regras para enfileirar comandos e processar resultados
  enqueue = async ({ assetId, code, timeoutSeconds = 30 }) => {
    if (!ALLOWED_COMMANDS.has(code)) throw new Error('INVALID_COMMAND')
    const asset = await this.assets.getById(assetId)
    if (!asset) throw new Error('ASSET_NOT_FOUND')
    
    // Validar timeout
    if (timeoutSeconds < 5 || timeoutSeconds > 300) {
      throw new Error('INVALID_TIMEOUT: deve estar entre 5 e 300 segundos')
    }
    
    return this.repo.create({ assetId, code, timeoutSeconds })
  }

  listByAsset = async (assetId) => this.repo.listByAsset(assetId)

  nextForToken = async (agentToken) => {
    const asset = await this.assets.getByToken(agentToken)
    if (!asset) return null
    
    const command = await this.repo.findPendingForAsset(asset.id)
    
    // Se encontrou comando pendente, marcar como EXECUTING
    if (command) {
      return this.repo.markAsExecuting(command.id)
    }
    
    return null
  }

  submitResult = async ({ commandId, agentToken, output }) => {
    const cmd = await this.repo.findWithAssetToken(commandId)
    if (!cmd || cmd.agent_token !== agentToken) throw new Error('FORBIDDEN')
    
    // Verificar se ainda está no tempo limite
    if (cmd.status !== 'EXECUTING') {
      throw new Error('COMMAND_NOT_EXECUTING')
    }
    
    await this.repo.attachResultAndMarkDone(commandId, output)
  }

  // Comentário: método para verificar e marcar comandos que excederam timeout
  checkTimeouts = async () => {
    const timedOutCommands = await this.repo.findTimedOutCommands()
    
    for (const cmd of timedOutCommands) {
      await this.repo.markAsFailed(cmd.id, `Timeout de ${cmd.timeout_seconds}s excedido`)
    }
    
    return timedOutCommands.length
  }
}
