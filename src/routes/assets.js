import { Router } from 'express'
import { AssetController } from '../controllers/AssetController.js'
import { jwtAuthMiddleware } from '../utils/auth.js'

export const assetsRouter = Router()
const controller = new AssetController()

/**
 * @swagger
 * /api/assets:
 *   get:
 *     summary: Lista todos os ativos
 *     tags: [Assets]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de ativos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Asset'
 *       401:
 *         description: Não autenticado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
assetsRouter.get('/', jwtAuthMiddleware, controller.list)

/**
 * @swagger
 * /api/assets:
 *   post:
 *     summary: Cria um novo ativo
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
 *               - agentToken
 *             properties:
 *               name:
 *                 type: string
 *                 example: Server-01
 *               type:
 *                 type: string
 *                 enum: [linux, windows, router, switch]
 *                 example: linux
 *               ip:
 *                 type: string
 *                 example: 192.168.1.100
 *               mac:
 *                 type: string
 *                 example: 00:11:22:33:44:55
 *               agentToken:
 *                 type: string
 *                 example: a1b2c3d4e5f6g7h8i9j0
 *     responses:
 *       201:
 *         description: Ativo criado com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Asset'
 *       400:
 *         description: Dados inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
assetsRouter.post('/', jwtAuthMiddleware, controller.create)

/**
 * @swagger
 * /api/assets/{id}:
 *   get:
 *     summary: Retorna detalhes de um ativo
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
assetsRouter.get('/:id', jwtAuthMiddleware, controller.get)

/**
 * @swagger
 * /api/assets/{id}:
 *   put:
 *     summary: Atualiza um ativo
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
 *                 enum: [linux, windows, router, switch]
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
assetsRouter.put('/:id', jwtAuthMiddleware, controller.update)

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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
assetsRouter.delete('/:id', jwtAuthMiddleware, controller.remove)
