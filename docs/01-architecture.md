# 1. Arquitetura do Sistema

Este documento descreve a arquitetura de alto nível, os componentes principais e os requisitos de infraestrutura de rede para o funcionamento do sistema Captive Portal Network (CPN).

## 1.1. Visão Geral e Filosofia

A arquitetura do CPN é baseada em um conjunto de micro-serviços e componentes que se comunicam via APIs REST e polling. A filosofia é manter os componentes desacoplados e com responsabilidades bem definidas, seguindo os princípios de **SOLID** e **Clean Architecture**.

- **Backend**: Node.js com Express, estruturado em camadas (Controllers, Services, Repositories).
- **Banco de Dados**: SQLite para simplicidade e portabilidade, com acesso via uma camada de repositório que abstrai o SQL.
- **Agente**: Um cliente Node.js leve que opera em modo de polling, garantindo que a comunicação seja sempre iniciada pelo ativo gerenciado, o que simplifica a configuração de firewalls.
- **Frontend**: HTML/JS/CSS puros e estáticos, servidos diretamente pelo Express, para o painel administrativo e a página do captive portal.
- **Segurança**: Autenticação baseada em JWT para o painel administrativo e um fluxo OAuth 2.0 (server-side) para os clientes do captive portal.

## 1.2. Diagrama de Componentes (Modelo C4)

O diagrama abaixo ilustra os principais contêineres (aplicações) do sistema e suas interações.

```mermaid
graph TD
    subgraph "Clientes (Usuários Finais)"
        ClientDevice[📱/💻 Dispositivo do Cliente]
    end

    subgraph "Infraestrutura de Rede Local"
        ClientDevice --"1. Conecta ao Wi-Fi"--> AccessPoint[📡 Access Point (Bridge)]
        AccessPoint --"2. Requisição HTTP"--> Gateway[🔥 Gateway Linux com iptables]
    end

    subgraph "Servidores"
        Gateway --"3. Redireciona para"--> CaptivePortalServer[🚀 Servidor CPN (Node.js)]
        CaptivePortalServer --"Lê/Escreve"--> Database[🗃️ Banco de Dados (SQLite)]
        CaptivePortalServer --"Executa Scripts"--> Gateway
    end
    
    subgraph "Administração"
        AdminUI[🖥️ Painel Admin] --"API REST"--> CaptivePortalServer
    end

    subgraph "Ativos Gerenciados"
        Agent[🤖 Agente Node.js] --"Polling (Heartbeat/Comandos)"--> CaptivePortalServer
    end

    subgraph "Serviços Externos"
        CaptivePortalServer --"OAuth 2.0"--> GoogleAuth[🌐 Google OAuth]
        CaptivePortalServer --"OAuth 2.0"--> FacebookAuth[🌐 Facebook OAuth]
    end

    ClientDevice --"4. Login Social"--> CaptivePortalServer
```

## 1.3. Componentes Detalhados

### 1.3.1. Servidor Captive Portal (Node.js)
- **`src/server.js`**: Ponto de entrada da aplicação. Configura Express, middlewares (CORS, JSON), rotas, e inicializa os serviços de background (`TimeoutMonitorService`, `SessionExpirationService`).
- **`src/routes/`**: Define os endpoints da API, associando URLs a métodos nos controllers.
- **`src/controllers/`**: Camada de interface com o mundo HTTP. Recebe requisições, valida parâmetros básicos e chama os serviços. Não contém regras de negócio.
- **`src/services/`**: O coração da aplicação. Orquestra as regras de negócio, combinando chamadas a um ou mais repositórios.
- **`src/repositories/`**: Camada de acesso a dados. É a única parte do sistema que conhece SQL e interage diretamente com o banco de dados.
- **`src/db/`**: Gerencia a conexão com o SQLite e garante que o schema do banco esteja atualizado.

### 1.3.2. Agente (Node.js)
- **`agent/index.js`**: Aplicação de console que roda nos ativos gerenciados.
- **Funções**:
    1.  **Heartbeat**: A cada 3 segundos, envia um "estou vivo" para o servidor, junto com seu IP e MAC.
    2.  **Polling de Comandos**: Na resposta do heartbeat, o servidor pode enviar um comando pendente.
    3.  **Execução Segura**: Executa o comando recebido usando `child_process.spawn` com um timeout definido pelo servidor.
    4.  **Envio de Resultado**: Após a execução (ou falha por timeout), envia o resultado (stdout/stderr) de volta para o servidor.

### 1.3.3. Frontend (HTML/JS)
- **`public/admin/`**: Painel de administração protegido por JWT. Permite gerenciar ativos, usuários e comandos.
- **`public/index.html`**: A página do captive portal, com design responsivo e JavaScript para detectar o tipo de dispositivo e construir as URLs de autenticação.

---

## 1.4. Infraestrutura de Rede e Gateway (Requisito Crítico)

Para que o redirecionamento do captive portal funcione, uma configuração de rede específica é **obrigatória**. Roteadores domésticos (como TP-Link, D-Link, etc.) **não são adequados** porque seus firmwares não oferecem o controle granular necessário sobre o tráfego de rede.

