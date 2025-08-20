import { Router } from 'express'
import { AgentController } from '../controllers/AgentController.js'

export const agentRouter = Router()
const controller = new AgentController()

// Heartbeat do agente
agentRouter.post('/heartbeat', controller.heartbeat)

// Resultado do comando
agentRouter.post('/result', controller.submitResult)
