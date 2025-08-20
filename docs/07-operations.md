# Operação

## Ambiente
- `.env` baseado em `.env.example`
- Variáveis principais: PORT, DATABASE_PATH, ADMIN_BASIC_*, SESSION_TTL_MINUTES, OAUTH_*, CAPTIVE_REDIRECT_SUCCESS

## Rodar local
- `npm install`
- `npm run dev`

## Agente
- `AGENT_TOKEN=... SERVER_BASE_URL=http://localhost:3000 node agent/index.js`

## Scripts Shell
- `scripts/allow_internet.sh <ip> <mac>`
