# Manual Executivo - Sistema Captive Portal Network

## 📋 Sumário Executivo

O **Captive Portal Network (CPN)** é uma solução completa de gerenciamento de acesso à internet via autenticação social, combinada com um sistema de monitoramento e controle remoto de ativos de TI. O sistema permite que estabelecimentos ofereçam Wi-Fi gratuito aos clientes mediante autenticação via Google ou Facebook, enquanto mantém controle total sobre a rede e os dispositivos conectados.

### Benefícios Principais

✅ **Wi-Fi Grátis Controlado**: Ofereça internet gratuita com autenticação social obrigatória  
✅ **Gerenciamento Remoto**: Controle ativos de TI (servidores, switches, roteadores) remotamente  
✅ **Marketing Digital**: Captura dados de usuários (com consentimento) para estratégias de marketing  
✅ **Segurança**: Controle de acesso baseado em sessões com timeout configurável  
✅ **Auditoria Completa**: Registros detalhados de todos os acessos e ações  
✅ **Escalabilidade**: Suporta múltiplos pontos de acesso e dispositivos simultâneos  

---

## 🎯 Casos de Uso

### 1. Restaurante/Café
- Clientes se conectam ao Wi-Fi "Restaurante_WiFi"
- São redirecionados para página de autenticação
- Fazem login com Google/Facebook
- Após autenticação, são direcionados ao Instagram do estabelecimento
- Acesso à internet liberado por tempo configurável (ex: 2 horas)

### 2. Shopping Center
- Múltiplos pontos de acesso em diferentes áreas
- Gerenciamento centralizado de todos os access points
- Controle de switches e roteadores remotamente
- Relatórios de uso e estatísticas de acesso

### 3. Hotel
- Wi-Fi gratuito para hóspedes
- Autenticação por quarto/período de estadia
- Monitoramento de qualidade de serviço
- Gerenciamento de equipamentos de rede distribuídos

---

## 🏗️ Arquitetura do Sistema

### Visão Geral

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENTES (Wi-Fi)                         │
│  📱 Smartphones  💻 Notebooks  📟 Tablets  🖥️ Desktops     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               GATEWAY/FIREWALL LINUX                        │
│  • iptables para redirect HTTP                              │
│  • NAT e masquerading                                        │
│  • Scripts de liberação/bloqueio                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              SERVIDOR CAPTIVE PORTAL                        │
│  • Node.js + Express                                         │
│  • SQLite Database                                           │
│  • OAuth 2.0 (Google/Facebook)                              │
│  • API REST para gerenciamento                              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  ATIVOS GERENCIADOS                         │
│  🖥️ Servidores  🔀 Switches  📡 Roteadores                │
│  (com agente Node.js instalado)                             │
└─────────────────────────────────────────────────────────────┘
```

### Componentes Principais

#### 1. **Gateway/Firewall Linux**
- **Função**: Interceptar e redirecionar tráfego HTTP não autenticado
- **Requisitos**: Linux com iptables e kernel 3.x+
- **Configuração**: Bridge entre rede interna e internet

#### 2. **Servidor Captive Portal**
- **Função**: Gerenciar autenticações, sessões e comandos
- **Requisitos**: Node.js 18+, 2GB RAM, 20GB disco
- **Acesso**: Interface web administrativa

#### 3. **Agentes nos Ativos**
- **Função**: Executar comandos remotos em dispositivos
- **Requisitos**: Node.js 18+, acesso à rede
- **Comunicação**: Polling via HTTPS a cada 3 segundos

---

## 🔧 Requisitos de Infraestrutura

### Hardware Necessário

#### Gateway/Firewall (OBRIGATÓRIO)
```
Equipamento: Servidor/PC com Linux
CPU: Dual-core 2.0 GHz ou superior
RAM: 4GB mínimo, 8GB recomendado
Rede: 2 interfaces de rede (LAN + WAN)
      - eth0: Internet (WAN)
      - eth1: Rede interna (LAN)
