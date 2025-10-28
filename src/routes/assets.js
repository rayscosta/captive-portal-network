import { Router } from 'express'
import { AssetController } from '../controllers/AssetController.js'

export const assetsRouter = Router()
const controller = new AssetController()

/**
 * @swagger
 * /api/assets:
 *   get:
 *     summary: Lista todos os ativos de TI
 *     tags: [Assets]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de ativos retornada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Asset'
 *       401:
 *         description: Não autorizado
 */
assetsRouter.get('/', basicAuthMiddleware, controller.list)

/**
 * @swagger
 * /api/assets:
 *   post:
 *     summary: Cria um novo ativo de TI
 *     tags: [Assets]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - ip
 *               - mac
 *               - agentToken
 *             properties:
 *               name:
 *                 type: string
 *                 example: Gateway Server
 *               type:
 *                 type: string
 *                 enum: [router, switch, server, workstation]
 *                 example: server
 *               ip:
 *                 type: string
 *                 example: 192.168.1.1
 *               mac:
 *                 type: string
 *                 example: AA:BB:CC:DD:EE:FF
 *               agentToken:
 *                 type: string
 *                 example: abc123def456
 *     responses:
 *       201:
 *         description: Ativo criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Asset'
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado
 */
assetsRouter.post('/', basicAuthMiddleware, controller.create)

/**
 * @swagger
 * /api/assets/{id}:
 *   get:
 *     summary: Retorna detalhes de um ativo específico
 *     tags: [Assets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do ativo
 *     responses:
 *       200:
 *         description: Detalhes do ativo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Asset'
 *       404:
 *         description: Ativo não encontrado
 *       401:
 *         description: Não autorizado
 */
assetsRouter.get('/:id', basicAuthMiddleware, controller.get)

/**
 * @swagger
 * /api/assets/{id}:
 *   put:
 *     summary: Atualiza um ativo existente
 *     tags: [Assets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do ativo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [router, switch, server, workstation]
 *               ip:
 *                 type: string
 *               mac:
 *                 type: string
 *               agentToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Ativo atualizado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Asset'
 *       404:
 *         description: Ativo não encontrado
 *       401:
 *         description: Não autorizado
 */
assetsRouter.put('/:id', basicAuthMiddleware, controller.update)

/**
 * @swagger
 * /api/assets/{id}:
 *   delete:
 *     summary: Remove um ativo
 *     tags: [Assets]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do ativo
 *     responses:
 *       204:
 *         description: Ativo removido com sucesso
 *       404:
 *         description: Ativo não encontrado
 *       401:
 *         description: Não autorizado
 */
assetsRouter.delete('/:id', basicAuthMiddleware, controller.remove)
