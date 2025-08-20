# Camadas e Classes (POO)

## Repositories
- AssetRepository
  - list(), getById(), getByToken(), create(), update(), remove(), history()
- CommandRepository
  - create(), findPendingForAsset(), listByAsset(), attachResultAndMarkDone(), findWithAssetToken()

## Services
- AssetService
  - list(), getWithHistory(), create(), update(), remove()
- CommandService
  - enqueue({assetId, code}), listByAsset(assetId)
  - nextForToken(agentToken), submitResult({commandId, agentToken, output})

## Controllers
- AssetController
  - list, create, get, update, remove
- CommandController
  - enqueue, listByAsset
- AgentController
  - heartbeat, submitResult

Observação: nomes de variáveis em inglês, comentários PT-BR; arrow functions, const e async/await por padrão.
