import { AuditRepository } from '../repositories/AuditRepository.js'

export class AuditService {
  repo = new AuditRepository()

  // Comentário: ações de auditoria padronizadas conforme RF1.5
  ACTIONS = {
    // Asset management
    ASSET_CREATED: 'asset.created',
    ASSET_UPDATED: 'asset.updated',
    ASSET_DELETED: 'asset.deleted',
    ASSET_HEARTBEAT: 'asset.heartbeat',

    // Command execution
    COMMAND_CREATED: 'command.created',
    COMMAND_EXECUTED: 'command.executed',
    COMMAND_COMPLETED: 'command.completed',
    COMMAND_FAILED: 'command.failed',

    // User management
    USER_CREATED: 'user.created',
    USER_UPDATED: 'user.updated',
    USER_DELETED: 'user.deleted',
    USER_LOGIN: 'user.login',
    USER_LOGOUT: 'user.logout',

    // Captive portal
    CAPTIVE_ACCESS_GRANTED: 'captive.access_granted',
    CAPTIVE_ACCESS_DENIED: 'captive.access_denied',
    CAPTIVE_SESSION_CREATED: 'captive.session_created',
    CAPTIVE_SESSION_EXPIRED: 'captive.session_expired',

    // Security
    AUTH_FAILED: 'auth.failed',
    AUTH_SUCCESS: 'auth.success',
    INVALID_REQUEST: 'security.invalid_request',
  }

  // Comentário: registrar log de auditoria com timestamp automático
  log = async (actor, action, details = {}) => {
    const detailsString = typeof details === 'string' ? details : JSON.stringify(details)
    return this.repo.create({ actor, action, details: detailsString })
  }

  // Comentário: métodos específicos para cada tipo de ação
  logAssetCreated = async (actor, assetData) => {
    return this.log(actor, this.ACTIONS.ASSET_CREATED, {
      assetId: assetData.id,
      assetName: assetData.name,
      assetType: assetData.type,
    })
  }

  logAssetUpdated = async (actor, assetId, changes) => {
    return this.log(actor, this.ACTIONS.ASSET_UPDATED, {
      assetId,
      changes,
    })
  }

  logAssetDeleted = async (actor, assetId) => {
    return this.log(actor, this.ACTIONS.ASSET_DELETED, { assetId })
  }

  logAssetHeartbeat = async (agentToken, ip, mac) => {
    return this.log(`agent:${agentToken}`, this.ACTIONS.ASSET_HEARTBEAT, { ip, mac })
  }

  logCommandCreated = async (actor, commandData) => {
    return this.log(actor, this.ACTIONS.COMMAND_CREATED, {
      commandId: commandData.id,
      assetId: commandData.asset_id,
      command: commandData.code,
    })
  }

  logCommandExecuted = async (agentToken, commandId) => {
    return this.log(`agent:${agentToken}`, this.ACTIONS.COMMAND_EXECUTED, { commandId })
  }

  logCommandCompleted = async (agentToken, commandId, success) => {
    const action = success ? this.ACTIONS.COMMAND_COMPLETED : this.ACTIONS.COMMAND_FAILED
    return this.log(`agent:${agentToken}`, action, { commandId })
  }

  logUserLogin = async (userId, provider, ip, mac, userAgent) => {
    return this.log(`user:${userId}`, this.ACTIONS.USER_LOGIN, {
      provider,
      ip,
      mac,
      userAgent,
    })
  }

  logUserLogout = async (userId) => {
    return this.log(`user:${userId}`, this.ACTIONS.USER_LOGOUT, {})
  }

  logCaptiveAccessGranted = async (userId, ip, mac, userAgent) => {
    return this.log(`user:${userId}`, this.ACTIONS.CAPTIVE_ACCESS_GRANTED, {
      ip,
      mac,
      userAgent,
    })
  }

  logCaptiveSessionCreated = async (userId, sessionId, expiresAt) => {
    return this.log(`user:${userId}`, this.ACTIONS.CAPTIVE_SESSION_CREATED, {
      sessionId,
      expiresAt,
    })
  }

  logAuthFailed = async (username, ip, reason) => {
    return this.log(`failed:${username}`, this.ACTIONS.AUTH_FAILED, {
      ip,
      reason,
    })
  }

  logInvalidRequest = async (ip, path, reason) => {
    return this.log(`system`, this.ACTIONS.INVALID_REQUEST, {
      ip,
      path,
      reason,
    })
  }

  // Comentário: consultas de auditoria
  list = async (limit = 100, offset = 0) => {
    return this.repo.list(limit, offset)
  }

  getByActor = async (actor, limit = 50) => {
    return this.repo.getByActor(actor, limit)
  }

  getByAction = async (action, limit = 50) => {
    return this.repo.getByAction(action, limit)
  }

  getByDateRange = async (startDate, endDate, limit = 100) => {
    return this.repo.getByDateRange(startDate, endDate, limit)
  }

  count = async () => {
    return this.repo.count()
  }

  // Comentário: limpeza de logs antigos (manutenção)
  cleanup = async (daysToKeep = 90) => {
    return this.repo.deleteOlderThan(daysToKeep)
  }
}
