import { AssetRepository } from '../repositories/AssetRepository.js'
import { CommandRepository } from '../repositories/CommandRepository.js'

const ALLOWED_COMMANDS = new Set(['UNAME', 'DF', 'UPTIME', 'LSROOT'])

export class CommandService {
  repo = new CommandRepository()
  assets = new AssetRepository()

  // Comentário: regras para enfileirar comandos e processar resultados
  enqueue = async ({ assetId, code }) => {
    if (!ALLOWED_COMMANDS.has(code)) throw new Error('INVALID_COMMAND')
    const asset = await this.assets.getById(assetId)
    if (!asset) throw new Error('ASSET_NOT_FOUND')
    return this.repo.create({ assetId, code })
  }

  listByAsset = async (assetId) => this.repo.listByAsset(assetId)

  nextForToken = async (agentToken) => {
    const asset = await this.assets.getByToken(agentToken)
    if (!asset) return null
    return this.repo.findPendingForAsset(asset.id)
  }

  submitResult = async ({ commandId, agentToken, output }) => {
    const cmd = await this.repo.findWithAssetToken(commandId)
    if (!cmd || cmd.agent_token !== agentToken) throw new Error('FORBIDDEN')
    await this.repo.attachResultAndMarkDone(commandId, output)
  }
}
