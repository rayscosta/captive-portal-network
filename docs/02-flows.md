# Fluxos de Ponta a Ponta

## 1) Gestão de Ativos
1. Admin autentica via Basic Auth
2. Admin cria/atualiza/remove ativos
3. Admin visualiza histórico (comandos/resultados)

## 2) Polling do Agente
1. Agente lê AGENT_TOKEN e SERVER_BASE_URL do ambiente
2. Envia `/api/agent/heartbeat` com IP/MAC
3. API retorna próximo comando PENDING
4. Agente executa localmente (somente whitelisted)
5. Agente envia `/api/agent/result` com saída

## 3) Captive Portal
1. Cliente acessa `/auth/login/:provider`
2. API cria `state` vinculado a IP/MAC
3. Redireciona para `/auth/callback` (simulado)
4. API valida `state`, cria `CaptiveSession`, roda script de liberação
5. Redireciona para destino (Instagram)
