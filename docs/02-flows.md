# 2. Fluxos de Ponta a Ponta

Esta seção detalha os principais fluxos de interação do usuário e do sistema, desde a conexão de um cliente Wi-Fi até o gerenciamento remoto de um ativo.

## 2.1. Fluxo de Autenticação do Cliente (Captive Portal)

Este é o fluxo principal para um usuário final que se conecta à rede Wi-Fi.

```mermaid
sequenceDiagram
    participant C as 📱 Cliente
    participant AP as 📡 Access Point
    participant GW as 🔥 Gateway Linux
    participant S as 🚀 Servidor CPN
    participant DB as 🗃️ Banco de Dados
    participant OAuth as 🌐 Google/Facebook

    C->>AP: 1. Conecta à rede Wi-Fi
    C->>GW: 2. Tenta acessar http://example.com
    GW-->>S: 3. [iptables] Redireciona requisição para o Servidor CPN
    S-->>C: 4. Retorna a página de login do Captive Portal (HTML)
    
    C->>S: 5. Clica em "Login com Google"
    S->>DB: 6. Gera e salva 'state' (vinculado a IP/MAC)
    S-->>C: 7. Redireciona para a URL de autorização do Google (com 'state')
    
    C->>OAuth: 8. Autoriza o acesso na página do Google
    OAuth-->>C: 9. Redireciona para /auth/callback com 'code' e 'state'
    C->>S: 10. Acessa /auth/callback?code=...&state=...
    
    S->>DB: 11. Valida se 'state' existe e corresponde ao IP/MAC
    S->>OAuth: 12. Troca 'code' por token de acesso e perfil do usuário
    S->>DB: 13. Cria/Atualiza registro do usuário (User)
    S->>DB: 14. Cria uma nova 'CaptiveSession' com TTL (ex: 2h)
    
    S->>GW: 15. Executa script 'allow_internet.sh' com IP/MAC do cliente
    GW->>GW: 16. [iptables] Adiciona regra de ACCEPT para o cliente
    
    S-->>C: 17. Redireciona para a página de sucesso (ex: Instagram)
    C->>GW: 18. Acessa qualquer site (ex: https://google.com)
    GW-->>C: 19. [iptables] Tráfego agora é permitido e roteado para a internet
```

## 2.2. Fluxo de Execução de Comando Remoto

Este fluxo descreve como um administrador envia um comando para um ativo gerenciado.

```mermaid
sequenceDiagram
    participant Admin as 👨‍💻 Admin
    participant AdminUI as 🖥️ Painel Admin
    participant S as 🚀 Servidor CPN
    participant DB as 🗃️ Banco de Dados
    participant Agent as 🤖 Agente no Ativo

    Admin->>AdminUI: 1. Acessa o painel e faz login (JWT)
    AdminUI-->>S: 2. Requisição para criar comando (ex: UPTIME para Ativo #1)
    
    S->>DB: 3. Valida comando e ativo
    S->>DB: 4. Cria registro na tabela 'commands' com status 'PENDING'
    S-->>AdminUI: 5. Retorna sucesso (comando enfileirado)
    
    loop Polling a cada 3s
        Agent->>S: 6. Envia Heartbeat (POST /api/agent/heartbeat)
        S->>DB: 7. Atualiza 'last_seen' do ativo
        S->>DB: 8. Procura por comandos 'PENDING' para este ativo
        
        alt Comando Encontrado
            S->>DB: 9. Atualiza status do comando para 'EXECUTING' e registra 'executed_at'
            S-->>Agent: 10. Retorna o comando (código e timeout)
        else Sem Comando
            S-->>Agent: 10. Retorna resposta vazia
        end
    end
    
    Agent->>Agent: 11. Executa o comando localmente (com timeout)
    Agent->>S: 12. Envia resultado (POST /api/agent/result)
    
    S->>DB: 13. Valida se o comando pertence ao agente
    S->>DB: 14. Salva o resultado na tabela 'command_results'
    S->>DB: 15. Atualiza status do comando para 'DONE' ou 'FAILED'
    S-->>Agent: 16. Retorna sucesso
    
    AdminUI->>S: 17. (Polling) Atualiza a lista de comandos
    S-->>AdminUI: 18. Retorna o comando com status 'DONE' e o resultado
```

## 2.3. Fluxo de Monitoramento de Timeout

Dois serviços de monitoramento rodam em background no Servidor CPN para garantir a integridade do sistema.

### 2.3.1. Timeout de Comandos

- **Objetivo**: Evitar que comandos fiquem presos no estado `EXECUTING` indefinidamente.
- **Gatilho**: `TimeoutMonitorService` roda a cada 10 segundos.

```mermaid
sequenceDiagram
    participant Monitor as ⏱️ TimeoutMonitorService
    participant DB as 🗃️ Banco de Dados

    loop a cada 10 segundos
        Monitor->>DB: 1. Busca comandos com status 'EXECUTING'
        DB-->>Monitor: 2. Retorna lista de comandos em execução

        Monitor->>Monitor: 3. Para cada comando, calcula se (agora > executed_at + timeout_seconds)
        
        alt Comando Excedeu Timeout
            Monitor->>DB: 4. Atualiza status para 'FAILED'
            Monitor->>DB: 5. Adiciona resultado 'ERROR: Timeout excedido'
        end
    end
```

### 2.3.2. Expiração de Sessão de Cliente

- **Objetivo**: Bloquear o acesso à internet de um cliente quando sua sessão expira.
- **Gatilho**: `SessionExpirationService` roda a cada 60 segundos.

```mermaid
sequenceDiagram
    participant Monitor as 🔒 SessionExpirationService
    participant DB as 🗃️ Banco de Dados
    participant GW as 🔥 Gateway Linux

    loop a cada 60 segundos
        Monitor->>DB: 1. Busca sessões com status 'active' onde 'expires_at' < agora
        DB-->>Monitor: 2. Retorna lista de sessões expiradas

        alt Sessões Expiradas Encontradas
            loop para cada sessão
                Monitor->>DB: 3. Atualiza status da sessão para 'expired'
                Monitor->>GW: 4. Executa script 'block_internet.sh' com IP/MAC da sessão
                GW->>GW: 5. [iptables] Remove a regra de ACCEPT para o cliente
            end
        end
    end
```
