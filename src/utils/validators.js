import crypto from 'node:crypto'

// Comentário: validação de endereço IPv4
export const isValidIPv4 = (ip) => {
  const ipv4Regex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)(\.(?!$)|$)){4}$/
  return ipv4Regex.test(ip)
}

// Comentário: validação de endereço IPv6
export const isValidIPv6 = (ip) => {
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/
  return ipv6Regex.test(ip)
}

// Comentário: validação de endereço IP (IPv4 ou IPv6)
export const isValidIP = (ip) => {
  if (!ip || typeof ip !== 'string') return false
  return isValidIPv4(ip) || isValidIPv6(ip)
}

// Comentário: validação de endereço MAC (formato XX:XX:XX:XX:XX:XX ou XX-XX-XX-XX-XX-XX)
export const isValidMAC = (mac) => {
  if (!mac || typeof mac !== 'string') return false
  const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/
  return macRegex.test(mac)
}

// Comentário: normaliza endereço MAC para formato padrão (XX:XX:XX:XX:XX:XX em uppercase)
export const normalizeMAC = (mac) => {
  if (!isValidMAC(mac)) return null
  return mac.replace(/-/g, ':').toUpperCase()
}

// Comentário: gera token criptograficamente seguro
export const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex')
}

// Comentário: valida se string é um token hexadecimal válido
export const isValidToken = (token) => {
  if (!token || typeof token !== 'string') return false
  const tokenRegex = /^[0-9a-fA-F]+$/
  return tokenRegex.test(token) && token.length >= 32
}

// Comentário: validação de email básica
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Comentário: validação de tipo de ativo permitido
export const isValidAssetType = (type) => {
  const validTypes = ['router', 'switch', 'server', 'workstation', 'linux', 'windows']
  return validTypes.includes(type)
}

// Comentário: validação de comando permitido
export const isValidCommand = (command) => {
  const validCommands = ['UNAME', 'DF', 'UPTIME', 'LSROOT']
  return validCommands.includes(command)
}

// Comentário: sanitiza string removendo caracteres especiais perigosos
export const sanitizeString = (str) => {
  if (!str || typeof str !== 'string') return ''
  // Remove caracteres que podem ser usados para injeção de comandos
  return str.replace(/[;&|`$()<>]/g, '')
}

// Comentário: valida TTL de sessão (em minutos, entre 1 e 1440 - 24h)
export const isValidSessionTTL = (ttl) => {
  const numTTL = parseInt(ttl, 10)
  return !isNaN(numTTL) && numTTL >= 1 && numTTL <= 1440
}
