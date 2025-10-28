# 7. Operações e Implantação

Este documento descreve os procedimentos para configurar, implantar e manter o sistema em um ambiente de produção.

## 7.1. Requisitos de Infraestrutura

-   **Servidor da Aplicação**:
    -   Máquina física ou virtual com Linux.
    -   Node.js v18 ou superior.
    -   Acesso de rede à sub-rede dos clientes do captive portal.
-   **Gateway de Rede**:
    -   **Obrigatório**: Um computador/servidor Linux dedicado para atuar como gateway/roteador. **Roteadores domésticos comuns não são suficientes**, pois não permitem a configuração de regras de `iptables` necessárias para o redirecionamento do captive portal.
    -   Duas interfaces de rede: uma para a WAN (internet) e uma para a LAN (clientes).
    -   Software: `iptables`, `dnsmasq` (para DHCP e DNS).
-   **Ponto de Acesso Wi-Fi (AP)**:
    -   Qualquer AP Wi-Fi configurado em **modo bridge**. O AP não deve ter seu próprio DHCP ou NAT ativado; ele deve apenas encaminhar o tráfego dos clientes para o gateway Linux.

## 7.2. Configuração do Ambiente

### Variáveis de Ambiente (`.env`)
Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# --- Server ---
PORT=3000
NODE_ENV=production
HOST=0.0.0.0

# --- Database ---
DATABASE_PATH=./database.sqlite

# --- Admin Authentication (JWT) ---
SESSION_SECRET=seu_segredo_super_secreto_para_jwt
ADMIN_USERNAME=admin
ADMIN_PASSWORD=uma_senha_forte_para_o_admin

# --- Captive Portal ---
CAPTIVE_SESSION_TTL_MINUTES=120
INSTAGRAM_REDIRECT_URL=https://www.instagram.com/sua_instituicao/

# --- OAuth Google ---
GOOGLE_CLIENT_ID=seu_id_de_cliente_google.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu_segredo_de_cliente_google
GOOGLE_CALLBACK_URL=http://seu_dominio_ou_ip:3000/captive/callback

# --- OAuth Facebook ---
FACEBOOK_APP_ID=seu_id_de_app_do_facebook
FACEBOOK_APP_SECRET=seu_segredo_de_app_do_facebook
FACEBOOK_CALLBACK_URL=http://seu_dominio_ou_ip:3000/captive/callback
```

### Configuração do Gateway Linux
Consulte o `docs/01-architecture.md` para um guia detalhado sobre a configuração do gateway, incluindo os scripts de `iptables` e `dnsmasq`.

## 7.3. Instalação e Execução

### Servidor Principal
1.  **Instalar dependências**:
    ```bash
    npm install --production
    ```
2.  **Executar as migrações do banco de dados**:
    ```bash
    npm run migrate
    ```
3.  **Iniciar a aplicação (usando um gerenciador de processos como o PM2)**:
    ```bash
    pm2 start src/server.js --name "captive-portal-api"
    ```
    O PM2 garantirá que a aplicação reinicie automaticamente em caso de falhas.

### Agente
O agente deve ser instalado em cada ativo que precisa ser gerenciado.

1.  **Instalar dependências**:
    ```bash
    cd agent
    npm install --production
    ```
2.  **Executar o agente (também via PM2)**:
    -   Obtenha o `agentToken` do ativo no painel de administração.
    -   Inicie o agente, passando as variáveis de ambiente necessárias:
    ```bash
    pm2 start agent/index.js --name "asset-agent" --env AGENT_TOKEN="seu_token_aqui" SERVER_BASE_URL="http://ip_do_servidor:3000"
    ```

## 7.4. Manutenção e Monitoramento

### Backup do Banco de Dados
O banco de dados é um único arquivo (`database.sqlite`). Faça backups regulares deste arquivo.

```bash
# Exemplo de comando de backup com data
cp database.sqlite backups/database-$(date +%Y-%m-%d-%H%M%S).sqlite
```

### Logs da Aplicação
Se estiver usando PM2, os logs podem ser visualizados com:
```bash
# Visualizar logs em tempo real
pm2 logs captive-portal-api

# Visualizar logs do agente
pm2 logs asset-agent
```

### Scripts de Manutenção
-   **Criar um administrador**: Se necessário, um novo administrador pode ser criado via linha de comando.
    ```bash
    node scripts/create_admin.js novo_admin senha_forte
    ```
-   **Migrações**: Para aplicar novas migrações de banco de dados após uma atualização.
    ```bash
    npm run migrate
    ```

## 7.5. Implantação com Docker (Opcional)

O projeto inclui um `Dockerfile` para containerizar a aplicação principal.

1.  **Construir a imagem Docker**:
    ```bash
    docker build -t captive-portal-network .
    ```
2.  **Executar o container**:
    -   Monte o arquivo de banco de dados como um volume para persistência.
    -   Passe as variáveis de ambiente através de um arquivo `.env`.
    ```bash
    docker run -d --name captive-portal 
      -p 3000:3000 
      --env-file ./.env 
      -v $(pwd)/database.sqlite:/usr/src/app/database.sqlite 
      captive-portal-network
    ```
Isso simplifica a implantação, mas ainda requer que o container tenha acesso de rede ao gateway e aos clientes.
