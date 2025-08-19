#!/usr/bin/env node
import 'dotenv/config'
import fetch from 'node-fetch'
import os from 'node:os'

const serverBaseUrl = process.env.SERVER_BASE_URL || 'http://localhost:3000'
const agentToken = process.env.AGENT_TOKEN || ''

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const safeExec = async (code) => {
  // Comentário: executa comandos permitidos localmente e retorna saída como string
  if (code === 'UNAME') return `${os.type()} ${os.release()} ${os.arch()}`
  if (code === 'DF') return JSON.stringify(os.totalmem() - os.freemem())
  if (code === 'UPTIME') return `${os.uptime()}s`
  if (code === 'LSROOT') return 'ls / (placeholder)'
  return 'Unsupported command'
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
  while (true) {
    try {
      const hb = await doHeartbeat()
      if (hb.command) {
        const output = await safeExec(hb.command.code)
        await postResult(hb.command.id, output)
      }
    } catch (e) {
      console.error('Agent loop error:', e.message)
    }
    await sleep(3000)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
