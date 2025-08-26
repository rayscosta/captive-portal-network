# Instruções GitHub Copilot - Sistema Captive Portal Network

## Orientações de Estilo de Código

- Sempre utilize **arrow functions** (`=>`) para definir funções em JavaScript.
- Prefira o uso de **const** ao invés de let sempre que possível.
- Utilize **async/await** para operações assíncronas, evitando callbacks e `.then()`.
- Sempre utilize nomes de variáveis em **inglês**.
- As explicações e comentários de código devem ser feitas em **português**.
- Utilize **Programação Orientada a Objetos (POO)**: estruture o backend em camadas com `Repositories` (acesso a dados), `Services` (regras de negócio) e `Controllers` (camada web), evitando lógica de negócio dentro de rotas.

## Contexto do Projeto

Este projeto é um sistema acadêmico de gerenciamento remoto de ativos de TI e um captive portal com autenticação social. A comunicação entre o backend e os agentes nos ativos é central.

## Stack Técnica

- **Backend:** Node.js com Express
- **Banco de Dados:** SQLite (arquivo `database.sqlite`)
- **Frontend:** HTML/JS puro (leve)
- **Agente:** Node.js (executável de console) em máquinas/VMs
- **Autenticação:** Server-side OAuth para Google e Facebook
- **Scripts:** Shell (`.sh`) para manipular o firewall/gateway

## Regras de Negócio Detalhadas

### RF1 - Gestão de Ativos

#### RF1.1: Cadastrar, editar e listar ativos (name, type, IP, MAC, agentToken)
**Escopo:** Gestão de Ativos
- CRUD completo para ativos com validação de dados
- Campos obrigatórios: name, type, IP, MAC, agentToken
- Validação de formato para IP e MAC
- Token único por ativo para autenticação

#### RF1.2: Visualizar detalhes e histórico por ativo
**Escopo:** Gestão de Ativos
- Dashboard com informações detalhadas do ativo
- Histórico de comandos executados
- Status de conectividade em tempo real
- Logs de atividade por ativo

#### RF1.3: Dashboard de usuários com informações como: número de acessos, tempo médio de conexão e dispositivos conectados
**Escopo:** Gestão de Ativos
- Métricas de uso por usuário
- Relatórios de tempo de sessão
- Monitoramento de dispositivos ativos
- Estatísticas de acesso por período

#### RF1.4: Administração de usuários e ativos por meio de um interface web
**Escopo:** Gestão de Ativos
- Interface administrativa responsiva
- Controle de permissões de usuário
- Gerenciamento centralizado de ativos
- Painéis de controle intuitivos

#### RF1.5: Registro de logs de acesso dos usuários
**Escopo:** Gestão de Ativos
- Log detalhado de todas as ações
- Auditoria de acesso com timestamp
- Rastreamento de origem (IP, MAC, User-Agent)
- Retenção configurável de logs

### RF2 - Envio de Comandos

#### RF2.1: Interface para enviar comando pré-definido a um ativo (UNAME, DF, UPTIME, LSROOT)
**Escopo:** Envio de Comandos
- Lista de comandos predefinidos e seguros
- Interface de seleção de ativo + comando
- Validação de permissões antes do envio
- Feedback visual do status do comando

#### RF2.2: API grava comando como Pending; agente puxa e executa; resultado é armazenado
**Escopo:** Envio de Comandos
- Estado `Pending` → `Executing` → `Completed/Failed`
- Queue system para gerenciar comandos
- Timeout configurável para execução
- Retry logic para comandos falhados

### RF3 - Agente (Node.js)

#### RF3.1: Agent faz heartbeat periódico e poll na API para buscar comandos pendentes
**Escopo:** Agente (Node.js)
- Heartbeat a cada 30 segundos (configurável)
- Polling inteligente com backoff exponencial
- Identificação única via agentToken
- Status de conectividade em tempo real

#### RF3.2: Agent executa apenas comandos permitidos (mapeados no servidor) e envia result
**Escopo:** Agente (Node.js)
- Whitelist de comandos no servidor
- Validação de comando antes da execução
- Sandbox de execução com timeout
- Retorno estruturado (stdout, stderr, exitCode)

### RF4 - Captive Portal

#### RF4.1: Redirecionamento de clientes HTTP para página captive
**Escopo:** Captive Portal
- Interceptação automática de tentativas HTTP
- Redirecionamento transparente para portal
- Preservação da URL original para retorno
- Suporte a diferentes dispositivos/browsers

#### RF4.2: Login via Google e Facebook (server-side OAuth)
**Escopo:** Captive Portal
- OAuth 2.0 flow completo server-side
- Integração com Google OAuth API
- Integração com Facebook Login API
- Gerenciamento seguro de tokens

#### RF4.3: Após o login, o sistema deve redirecionar o usuário automaticamente para o aplicativo do Instagram da instituição parceira
**Escopo:** Captive Portal
- Criação de `CaptiveSession` após autenticação
- Execução de script de liberação de acesso
- Redirecionamento automático para Instagram
- Deep linking para app mobile quando disponível

