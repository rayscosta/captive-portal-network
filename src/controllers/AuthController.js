import { AuthService } from '../services/AuthService.js'
import { AuditService } from '../services/AuditService.js'

export class AuthController {
  authService = new AuthService()
  auditService = new AuditService()

  // Comentário: login de usuário admin
  login = async (req, res) => {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        return res.status(400).json({ error: 'Email e senha são obrigatórios' })
      }

      const user = await this.authService.authenticateAdmin(email, password)
      const token = this.authService.generateSessionToken(user.id)

      // Log de auditoria
      await this.auditService.log({
        actor: email,
        action: 'admin_login',
        details: JSON.stringify({ userId: user.id, ip: req.ip }),
      })

      res.json({
        user,
        token,
      })
    } catch (e) {
      if (e.message === 'Credenciais inválidas') {
        return res.status(401).json({ error: e.message })
      }
      res.status(500).json({ error: 'Erro ao fazer login' })
    }
  }

  // Comentário: registra novo usuário admin (apenas para primeiro acesso)
  register = async (req, res) => {
    try {
      const { email, password, name, secret } = req.body

      // Verifica secret para criação de admin (segurança adicional)
      const adminSecret = process.env.ADMIN_REGISTRATION_SECRET
      if (!adminSecret || secret !== adminSecret) {
        return res.status(403).json({ error: 'Secret de registro inválido' })
      }

      const user = await this.authService.createAdminUser({ email, password, name })

      // Log de auditoria
      await this.auditService.log({
        actor: 'system',
        action: 'admin_registered',
        details: JSON.stringify({ email, userId: user.id }),
      })

      res.status(201).json(user)
    } catch (e) {
      if (e.message.includes('Email') || e.message.includes('Senha')) {
        return res.status(400).json({ error: e.message })
      }
      res.status(500).json({ error: 'Erro ao criar usuário admin' })
    }
  }

  // Comentário: verifica se usuário está autenticado
  me = async (req, res) => {
    try {
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token não fornecido' })
      }

      const token = authHeader.substring(7)
      const payload = this.authService.validateSessionToken(token)

      if (!payload) {
        return res.status(401).json({ error: 'Token inválido ou expirado' })
      }

      const user = await this.authService.getUserById(payload.userId)
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado' })
      }

      res.json(user)
    } catch (e) {
      res.status(500).json({ error: 'Erro ao verificar autenticação' })
    }
  }

  // Comentário: logout (invalida token no cliente)
  logout = async (req, res) => {
    try {
      const user = req.user // Definido pelo middleware
      if (user) {
        await this.auditService.log({
          actor: user.email,
          action: 'admin_logout',
          details: JSON.stringify({ userId: user.id }),
        })
      }
      res.json({ message: 'Logout realizado com sucesso' })
    } catch (e) {
      res.status(500).json({ error: 'Erro ao fazer logout' })
    }
  }
}
