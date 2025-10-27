import { Router } from 'express'
import { UserController } from '../controllers/UserController.js'
import { jwtAuthMiddleware } from '../utils/auth.js'

export const usersRouter = Router()
const controller = new UserController()

// Lista usuários
usersRouter.get('/', jwtAuthMiddleware, controller.list)

// Cria usuário
usersRouter.post('/', jwtAuthMiddleware, controller.create)

// Detalhe de usuário
usersRouter.get('/:id', jwtAuthMiddleware, controller.get)

// Atualiza usuário
usersRouter.put('/:id', jwtAuthMiddleware, controller.update)

// Remove usuário
usersRouter.delete('/:id', jwtAuthMiddleware, controller.remove)

// Métricas de acesso do usuário
usersRouter.get('/:id/metrics', jwtAuthMiddleware, controller.getMetrics)

// Histórico de sessões do usuário
usersRouter.get('/:id/sessions', jwtAuthMiddleware, controller.getSessionHistory)
