import { CommandService } from '../services/CommandService.js'

export class CommandController {
  service = new CommandService()

  enqueue = async (req, res) => {
    try {
      const { assetId, code } = req.body
      const created = await this.service.enqueue({ assetId, code })
      res.status(201).json(created)
    } catch (e) {
      if (e.message === 'INVALID_COMMAND') return res.status(400).json({ error: 'Invalid command' })
      if (e.message === 'ASSET_NOT_FOUND') return res.status(404).json({ error: 'Asset not found' })
      res.status(500).json({ error: 'Failed to enqueue command' })
    }
  }

  listByAsset = async (req, res) => {
    try {
      const rows = await this.service.listByAsset(req.params.assetId)
      res.json(rows)
    } catch (e) {
      res.status(500).json({ error: 'Failed to list commands' })
    }
  }
}
