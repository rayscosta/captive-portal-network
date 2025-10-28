import { Router } from 'express'
import { AgentController } from '../controllers/AgentController.js'

export const agentRouter = Router()
const controller = new AgentController()

/**
 * @swagger
 * /api/agent/heartbeat:
 *   post:
 *     summary: Envia heartbeat do agente e recebe comandos pendentes
 *     tags: [Agent]
 *     security:
 *       - AgentToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - agentToken
 *             properties:
 *               agentToken:
 *                 type: string
 *                 description: Token único do agente
 *                 example: a1b2c3d4e5f6g7h8i9j0
 *     responses:
 *       200:
 *         description: Heartbeat recebido, retorna comandos pendentes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 commands:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Command'
 *       404:
 *         description: Token de agente inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
agentRouter.post('/heartbeat', controller.heartbeat)

/**
 * @swagger
 * /api/agent/result:
 *   post:
 *     summary: Envia resultado da execução de um comando
 *     tags: [Agent]
 *     security:
 *       - AgentToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - agentToken
 *               - commandId
 *               - output
 *             properties:
 *               agentToken:
 *                 type: string
 *                 description: Token único do agente
 *                 example: a1b2c3d4e5f6g7h8i9j0
 *               commandId:
 *                 type: integer
 *                 description: ID do comando executado
 *                 example: 1
 *               output:
 *                 type: string
 *                 description: Resultado da execução do comando
 *                 example: Linux server-01 5.15.0-91-generic
 *     responses:
 *       200:
 *         description: Resultado recebido com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Resultado recebido
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
agentRouter.post('/result', controller.submitResult)
