# 5. API HTTP e Endpoints

A API do sistema é dividida em duas partes principais: a API de gerenciamento (prefixo `/api`) e a API do captive portal (prefixo `/captive`). A documentação interativa completa está disponível via Swagger em `/api-docs`.

## 5.1. API de Gerenciamento (`/api`)

Esta API é usada pelo painel de administração e pelos agentes. O acesso à maioria dos endpoints é protegido.

### Autenticação
- **Painel Admin**: Autenticação via `Bearer Token` (JWT) no header `Authorization`.
- **Agente**: Autenticação baseada em `agentToken` enviado no corpo da requisição.

---

### Healthcheck

-   `GET /health`
    -   **Descrição**: Verifica se a aplicação está no ar.
    -   **Resposta**: `200 OK`
        ```json
        { "ok": true }
        ```

---

### Autenticação Admin (`/api/auth`)

-   `POST /api/auth/login`
    -   **Descrição**: Autentica um administrador e retorna um token JWT.
    -   **Corpo**: `{ "username": "admin", "password": "your_password" }`
    -   **Resposta**: `200 OK`
        ```json
        { "token": "ey...", "user": { "username": "admin", "role": "admin" } }
        ```

-   `GET /api/auth/me`
    -   **Descrição**: Retorna informações do usuário autenticado (requer token JWT).
    -   **Resposta**: `200 OK`
        ```json
        { "user": { "username": "admin", "role": "admin" } }
        ```

---

### Gerenciamento de Ativos (`/api/assets`)

-   `GET /api/assets`
    -   **Descrição**: Lista todos os ativos cadastrados.
    -   **Resposta**: `200 OK` -> `[Asset]`

-   `POST /api/assets`
    -   **Descrição**: Cria um novo ativo.
    -   **Corpo**: `{ "name": "string", "type": "string", "ip": "string", "mac": "string" }`
    -   **Resposta**: `201 Created` -> `Asset`

-   `GET /api/assets/:id`
    -   **Descrição**: Obtém detalhes de um ativo, incluindo seu histórico de comandos.
    -   **Resposta**: `200 OK` -> `{ asset: Asset, history: [Command] }`

-   `PUT /api/assets/:id`
    -   **Descrição**: Atualiza um ativo.
    -   **Corpo**: `{ "name": "string", "type": "string", "ip": "string", "mac": "string" }`
    -   **Resposta**: `200 OK` -> `Asset`

-   `DELETE /api/assets/:id`
    -   **Descrição**: Remove um ativo.
    -   **Resposta**: `204 No Content`

---

### Gerenciamento de Comandos (`/api/commands`)

-   `POST /api/commands`
    -   **Descrição**: Enfileira um novo comando para ser executado por um agente.
    -   **Corpo**: `{ "assetId": "integer", "code": "UNAME" | "DF" | "UPTIME" | "LSROOT", "timeoutSeconds": "integer" }`
    -   **Resposta**: `201 Created` -> `Command`

-   `GET /api/commands/asset/:assetId`
    -   **Descrição**: Lista todos os comandos enviados para um ativo específico.
    -   **Resposta**: `200 OK` -> `[Command]`

---

### Comunicação do Agente (`/api/agent`)

-   `POST /api/agent/heartbeat`
    -   **Descrição**: Endpoint de polling para o agente. Informa que o agente está online e busca por comandos pendentes.
    -   **Corpo**: `{ "agentToken": "string", "ip": "string", "mac": "string" }`
    -   **Resposta**: `200 OK`
        ```json
        // Se houver um comando
        { "command": { "id": 1, "code": "UPTIME", "timeout_seconds": 30 } }
        
        // Se não houver comando
        { "command": null }
        ```

-   `POST /api/agent/result`
    -   **Descrição**: Envia o resultado de um comando executado pelo agente.
    -   **Corpo**: `{ "commandId": "integer", "agentToken": "string", "output": "string" }`
    -   **Resposta**: `201 Created` -> `{ "ok": true }`

---

### Gerenciamento de Usuários (`/api/users`)

-   `GET /api/users`
    -   **Descrição**: Lista todos os usuários do captive portal com métricas de uso.
    -   **Resposta**: `200 OK` -> `[UserWithMetrics]`

-   `GET /api/users/sessions`
    -   **Descrição**: Lista todas as sessões ativas e expiradas.
    -   **Resposta**: `200 OK` -> `[CaptiveSession]`

---

## 5.2. API do Captive Portal (`/captive`)

Esta API é pública e usada pelos clientes finais para autenticação.

-   `GET /captive`
    -   **Descrição**: Rota principal que serve a página HTML do captive portal.
    -   **Query Params (Opcionais)**: `?ip=...&mac=...&url=...` (preservados pelo sistema).
    -   **Resposta**: `200 OK` -> `text/html`

-   `GET /captive/login/:provider`
    -   **Descrição**: Inicia o fluxo de autenticação OAuth 2.0.
    -   **Parâmetros de Rota**: `:provider` pode ser `google` ou `facebook`.
    -   **Query Params**: `?ip=...&mac=...`
    -   **Ação**: Cria um `state` no banco, o associa ao IP/MAC e redireciona o usuário para a página de autorização do provedor OAuth.

-   `GET /captive/callback`
    -   **Descrição**: Endpoint de callback para o qual o provedor OAuth redireciona após a autorização do usuário.
    -   **Query Params**: `?state=...&code=...`
    -   **Ação**:
        1.  Valida o `state`.
        2.  Troca o `code` por um token de acesso.
        3.  Busca/Cria o registro do usuário.
        4.  Cria uma `CaptiveSession`.
        5.  Executa o script `allow_internet.sh`.
        6.  Redireciona o usuário para a página de sucesso (ex: Instagram).
    -   **Resposta**: `302 Found` (redirecionamento).
