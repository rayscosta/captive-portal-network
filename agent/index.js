#!/usr/bin/env node
import 'dotenv/config'
import os from 'node:os'
import { spawn } from 'node:child_process'

const serverBaseUrl = process.env.SERVER_BASE_URL || 'http://localhost:3000'
const agentToken = process.env.AGENT_TOKEN || ''

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Comentário: mapeamento de comandos permitidos para comandos shell reais
const COMMAND_MAP = {
  'UNAME': 'uname -a',
  'DF': 'df -h',
  'UPTIME': 'uptime',
  'LSROOT': 'ls -la /'
}

const safeExec = async (code, timeoutSeconds = 30) => {
  // Comentário: executa comandos permitidos com timeout configurável
  const shellCommand = COMMAND_MAP[code]
  if (!shellCommand) {
    return 'ERROR: Unsupported command'
  }

  return new Promise((resolve, reject) => {
    const [cmd, ...args] = shellCommand.split(' ')
    const proc = spawn(cmd, args)
    
    let stdout = ''
    let stderr = ''
    let killed = false
    
    // Timeout para matar o processo
    const timeoutId = setTimeout(() => {
      killed = true
      proc.kill('SIGKILL')
    }, timeoutSeconds * 1000)
    
    proc.stdout.on('data', (data) => {
      stdout += data.toString()
    })
    
    proc.stderr.on('data', (data) => {
      stderr += data.toString()
    })
    
    proc.on('close', (exitCode) => {
      clearTimeout(timeoutId)
      
      if (killed) {
        resolve(`ERROR: Command timed out after ${timeoutSeconds}s`)
      } else if (exitCode !== 0) {
        resolve(`ERROR: Command failed with exit code ${exitCode}\n${stderr}`)
      } else {
        resolve(stdout || stderr || 'OK')
      }
    })
    
    proc.on('error', (err) => {
      clearTimeout(timeoutId)
      resolve(`ERROR: Failed to execute command: ${err.message}`)
    })
  })
}

const doHeartbeat = async () => {
  const body = {
    agentToken,
    ip: process.env.AGENT_IP || '',
    mac: process.env.AGENT_MAC || '',
  }
  const res = await fetch(`${serverBaseUrl}/api/agent/heartbeat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Heartbeat failed: ${res.status}`)
  return res.json()
}

const postResult = async (commandId, output) => {
  const res = await fetch(`${serverBaseUrl}/api/agent/result`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commandId, agentToken, output }),
  })
  if (!res.ok) throw new Error(`Result failed: ${res.status}`)
}

const main = async () => {
  if (!agentToken) {
    console.error('AGENT_TOKEN not configured')
    process.exit(1)
  }
  
  console.log('🤖 Agent started with token:', agentToken.substring(0, 8) + '...')
  console.log('📡 Server:', serverBaseUrl)
  
  while (true) {
    try {
      const hb = await doHeartbeat()
      if (hb.command) {
        const { id, code, timeout_seconds } = hb.command
        console.log(`📥 Command received: ${code} (timeout: ${timeout_seconds}s)`)
        
        const output = await safeExec(code, timeout_seconds || 30)
        
        console.log(`📤 Sending result for command #${id}`)
        await postResult(id, output)
        
        if (output.startsWith('ERROR:')) {
          console.log(`❌ Command failed: ${output.substring(0, 50)}...`)
        } else {
          console.log(`✅ Command completed successfully`)
        }
      }
    } catch (e) {
      console.error('❌ Agent loop error:', e.message)
    }
    await sleep(3000)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
