import { Router } from 'express'
import { CommandController } from '../controllers/CommandController.js'
import { basicAuthMiddleware } from '../utils/auth.js'

export const commandsRouter = Router()
const controller = new CommandController()

// Enfileirar comando para um ativo
commandsRouter.post('/', basicAuthMiddleware, controller.enqueue)

// Listar comandos por ativo
commandsRouter.get('/asset/:assetId', basicAuthMiddleware, controller.listByAsset)
