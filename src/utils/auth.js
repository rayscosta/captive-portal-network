// Comentário: helpers simples de autenticação e autorização
import { AuthService } from '../services/AuthService.js'

const authService = new AuthService()

export const basicAuthMiddleware = (req, res, next) => {
  // Comentário: autenticação básica para rotas de administração (legacy)
  const auth = req.headers.authorization || ''
  const [type, credentials] = auth.split(' ')
  if (type !== 'Basic' || !credentials) return res.status(401).set('WWW-Authenticate', 'Basic').end()
  const [user, pass] = Buffer.from(credentials, 'base64').toString().split(':')
  if (user === process.env.ADMIN_BASIC_USER && pass === process.env.ADMIN_BASIC_PASS) return next()
  return res.status(403).json({ error: 'Forbidden' })
}

// Comentário: middleware JWT para proteger rotas admin (RF1.4)
export const jwtAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' })
    }

    const token = authHeader.substring(7)
    const payload = authService.validateSessionToken(token)

    if (!payload) {
      return res.status(401).json({ error: 'Token inválido ou expirado' })
    }

    const user = await authService.getUserById(payload.userId)
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' })
    }

    // Adiciona usuário ao request para uso nos controllers
    req.user = user
    next()
  } catch (e) {
    res.status(500).json({ error: 'Erro na autenticação' })
  }
}

// Comentário: middleware para permitir acesso à interface admin sem autenticação
export const adminPageMiddleware = (req, res, next) => {
  // Se for uma requisição para a pasta admin, permitir acesso direto
  if (req.path.startsWith('/admin')) return next()
  return basicAuthMiddleware(req, res, next)
}
