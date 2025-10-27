# API Documentation - Captive Portal Network

## 📖 Swagger/OpenAPI

A documentação interativa da API está disponível através do Swagger UI.

### Acessar a Documentação

Após iniciar o servidor, acesse:

**Interface Swagger UI:**
```
http://localhost:3000/api-docs
```

**Especificação OpenAPI (JSON):**
```
http://localhost:3000/api-docs.json
```

### Características da Documentação

- ✅ **Interativa**: Teste os endpoints diretamente pela interface
- ✅ **Schemas Completos**: Modelos de dados detalhados
- ✅ **Autenticação**: Suporte para Bearer Token (JWT) e Agent Token
- ✅ **Exemplos**: Requisições e respostas de exemplo
- ✅ **Organizada por Tags**: Endpoints agrupados por funcionalidade

## 🔐 Autenticação no Swagger

### Para testar endpoints protegidos:

1. Acesse `/api-docs`
2. Clique no botão **"Authorize"** no topo da página
3. Escolha o tipo de autenticação:

#### Bearer Authentication (Admin)
- Faça login via `POST /api/auth/login`
- Copie o `token` da resposta
- Cole no campo "Value" do Bearer Auth
- Formato: `Bearer <seu-token-aqui>`

#### Agent Token
- Use o `agent_token` de um ativo cadastrado
- Cole no campo "X-Agent-Token"

## 📋 Grupos de Endpoints

### Authentication
- `POST /api/auth/login` - Login de administrador
- `POST /api/auth/register` - Registro de novo admin
- `GET /api/auth/me` - Informações do usuário logado
- `POST /api/auth/logout` - Logout

### Assets
- `GET /api/assets` - Listar ativos
- `POST /api/assets` - Criar ativo
- `GET /api/assets/{id}` - Detalhes do ativo
- `PUT /api/assets/{id}` - Atualizar ativo
- `DELETE /api/assets/{id}` - Remover ativo

### Commands
- `POST /api/commands` - Enfileirar comando
- `GET /api/commands/asset/{assetId}` - Listar comandos do ativo

### Agent
- `POST /api/agent/heartbeat` - Heartbeat + buscar comandos
- `POST /api/agent/result` - Enviar resultado de execução

### Users
- `GET /api/users` - Listar usuários
- `POST /api/users` - Criar usuário
- `GET /api/users/{id}` - Detalhes do usuário
- `PUT /api/users/{id}` - Atualizar usuário
- `DELETE /api/users/{id}` - Remover usuário
- `GET /api/users/{id}/metrics` - Métricas de acesso
- `GET /api/users/{id}/sessions` - Histórico de sessões

## 🚀 Exemplo de Uso

### 1. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cpn.com","password":"admin123"}'
```

### 2. Listar Ativos (com token)
```bash
curl -X GET http://localhost:3000/api/assets \
  -H "Authorization: Bearer <seu-token>"
```

### 3. Criar Ativo
```bash
curl -X POST http://localhost:3000/api/assets \
  -H "Authorization: Bearer <seu-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Server-01",
    "type": "linux",
    "ip": "192.168.1.100",
    "mac": "00:11:22:33:44:55",
    "agentToken": "a1b2c3d4e5f6g7h8"
  }'
```

### 4. Enviar Comando
```bash
curl -X POST http://localhost:3000/api/commands \
  -H "Authorization: Bearer <seu-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": 1,
    "code": "UNAME"
  }'
```

## 📦 Schemas Principais

### Asset
```json
{
  "id": 1,
  "name": "Server-01",
  "type": "linux",
  "ip": "192.168.1.100",
  "mac": "00:11:22:33:44:55",
  "agent_token": "a1b2c3d4e5f6g7h8",
  "last_seen": "2025-10-27T19:30:00.000Z",
  "created_at": "2025-10-27T10:00:00.000Z"
}
```

### Command
```json
{
  "id": 1,
  "asset_id": 1,
  "code": "UNAME",
  "status": "PENDING",
  "output": null,
  "executed_at": null,
  "created_at": "2025-10-27T19:30:00.000Z"
}
```

### User
```json
{
  "id": 1,
  "name": "Admin Sistema",
  "email": "admin@cpn.com",
  "role": "admin",
  "provider": "local",
  "created_at": "2025-10-27T10:00:00.000Z"
}
```

## 🔧 Configuração

A configuração do Swagger está em:
```
src/config/swagger.js
```

Para personalizar:
- Modificar informações da API (título, descrição, versão)
- Adicionar/remover servidores
- Ajustar schemas
- Configurar temas do Swagger UI

## 📝 Convenções

### Códigos de Status HTTP

- `200 OK` - Requisição bem-sucedida
- `201 Created` - Recurso criado com sucesso
- `204 No Content` - Ação bem-sucedida sem conteúdo de retorno
- `400 Bad Request` - Dados inválidos
- `401 Unauthorized` - Não autenticado
- `403 Forbidden` - Sem permissão
- `404 Not Found` - Recurso não encontrado
- `500 Internal Server Error` - Erro no servidor

### Comandos Permitidos

- `UNAME` - Informações do sistema operacional
- `DF` - Uso de disco
- `UPTIME` - Tempo de atividade
- `LSROOT` - Listagem do diretório raiz

### Tipos de Ativos

- `linux` - Servidor/Estação Linux
- `windows` - Servidor/Estação Windows
- `router` - Roteador
- `switch` - Switch de rede

## 🔗 Links Úteis

- [OpenAPI Specification](https://spec.openapis.org/oas/v3.0.0)
- [Swagger Editor](https://editor.swagger.io/)
- [Swagger UI Documentation](https://swagger.io/docs/open-source-tools/swagger-ui/usage/installation/)