Storage: 50GB
SO: Ubuntu Server 22.04 LTS ou Debian 11+
```

**⚠️ IMPORTANTE**: Roteadores domésticos comuns (TP-Link, D-Link, Linksys) **NÃO funcionam** pois:
- Não suportam redirecionamento HTTP customizado
- Firmware limitado sem iptables completo
- Não permitem execução de scripts shell
- Não suportam NAT hairpinning adequado

#### Servidor Captive Portal
```
Equipamento: Servidor físico ou VM
CPU: Quad-core 2.5 GHz
RAM: 8GB mínimo, 16GB recomendado
Storage: 100GB SSD
SO: Ubuntu Server 22.04 LTS
Rede: 1 interface (acesso ao gateway)
```

#### Access Points (APs)
```
Equipamento: APs enterprise (Ubiquiti, Mikrotik, etc)
Funcionalidade: Modo Bridge/AP puro
Configuração: DHCP desabilitado (delegado ao gateway)
Quantidade: Conforme área de cobertura
```

### Topologia de Rede Recomendada

```
                    INTERNET
                       │
                       │ (eth0 - WAN)
                       ▼
              ┌────────────────┐
              │  GATEWAY LINUX │
              │   (Firewall)   │
              └────────┬───────┘
                       │ (eth1 - LAN)
                       │ VLAN 10: 192.168.10.0/24
                       │
         ┌─────────────┼─────────────┐
         │             │             │
         ▼             ▼             ▼
    ┌────────┐   ┌─────────┐   ┌──────────┐
    │  AP 1  │   │  AP 2   │   │ Servidor │
    │ Bridge │   │ Bridge  │   │ Captive  │
    └────────┘   └─────────┘   └──────────┘
         │             │             │
         └─────────────┴─────────────┘
                       │
              Clientes Wi-Fi
         (192.168.10.100-254)
```

### Configuração de Rede

#### Gateway Linux
```bash
# /etc/network/interfaces
auto eth0
iface eth0 inet dhcp  # Internet

auto eth1
iface eth1 inet static
  address 192.168.10.1
  netmask 255.255.255.0
  
# DHCP Server (dnsmasq)
interface=eth1
dhcp-range=192.168.10.100,192.168.10.254,12h
dhcp-option=option:router,192.168.10.1
dhcp-option=option:dns-server,8.8.8.8,8.8.4.4
```

#### iptables (no Gateway)
```bash
# Habilitar IP forwarding
echo 1 > /proc/sys/net/ipv4/ip_forward

# NAT para internet
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE

# Redirect HTTP não autenticado para captive portal
iptables -t nat -A PREROUTING -i eth1 -p tcp --dport 80 \
  -m mark ! --mark 1 -j DNAT --to-destination 192.168.10.2:3000

# Bloquear HTTPS até autenticação
iptables -A FORWARD -i eth1 -p tcp --dport 443 \
  -m mark ! --mark 1 -j DROP
```

---

## 📦 Instalação e Configuração

### Passo 1: Preparar o Gateway Linux

```bash
# Instalar dependências
sudo apt update
sudo apt install -y iptables-persistent dnsmasq

# Configurar interfaces de rede
sudo nano /etc/network/interfaces
# (adicionar configuração acima)

# Configurar dnsmasq
sudo nano /etc/dnsmasq.conf
# (adicionar configuração DHCP)

# Aplicar iptables
sudo nano /etc/iptables/rules.v4
# (adicionar regras acima)

# Reiniciar serviços
sudo systemctl restart networking
sudo systemctl restart dnsmasq
sudo iptables-restore < /etc/iptables/rules.v4
```

### Passo 2: Instalar Servidor Captive Portal

```bash
# Clone do repositório
git clone https://github.com/seu-usuario/captive-portal-network.git
cd captive-portal-network

# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
nano .env
```

**Configuração .env**:
```bash
# Servidor
PORT=3000
NODE_ENV=production

# Banco de dados
DATABASE_PATH=./database.sqlite

# Autenticação Admin
ADMIN_USERNAME=admin
ADMIN_PASSWORD=senha_segura_aqui

# OAuth Google
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_client_secret
GOOGLE_CALLBACK_URL=http://192.168.10.2:3000/auth/callback/google

# OAuth Facebook
FACEBOOK_APP_ID=seu_facebook_app_id
FACEBOOK_APP_SECRET=seu_facebook_app_secret
FACEBOOK_CALLBACK_URL=http://192.168.10.2:3000/auth/callback/facebook

# Sessões
SESSION_SECRET=chave_aleatoria_muito_segura
SESSION_TTL_MINUTES=120

