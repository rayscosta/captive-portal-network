import { UserService } from '../services/UserService.js'

export class UserController {
  service = new UserService()

  list = async (_req, res) => {
    try {
      const data = await this.service.list()
      res.json(data)
    } catch (e) {
      res.status(500).json({ error: 'Failed to list users' })
    }
  }

  get = async (req, res) => {
    try {
      const user = await this.service.getById(req.params.id)
      if (!user) return res.status(404).json({ error: 'User not found' })
      res.json(user)
    } catch (e) {
      res.status(500).json({ error: 'Failed to load user' })
    }
  }

  create = async (req, res) => {
    try {
      const { provider, providerId, name, email } = req.body
      const created = await this.service.create({ provider, providerId, name, email })
      res.status(201).json(created)
    } catch (e) {
      if (e.message.includes('Validação falhou')) {
        return res.status(400).json({ error: e.message })
      }
      if (e.message.includes('já cadastrado')) {
        return res.status(409).json({ error: e.message })
      }
      res.status(500).json({ error: 'Failed to create user' })
    }
  }

  update = async (req, res) => {
    try {
      const { name, email } = req.body
      const updated = await this.service.update(req.params.id, { name, email })
      res.json(updated)
    } catch (e) {
      if (e.message.includes('inválido')) {
        return res.status(400).json({ error: e.message })
      }
      res.status(500).json({ error: 'Failed to update user' })
    }
  }

  remove = async (req, res) => {
    try {
      await this.service.remove(req.params.id)
      res.status(204).end()
    } catch (e) {
      res.status(500).json({ error: 'Failed to delete user' })
    }
  }

  // Comentário: endpoint para métricas de acesso (RF1.3)
  getMetrics = async (req, res) => {
    try {
      const data = await this.service.getAccessMetrics(req.params.id)
      res.json(data)
    } catch (e) {
      if (e.message === 'Usuário não encontrado') {
        return res.status(404).json({ error: e.message })
      }
      res.status(500).json({ error: 'Failed to load metrics' })
    }
  }

  // Comentário: endpoint para histórico de sessões
  getSessionHistory = async (req, res) => {
    try {
      const limit = parseInt(req.query.limit || '50', 10)
      const sessions = await this.service.getSessionHistory(req.params.id, limit)
      res.json(sessions)
    } catch (e) {
      if (e.message === 'Usuário não encontrado') {
        return res.status(404).json({ error: e.message })
      }
      res.status(500).json({ error: 'Failed to load session history' })
    }
  }
}
