import { Router } from 'express'
import { AssetController } from '../controllers/AssetController.js'
import { basicAuthMiddleware } from '../utils/auth.js'

export const assetsRouter = Router()
const controller = new AssetController()

// Lista ativos
assetsRouter.get('/', basicAuthMiddleware, controller.list)

// Cria ativo
assetsRouter.post('/', basicAuthMiddleware, controller.create)

// Detalhe de ativo
assetsRouter.get('/:id', basicAuthMiddleware, controller.get)

// Atualiza ativo
assetsRouter.put('/:id', basicAuthMiddleware, controller.update)

// Remove ativo
assetsRouter.delete('/:id', basicAuthMiddleware, controller.remove)