# Instagram Redirect
INSTAGRAM_REDIRECT_URL=https://instagram.com/seu_estabelecimento
```

```bash
# Criar admin inicial
npm run create-admin

# Iniciar servidor
npm start

# Ou usar PM2 para produção
sudo npm install -g pm2
pm2 start src/server.js --name captive-portal
pm2 startup
pm2 save
```

### Passo 3: Configurar Access Points

```bash
# Para cada AP (via interface web):
1. Definir SSID: "Nome_do_Estabelecimento_WiFi"
2. Segurança: Aberta (sem senha) ou WPA2-PSK
3. Modo: Bridge/AP
4. DHCP: Desabilitado
5. Gateway: 192.168.10.1
6. VLAN: 10 (se suportado)
```

### Passo 4: Instalar Agentes nos Ativos

```bash
# Em cada ativo a ser gerenciado
cd /opt
git clone https://github.com/seu-usuario/captive-portal-network.git
cd captive-portal-network/agent

# Instalar dependências
npm install

# Configurar agente
cat > .env << EOF
SERVER_BASE_URL=http://192.168.10.2:3000
AGENT_TOKEN=token_gerado_no_admin
AGENT_IP=$(hostname -I | awk '{print $1}')
AGENT_MAC=$(ip link show | grep ether | head -1 | awk '{print $2}')
EOF

# Iniciar agente
pm2 start index.js --name cpn-agent
pm2 startup
pm2 save
```

---

## 🔐 Configuração OAuth

### Google OAuth

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto: "Captive Portal"
3. Navegue para "APIs & Services" > "Credentials"
4. Clique em "Create Credentials" > "OAuth 2.0 Client ID"
5. Tipo: Web application
6. Authorized redirect URIs:
   - `http://192.168.10.2:3000/auth/callback/google`
   - `http://SEU_DOMINIO/auth/callback/google` (se tiver)
7. Copie Client ID e Client Secret para o `.env`

### Facebook OAuth

