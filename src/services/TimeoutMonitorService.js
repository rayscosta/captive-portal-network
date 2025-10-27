import { CommandService } from './CommandService.js'

export class TimeoutMonitorService {
  commandService = new CommandService()
  intervalId = null
  intervalMs = 10000 // 10 segundos

  // Comentário: inicia monitoramento de timeouts de comandos
  start = () => {
    if (this.intervalId) {
      console.warn('TimeoutMonitorService já está rodando')
      return
    }

    console.log(`⏱️  TimeoutMonitor iniciado (verifica a cada ${this.intervalMs/1000}s)`)
    
    this.intervalId = setInterval(async () => {
      try {
        const count = await this.commandService.checkTimeouts()
        if (count > 0) {
          console.log(`⚠️  ${count} comando(s) marcado(s) como FAILED por timeout`)
        }
      } catch (error) {
        console.error('Erro ao verificar timeouts:', error.message)
      }
    }, this.intervalMs)
  }

  // Comentário: para o monitoramento
  stop = () => {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      console.log('⏱️  TimeoutMonitor parado')
    }
  }

  // Comentário: configura intervalo de verificação
  setInterval = (ms) => {
    if (ms < 5000) {
      throw new Error('Intervalo mínimo é 5 segundos')
    }
    this.intervalMs = ms
  }
}
