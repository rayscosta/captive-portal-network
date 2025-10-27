import { UserRepository } from '../repositories/UserRepository.js'
import { isValidEmail, sanitizeString } from '../utils/validators.js'

export class UserService {
  repo = new UserRepository()

  // Comentário: regras de negócio para gestão de usuários (RF1.3)
  
  list = async () => this.repo.list()

  getById = async (id) => this.repo.getById(id)

  getByProviderAndId = async (provider, providerId) => {
    return this.repo.getByProviderAndId(provider, providerId)
  }

  create = async (payload) => {
    // Comentário: validações de entrada
    const errors = []

    if (!payload.provider || !['google', 'facebook'].includes(payload.provider)) {
      errors.push('Provider inválido (deve ser google ou facebook)')
    }

    if (!payload.providerId || payload.providerId.trim().length === 0) {
      errors.push('Provider ID é obrigatório')
    }

    if (payload.email && !isValidEmail(payload.email)) {
      errors.push('Email inválido')
    }

    if (errors.length > 0) {
      throw new Error(`Validação falhou: ${errors.join(', ')}`)
    }

    // Comentário: verificar se usuário já existe
    const existing = await this.repo.getByProviderAndId(payload.provider, payload.providerId)
    if (existing) {
      throw new Error('Usuário já cadastrado com este provider')
    }

    // Comentário: sanitização de dados
    const sanitizedData = {
      provider: payload.provider,
      providerId: payload.providerId,
      name: payload.name ? sanitizeString(payload.name) : null,
      email: payload.email || null,
    }

    return this.repo.create(sanitizedData)
  }

  update = async (id, payload) => {
    // Comentário: validações para atualização
    if (payload.email && !isValidEmail(payload.email)) {
      throw new Error('Email inválido')
    }

    const sanitizedData = {
      name: payload.name ? sanitizeString(payload.name) : undefined,
      email: payload.email || undefined,
    }

    // Remove campos undefined
    Object.keys(sanitizedData).forEach((key) => {
      if (sanitizedData[key] === undefined) delete sanitizedData[key]
    })

    return this.repo.update(id, sanitizedData)
  }

  remove = async (id) => this.repo.remove(id)

  // Comentário: obter métricas de acesso do usuário (RF1.3)
  getAccessMetrics = async (userId) => {
    const user = await this.repo.getById(userId)
    if (!user) {
      throw new Error('Usuário não encontrado')
    }

    const metrics = await this.repo.getAccessMetrics(userId)
    
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        provider: user.provider,
        createdAt: user.created_at,
      },
      metrics,
    }
  }

  // Comentário: obter histórico de sessões do usuário
  getSessionHistory = async (userId, limit = 50) => {
    const user = await this.repo.getById(userId)
    if (!user) {
      throw new Error('Usuário não encontrado')
    }

    return this.repo.getSessionHistory(userId, limit)
  }
}
