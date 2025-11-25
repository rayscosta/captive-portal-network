import { Router } from 'express'
import { execFile } from 'node:child_process'
import crypto from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { getDb } from '../db/connection.js'

const execFileAsync = promisify(execFile)
export const captiveRouter = Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Comentário: configurações OAuth
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

const FACEBOOK_AUTH_URL = 'https://www.facebook.com/v18.0/dialog/oauth'
const FACEBOOK_TOKEN_URL = 'https://graph.facebook.com/v18.0/oauth/access_token'
const FACEBOOK_USERINFO_URL = 'https://graph.facebook.com/me'

// Comentário: serve página principal do captive portal
captiveRouter.get('/', (req, res) => {
  const publicPath = path.join(__dirname, '../../public/index.html')
  res.sendFile(publicPath)
})

// Inicia OAuth Google - redireciona para página de autenticação do Google
captiveRouter.get('/login/google', async (req, res) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown'
    const mac = req.query.mac || null
    const state = crypto.randomBytes(16).toString('hex')
    
    // Comentário: armazena state vinculado ao IP/MAC para validação posterior
    const db = getDb()
    db.prepare('INSERT INTO state_challenges (state, ip, mac) VALUES (?, ?, ?)').run(state, ip, mac)
    
    // Comentário: monta URL de autenticação do Google
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL,
      response_type: 'code',
      scope: 'openid email profile',
      state: state
    })
    
    const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`
    res.redirect(authUrl)
  } catch (e) {
    console.error('Google login error:', e)
    res.status(500).send('Failed to start authentication')
  }
})

// Inicia OAuth Facebook - redireciona para página de autenticação do Facebook
captiveRouter.get('/login/facebook', async (req, res) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown'
    const mac = req.query.mac || null
    const state = crypto.randomBytes(16).toString('hex')
    
    // Comentário: armazena state vinculado ao IP/MAC para validação posterior
    const db = getDb()
    db.prepare('INSERT INTO state_challenges (state, ip, mac) VALUES (?, ?, ?)').run(state, ip, mac)
    
    // Comentário: monta URL de autenticação do Facebook
    const params = new URLSearchParams({
      client_id: process.env.FACEBOOK_APP_ID,
      redirect_uri: process.env.FACEBOOK_CALLBACK_URL,
      response_type: 'code',
      scope: 'email,public_profile',
      state: state
    })
    
    const authUrl = `${FACEBOOK_AUTH_URL}?${params.toString()}`
    res.redirect(authUrl)
  } catch (e) {
    console.error('Facebook login error:', e)
    res.status(500).send('Failed to start authentication')
  }
})

// Callback OAuth Google - processa autenticação e libera acesso
captiveRouter.get('/callback/google', async (req, res) => {
  try {
    const { code, state, error } = req.query
    
    // Comentário: verifica se houve erro do Google
    if (error) {
      console.error('Google OAuth error:', error)
      return res.status(400).send(`Erro na autenticação: ${error}`)
    }
    
    if (!code || !state) {
      console.error('Missing code or state:', { code: !!code, state: !!state })
      return res.status(400).send('Missing authorization code or state')
    }
    
    console.log('📥 Google callback received:', { 
      state: state.substring(0, 8) + '...', 
      hasCode: !!code 
    })
    
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown'
    const userAgent = req.headers['user-agent'] || 'unknown'
    
    // Comentário: valida state para prevenir CSRF
    const db = getDb()
    const stateChallenge = db.prepare('SELECT * FROM state_challenges WHERE state = ?').get(state)
    
    if (!stateChallenge) {
      console.error('Invalid state parameter:', state.substring(0, 8) + '...')
      return res.status(400).send('Invalid state parameter')
    }
    
    console.log('✅ State validated:', { ip: stateChallenge.ip, mac: stateChallenge.mac })
    
    // Comentário: troca authorization code por access token
    console.log('🔄 Exchanging code for token...')
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code'
      })
    })
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      throw new Error(`Failed to exchange code for token: ${errorText}`)
    }
    
    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token
    console.log('✅ Access token obtained')
    
    // Comentário: busca informações do usuário usando o access token
    console.log('👤 Fetching user info...')
    const userInfoResponse = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    
    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text()
      console.error('User info fetch failed:', errorText)
      throw new Error(`Failed to fetch user info: ${errorText}`)
    }
    
    const userInfo = await userInfoResponse.json()
    console.log('✅ User info received:', { email: userInfo.email, name: userInfo.name })
    
    // Comentário: cria ou atualiza usuário no banco
    const existingUser = db.prepare(
      'SELECT * FROM users WHERE provider = ? AND provider_id = ?'
    ).get('google', userInfo.id)
    
    let userId
    if (existingUser) {
      userId = existingUser.id
      db.prepare(
        'UPDATE users SET name = ?, email = ? WHERE id = ?'
      ).run(userInfo.name, userInfo.email, userId)
      console.log('✅ User updated:', userId)
    } else {
      const result = db.prepare(
        'INSERT INTO users (provider, provider_id, name, email) VALUES (?, ?, ?, ?)'
      ).run('google', userInfo.id, userInfo.name, userInfo.email)
      userId = result.lastInsertRowid
      console.log('✅ New user created:', userId)
    }
    
    // Comentário: cria sessão captive
    const sessionTimeout = Number(process.env.SESSION_TIMEOUT || 3600)
    const startedAt = new Date().toISOString()
    const expiresAt = new Date(Date.now() + sessionTimeout * 1000).toISOString()
    
    db.prepare(
      'INSERT INTO captive_sessions (user_id, ip, mac, started_at, expires_at) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, ip, stateChallenge.mac, startedAt, expiresAt)
    console.log('✅ Captive session created:', { userId, ip, mac: stateChallenge.mac, startedAt, expiresAt })
    
    // Comentário: executa script para liberar acesso à internet
    const macAddress = stateChallenge.mac
    if (macAddress) {
      try {
        const scriptPath = process.env.SCRIPT_LIBERA_ACESSO || './scripts/allow_internet.sh'
        console.log('🔓 Executing access script:', scriptPath, macAddress)
        await execFileAsync(scriptPath, [macAddress])
        console.log(`✅ [ALLOW] Access granted for MAC: ${macAddress} (${userInfo.email})`)
      } catch (scriptErr) {
        console.error('❌ Script execution error:', scriptErr?.stderr || scriptErr?.message)
        // Continua mesmo se o script falhar (útil para desenvolvimento)
      }
    } else {
      console.warn('⚠️  No MAC address found, skipping access script')
    }
    
    // Comentário: remove state usado
    db.prepare('DELETE FROM state_challenges WHERE state = ?').run(state)
    console.log('🧹 State challenge cleaned up')
    
    // Comentário: redireciona para página de sucesso com informações do usuário
    const redirectUrl = process.env.INSTAGRAM_REDIRECT_URL || 'https://www.instagram.com'
    const successPageUrl = `/success.html?name=${encodeURIComponent(userInfo.name)}&email=${encodeURIComponent(userInfo.email)}&timeout=${sessionTimeout}&redirect=${encodeURIComponent(redirectUrl)}`
    
    console.log('🎉 Redirecting to success page')
    res.redirect(successPageUrl)
    
  } catch (e) {
    console.error('❌ Google callback error:', e)
    res.status(500).send(`Authentication failed: ${e.message}`)
  }
})

// Callback OAuth Facebook - processa autenticação e libera acesso
captiveRouter.get('/callback/facebook', async (req, res) => {
  try {
    const { code, state, error } = req.query
    
    // Comentário: verifica se houve erro do Facebook
    if (error) {
      console.error('Facebook OAuth error:', error)
      return res.status(400).send(`Erro na autenticação: ${error}`)
    }
    
    if (!code || !state) {
      console.error('Missing code or state:', { code: !!code, state: !!state })
      return res.status(400).send('Missing authorization code or state')
    }
    
    console.log('📥 Facebook callback received:', { 
      state: state.substring(0, 8) + '...', 
      hasCode: !!code 
    })
    
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown'
    const userAgent = req.headers['user-agent'] || 'unknown'
    
    // Comentário: valida state para prevenir CSRF
    const db = getDb()
    const stateChallenge = db.prepare('SELECT * FROM state_challenges WHERE state = ?').get(state)
    
    if (!stateChallenge) {
      console.error('Invalid state parameter:', state.substring(0, 8) + '...')
      return res.status(400).send('Invalid state parameter')
    }
    
    console.log('✅ State validated:', { ip: stateChallenge.ip, mac: stateChallenge.mac })
    
    // Comentário: troca authorization code por access token
    console.log('🔄 Exchanging code for token...')
    const tokenParams = new URLSearchParams({
      code,
      client_id: process.env.FACEBOOK_APP_ID,
      client_secret: process.env.FACEBOOK_APP_SECRET,
      redirect_uri: process.env.FACEBOOK_CALLBACK_URL
    })
    
    const tokenResponse = await fetch(`${FACEBOOK_TOKEN_URL}?${tokenParams.toString()}`)
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      throw new Error(`Failed to exchange code for token: ${errorText}`)
    }
    
    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token
    console.log('✅ Access token obtained')
    
    // Comentário: busca informações do usuário usando o access token
    console.log('👤 Fetching user info...')
    const userInfoParams = new URLSearchParams({
      fields: 'id,name,email',
      access_token: accessToken
    })
    
    const userInfoResponse = await fetch(`${FACEBOOK_USERINFO_URL}?${userInfoParams.toString()}`)
    
    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text()
      console.error('User info fetch failed:', errorText)
      throw new Error(`Failed to fetch user info: ${errorText}`)
    }
    
    const userInfo = await userInfoResponse.json()
    console.log('✅ User info received:', { name: userInfo.name, email: userInfo.email || 'N/A' })
    
    // Comentário: cria ou atualiza usuário no banco
    const existingUser = db.prepare(
      'SELECT * FROM users WHERE provider = ? AND provider_id = ?'
    ).get('facebook', userInfo.id)
    
    let userId
    if (existingUser) {
      userId = existingUser.id
      db.prepare(
        'UPDATE users SET name = ?, email = ? WHERE id = ?'
      ).run(userInfo.name, userInfo.email || null, userId)
      console.log('✅ User updated:', userId)
    } else {
      const result = db.prepare(
        'INSERT INTO users (provider, provider_id, name, email) VALUES (?, ?, ?, ?)'
      ).run('facebook', userInfo.id, userInfo.name, userInfo.email || null)
      userId = result.lastInsertRowid
      console.log('✅ New user created:', userId)
    }
    
    // Comentário: cria sessão captive
    const sessionTimeout = Number(process.env.SESSION_TIMEOUT || 3600)
    const expiresAt = new Date(Date.now() + sessionTimeout * 1000).toISOString()
    const startedAt = new Date().toISOString()
    
    db.prepare(
      'INSERT INTO captive_sessions (user_id, ip, mac, started_at, expires_at) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, ip, stateChallenge.mac, startedAt, expiresAt)
    console.log('✅ Captive session created:', { userId, ip, mac: stateChallenge.mac, startedAt, expiresAt })
    
    // Comentário: executa script para liberar acesso à internet
    const macAddress = stateChallenge.mac
    if (macAddress) {
      try {
        const scriptPath = process.env.SCRIPT_LIBERA_ACESSO || './scripts/allow_internet.sh'
        console.log('🔓 Executing access script:', scriptPath, macAddress)
        await execFileAsync(scriptPath, [macAddress])
        console.log(`✅ [ALLOW] Access granted for MAC: ${macAddress} (${userInfo.name})`)
      } catch (scriptErr) {
        console.error('❌ Script execution error:', scriptErr?.stderr || scriptErr?.message)
        // Continua mesmo se o script falhar (útil para desenvolvimento)
      }
    } else {
      console.warn('⚠️  No MAC address found, skipping access script')
    }
    
    // Comentário: remove state usado
    db.prepare('DELETE FROM state_challenges WHERE state = ?').run(state)
    console.log('🧹 State challenge cleaned up')
    
    // Comentário: redireciona para página de sucesso com informações do usuário
    const redirectUrl = process.env.INSTAGRAM_REDIRECT_URL || 'https://www.instagram.com'
    const successPageUrl = `/success.html?name=${encodeURIComponent(userInfo.name)}&email=${encodeURIComponent(userInfo.email || '')}&timeout=${sessionTimeout}&redirect=${encodeURIComponent(redirectUrl)}`
    
    console.log('🎉 Redirecting to success page')
    res.redirect(successPageUrl)
    
  } catch (e) {
    console.error('❌ Facebook callback error:', e)
    res.status(500).send(`Authentication failed: ${e.message}`)
  }
})
