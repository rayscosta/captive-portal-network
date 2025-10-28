# 6. Segurança

A segurança é um pilar fundamental do sistema, abrangendo desde a autenticação de usuários e agentes até a integridade dos comandos executados e a proteção da infraestrutura de rede.

## 6.1. Visão Geral

A estratégia de segurança é baseada em camadas, protegendo diferentes vetores de ataque:
1.  **Autenticação e Autorização**: Garante que apenas entidades autorizadas acessem os recursos.
2.  **Segurança do Captive Portal**: Protege o fluxo de login de usuários finais.
3.  **Comunicação com Agente**: Assegura que a comunicação entre o servidor e os ativos seja autêntica e restrita.
4.  **Validação de Dados**: Previne ataques de injeção e garante a integridade dos dados.
5.  **Segurança da Infraestrutura**: Controla o acesso à rede através de scripts de firewall.
6.  **Auditoria**: Mantém um registro detalhado de todas as ações críticas.

---

## 6.2. Autenticação e Autorização

### Painel de Administração (JWT)
O acesso à API de gerenciamento (`/api/*`) é protegido por **JSON Web Tokens (JWT)**.
-   **Fluxo**: O administrador faz login com `username` e `password` no endpoint `/api/auth/login`.
-   **Token**: Em caso de sucesso, o servidor gera um token JWT assinado e com tempo de expiração curto.
-   **Acesso**: Para as requisições subsequentes, o token deve ser enviado no header `Authorization` como `Bearer <token>`. O servidor valida a assinatura e a expiração do token a cada requisição.

### Agente (Token Fixo)
A comunicação do agente com o servidor é autenticada por um **token pré-compartilhado (`agentToken`)**.
-   Cada ativo (`Asset`) possui um `agentToken` único, gerado durante seu cadastro.
-   O agente deve incluir seu `agentToken` no corpo de todas as requisições que faz ao servidor (ex: `heartbeat`, `result`).
-   O servidor valida se o token recebido corresponde a um ativo cadastrado, autorizando ou negando a requisição.

---

## 6.3. Segurança do Captive Portal

### Prevenção de CSRF com `StateChallenge`
O fluxo OAuth 2.0 é protegido contra ataques de *Cross-Site Request Forgery* (CSRF) usando um mecanismo de `state` vinculado à sessão do cliente.
1.  **Geração do State**: Quando o usuário inicia o login, o sistema gera um `state` (string aleatória e única).
2.  **Associação**: Este `state` é armazenado na tabela `StateChallenge`, associado ao **endereço MAC e IP** do dispositivo do usuário.
3.  **Validação no Callback**: Após a autenticação no provedor (Google/Facebook), o provedor redireciona de volta para a aplicação com o `state` original. O sistema então verifica se o `state` recebido existe, não foi usado e corresponde ao IP/MAC do cliente que está completando o fluxo.
4.  **Garantia**: Isso garante que apenas o usuário que iniciou o processo de login pode finalizá-lo, prevenindo que um atacante intercepte o código de autorização.

### Gerenciamento de Sessão (`CaptiveSession`)
-   Após a autenticação bem-sucedida, uma `CaptiveSession` é criada com um **tempo de vida limitado (TTL)**.
-   Um serviço de background (`SessionExpirationService`) monitora continuamente as sessões e executa o script `block_internet.sh` para revogar o acesso de sessões expiradas.

---

## 6.4. Segurança na Comunicação com o Agente

### Whitelist de Comandos
O agente **não executa comandos arbitrários** enviados pelo servidor.
-   O servidor envia apenas um **código de comando** (ex: `UNAME`, `DF`).
-   O agente possui um mapa local (`ALLOWED_COMMANDS`) que traduz esse código para um comando shell real e seguro.
-   Qualquer código de comando que não esteja nesta "whitelist" é ignorado, prevenindo a execução de comandos maliciosos.

### Execução com Timeout
Todos os comandos são executados com um **timeout configurável**. Se um comando demorar mais do que o esperado, o processo é finalizado (`SIGKILL`), prevenindo que processos travados ou maliciosos consumam recursos indefinidamente no ativo.

---

## 6.5. Validação de Dados e Prevenção de Injeção

-   **Validação de Formato**: Todas as entradas de dados, como endereços IP e MAC, são validadas para garantir que seguem o formato esperado.
-   **Sanitização**: Embora o uso de um ORM (Sequelize) ajude a prevenir SQL Injection, todas as entradas que interagem com scripts shell ou são exibidas na UI devem ser tratadas com cuidado.
-   **Foreign Keys**: O banco de dados SQLite é configurado com `PRAGMA foreign_keys=ON` para garantir a integridade referencial dos dados.

---

## 6.6. Segurança da Infraestrutura e Scripts

-   A interação com o firewall do gateway é feita exclusivamente através de scripts shell (`allow_internet.sh`, `block_internet.sh`).
-   Esses scripts recebem apenas os parâmetros estritamente necessários (como endereço MAC) e são projetados para executar uma única função, limitando a superfície de ataque.
-   O acesso para executar esses scripts deve ser restrito ao usuário do serviço da aplicação Node.js.

---

## 6.7. Auditoria e Logs

-   O sistema mantém um registro detalhado de eventos críticos na tabela `AuditLog`.
-   **Eventos Registrados**:
    -   Login de administrador.
    -   Criação/remoção de ativos.
    -   Envio de comandos.
    -   Criação de sessão no captive portal.
    -   Expiração de sessão.
-   Esses logs são essenciais para investigações de segurança e análise de incidentes.

---

## 6.8. Próximos Passos e Melhorias

-   **Rate Limiting**: Implementar um limitador de requisições para endpoints sensíveis (ex: login) para prevenir ataques de força bruta.
-   **HTTPS**: Configurar a aplicação para rodar sobre HTTPS, criptografando todo o tráfego.
-   **Variáveis de Ambiente**: Mover segredos (como `SESSION_SECRET` e senhas) para um cofre de segredos (como HashiCorp Vault ou Azure Key Vault) em vez de arquivos `.env`.
-   **Permissões de Usuário**: Evoluir o sistema de autenticação para suportar diferentes níveis de permissão (roles) para administradores.
