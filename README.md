# Captive Portal & Network Asset Manager

Este projeto é um sistema de gerenciamento remoto de ativos de TI combinado com um captive portal para autenticação de usuários em redes Wi-Fi via redes sociais (Google e Facebook).

O sistema é composto por três partes principais:
1.  **Servidor Central (Backend)**: Uma aplicação Node.js/Express que oferece uma API REST para gerenciamento e serve o portal de autenticação.
2.  **Painel de Administração (Frontend)**: Uma interface web simples para administradores gerenciarem ativos, usuários e comandos.
3.  **Agente**: Um script Node.js leve para ser executado nos ativos de TI, que se comunica com o servidor para receber e executar comandos.



## 📖 Documentação Completa

Toda a documentação do projeto foi consolidada na pasta `/docs`.

-   **[Manual Executivo](docs/MANUAL_EXECUTIVO.md)**: Uma visão geral de alto nível do projeto, seus casos de uso, e requisitos de negócio e infraestrutura. Ideal para gestores e equipes de operação.
-   **[Documentação Técnica Detalhada](docs/README.md)**: O ponto de partida para desenvolvedores. Contém links para toda a documentação técnica, incluindo:
    -   **[1. Arquitetura](docs/01-architecture.md)**: Diagramas de componentes, topologia de rede e explicação detalhada do gateway.
    -   **[2. Fluxos e Diagramas de Sequência](docs/02-flows.md)**: Detalhamento dos principais processos do sistema.
    -   **[3. Modelo de Domínio e Banco de Dados](docs/03-domain-model.md)**: Diagrama Entidade-Relacionamento e esquema SQL.
    -   **[4. Diagrama de Classes do Backend](docs/04-classes.md)**: Estrutura de classes do servidor.
    -   **[5. API e Endpoints](docs/05-api.md)**: Contrato detalhado da API REST.
    -   **[6. Segurança](docs/06-security.md)**: Estratégias de autenticação, autorização e prevenção de ataques.
    -   **[7. Operações e Implantação](docs/07-operations.md)**: Guia para colocar o sistema em produção.
    -   **[8. Trabalhos Futuros](docs/08-future-work.md)**: Ideias para a evolução do projeto.

### 📚 Documentação Interativa da API (Swagger)

Após iniciar o servidor, a documentação interativa da API, gerada pelo Swagger, está disponível em:

-   **URL**: `http://localhost:3000/api-docs`

## 🚀 Guia de Instalação e Operação

> **Atenção**: A implantação deste sistema requer um **gateway Linux dedicado**. Roteadores domésticos não são suportados. Veja o [guia de arquitetura](docs/01-architecture.md) para mais detalhes.

### 1. Pré-requisitos
- Node.js v18+
- Um servidor/VM Linux para o gateway
- Um Ponto de Acesso Wi-Fi em modo bridge

### 2. Configuração do Servidor
1.  Clone o repositório.
2.  Copie o arquivo `.env.example` para `.env` e preencha **todas** as variáveis, incluindo as chaves de API para o Google e Facebook OAuth.
    ```bash
    cp .env.example .env
    ```
    
    > **⚠️ Importante para OAuth**: Se você estiver desenvolvendo localmente, precisa usar um túnel público (como ngrok) para que o OAuth funcione. Veja o [Guia Rápido OAuth](OAUTH-QUICKSTART.md) para instruções passo-a-passo.

3.  Instale as dependências:
    ```bash
    npm install
    ```
4.  Execute as migrações do banco de dados para criar as tabelas:
    ```bash
    npm run migrate
    ```
5.  Crie o primeiro usuário administrador:
    ```bash
    node scripts/create_admin.js admin "SuaSenhaForteAqui"
    ```

### 3. Execução

#### Ambiente de Desenvolvimento
Para rodar o servidor com reinicialização automática (`nodemon`):
```bash
npm run dev
```

**Para desenvolvimento com OAuth (recomendado):**

Use um túnel público para expor seu servidor local:
```bash
# Terminal 1 - Inicie o túnel
npm run tunnel

# Terminal 2 - Inicie o servidor
npm run dev
```

Veja o [Guia Rápido OAuth](OAUTH-QUICKSTART.md) para configuração completa.

#### Ambiente de Produção
É altamente recomendado usar um gerenciador de processos como o **PM2**.

1.  Instale o PM2 globalmente:
    ```bash
    npm install -g pm2
    ```
2.  Inicie a aplicação:
    ```bash
    pm2 start src/server.js --name "captive-portal-api"
    ```

### 4. Acesso ao Painel Admin
-   Acesse a página de login em `http://ip_do_servidor:3000/admin/login.html`.
-   Use as credenciais do administrador criadas no passo 2.5.

### 5. Implantação com Docker (Recomendado)

O projeto possui suporte completo para Docker com configuração otimizada para produção.

#### Opção A: Docker Compose (Recomendado)

1.  **Configure as variáveis de ambiente**:
    ```bash
    cp .env.example .env
    nano .env  # Edite com suas configurações
    ```

2.  **Usando o Makefile (mais fácil)**:
    ```bash
    # Setup inicial
    make setup
    
    # Build e iniciar
    make build
    make up
    
    # Ver logs
    make logs
    
    # Ver todos os comandos disponíveis
    make help
    ```

3.  **Ou usando Docker Compose diretamente**:
    ```bash
    # Build da imagem
    docker compose build
    
    # Iniciar em background
    docker compose up -d
    
    # Ver logs
    docker compose logs -f
    ```

#### Opção B: Docker Manual

1.  **Construa a imagem**:
    ```bash
    docker build -t captive-portal-network .
    ```

2.  **Execute o container**:
    ```bash
    docker run -d --name captive-portal \
      --network host \
      --cap-add NET_ADMIN \
      --cap-add NET_RAW \
      --env-file .env \
      -v $(pwd)/data:/app/data \
      -v $(pwd)/logs:/app/logs \
      -v $(pwd)/scripts:/app/scripts:ro \
      --restart unless-stopped \
      captive-portal-network
    ```

#### Healthcheck e Status

```bash
# Verificar saúde da aplicação
curl http://localhost:3000/health

# Ver status do container
docker compose ps

# Ver uso de recursos
make stats
```

#### 📚 Documentação Docker Completa

Para deployment detalhado com Docker, incluindo troubleshooting e configuração de produção:
- **[Guia de Deployment com Docker](docs/DEPLOYMENT_DOCKER.md)**

#### 🔧 Comandos Úteis (via Makefile)

```bash
make help         # Ver todos os comandos
make build        # Build da imagem
make up           # Iniciar container
make down         # Parar container
make restart      # Reiniciar container
make logs         # Ver logs em tempo real
make shell        # Abrir shell no container
make healthcheck  # Testar endpoint /health
make iptables     # Ver regras de firewall
make backup       # Backup do banco de dados
```