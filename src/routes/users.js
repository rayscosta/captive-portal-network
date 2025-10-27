import { Router } from 'express'
import { UserController } from '../controllers/UserController.js'
import { basicAuthMiddleware } from '../utils/auth.js'

export const usersRouter = Router()
const controller = new UserController()

// Lista usuários
usersRouter.get('/', basicAuthMiddleware, controller.list)

// Cria usuário
usersRouter.post('/', basicAuthMiddleware, controller.create)

// Detalhe de usuário
usersRouter.get('/:id', basicAuthMiddleware, controller.get)

// Atualiza usuário
usersRouter.put('/:id', basicAuthMiddleware, controller.update)

// Remove usuário
usersRouter.delete('/:id', basicAuthMiddleware, controller.remove)

// Métricas de acesso do usuário
usersRouter.get('/:id/metrics', basicAuthMiddleware, controller.getMetrics)

// Histórico de sessões do usuário
usersRouter.get('/:id/sessions', basicAuthMiddleware, controller.getSessionHistory)
