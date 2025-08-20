import { AssetRepository } from '../repositories/AssetRepository.js'

export class AssetService {
  repo = new AssetRepository()

  // Comentário: regras de negócio de ativos
  list = async () => this.repo.list()

  getWithHistory = async (id) => {
    const asset = await this.repo.getById(id)
    if (!asset) return null
    const history = await this.repo.history(id)
    return { asset, history }
  }

  create = async (payload) => this.repo.create(payload)

  update = async (id, payload) => this.repo.update(id, payload)

  remove = async (id) => this.repo.remove(id)
}