#### RF4.4: Após autenticado via User e CaptiveSession, executa libera_acesso.sh e redireciona para página/conta do cliente no instagram; se mobile, tenta abrir app instagram
**Escopo:** Captive Portal
- Validação de sessão ativa
- Execução segura de script shell
- Detecção de dispositivo mobile
- Fallback para versão web do Instagram

## Estrutura de Dados (Entidades)

### Asset
```javascript
{
  id: Number,
  name: String,
  type: String, // 'router', 'switch', 'server', 'workstation'
  ip: String,
  mac: String,
  agentToken: String,
  status: String, // 'online', 'offline', 'pending'
  lastSeen: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Command
```javascript
{
  id: Number,
  assetId: Number,
  command: String, // 'UNAME', 'DF', 'UPTIME', 'LSROOT'
  status: String, // 'pending', 'executing', 'completed', 'failed'
  result: String,
  executedAt: Date,
  createdAt: Date
}
```

### User
```javascript
{
  id: Number,
  email: String,
  name: String,
  provider: String, // 'google', 'facebook'
  providerId: String,
  createdAt: Date
}
```

### CaptiveSession
```javascript
{
  id: Number,
  userId: Number,
  mac: String,
  ip: String,
  userAgent: String,
  status: String, // 'active', 'expired', 'blocked'
  expiresAt: Date,
  createdAt: Date
}
```

### StateChallenge
```javascript
{
  id: Number,
  state: String,
  mac: String,
  ip: String,
  used: Boolean,
  expiresAt: Date,
  createdAt: Date
}
```

## Segurança e Validações

### Autenticação e Autorização
- **Admin Interface:** Basic Auth ou JWT tokens
- **Agent Communication:** Token-based authentication
- **OAuth State:** Vinculado ao MAC/IP para prevenir CSRF
- **Session Management:** TTL configurável com renovação automática

### Validações de Entrada
- **IP Address:** Formato IPv4/IPv6 válido
- **MAC Address:** Formato padrão (XX:XX:XX:XX:XX:XX)
- **Commands:** Apenas comandos da whitelist predefinida
- **Tokens:** Geração criptograficamente segura

### Auditoria e Logs
- **Command Execution:** Log completo (usuário, comando, resultado, timestamp)
- **User Access:** Registro de login/logout com metadados
- **System Events:** Heartbeats, conectividade, erros
- **Security Events:** Tentativas de acesso não autorizadas

## APIs e Endpoints

### Asset Management
- `GET /api/assets` - Listar todos os ativos
- `POST /api/assets` - Criar novo ativo
- `GET /api/assets/:id` - Detalhes do ativo
- `PUT /api/assets/:id` - Atualizar ativo
- `DELETE /api/assets/:id` - Remover ativo

### Command Management
- `POST /api/commands` - Enviar comando para ativo
- `GET /api/commands/:assetId` - Histórico de comandos
- `GET /api/agent/commands/:token` - Buscar comandos pendentes (Agent)
- `POST /api/agent/commands/:id/result` - Enviar resultado (Agent)

### Agent Communication
- `POST /api/agent/heartbeat` - Heartbeat do agente
- `GET /api/agent/status/:token` - Status do agente

### Captive Portal
- `GET /captive` - Página de login
- `GET /auth/google` - Iniciar OAuth Google
- `GET /auth/facebook` - Iniciar OAuth Facebook
- `GET /auth/callback/:provider` - Callback OAuth
- `POST /captive/session` - Criar sessão captive

## Scripts e Integração

### Scripts Shell
- `scripts/libera_acesso.sh` - Libera acesso à internet via iptables
- `scripts/bloqueia_acesso.sh` - Bloqueia acesso quando sessão expira
- `scripts/monitor_gateway.sh` - Monitora status do gateway

### Comandos Permitidos
```javascript
const ALLOWED_COMMANDS = {
  'UNAME': 'uname -a',
  'DF': 'df -h',
  'UPTIME': 'uptime',
  'LSROOT': 'ls -la /'
};
```

## Configurações de Ambiente

```env
# Server
PORT=3000
NODE_ENV=production

# Database
DATABASE_PATH=./database.sqlite

# Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password

# OAuth Google
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OAuth Facebook
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# Instagram
INSTAGRAM_REDIRECT_URL=https://instagram.com/your_institution

# Session
SESSION_SECRET=your_session_secret
SESSION_TIMEOUT=3600
```

## Observações para Desenvolvimento

1. **Modularidade:** Código deve ser modular seguindo padrões MVC/Repository
2. **Segurança:** Validação rigorosa de entrada e sanitização de dados
3. **Performance:** Caching para operações frequentes, paginação para listas
4. **Monitoramento:** Logs estruturados para facilitar debugging
5. **Escalabilidade:** Preparar para crescimento (connection pooling, background jobs)
6. **Manutenibilidade:** Documentação de código e APIs atualizadas
7. **Testes:** Cobertura mínima de 80% para funcionalidades críticas

## Prioridade de Desenvolvimento

1. **Fase 1:** APIs de Gestão de Ativos + Agent Communication
2. **Fase 2:** Interface administrativa + Command Management
3. **Fase 3:** Captive Portal + OAuth Integration
4. **Fase 4:** Monitoramento + Analytics + Relatórios
