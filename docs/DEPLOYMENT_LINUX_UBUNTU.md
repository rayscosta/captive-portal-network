# Implantação em Linux Ubuntu (Gateway Dedicado)

Este documento explica como implantar o sistema Captive Portal Network usando um computador dedicado com Ubuntu como gateway/firewall e servidor da aplicação.

## ✅ Por Que Linux Nativo?

Esta é a configuração **recomendada e testada** para ambientes de produção. Ao usar Linux nativo:

✅ **Acesso direto ao hardware de rede** - Controle total sobre interfaces físicas  
✅ **Performance máxima** - Sem camadas de virtualização intermediárias  
✅ **iptables completo** - Todos os módulos do kernel disponíveis  
✅ **Estabilidade** - Configuração robusta e confiável para 24/7  
✅ **Simplicidade** - Menos componentes, menos pontos de falha  

Esta configuração é adequada para:
- Ambientes de produção (pequeno a médio porte)
- Estabelecimentos comerciais (restaurantes, cafés, hotéis)
- Redes com até 200 usuários simultâneos
- Implantações permanentes

---

## 📋 Índice

1. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
2. [Requisitos de Hardware](#requisitos-de-hardware)
3. [Requisitos de Software](#requisitos-de-software)
4. [Instalação do Ubuntu](#instalação-do-ubuntu)
5. [Configuração das Interfaces de Rede](#configuração-das-interfaces-de-rede)
6. [Configuração do Gateway e Firewall](#configuração-do-gateway-e-firewall)
7. [Configuração do DHCP](#configuração-do-dhcp)
8. [Instalação do Servidor Captive Portal](#instalação-do-servidor-captive-portal)
9. [Configuração do Roteador Doméstico como AP](#configuração-do-roteador-doméstico-como-ap)
10. [Automação e Serviços Systemd](#automação-e-serviços-systemd)
11. [Testes e Validação](#testes-e-validação)
12. [Troubleshooting](#troubleshooting)

---

## 1. Visão Geral da Arquitetura

### Topologia de Rede

```
                        ┌─────────────┐
                        │   INTERNET  │
                        └──────┬──────┘
                               │
                        ┌──────┴──────────────────────────────────┐
                        │   Modem do Provedor (Modo Bridge)       │
                        │   - Apenas converte sinal                │
                        │   - Sem roteamento/NAT                   │
                        └──────┬───────────────────────────────────┘
                               │ Cabo Ethernet
                               │ (Interface WAN)
                        ┌──────┴───────────────────────────────────────────┐
                        │                                                  │
                        │    🔥 GATEWAY LINUX UBUNTU (Desktop/Servidor)   │
                        │                                                  │
                        │  ┌────────────────────────────────────────────┐ │
                        │  │   Sistema Operacional: Ubuntu 22.04 LTS   │ │
                        │  └────────────────────────────────────────────┘ │
                        │                                                  │
                        │  ┌────────────────────────────────────────────┐ │
                        │  │   Componente: Gateway/Firewall             │ │
                        │  │   - iptables (NAT, DNAT, FORWARD)          │ │
                        │  │   - IP Forwarding habilitado               │ │
                        │  │   - Scripts: allow/block_internet.sh       │ │
                        │  └────────────────────────────────────────────┘ │
                        │                                                  │
                        │  ┌────────────────────────────────────────────┐ │
                        │  │   Componente: Servidor DHCP                │ │
                        │  │   - dnsmasq                                │ │
                        │  │   - Range: 192.168.10.100-254              │ │
                        │  │   - Gateway: 192.168.10.1                  │ │
                        │  └────────────────────────────────────────────┘ │
                        │                                                  │
                        │  ┌────────────────────────────────────────────┐ │
                        │  │   Componente: API Captive Portal           │ │
                        │  │   - Node.js + Express                      │ │
                        │  │   - SQLite Database                        │ │
                        │  │   - OAuth 2.0 (Google/Facebook)            │ │
                        │  │   - Porta: 3000                            │ │
                        │  └────────────────────────────────────────────┘ │
                        │                                                  │
                        │  [enp1s0] ◄─── WAN (Internet)                   │
                        │  [enp2s0] ◄─── LAN (Rede Interna)               │
                        │                192.168.10.1/24                   │
                        └──────┬───────────────────────────────────────────┘
                               │ Cabo Ethernet
                               │ (Interface LAN)
                        ┌──────┴───────────────────────────────────┐
                        │   Roteador Doméstico (Modo AP)           │
                        │   - DHCP: Desabilitado                   │
                        │   - IP Estático: 192.168.10.2            │
                        │   - SSID: "CaptivePortal_WiFi"           │
                        │   - Modo: Access Point / Bridge          │
                        └──────┬───────────────────────────────────┘
                               │ Wi-Fi 📶
                               │
              ┌────────────────┼────────────────┐
              │                │                │
         ┌────▼────┐      ┌────▼────┐     ┌────▼────┐
         │ 📱 Phone│      │💻 Laptop│     │� Tablet│
         │ Cliente │      │ Cliente │     │ Cliente │
         └─────────┘      └─────────┘     └─────────┘
```

### Fluxo de Tráfego

1.  **Cliente se conecta** ao Wi-Fi "CaptivePortal_WiFi" (emitido pelo roteador em modo AP).
2.  **Roteador (AP)** encaminha tráfego via cabo Ethernet para a interface LAN do Gateway Ubuntu (`enp2s0`).
3.  **Cliente solicita IP** via DHCP → `dnsmasq` no Ubuntu atribui um IP da faixa `192.168.10.100-254`.
4.  **Cliente tenta acessar HTTP** → `iptables` intercepta e redireciona (DNAT) para `localhost:3000` (API Captive Portal).
5.  **API** serve a página de autenticação OAuth.
6.  **Após autenticação bem-sucedida** → Script `allow_internet.sh` adiciona regra de `iptables` para liberar o MAC do cliente.
7.  **Tráfego liberado** passa pelo `FORWARD` → `MASQUERADE` → Interface WAN (`enp1s0`) → Internet.
8.  **Após expiração da sessão** → Script `block_internet.sh` remove a regra, bloqueando o cliente.

---

## 2. Requisitos de Hardware

### Gateway Linux (Desktop ou Servidor)

```
CPU: Intel Core i3 ou superior / AMD Ryzen 3 ou superior
     (2 cores, 4 threads mínimo)

RAM: 4GB mínimo (8GB recomendado para 100+ usuários)

Storage: 
  - SSD 64GB mínimo
  - 20GB para sistema operacional
  - 20GB para aplicação e banco de dados
  - 20GB para logs e backups

Rede: 
  ✅ 2 (duas) interfaces de rede Ethernet obrigatórias:
     - Interface 1 (WAN): Conectada ao modem (internet)
     - Interface 2 (LAN): Conectada ao AP/Switch (rede interna)
  
  📌 Se o computador tiver apenas 1 porta Ethernet integrada:
     - Adicione uma placa de rede PCI-E Gigabit Ethernet
     - OU use um adaptador USB 3.0 para Ethernet Gigabit
```

### Modem do Provedor

```
Tipo: Qualquer modem de banda larga
Configuração: Modo Bridge (sem roteamento/NAT)
```

### Roteador Doméstico (como Access Point)

```
Tipo: Qualquer roteador Wi-Fi doméstico
Capacidade: Wi-Fi 802.11n ou superior
Portas: Mínimo 1 porta LAN disponível
Configuração: Modo Access Point / DHCP desabilitado
```

---

## 3. Requisitos de Software

-   **Ubuntu 22.04 LTS** (Server ou Desktop)
-   **Node.js v18+** (será instalado)
-   **Git** (será instalado)
-   Acesso root ou usuário com privilégios `sudo`

---

## 4. Instalação do Ubuntu

### Opção 1: Instalação Limpa (Recomendada)

1.  **Baixe o Ubuntu 22.04 LTS**:
    -   Acesse: https://ubuntu.com/download/server
    -   Escolha: **Ubuntu Server 22.04 LTS** (mais leve) ou **Ubuntu Desktop 22.04 LTS** (se precisar de interface gráfica)

2.  **Crie um pendrive bootável**:
    -   Use ferramentas como **Rufus** (Windows) ou **Etcher** (Linux/Mac/Windows)
    -   Grave a ISO do Ubuntu no pendrive

3.  **Instale o Ubuntu**:
    -   Conecte o pendrive no computador que será o gateway
    -   Boot pelo pendrive (geralmente pressione F12, F2 ou Del durante a inicialização)
    -   Siga o assistente de instalação:
        -   Idioma: Português do Brasil
        -   Layout do teclado: Português (Brasil)
        -   Tipo de instalação: **Apagar disco e instalar Ubuntu** (se for um computador dedicado)
        -   Crie um usuário administrador
        -   Aguarde a instalação completar e reinicie

4.  **Primeiro boot**:
    ```bash
    # Atualizar o sistema
    sudo apt update && sudo apt upgrade -y
    
    # Instalar SSH (para acesso remoto, opcional)
    sudo apt install openssh-server -y
    ```

### Opção 2: Dual Boot (Se já tem outro SO instalado)

Se o computador já tem Windows ou outro sistema operacional e você quer manter ambos:

1.  Faça backup de todos os dados importantes
2.  Use o particionador durante a instalação do Ubuntu
3.  Escolha **"Instalar Ubuntu ao lado de [Sistema Existente]"**
4.  O Ubuntu criará um menu de boot (GRUB) para escolher qual sistema iniciar

---

## 5. Configuração das Interfaces de Rede

### Passo 1: Identificar as Interfaces

Após o Ubuntu estar instalado, identifique suas interfaces de rede:

```bash
# Listar todas as interfaces de rede
ip addr show

# Ou use
ip link show
```

**Saída esperada** (os nomes podem variar):
```
1: lo: <LOOPBACK,UP,LOWER_UP> ...
2: enp1s0: <BROADCAST,MULTICAST,UP,LOWER_UP> ...  ← Interface WAN (internet)
3: enp2s0: <BROADCAST,MULTICAST,UP,LOWER_UP> ...  ← Interface LAN (rede interna)
```

**Identificando qual é qual:**
-   **enp1s0**: Se estiver conectada ao modem, é a WAN
-   **enp2s0**: Se estiver conectada ao AP/switch, é a LAN

### Passo 2: Configurar IPs Estáticos com Netplan

O Ubuntu 22.04 usa o **Netplan** para configuração de rede.

Edite o arquivo de configuração:

```bash
sudo nano /etc/netplan/00-installer-config.yaml
```

**Cole a seguinte configuração** (ajuste os nomes das interfaces se necessário):

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    # Interface WAN (conectada ao modem)
    enp1s0:
      dhcp4: true
      dhcp6: no
      optional: true
    
    # Interface LAN (conectada ao AP/switch)
    enp2s0:
      dhcp4: no
      dhcp6: no
      addresses:
        - 192.168.10.1/24
      nameservers:
        addresses:
          - 8.8.8.8
          - 8.8.4.4
```

**Salve o arquivo** (Ctrl+O, Enter, Ctrl+X).

**Aplique as configurações**:

```bash
# Testar a configuração antes de aplicar
sudo netplan try

# Se estiver tudo ok, aplique permanentemente
sudo netplan apply

# Verificar se os IPs foram configurados
ip addr show
```

**Resultado esperado**:
-   `enp1s0`: Deve ter um IP obtido via DHCP do modem (ex: 192.168.0.100, 10.0.0.2, etc.)
-   `enp2s0`: Deve ter o IP estático `192.168.10.1/24`

---

## 6. Configuração do Gateway e Firewall

### Passo 1: Habilitar IP Forwarding

O IP forwarding permite que o Ubuntu encaminhe pacotes entre as interfaces WAN e LAN:

```bash
# Habilitar temporariamente
sudo sysctl -w net.ipv4.ip_forward=1

# Habilitar permanentemente
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf

# Aplicar mudanças
sudo sysctl -p
```

### Passo 2: Criar Script de Configuração do iptables

Crie o script que configurará todas as regras de firewall:

```bash
sudo nano /usr/local/bin/setup-captive-firewall.sh
```

**Cole o seguinte conteúdo**:

```bash
#!/bin/bash

# Configurações
WAN_INTERFACE="enp1s0"          # Interface conectada ao modem (internet)
LAN_INTERFACE="enp2s0"          # Interface conectada ao AP/switch
LAN_NETWORK="192.168.10.0/24"   # Rede interna
CAPTIVE_SERVER_PORT="3000"      # Porta do servidor captive portal

echo "=== Configurando Firewall do Captive Portal ==="

# Limpar todas as regras existentes
echo "Limpando regras antigas..."
iptables -F
iptables -t nat -F
iptables -t mangle -F
iptables -X

# Políticas padrão
echo "Configurando políticas padrão..."
iptables -P INPUT ACCEPT
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# Regra 1: Permitir tráfego na interface loopback
iptables -A INPUT -i lo -j ACCEPT

# Regra 2: Permitir tráfego já estabelecido
iptables -A INPUT -m state --state RELATED,ESTABLISHED -j ACCEPT
iptables -A FORWARD -m state --state RELATED,ESTABLISHED -j ACCEPT

# Regra 3: Permitir SSH (para administração remota)
iptables -A INPUT -p tcp --dport 22 -j ACCEPT

# Regra 4: Permitir acesso ao servidor captive portal da LAN
iptables -A INPUT -i $LAN_INTERFACE -p tcp --dport $CAPTIVE_SERVER_PORT -j ACCEPT

# Regra 5: Permitir DNS da LAN para o gateway
iptables -A INPUT -i $LAN_INTERFACE -p udp --dport 53 -j ACCEPT
iptables -A INPUT -i $LAN_INTERFACE -p tcp --dport 53 -j ACCEPT

# Regra 6: Permitir DHCP da LAN
iptables -A INPUT -i $LAN_INTERFACE -p udp --dport 67:68 -j ACCEPT

# === Regras do Captive Portal ===

# Regra 7: Redirecionar HTTP (porta 80) para o servidor captive portal
echo "Configurando redirecionamento HTTP para captive portal..."
iptables -t nat -A PREROUTING -i $LAN_INTERFACE -p tcp --dport 80 -j REDIRECT --to-port $CAPTIVE_SERVER_PORT

# Regra 8: Permitir DNS para todos (necessário para resolução de nomes)
iptables -A FORWARD -p udp --dport 53 -j ACCEPT
iptables -A FORWARD -p tcp --dport 53 -j ACCEPT

# Regra 9: Permitir HTTPS para o servidor captive portal (OAuth callbacks)
iptables -A FORWARD -p tcp --dport 443 -d accounts.google.com -j ACCEPT
iptables -A FORWARD -p tcp --dport 443 -d www.facebook.com -j ACCEPT
iptables -A FORWARD -p tcp --dport 443 -d graph.facebook.com -j ACCEPT

# Regra 10: BLOQUEAR todo o resto por padrão (será liberado por MAC após autenticação)
iptables -A FORWARD -j DROP

# === NAT para compartilhar internet ===
echo "Configurando NAT (MASQUERADE)..."
iptables -t nat -A POSTROUTING -o $WAN_INTERFACE -j MASQUERADE

echo "=== Firewall configurado com sucesso! ==="
echo ""
echo "Regras ativas:"
iptables -L -v -n
echo ""
echo "Regras NAT:"
iptables -t nat -L -v -n
```

**Salve o arquivo** (Ctrl+O, Enter, Ctrl+X).

**Torne o script executável**:

```bash
sudo chmod +x /usr/local/bin/setup-captive-firewall.sh
```

**Execute o script para testar**:

```bash
sudo /usr/local/bin/setup-captive-firewall.sh
```

### Passo 3: Instalar iptables-persistent (Para Salvar Regras)

Para que as regras do `iptables` sejam restauradas após reiniciar o servidor:

```bash
# Instalar
sudo apt install iptables-persistent -y

# Durante a instalação, escolha "Yes" para salvar as regras atuais

# Para salvar manualmente no futuro
sudo netfilter-persistent save

# Para recarregar as regras
sudo netfilter-persistent reload
```

---

## 7. Configuração do DHCP

O `dnsmasq` é um servidor DHCP/DNS leve e eficiente, perfeito para o gateway.

### Passo 1: Instalar dnsmasq

```bash
sudo apt install dnsmasq -y
```

### Passo 2: Fazer Backup da Configuração Original

```bash
sudo mv /etc/dnsmasq.conf /etc/dnsmasq.conf.original
```

### Passo 3: Criar Nova Configuração

```bash
sudo nano /etc/dnsmasq.conf
```

**Cole o seguinte conteúdo**:

```conf
# Interface de rede (apenas na LAN)
interface=enp2s0
bind-interfaces

# Desabilitar função DNS (usaremos apenas DHCP)
port=0

# Range de IPs para DHCP
dhcp-range=192.168.10.100,192.168.10.254,12h

# Opções DHCP
dhcp-option=3,192.168.10.1     # Gateway padrão
dhcp-option=6,8.8.8.8,8.8.4.4  # Servidores DNS (Google)

# Registrar concessões DHCP em arquivo
dhcp-leasefile=/var/lib/misc/dnsmasq.leases

# Log (opcional, descomente para debug)
# log-queries
# log-dhcp

# Autoridade DHCP
dhcp-authoritative

# Ignorar solicitações de outras interfaces
except-interface=enp1s0
except-interface=lo
```

**Salve o arquivo** (Ctrl+O, Enter, Ctrl+X).

### Passo 4: Reiniciar o Serviço

```bash
# Reiniciar dnsmasq
sudo systemctl restart dnsmasq

# Habilitar para iniciar no boot
sudo systemctl enable dnsmasq

# Verificar status
sudo systemctl status dnsmasq
```

**Verificar concessões DHCP** (após clientes se conectarem):

```bash
cat /var/lib/misc/dnsmasq.leases
```

---

## 8. Instalação do Servidor Captive Portal

### Passo 1: Instalar Node.js

```bash
# Instalar dependências necessárias
sudo apt install curl -y

# Adicionar repositório NodeSource para Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# Instalar Node.js
sudo apt install nodejs -y

# Verificar instalação
node --version  # Deve mostrar v18.x ou superior
npm --version
```

### Passo 2: Instalar Git

```bash
sudo apt install git -y
```

### Passo 3: Clonar o Repositório

```bash
# Criar diretório para aplicações
sudo mkdir -p /opt/captive-portal
sudo chown $USER:$USER /opt/captive-portal

# Clonar o projeto
cd /opt/captive-portal
git clone https://github.com/rayscosta/captive-portal-network.git .
```

### Passo 4: Instalar Dependências

```bash
cd /opt/captive-portal
npm install --production
```

### Passo 5: Configurar Variáveis de Ambiente

```bash
# Copiar o exemplo
cp .env.example .env

# Editar o arquivo
nano .env
```

**Configure as seguintes variáveis** (exemplo):

```env
# --- Server ---
PORT=3000
NODE_ENV=production
HOST=0.0.0.0

# --- Database ---
DATABASE_PATH=./database.sqlite

# --- Admin Authentication (JWT) ---
SESSION_SECRET=gere_um_segredo_aleatorio_muito_forte_aqui
ADMIN_USERNAME=admin
ADMIN_PASSWORD=SuaSenhaFortePara0Admin

# --- Captive Portal ---
CAPTIVE_SESSION_TTL_MINUTES=120
INSTAGRAM_REDIRECT_URL=https://www.instagram.com/sua_instituicao/

# --- OAuth Google ---
GOOGLE_CLIENT_ID=seu_id_de_cliente_google.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu_segredo_de_cliente_google
GOOGLE_CALLBACK_URL=http://192.168.10.1:3000/captive/callback

# --- OAuth Facebook ---
FACEBOOK_APP_ID=seu_id_de_app_do_facebook
FACEBOOK_APP_SECRET=seu_segredo_de_app_do_facebook
FACEBOOK_CALLBACK_URL=http://192.168.10.1:3000/captive/callback
```

**Salve o arquivo** (Ctrl+O, Enter, Ctrl+X).

### Passo 6: Inicializar o Banco de Dados

```bash
cd /opt/captive-portal
node src/db/connection.js
```

### Passo 7: Criar Usuário Administrador

```bash
node scripts/create_admin.js admin "SuaSenhaForte123"
```

### Passo 8: Atualizar os Scripts de Firewall

Os scripts `allow_internet.sh` e `block_internet.sh` precisam usar as interfaces corretas:

```bash
nano scripts/allow_internet.sh
```

**Certifique-se de que tem este conteúdo**:

```bash
#!/bin/bash

MAC=$1
COMMENT="captive-user-${MAC}"

if [ -z "$MAC" ]; then
    echo "Uso: $0 <MAC_ADDRESS>"
    exit 1
fi

# Permitir FORWARD para este MAC específico
iptables -I FORWARD 1 -m mac --mac-source $MAC -j ACCEPT -m comment --comment "$COMMENT"

echo "Acesso liberado para MAC: $MAC"
```

Faça o mesmo para `block_internet.sh`:

```bash
nano scripts/block_internet.sh
```

```bash
#!/bin/bash

MAC=$1
COMMENT="captive-user-${MAC}"

if [ -z "$MAC" ]; then
    echo "Uso: $0 <MAC_ADDRESS>"
    exit 1
fi

# Remover regra de FORWARD para este MAC
iptables -D FORWARD -m mac --mac-source $MAC -j ACCEPT -m comment --comment "$COMMENT" 2>/dev/null

echo "Acesso bloqueado para MAC: $MAC"
```

**Torne os scripts executáveis**:

```bash
chmod +x scripts/*.sh
```

### Passo 9: Testar a Aplicação

```bash
cd /opt/captive-portal
npm start
```

Acesse no navegador: `http://192.168.10.1:3000/health`  
Deve retornar: `{"ok":true}`

---

## 9. Automação e Serviços Systemd

Para que a aplicação inicie automaticamente após reiniciar o servidor:

### Criar Serviço Systemd

```bash
sudo nano /etc/systemd/system/captive-portal.service
```

**Cole o seguinte conteúdo**:

```ini
[Unit]
Description=Captive Portal Network Server
After=network.target

[Service]
Type=simple
User=seu_usuario
WorkingDirectory=/opt/captive-portal
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=captive-portal

# Variáveis de ambiente (ou use EnvironmentFile)
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

**Substitua `seu_usuario`** pelo seu nome de usuário atual:

```bash
# Descubra seu usuário
whoami

# Edite o arquivo e substitua
```

**Salve o arquivo** (Ctrl+O, Enter, Ctrl+X).

### Habilitar e Iniciar o Serviço

```bash
# Recarregar configurações do systemd
sudo systemctl daemon-reload

# Habilitar o serviço para iniciar no boot
sudo systemctl enable captive-portal

# Iniciar o serviço agora
sudo systemctl start captive-portal

# Verificar status
sudo systemctl status captive-portal

# Ver logs em tempo real
sudo journalctl -u captive-portal -f
```

### Criar Serviço para Restaurar Firewall no Boot

```bash
sudo nano /etc/systemd/system/captive-firewall.service
```

**Cole o seguinte conteúdo**:

```ini
[Unit]
Description=Captive Portal Firewall Rules
After=network.target
Before=captive-portal.service

[Service]
Type=oneshot
ExecStart=/usr/local/bin/setup-captive-firewall.sh
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
```

**Habilitar o serviço**:

```bash
sudo systemctl daemon-reload
sudo systemctl enable captive-firewall
```

---

## 10. Configuração do Roteador Doméstico como AP

Siga este guia detalhado para transformar seu roteador doméstico em um Access Point puro.

### Topologia de Conexão

```
Gateway Ubuntu [enp2s0] ◄──── Cabo Ethernet ────► [Porta LAN 1-4] Roteador
```

**⚠️ IMPORTANTE**: **NÃO conecte na porta WAN/Internet do roteador!** Use apenas uma das portas LAN.

### Passo a Passo

1.  **Conecte seu computador ao roteador**:
    -   Use um cabo Ethernet ou conecte-se ao Wi-Fi do roteador.

2.  **Acesse o painel de administração**:
    -   Abra o navegador e vá para o IP padrão do roteador (geralmente `192.168.0.1` ou `192.168.1.1`).
    -   Faça login com as credenciais padrão (geralmente `admin` / `admin`).

3.  **Procure por "Modo Access Point" ou "Modo AP"**:
    -   Se o roteador tiver essa opção, ative-a. O roteador fará as configurações automaticamente.
    -   Pule para o passo 7 se encontrou essa opção.

4.  **Configuração Manual - Desabilitar DHCP**:
    -   Vá para **LAN** ou **Rede Local** → **Servidor DHCP**.
    -   **Desabilite** o servidor DHCP.
    -   Salve as configurações.

5.  **Configuração Manual - Definir IP Estático**:
    -   Na mesma seção **LAN** ou **Configurações de IP**:
        ```
        Endereço IP: 192.168.10.2
        Máscara de Sub-rede: 255.255.255.0
        Gateway Padrão: 192.168.10.1
        DNS Primário: 192.168.10.1
        ```
    -   Salve as configurações.
    -   **O roteador pode reiniciar. Após reiniciar, acesse-o pelo novo IP: `192.168.10.2`**.

6.  **Configurar Wi-Fi**:
    -   Vá para **Wireless** ou **Wi-Fi**.
    -   Configure:
        ```
        SSID: CaptivePortal_WiFi (ou o nome que desejar)
        Segurança: Aberta (Open/None) ← IMPORTANTE para captive portal
        Canal: Auto ou fixo (1, 6 ou 11 para 2.4GHz)
        ```
    -   Salve as configurações.

7.  **Fazer a Conexão Física**:
    -   Desligue o roteador.
    -   Conecte um cabo Ethernet da **porta LAN do roteador** (1, 2, 3 ou 4) para a **porta `enp2s0` do Gateway Ubuntu**.
    -   **Não use a porta WAN/Internet do roteador!**
    -   Ligue o roteador.

8.  **Testar**:
    -   Procure pela rede Wi-Fi "CaptivePortal_WiFi" no seu smartphone.
    -   Conecte-se a ela.
    -   O smartphone deve receber um IP na faixa `192.168.10.100-254` automaticamente.

---

## 11. Testes e Validação

### Teste 1: Conectividade Básica do Gateway

No Gateway Ubuntu:

```bash
# Ping para interface LAN
ping -c 4 192.168.10.1

# Ping para a internet
ping -c 4 8.8.8.8

# Verificar rotas
ip route show
```

### Teste 2: Verificar Interfaces e IPs

```bash
# Verificar interfaces
ip addr show

# Deve ver:
# - enp1s0 com IP da internet (ex: 10.0.0.2)
# - enp2s0 com IP 192.168.10.1
```

### Teste 3: Verificar Regras do iptables

```bash
# Listar todas as regras
sudo iptables -L -v -n

# Listar regras NAT
sudo iptables -t nat -L -v -n

# Deve ver a regra de REDIRECT na porta 80
# Deve ver a regra de MASQUERADE
```

### Teste 4: Verificar Serviços

```bash
# Status do dnsmasq
sudo systemctl status dnsmasq

# Status da aplicação
sudo systemctl status captive-portal

# Ver concessões DHCP
cat /var/lib/misc/dnsmasq.leases
```

### Teste 5: Acessar a API

No navegador do Gateway ou de outro computador na mesma rede:

```
http://192.168.10.1:3000/health
```

Deve retornar: `{"ok":true}`

### Teste 6: Testar Captive Portal com Cliente

1.  **Conecte um smartphone** ao Wi-Fi "CaptivePortal_WiFi".
2.  **Abra o navegador** e tente acessar qualquer site HTTP (ex: `http://example.com`).
3.  **Você deve ser redirecionado** para `http://192.168.10.1:3000/captive`.
4.  **Faça login** com Google ou Facebook.
5.  **Após o login**, você deve ser redirecionado para o Instagram configurado.
6.  **Teste a internet**: Acesse qualquer site. Deve funcionar normalmente.

### Teste 7: Verificar Logs

```bash
# Logs da aplicação em tempo real
sudo journalctl -u captive-portal -f

# Logs do sistema
sudo tail -f /var/log/syslog
```

---

## 12. Troubleshooting

### Problema: Cliente não recebe IP via DHCP

**Diagnóstico**:
```bash
# Verificar se dnsmasq está rodando
sudo systemctl status dnsmasq

# Ver logs do dnsmasq
sudo journalctl -u dnsmasq -f
```

**Soluções**:
1.  Verifique se a interface `enp2s0` está configurada corretamente no `/etc/dnsmasq.conf`.
2.  Verifique se o cabo está conectado e a interface está "UP":
    ```bash
    ip link show enp2s0
    ```
3.  Reinicie o dnsmasq:
    ```bash
    sudo systemctl restart dnsmasq
    ```

### Problema: Gateway não tem acesso à internet

**Diagnóstico**:
```bash
# Verificar se a interface WAN tem IP
ip addr show enp1s0

# Verificar se há rota para a internet
ip route show

# Testar DNS
nslookup google.com
```

**Soluções**:
1.  Verifique se o cabo do modem está conectado em `enp1s0`.
2.  Verifique se o modem está em modo bridge e fornecendo IP via DHCP.
3.  Reinicie a interface:
    ```bash
    sudo ip link set enp1s0 down
    sudo ip link set enp1s0 up
    sudo dhclient enp1s0
    ```

### Problema: Redirecionamento HTTP não funciona

**Diagnóstico**:
```bash
# Verificar se a regra de REDIRECT existe
sudo iptables -t nat -L PREROUTING -v -n | grep 80

# Verificar se IP forwarding está ativado
sysctl net.ipv4.ip_forward
```

**Soluções**:
1.  Execute o script de firewall novamente:
    ```bash
    sudo /usr/local/bin/setup-captive-firewall.sh
    ```
2.  Verifique se a aplicação está rodando na porta 3000:
    ```bash
    sudo netstat -tlnp | grep 3000
    ```

### Problema: Aplicação não inicia

**Diagnóstico**:
```bash
# Ver logs de erro
sudo journalctl -u captive-portal -n 50 --no-pager
```

**Soluções**:
1.  Verifique se todas as dependências foram instaladas:
    ```bash
    cd /opt/captive-portal
    npm install
    ```
2.  Verifique se o arquivo `.env` está configurado corretamente.
3.  Verifique se a porta 3000 não está em uso:
    ```bash
    sudo lsof -i :3000
    ```

### Problema: OAuth não funciona (Google/Facebook)

**Soluções**:
1.  Verifique se as credenciais no `.env` estão corretas.
2.  Verifique se a URL de callback está configurada corretamente nos consoles de desenvolvedor do Google/Facebook:
    ```
    http://192.168.10.1:3000/captive/callback
    ```
3.  Certifique-se de que o firewall permite HTTPS para os domínios do Google e Facebook (regra já incluída no script de firewall).

### Problema: Sessão não expira / Cliente não é bloqueado

**Diagnóstico**:
```bash
# Verificar se o serviço de expiração está rodando
sudo journalctl -u captive-portal | grep SessionExpiration
```

**Soluções**:
1.  Verifique se os scripts `block_internet.sh` têm permissão de execução:
    ```bash
    ls -la /opt/captive-portal/scripts/
    ```
2.  Teste o script manualmente:
    ```bash
    sudo /opt/captive-portal/scripts/block_internet.sh AA:BB:CC:DD:EE:FF
    ```

---

## 📌 Conclusão

Com esta configuração, você terá um **sistema Captive Portal completo e profissional** rodando em um gateway Linux Ubuntu dedicado.

**Vantagens desta abordagem**:
✅ Performance nativa sem overhead de virtualização  
✅ Acesso direto ao hardware de rede  
✅ iptables completo com todos os módulos  
✅ Estabilidade para operação 24/7  
✅ Fácil manutenção e troubleshooting  

**Para ambientes de produção maiores**, considere:
-   Usar um servidor dedicado (não um desktop)
-   Adicionar um sistema de backup automático do banco de dados
-   Configurar monitoramento com ferramentas como Prometheus + Grafana
-   Implementar um segundo gateway para redundância (failover)

---

## 🔗 Referências

-   [Documentação oficial do Ubuntu](https://ubuntu.com/server/docs)
-   [Netplan - Configuração de Rede](https://netplan.io/)
-   [iptables Tutorial](https://netfilter.org/documentation/)
-   [dnsmasq Documentation](https://thekelleys.org.uk/dnsmasq/doc.html)
-   [Systemd Service Management](https://www.freedesktop.org/software/systemd/man/systemd.service.html)
