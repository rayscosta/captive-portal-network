import { AssetService } from '../services/AssetService.js'

export class AssetController {
  service = new AssetService()

  list = async (_req, res) => {
    try {
      const data = await this.service.list()
      res.json(data)
    } catch (e) {
      res.status(500).json({ error: 'Failed to list assets' })
    }
  }

  create = async (req, res) => {
    try {
      const { name, type, ip, mac, agentToken } = req.body
      const created = await this.service.create({ name, type, ip, mac, agentToken })
      res.status(201).json(created)
    } catch (e) {
      res.status(500).json({ error: 'Failed to create asset' })
    }
  }

  get = async (req, res) => {
    try {
      const data = await this.service.getWithHistory(req.params.id)
      if (!data) return res.status(404).json({ error: 'Asset not found' })
      res.json(data)
    } catch (e) {
      res.status(500).json({ error: 'Failed to load asset' })
    }
  }

  update = async (req, res) => {
    try {
      const { name, type, ip, mac, agentToken } = req.body
      const updated = await this.service.update(req.params.id, { name, type, ip, mac, agentToken })
      res.json(updated)
    } catch (e) {
      res.status(500).json({ error: 'Failed to update asset' })
    }
  }

  remove = async (req, res) => {
    try {
      await this.service.remove(req.params.id)
      res.status(204).end()
    } catch (e) {
      res.status(500).json({ error: 'Failed to delete asset' })
    }
  }
}
