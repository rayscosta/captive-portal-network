import { Router } from 'express'
import { AssetController } from '../controllers/AssetController.js'
import { jwtAuthMiddleware } from '../utils/auth.js'

export const assetsRouter = Router()
const controller = new AssetController()

// Lista ativos
assetsRouter.get('/', jwtAuthMiddleware, controller.list)

// Cria ativo
assetsRouter.post('/', jwtAuthMiddleware, controller.create)

// Detalhe de ativo
assetsRouter.get('/:id', jwtAuthMiddleware, controller.get)

// Atualiza ativo
assetsRouter.put('/:id', jwtAuthMiddleware, controller.update)

// Remove ativo
assetsRouter.delete('/:id', jwtAuthMiddleware, controller.remove)