### 1.4.1. Por que um Roteador Doméstico não Funciona?
- **Redirecionamento Limitado**: Não permitem criar regras para redirecionar apenas o tráfego HTTP da porta 80 para um servidor específico na rede.
- **Falta de `iptables`**: Não possuem um firewall `iptables` completo para manipulação avançada de pacotes (NAT, DNAT, mark).
- **Execução de Scripts**: Não é possível executar scripts (`allow_internet.sh`, `block_internet.sh`) para liberar ou bloquear acesso dinamicamente.
- **Isolamento de Clientes**: Geralmente não suportam VLANs ou isolamento de clientes de forma eficaz.

### 1.4.2. Topologia de Rede Obrigatória

A solução exige um **Gateway Linux** posicionado entre os clientes e a internet. Este gateway atuará como o roteador principal da rede.

```
      INTERNET
         │
(eth0) ┌─▼──────────────┐ (eth1)
       │  GATEWAY LINUX   ├───────────┐
       │ (iptables, DHCP) │           │
       └──────────────────┘           │
                                      │ (Rede Interna - 192.168.10.0/24)
                                      │
              ┌───────────────────────┴───────────────────────┐
              │                       │                       │
      ┌───────▼───────┐      ┌────────▼────────┐      ┌───────▼───────┐
      │ Access Point  │      │ Access Point  │      │ Servidor CPN  │
      │ (Modo Bridge) │      │ (Modo Bridge) │      │(192.168.10.2) │
      └───────────────┘      └───────────────┘      └───────────────┘
              │                       │
              └──────────┬────────────┘
                         │
                 ┌───────▼───────┐
                 │ Clientes Wi-Fi│
                 └───────────────┘
```

### 1.4.3. Configuração do Gateway Linux

O gateway deve ser um computador ou servidor com **duas interfaces de rede** (uma para a WAN/internet, outra para a LAN/rede interna) e rodando uma distribuição Linux (ex: Ubuntu Server, Debian).

**Principais Funções do Gateway:**
1.  **Servidor DHCP**: Atribuir IPs para os clientes na rede interna (usando `dnsmasq`, por exemplo).
2.  **Roteamento e NAT**: Fazer o roteamento dos pacotes da rede interna para a internet (`MASQUERADE`).
3.  **Firewall com `iptables`**: Onde a "mágica" do captive portal acontece.

#### Regras `iptables` Essenciais

Estas regras são aplicadas no Gateway Linux para controlar o fluxo de tráfego.

1.  **Habilitar o encaminhamento de pacotes**:
    ```bash
    # Permite que o gateway atue como um roteador
    echo 1 > /proc/sys/net/ipv4/ip_forward
    ```

2.  **NAT (Network Address Translation)**:
    ```bash
    # Faz com que todo o tráfego da rede interna saia para a internet com o IP do gateway
    iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
    ```

3.  **Redirecionamento para o Captive Portal (Regra Chave)**:
    ```bash
    # Redireciona todo o tráfego HTTP (porta 80) de clientes não autenticados
    # para o servidor CPN na porta 3000.
    iptables -t nat -A PREROUTING -i eth1 -p tcp --dport 80 -j DNAT --to-destination 192.168.10.2:3000
    ```
    - `-i eth1`: Aplica-se apenas ao tráfego vindo da rede interna.
    - `-p tcp --dport 80`: Captura apenas pacotes TCP destinados à porta 80 (HTTP).
    - `-j DNAT`: Altera o destino do pacote para o servidor CPN.

4.  **Bloqueio de HTTPS para não autenticados**:
    ```bash
    # Bloqueia o tráfego HTTPS (porta 443) para forçar o usuário a tentar
    # acessar uma página HTTP primeiro, o que aciona o redirecionamento.
    iptables -A FORWARD -i eth1 -p tcp --dport 443 -j DROP
    ```
    *Nota: Sem essa regra, um usuário tentando acessar `https://google.com` receberia um erro de timeout em vez de ser redirecionado.*

5.  **Liberação de Acesso (executado por `allow_internet.sh`)**:
    Quando um usuário se autentica, o servidor CPN executa um script no gateway que adiciona regras de exceção para o IP/MAC daquele cliente.

    ```bash
    # Libera todo o tráfego para um IP específico
    iptables -I FORWARD -s 192.168.10.123 -j ACCEPT

    # Ou, de forma mais segura, usando MAC address
    iptables -I FORWARD -m mac --mac-source 00:1A:2B:3C:4D:5E -j ACCEPT
    ```
    - `-I FORWARD`: Insere a regra no topo da cadeia `FORWARD`, garantindo que seja processada antes das regras de `DROP`.

Com esta configuração, qualquer dispositivo que se conectar à rede terá seu tráfego HTTP interceptado e redirecionado para o portal, enquanto todo o resto é bloqueado até que a autenticação seja concluída e as regras de `ACCEPT` sejam aplicadas.
