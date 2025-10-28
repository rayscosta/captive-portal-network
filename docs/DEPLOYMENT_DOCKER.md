# Deployment com Docker - Captive Portal Network

Este guia descreve como fazer o deployment do sistema Captive Portal Network utilizando Docker e Docker Compose.

## 📋 Índice

- [Pré-requisitos](#pré-requisitos)
- [Arquitetura Docker](#arquitetura-docker)
- [Instalação Rápida](#instalação-rápida)
- [Configuração Detalhada](#configuração-detalhada)
- [Comandos Docker](#comandos-docker)
- [Troubleshooting](#troubleshooting)
- [Segurança](#segurança)

## 🔧 Pré-requisitos

### Hardware
- Servidor Linux com 2 interfaces de rede (WAN + LAN)
- Mínimo 2GB RAM
- 10GB de espaço em disco

### Software
- Ubuntu 22.04 LTS (recomendado) ou outra distribuição Linux
- Docker Engine 20.10+
- Docker Compose 2.0+
- iptables configurado no host

### Instalação do Docker

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install -y ca-certificates curl gnupg lsb-release

# Adicionar chave GPG oficial do Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Adicionar repositório
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker Engine e Compose
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Verificar instalação
docker --version
docker compose version

# Adicionar usuário atual ao grupo docker (opcional, para não usar sudo)
sudo usermod -aG docker $USER
newgrp docker
```

## 🏗️ Arquitetura Docker

```
┌─────────────────────────────────────────────────────────┐
│                    Host Linux (Ubuntu)                   │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │         Docker Container (network_mode: host)      │ │
│  │                                                    │ │
│  │  ┌──────────────────────────────────────────────┐ │ │
│  │  │      Captive Portal Application (Node.js)    │ │ │
│  │  │  - Express Server (porta 3000)               │ │ │
│  │  │  - SQLite Database                           │ │ │
│  │  │  - OAuth Integration                         │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  │  Capabilities: NET_ADMIN, NET_RAW                 │ │
│  │  Acesso direto ao iptables do host               │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  iptables (gerenciado pelo container)                   │
│  dnsmasq (executado no host)                            │
│                                                          │
│  eth0 (WAN) ←→ Internet                                 │
│  eth1 (LAN) ←→ Access Point ←→ Clientes Wi-Fi          │
└─────────────────────────────────────────────────────────┘
```

### Por que `network_mode: host`?

O container usa `network_mode: host` porque:

1. **Acesso direto às interfaces de rede**: Necessário para manipular iptables
2. **Performance**: Sem overhead de NAT do Docker
3. **Simplicidade**: Não precisa de port forwarding complexo
4. **Captive Portal**: Interceptação de tráfego HTTP requer acesso direto às interfaces

## 🚀 Instalação Rápida

### 1. Clonar o repositório

```bash
git clone https://github.com/rayscosta/captive-portal-network.git
cd captive-portal-network
```

### 2. Configurar variáveis de ambiente

```bash
# Copiar template
cp .env.example .env

# Editar com seus valores
nano .env
```

**Variáveis obrigatórias a configurar:**

```bash
# OAuth Google (obter em: https://console.cloud.google.com/)
GOOGLE_CLIENT_ID=seu_client_id_aqui
GOOGLE_CLIENT_SECRET=seu_client_secret_aqui

# OAuth Facebook (obter em: https://developers.facebook.com/)
FACEBOOK_APP_ID=seu_app_id_aqui
FACEBOOK_APP_SECRET=seu_app_secret_aqui

# Instagram (página para redirecionamento)
INSTAGRAM_REDIRECT_URL=https://instagram.com/sua_instituicao

# Segurança (ALTERAR EM PRODUÇÃO!)
ADMIN_PASSWORD=sua_senha_forte_aqui
SESSION_SECRET=$(openssl rand -hex 32)

# Interfaces de rede
WAN_INTERFACE=eth0  # ajustar conforme seu sistema
LAN_INTERFACE=eth1  # ajustar conforme seu sistema
```

### 3. Criar diretórios necessários

```bash
mkdir -p data logs
```

### 4. Configurar rede do host

**a) Configurar IP forwarding:**

```bash
sudo sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf
```

**b) Configurar interface LAN:**

```bash
# Editar Netplan (ajustar nomes das interfaces)
sudo nano /etc/netplan/01-netcfg.yaml
```

```yaml
network:
  version: 2
  ethernets:
    eth0:  # WAN - Internet
      dhcp4: true
    eth1:  # LAN - Rede local
      addresses:
        - 192.168.10.1/24
      dhcp4: false
```

```bash
# Aplicar configuração
sudo netplan apply
```

**c) Configurar dnsmasq (DHCP server):**

```bash
# Instalar dnsmasq
sudo apt install -y dnsmasq

# Configurar
sudo cp config/dnsmasq.conf /etc/dnsmasq.conf
sudo systemctl restart dnsmasq
sudo systemctl enable dnsmasq
```

### 5. Tornar scripts executáveis

```bash
chmod +x scripts/*.sh
```

### 6. Build e iniciar container

```bash
# Build da imagem
docker compose build

# Iniciar em background
docker compose up -d

# Ver logs
docker compose logs -f
```

### 7. Configurar firewall

O container precisa configurar o iptables no host. Execute:

```bash
# O script setup-captive-firewall.sh será executado pelo container
# mas você também pode executá-lo manualmente:
sudo ./scripts/setup-captive-firewall.sh
```

### 8. Verificar status

```bash
# Status do container
docker compose ps

# Logs da aplicação
docker compose logs captive-portal

# Healthcheck
curl http://localhost:3000/health

# Ver regras iptables
sudo iptables -L -n -v
sudo iptables -t nat -L -n -v
```

## 📝 Configuração Detalhada

### Estrutura de Arquivos

```
captive-portal-network/
├── dockerfile              # Definição da imagem Docker
├── docker-compose.yml      # Orquestração dos serviços
├── .dockerignore          # Arquivos ignorados no build
├── .env                   # Variáveis de ambiente (não commitado)
├── .env.example           # Template de variáveis
├── data/                  # Volume: banco de dados SQLite
│   └── database.sqlite
├── logs/                  # Volume: logs da aplicação
│   └── application.log
├── scripts/               # Volume: scripts shell (read-only)
│   ├── setup-captive-firewall.sh
│   ├── allow_internet.sh
│   └── block_internet.sh
└── src/                   # Código da aplicação
```

### Dockerfile Explicado

```dockerfile
# Multi-stage build para otimizar tamanho da imagem
FROM node:18-alpine AS builder
# Instala apenas dependências de produção

FROM node:18-alpine
# Imagem final leve (Alpine Linux)

RUN apk add --no-cache iptables bash curl dumb-init
# iptables: manipulação de firewall
# bash: execução dos scripts shell
# curl: healthcheck
# dumb-init: gerenciador de processos (PID 1)

RUN adduser -u 1001 -S captive
# Usuário não-root para segurança

USER captive
# Executa como usuário sem privilégios
# (NET_ADMIN capability dá acesso ao iptables)
```

### Docker Compose Explicado

```yaml
network_mode: host
# Container compartilha a rede do host
# Necessário para manipular iptables

cap_add:
  - NET_ADMIN  # Permite manipular iptables
  - NET_RAW    # Permite criar sockets raw

volumes:
  - ./data:/app/data          # Banco de dados persistente
  - ./scripts:/app/scripts:ro # Scripts (read-only)
  - ./logs:/app/logs          # Logs da aplicação

healthcheck:
  # Verifica se a aplicação está respondendo
  test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
```

## 🔨 Comandos Docker

### Gerenciamento Básico

```bash
# Iniciar
docker compose up -d

# Parar
docker compose down

# Reiniciar
docker compose restart

# Ver logs
docker compose logs -f captive-portal

# Ver logs das últimas 100 linhas
docker compose logs --tail=100 captive-portal

# Status dos containers
docker compose ps

# Executar comando dentro do container
docker compose exec captive-portal sh
```

### Build e Atualização

```bash
# Rebuild da imagem
docker compose build --no-cache

# Atualizar e reiniciar
docker compose up -d --build

# Pull de novas versões
git pull
docker compose down
docker compose build
docker compose up -d
```

### Manutenção

```bash
# Ver uso de recursos
docker stats

# Inspecionar container
docker compose exec captive-portal sh -c "ps aux"

# Backup do banco de dados
docker compose exec captive-portal cp /app/data/database.sqlite /app/data/backup-$(date +%Y%m%d).sqlite

# Limpar logs antigos
docker compose exec captive-portal sh -c "find /app/logs -name '*.log' -mtime +30 -delete"

# Ver regras iptables do host (fora do container)
sudo iptables -L FORWARD -n -v | grep ACCEPT
```

### Debug

```bash
# Shell interativo no container
docker compose exec captive-portal sh

# Ver variáveis de ambiente
docker compose exec captive-portal env

# Testar scripts manualmente
docker compose exec captive-portal /app/scripts/allow_internet.sh AA:BB:CC:DD:EE:FF

# Ver processos
docker compose exec captive-portal ps aux

# Testar conectividade
docker compose exec captive-portal curl -I http://google.com
```

## 🔍 Troubleshooting

### Container não inicia

```bash
# Ver logs detalhados
docker compose logs captive-portal

# Verificar se porta 3000 está em uso
sudo netstat -tlnp | grep 3000

# Verificar permissões
ls -la data/ logs/
```

### Scripts não funcionam

```bash
# Verificar se scripts têm permissão de execução
ls -la scripts/

# Tornar executáveis
chmod +x scripts/*.sh

# Testar script manualmente no host
sudo ./scripts/allow_internet.sh AA:BB:CC:DD:EE:FF

# Ver logs do syslog
sudo tail -f /var/log/syslog | grep allow_internet
```

### iptables não funciona

```bash
# Verificar capabilities do container
docker inspect captive-portal-app | grep -A 10 CapAdd

# Verificar se iptables está instalado no host
sudo iptables --version

# Ver regras atuais
sudo iptables -L -n -v
sudo iptables -t nat -L -n -v

# Reconfigurar firewall
sudo ./scripts/setup-captive-firewall.sh
```

### OAuth não funciona

```bash
# Verificar variáveis de ambiente
docker compose exec captive-portal env | grep GOOGLE
docker compose exec captive-portal env | grep FACEBOOK

# Testar callback URL
curl http://192.168.10.1:3000/auth/google/callback

# Ver logs da aplicação
docker compose logs -f captive-portal
```

### Performance issues

```bash
# Ver uso de recursos
docker stats captive-portal-app

# Ver conexões ativas
docker compose exec captive-portal ss -tuln

# Ver processos Node.js
docker compose exec captive-portal ps aux | grep node
```

## 🔒 Segurança

### Checklist de Segurança

- [ ] **Alterar senhas padrão**
  ```bash
  # Gerar senha forte
  openssl rand -base64 32
  ```

- [ ] **Gerar SESSION_SECRET forte**
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

- [ ] **Configurar OAuth callbacks com HTTPS** (em produção)
  ```bash
  GOOGLE_CALLBACK_URL=https://seu-dominio.com:3000/auth/google/callback
  ```

- [ ] **Limitar acesso SSH ao servidor**
  ```bash
  sudo ufw allow from 192.168.10.0/24 to any port 22
  sudo ufw enable
  ```

- [ ] **Configurar firewall do host**
  ```bash
  sudo ufw allow 3000/tcp
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  ```

- [ ] **Backup regular do banco de dados**
  ```bash
  # Adicionar ao crontab
  0 2 * * * docker compose -f /path/to/docker-compose.yml exec captive-portal cp /app/data/database.sqlite /app/data/backup-$(date +\%Y\%m\%d).sqlite
  ```

- [ ] **Monitorar logs**
  ```bash
  docker compose logs -f | grep -i error
  ```

- [ ] **Atualizar dependências regularmente**
  ```bash
  npm audit
  npm update
  docker compose build --no-cache
  ```

### Hardening Adicional

```bash
# Restringir acesso ao Docker socket
sudo chmod 660 /var/run/docker.sock

# Configurar AppArmor/SELinux
sudo apt install apparmor-utils

# Limitar recursos do container (em docker-compose.yml)
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 1G
    reservations:
      cpus: '1'
      memory: 512M
```

## 📊 Monitoramento

### Logs

```bash
# Ver logs em tempo real
docker compose logs -f

# Filtrar por nível de erro
docker compose logs | grep ERROR

# Exportar logs
docker compose logs > logs-$(date +%Y%m%d).txt
```

### Métricas

```bash
# CPU e memória
docker stats --no-stream captive-portal-app

# Conexões de rede
docker compose exec captive-portal ss -s

# Usuários conectados (via iptables)
sudo iptables -L FORWARD -n -v | grep ACCEPT | wc -l
```

### Health Checks

```bash
# Status HTTP
curl -I http://localhost:3000/health

# Verificar banco de dados
docker compose exec captive-portal sqlite3 /app/data/database.sqlite "SELECT COUNT(*) FROM captive_sessions WHERE status='active';"
```

## 🚀 Deployment em Produção

### Usando HTTPS (recomendado)

Adicionar Nginx ou Traefik como reverse proxy com Let's Encrypt:

```yaml
# docker-compose.yml (adicionar)
nginx:
  image: nginx:alpine
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - ./nginx.conf:/etc/nginx/nginx.conf:ro
    - ./certs:/etc/nginx/certs:ro
```

### Auto-start no Boot

```bash
# Criar systemd service
sudo nano /etc/systemd/system/captive-portal.service
```

```ini
[Unit]
Description=Captive Portal Network
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/captive-portal-network
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

```bash
# Habilitar
sudo systemctl enable captive-portal
sudo systemctl start captive-portal
```

## 📚 Referências

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [iptables Tutorial](https://www.frozentux.net/iptables-tutorial/iptables-tutorial.html)

---

**Desenvolvido por:** Captive Portal Network Team  
**Licença:** MIT  
**Versão:** 1.0.0
