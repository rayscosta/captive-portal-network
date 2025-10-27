import { Router } from 'express'
import { CommandController } from '../controllers/CommandController.js'
import { jwtAuthMiddleware } from '../utils/auth.js'

export const commandsRouter = Router()
const controller = new CommandController()

/**
 * @swagger
 * /api/commands:
 *   post:
 *     summary: Enfileira um comando para execução em um ativo
 *     tags: [Commands]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assetId
 *               - code
 *             properties:
 *               assetId:
 *                 type: integer
 *                 example: 1
 *               code:
 *                 type: string
 *                 enum: [UNAME, DF, UPTIME, LSROOT]
 *                 example: UNAME
 *     responses:
 *       201:
 *         description: Comando enfileirado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Command'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
commandsRouter.post('/', jwtAuthMiddleware, controller.enqueue)

/**
 * @swagger
 * /api/commands/asset/{assetId}:
 *   get:
 *     summary: Lista todos os comandos de um ativo
 *     tags: [Commands]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: assetId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do ativo
 *     responses:
 *       200:
 *         description: Lista de comandos do ativo
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Command'
 *       404:
 *         description: Ativo não encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
commandsRouter.get('/asset/:assetId', jwtAuthMiddleware, controller.listByAsset)
