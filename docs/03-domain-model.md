# Modelo de Domínio e Banco de Dados

## Entidades
- User: provider, provider_id, name, email
- Asset: name, type, ip, mac, agent_token, last_seen
- Command: asset_id, code, status (PENDING|DONE)
- CommandResult: command_id, output, executed_at
- CaptiveSession: user_id, ip, mac, started_at, expires_at
- StateChallenge: state, ip, mac, created_at
- AuditLog: actor, action, details, created_at

## Esquema (SQLite)
Definido em `src/db/connection.js` com criação automática no boot.

## Regras
- Foreign keys ON
- Cascade em comandos/outputs
- agent_token único por Asset
