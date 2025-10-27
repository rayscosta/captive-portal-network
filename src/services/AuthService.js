import crypto from 'node:crypto'
import { getDb } from '../db/connection.js'
import { isValidEmail, sanitizeString } from '../utils/validators.js'

export class AuthService {
  // Comentário: hash de senha usando crypto nativo do Node.js
  hashPassword = (password) => {
    return crypto.createHash('sha256').update(password).digest('hex')
  }

  // Comentário: verifica se senha corresponde ao hash
  verifyPassword = (password, hash) => {
    const inputHash = this.hashPassword(password)
    return inputHash === hash
  }

  // Comentário: cria usuário admin local (RF1.4)
  createAdminUser = async ({ email, password, name }) => {
    if (!email || !isValidEmail(email)) {
      throw new Error('Email inválido')
    }

    if (!password || password.length < 6) {
      throw new Error('Senha deve ter no mínimo 6 caracteres')
    }

    const db = await getDb()

    // Verifica se email já existe
    const existing = await db.get('SELECT * FROM users WHERE email = ?', [email])
    if (existing) {
      await db.close()
      throw new Error('Email já cadastrado')
    }

    const passwordHash = this.hashPassword(password)
    const sanitizedName = sanitizeString(name || email.split('@')[0])

    const result = await db.run(
      'INSERT INTO users (provider, provider_id, name, email, password, role) VALUES (?, ?, ?, ?, ?, ?)',
      ['local', email, sanitizedName, email, passwordHash, 'admin']
    )

    const user = await db.get('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [result.lastID])
    await db.close()

    return user
  }

  // Comentário: autentica usuário admin por email e senha
  authenticateAdmin = async (email, password) => {
    if (!email || !password) {
      throw new Error('Email e senha são obrigatórios')
    }

    const db = await getDb()
    const user = await db.get('SELECT * FROM users WHERE email = ? AND role = ?', [email, 'admin'])
    await db.close()

    if (!user || !user.password) {
      throw new Error('Credenciais inválidas')
    }

    if (!this.verifyPassword(password, user.password)) {
      throw new Error('Credenciais inválidas')
    }

    // Retorna usuário sem a senha
    const { password: _, ...userWithoutPassword } = user
    return userWithoutPassword
  }

  // Comentário: gera token de sessão JWT-like (simplificado para POC)
  generateSessionToken = (userId) => {
    const payload = {
      userId,
      iat: Date.now(),
      exp: Date.now() + 8 * 60 * 60 * 1000, // 8 horas
    }
    return Buffer.from(JSON.stringify(payload)).toString('base64')
  }

  // Comentário: valida token de sessão
  validateSessionToken = (token) => {
    try {
      const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))
      
      if (!payload.userId || !payload.exp) {
        return null
      }

      if (Date.now() > payload.exp) {
        return null // Token expirado
      }

      return payload
    } catch {
      return null
    }
  }

  // Comentário: busca usuário por ID
  getUserById = async (userId) => {
    const db = await getDb()
    const user = await db.get('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [userId])
    await db.close()
    return user
  }
}
