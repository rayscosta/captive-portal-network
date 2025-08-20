# Arquitetura do Sistema

## Visão Geral

- Backend: Node.js + Express
- Banco: SQLite (arquivo `database.sqlite`)
- Frontend: HTML/JS estático (público)
- Agente: Node.js CLI (polling)
- OAuth: server-side (simulado nesta fase)
- Scripts: Shell (gateway/firewall)

## Componentes
- API Server (`src/server.js`)
- Rotas (`src/routes/*`)
- Controllers (`src/controllers/*`)
- Services (`src/services/*`)
- Repositories (`src/repositories/*`)
- DB (`src/db/connection.js`)
- Web (`public/`)
- Agente (`agent/`)
- Scripts (`scripts/`)

## Comunicação
- Agente -> API: POST `/api/agent/heartbeat` e `/api/agent/result`
- Admin UI -> API: CRUD assets, enfileira comandos
- Cliente -> Captive: `/auth/login/:provider` -> `/auth/callback`

## Decisões
- POO com separação em camadas (SRP)
- Somente comandos whitelisted
- Basic Auth para administração
- State OAuth vinculado a IP/MAC
