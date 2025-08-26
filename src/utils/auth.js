// Comentário: helpers simples de autenticação e autorização

export const basicAuthMiddleware = (req, res, next) => {
  // Comentário: autenticação básica para rotas de administração
  const auth = req.headers.authorization || ''
  const [type, credentials] = auth.split(' ')
  if (type !== 'Basic' || !credentials) return res.status(401).set('WWW-Authenticate', 'Basic').end()
  const [user, pass] = Buffer.from(credentials, 'base64').toString().split(':')
  if (user === process.env.ADMIN_BASIC_USER && pass === process.env.ADMIN_BASIC_PASS) return next()
  return res.status(403).json({ error: 'Forbidden' })
}

// Comentário: middleware para permitir acesso à interface admin sem autenticação
export const adminPageMiddleware = (req, res, next) => {
  // Se for uma requisição para a pasta admin, permitir acesso direto
  if (req.path.startsWith('/admin')) return next()
  return basicAuthMiddleware(req, res, next)
}
