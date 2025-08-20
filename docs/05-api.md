# API HTTP — Contratos

Base URL: `http://localhost:3000`

## Health
- GET `/health` -> `{ ok: true }`

## Assets (Basic Auth)
- GET `/api/assets` -> `[Asset]`
- POST `/api/assets` { name, type, ip, mac, agentToken } -> `Asset`
- GET `/api/assets/:id` -> `{ asset, history: [Command + CommandResult] }`
- PUT `/api/assets/:id` { name, type, ip, mac, agentToken } -> `Asset`
- DELETE `/api/assets/:id` -> 204

## Commands (Basic Auth)
- POST `/api/commands` { assetId, code } (code ∈ UNAME|DF|UPTIME|LSROOT) -> `Command`
- GET `/api/commands/asset/:assetId` -> `[Command]`

## Agent
- POST `/api/agent/heartbeat` { agentToken, ip, mac } -> `{ command|null }`
- POST `/api/agent/result` { commandId, agentToken, output } -> `{ ok: true }`

## Captive
- GET `/auth/login/:provider` (?ip, ?mac) -> `{ redirect }`
- GET `/auth/callback` (?provider, state, ?code, ?ip, ?mac) -> 302 redirect
