import { AssetRepository } from '../repositories/AssetRepository.js'
import {
  generateSecureToken,
  isValidAssetType,
  isValidIP,
  isValidMAC,
  normalizeMAC,
  sanitizeString,
} from '../utils/validators.js'

export class AssetService {
  repo = new AssetRepository()

  // Comentário: regras de negócio de ativos com validações
  list = async () => this.repo.list()

  getWithHistory = async (id) => {
    const asset = await this.repo.getById(id)
    if (!asset) return null
    const history = await this.repo.history(id)
    return { asset, history }
  }

  create = async (payload) => {
    // Comentário: validações de entrada conforme RF1.1
    const errors = []

    if (!payload.name || payload.name.trim().length === 0) {
      errors.push('Nome do ativo é obrigatório')
    }

    if (!payload.type || !isValidAssetType(payload.type)) {
      errors.push('Tipo de ativo inválido')
    }

    if (payload.ip && !isValidIP(payload.ip)) {
      errors.push('Endereço IP inválido')
    }

    if (payload.mac && !isValidMAC(payload.mac)) {
      errors.push('Endereço MAC inválido')
    }

    if (errors.length > 0) {
      throw new Error(`Validação falhou: ${errors.join(', ')}`)
    }

    // Comentário: sanitização e normalização de dados
    const sanitizedData = {
      name: sanitizeString(payload.name.trim()),
      type: payload.type,
      ip: payload.ip || null,
      mac: payload.mac ? normalizeMAC(payload.mac) : null,
      agentToken: payload.agentToken || generateSecureToken(),
    }

    return this.repo.create(sanitizedData)
  }

  update = async (id, payload) => {
    // Comentário: validações para atualização
    const errors = []

    if (payload.name && payload.name.trim().length === 0) {
      errors.push('Nome do ativo não pode ser vazio')
    }

    if (payload.type && !isValidAssetType(payload.type)) {
      errors.push('Tipo de ativo inválido')
    }

    if (payload.ip && !isValidIP(payload.ip)) {
      errors.push('Endereço IP inválido')
    }

    if (payload.mac && !isValidMAC(payload.mac)) {
      errors.push('Endereço MAC inválido')
    }

    if (errors.length > 0) {
      throw new Error(`Validação falhou: ${errors.join(', ')}`)
    }

    // Comentário: sanitização e normalização
    const sanitizedData = {
      name: payload.name ? sanitizeString(payload.name.trim()) : undefined,
      type: payload.type,
      ip: payload.ip || null,
      mac: payload.mac ? normalizeMAC(payload.mac) : null,
      agentToken: payload.agentToken,
    }

    // Remove campos undefined
    Object.keys(sanitizedData).forEach((key) => {
      if (sanitizedData[key] === undefined) delete sanitizedData[key]
    })

    return this.repo.update(id, sanitizedData)
  }

  remove = async (id) => this.repo.remove(id)
}

