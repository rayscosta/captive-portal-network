import { Router } from 'express'
import { execFile } from 'node:child_process'
import crypto from 'node:crypto'
import { promisify } from 'node:util'
import { getDb } from '../db/connection.js'

const execFileAsync = promisify(execFile)
export const captiveRouter = Router()

// Inicia OAuth - cria state vinculado a IP/MAC
captiveRouter.get('/login/:provider', async (req, res) => {
  try {
    const { provider } = req.params
    const { ip = req.ip, mac } = req.query
    const state = crypto.randomBytes(16).toString('hex')
    const db = await getDb()
    await db.run('INSERT INTO state_challenges (state, ip, mac) VALUES (?, ?, ?)', [state, ip, mac || null])
    await db.close()
    // Comentário: nesta POC, apenas simulamos o redirect URL
    const redirectUrl = `${process.env.OAUTH_REDIRECT_URL}?provider=${provider}&state=${state}`
    res.json({ redirect: redirectUrl })
  } catch (e) {
    res.status(500).json({ error: 'Failed to start auth' })
  }
})

// Callback OAuth - valida state, cria sessão e libera acesso via script shell
captiveRouter.get('/callback', async (req, res) => {
  try {
    const { provider = 'google', state, code, ip, mac } = req.query
    if (!state) return res.status(400).json({ error: 'Missing state' })
    
    // Comentário: captura user-agent para rastreamento (RF1.5)
    const userAgent = req.headers['user-agent'] || 'unknown'
    
    const db = await getDb()
    const sc = await db.get('SELECT * FROM state_challenges WHERE state = ?', [state])
    if (!sc) {
      await db.close()
      return res.status(400).json({ error: 'Invalid state' })
    }
    // Verificação de ip/mac
    if ((sc.ip && ip && sc.ip !== ip) || (sc.mac && mac && sc.mac !== mac)) {
      await db.close()
      return res.status(400).json({ error: 'State mismatch' })
    }
    // Comentário: aqui normalmente trocaríamos o code por tokens no provider
    const userName = 'Guest User'
    const providerId = code || 'mock-code'
    const userResult = await db.run(
      'INSERT INTO users (provider, provider_id, name) VALUES (?, ?, ?)',
      [provider, providerId, userName]
    )
    const userId = userResult.lastID
    const ttlMinutes = Number(process.env.SESSION_TTL_MINUTES || 60)
    
    // Comentário: armazena user_agent na sessão conforme RF1.5
    await db.run(
      'INSERT INTO captive_sessions (user_id, ip, mac, user_agent, expires_at) VALUES (?, ?, ?, ?, datetime("now", ?))',
      [userId, ip || sc.ip, mac || sc.mac, userAgent, `+${ttlMinutes} minutes`]
    )

    // Executa script shell para liberar acesso
    const scriptPath = 'scripts/allow_internet.sh'
    try {
      await execFileAsync(scriptPath, [ip || sc.ip || '', mac || sc.mac || ''])
    } catch (scriptErr) {
      // Log mas não falhar o fluxo de usuário
      console.error('Script error:', scriptErr?.stderr || scriptErr?.message)
    }

    await db.run('DELETE FROM state_challenges WHERE state = ?', [state])
    await db.close()
    const redirectTo = process.env.CAPTIVE_REDIRECT_SUCCESS || 'https://www.instagram.com'
    res.redirect(302, redirectTo)
  } catch (e) {
    res.status(500).json({ error: 'Auth callback failed' })
  }
})
