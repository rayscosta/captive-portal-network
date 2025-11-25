/**
 * Utilitário para gerenciar URLs de callback OAuth dinamicamente
 * Útil para desenvolvimento com túneis públicos (ngrok, localtunnel, cloudflare)
 */

/**
 * Obtém a URL base da requisição atual
 * @param {Request} req - Objeto request do Express
 * @returns {string} URL base completa (ex: https://abc123.ngrok.io)
 */
export const getBaseUrl = (req) => {
  // Comentário: verifica se há proxy reverso (X-Forwarded-* headers)
  const protocol = req.headers['x-forwarded-proto'] || req.protocol
  const host = req.headers['x-forwarded-host'] || req.get('host')
  return `${protocol}://${host}`
}

/**
 * Gera callback URL completa para OAuth baseada na requisição
 * @param {Request} req - Objeto request do Express
 * @param {string} provider - Nome do provider ('google' ou 'facebook')
 * @returns {string} URL de callback completa
 */
export const getCallbackUrl = (req, provider) => {
  // Comentário: se há variável de ambiente específica, usa ela (prioridade)
  const envKey = `${provider.toUpperCase()}_CALLBACK_URL`
  if (process.env[envKey]) {
    return process.env[envKey]
  }
  
  // Comentário: caso contrário, gera dinamicamente baseado na requisição
  const baseUrl = getBaseUrl(req)
  return `${baseUrl}/auth/callback/${provider}`
}

/**
 * Valida se a URL de callback está configurada corretamente
 * @param {string} url - URL a ser validada
 * @returns {boolean} true se válida
 */
export const isValidCallbackUrl = (url) => {
  if (!url) return false
  
  // Comentário: deve começar com https:// (exceto localhost em dev)
  if (!url.startsWith('https://') && !url.includes('localhost')) {
    console.warn(`⚠️  Callback URL should use HTTPS: ${url}`)
    return false
  }
  
  return true
}

/**
 * Exibe informações sobre a configuração OAuth no console
 */
export const logOAuthConfig = () => {
  console.log('\n📋 OAuth Configuration:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  
  // Google
  const googleConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)
  console.log(`\n🔵 Google OAuth: ${googleConfigured ? '✅ Configured' : '❌ Missing credentials'}`)
  if (googleConfigured) {
    console.log(`   Client ID: ${process.env.GOOGLE_CLIENT_ID?.substring(0, 20)}...`)
    console.log(`   Callback: ${process.env.GOOGLE_CALLBACK_URL || 'Dynamic (based on request)'}`)
  }
  
  // Facebook
  const facebookConfigured = !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET)
  console.log(`\n🔷 Facebook OAuth: ${facebookConfigured ? '✅ Configured' : '❌ Missing credentials'}`)
  if (facebookConfigured) {
    console.log(`   App ID: ${process.env.FACEBOOK_APP_ID}`)
    console.log(`   Callback: ${process.env.FACEBOOK_CALLBACK_URL || 'Dynamic (based on request)'}`)
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  
  // Avisos
  if (!googleConfigured && !facebookConfigured) {
    console.log('⚠️  No OAuth providers configured!')
    console.log('📖 See docs/oauth-setup.md for instructions\n')
  }
  
  if (!process.env.GOOGLE_CALLBACK_URL && googleConfigured) {
    console.log('💡 Google callback URL will be generated dynamically')
    console.log('   Make sure to register all possible URLs in Google Console\n')
  }
}
