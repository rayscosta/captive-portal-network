import { Router } from 'express'
import { AuthController } from '../controllers/AuthController.js'
import { jwtAuthMiddleware } from '../utils/auth.js'

export const authRouter = Router()
const controller = new AuthController()

// Login de admin
authRouter.post('/login', controller.login)

// Registro de novo admin (protegido por secret)
authRouter.post('/register', controller.register)

// Verifica autenticação atual
authRouter.get('/me', controller.me)

// Logout
authRouter.post('/logout', jwtAuthMiddleware, controller.logout)