1. Acesse [Facebook Developers](https://developers.facebook.com)
2. Crie um novo app: "Captive Portal"
3. Adicione produto "Facebook Login"
4. Configurações do Facebook Login:
   - Valid OAuth Redirect URIs:
     - `http://192.168.10.2:3000/auth/callback/facebook`
5. Configurações > Básico:
   - Copie App ID e App Secret para o `.env`

---

## 📊 Uso do Sistema

### Para Administradores

#### Acessar Painel Admin
```
URL: http://192.168.10.2:3000/admin
Usuário: admin (configurado no .env)
Senha: senha_segura_aqui
```

#### Cadastrar Ativo
1. Login no painel admin
2. Menu "Ativos" > "Novo Ativo"
3. Preencher:
   - Nome: Servidor-Principal
   - Tipo: server
   - IP: 192.168.10.50
   - MAC: 00:11:22:33:44:55
   - Token: (gerado automaticamente)
4. Copiar token gerado
5. Instalar agente no ativo usando o token

#### Enviar Comando
1. Menu "Comandos" > "Novo Comando"
2. Selecionar ativo
3. Escolher comando: UNAME, DF, UPTIME, LSROOT
4. Definir timeout (5-300s)
5. Aguardar execução
6. Ver resultado na lista de comandos

#### Visualizar Sessões
1. Menu "Usuários" > "Sessões Ativas"
2. Ver lista de clientes conectados
3. Informações disponíveis:
   - Nome do usuário
   - Dispositivo (iOS/Android/Desktop)
   - IP e MAC
   - Tempo de sessão
   - Data de expiração

### Para Clientes (Usuários Finais)

#### Conectar ao Wi-Fi
1. Conectar à rede "Nome_do_Estabelecimento_WiFi"
2. Abrir navegador (qualquer site HTTP)
3. Será redirecionado automaticamente para página de login
4. Escolher "Continuar com Google" ou "Continuar com Facebook"
5. Autorizar acesso (primeira vez)
6. Será redirecionado para Instagram do estabelecimento
7. Internet liberada por período configurado

#### Renovar Sessão
- Sessão expira automaticamente após tempo configurado
- Para renovar: repetir processo de login
- Dados do usuário são reutilizados (não pede autorização novamente)

---

## 📈 Monitoramento e Manutenção

### Logs do Sistema

```bash
# Logs do servidor captive portal
pm2 logs captive-portal

# Logs dos agentes
pm2 logs cpn-agent

# Logs do sistema (iptables)
sudo tail -f /var/log/syslog | grep iptables

# Logs do dnsmasq (DHCP)
sudo tail -f /var/log/syslog | grep dnsmasq
```

### Comandos Úteis

```bash
# Ver conexões ativas
sudo iptables -L -n -v

# Verificar NAT
sudo iptables -t nat -L -n -v

# Ver DHCP leases
cat /var/lib/misc/dnsmasq.leases

# Teste de conectividade
ping -c 4 8.8.8.8

# Reiniciar serviços
pm2 restart captive-portal
sudo systemctl restart dnsmasq
```

### Backup

```bash
# Backup do banco de dados
cp database.sqlite backups/database-$(date +%Y%m%d).sqlite

# Backup automático diário (cron)
0 2 * * * cd /opt/captive-portal-network && cp database.sqlite backups/database-$(date +\%Y\%m\%d).sqlite
```

---

## 🚨 Troubleshooting

### Cliente não é redirecionado

**Problema**: Cliente conecta no Wi-Fi mas não vê página de login

**Soluções**:
1. Verificar se iptables está ativo: `sudo iptables -L -t nat`
2. Verificar se servidor está rodando: `pm2 status`
3. Testar redirect manualmente: `curl http://example.com` (deve retornar HTML do portal)
4. Verificar logs: `sudo tail -f /var/log/syslog | grep iptables`

### Autenticação falha

**Problema**: Erro ao fazer login com Google/Facebook

**Soluções**:
1. Verificar se Client ID/Secret estão corretos no `.env`
2. Verificar se URL de callback está registrada no OAuth provider
3. Verificar logs do servidor: `pm2 logs captive-portal`
4. Testar conectividade: `curl https://accounts.google.com`

### Internet não libera após login

**Problema**: Usuário se autentica mas não consegue navegar

**Soluções**:
1. Verificar se script `allow_internet.sh` foi executado
2. Verificar se regra iptables foi adicionada: `sudo iptables -L -n -v | grep <IP_CLIENTE>`
3. Verificar se sessão foi criada no banco: consultar tabela `captive_sessions`
4. Verificar se gateway está fazendo NAT: `sudo iptables -t nat -L -n -v`

### Agente não conecta

**Problema**: Ativo aparece offline no painel admin

**Soluções**:
1. Verificar se agente está rodando: `pm2 status`
2. Verificar conectividade: `ping 192.168.10.2`
3. Verificar logs: `pm2 logs cpn-agent`
4. Verificar token no `.env` do agente
5. Testar manualmente: `curl http://192.168.10.2:3000/health`

---

## 💰 Custos Estimados

### Hardware
- Gateway Linux (PC/Servidor usado): R$ 500 - R$ 1.500
- Access Points enterprise (x3): R$ 300 - R$ 800 cada
- Servidor Captive Portal (VM ou dedicado): R$ 50 - R$ 200/mês
- **Total hardware**: R$ 1.600 - R$ 4.000 (one-time)

### Software
- Node.js: Gratuito
- Ubuntu Server: Gratuito
- Dependências: Gratuitas
- **Total software**: R$ 0

### Operação Mensal
- Energia elétrica (~100W 24/7): R$ 50/mês
- Link de internet: R$ 100 - R$ 300/mês
- Manutenção/monitoramento: R$ 200 - R$ 500/mês
- **Total operação**: R$ 350 - R$ 850/mês

### ROI Estimado
Para um estabelecimento com 200 acessos/dia:
- Emails capturados: ~6.000/mês
- Engajamento Instagram: +30% média
- Retorno em marketing: R$ 1.000 - R$ 3.000/mês
- **ROI**: Positivo em 2-4 meses

---

## 📞 Suporte e Contato

### Documentação Técnica
- Arquitetura detalhada: `docs/01-architecture.md`
- Fluxos do sistema: `docs/02-flows.md`
- APIs: `docs/05-api.md`
- Segurança: `docs/06-security.md`

### Comunidade
- Issues: https://github.com/seu-usuario/captive-portal-network/issues
- Discussões: https://github.com/seu-usuario/captive-portal-network/discussions

### Licença
MIT License - Uso livre com atribuição

---

**Versão**: 1.0.0  
**Última atualização**: Outubro 2025  
**Autor**: Equipe Captive Portal Network
