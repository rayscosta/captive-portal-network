# 🐳 Quick Start - Docker

Guia de início rápido para executar o Captive Portal Network com Docker.

## ⚡ Início Rápido (5 minutos)

### 1. Pré-requisitos

- Docker 20.10+ instalado
- Docker Compose 2.0+ instalado
- Servidor Linux com 2 interfaces de rede

### 2. Instalação

```bash
# Clone o repositório
git clone https://github.com/rayscosta/captive-portal-network.git
cd captive-portal-network

# Configure as variáveis de ambiente
cp .env.example .env
nano .env  # Edite com suas configurações

# Setup inicial (cria diretórios e permissões)
make setup

# Build e iniciar
make build
make up
```

### 3. Verificar

```bash
# Healthcheck
make healthcheck

# Ver logs
make logs

# Ver status
make status
```

## 📋 Variáveis Obrigatórias no .env

```bash
# OAuth Google (obter em: https://console.cloud.google.com/)
GOOGLE_CLIENT_ID=seu_google_client_id
GOOGLE_CLIENT_SECRET=seu_google_secret

# OAuth Facebook (obter em: https://developers.facebook.com/)
FACEBOOK_APP_ID=seu_facebook_app_id
FACEBOOK_APP_SECRET=seu_facebook_secret

# Segurança (ALTERAR!)
ADMIN_PASSWORD=sua_senha_forte

# Interfaces de rede (ajustar conforme seu sistema)
WAN_INTERFACE=eth0  # Interface conectada à internet
LAN_INTERFACE=eth1  # Interface da rede local
```

## 🔧 Comandos Essenciais

```bash
# Ver todos os comandos disponíveis
make help

# Gerenciamento
make up          # Iniciar
make down        # Parar
make restart     # Reiniciar
make logs        # Ver logs

# Operações
make shell       # Abrir shell no container
make healthcheck # Testar /health endpoint
make iptables    # Ver regras de firewall
make backup      # Backup do banco de dados

# Desenvolvimento
make rebuild     # Rebuild sem cache
make clean       # Limpar tudo
```

## 🌐 Acessar a Aplicação

- **Portal Captive**: http://192.168.10.1:3000/captive
- **Painel Admin**: http://192.168.10.1:3000/admin
- **API Docs (Swagger)**: http://192.168.10.1:3000/api-docs
- **Health Check**: http://192.168.10.1:3000/health

## 🔍 Troubleshooting

### Container não inicia

```bash
# Ver logs detalhados
docker compose logs captive-portal

# Ver erros específicos
docker compose logs | grep ERROR
```

### Scripts não funcionam

```bash
# Entrar no container
make shell

# Testar script manualmente
/app/scripts/allow_internet.sh AA:BB:CC:DD:EE:FF

# Ver logs do syslog (no host)
sudo tail -f /var/log/syslog | grep allow_internet
```

### iptables não funciona

```bash
# Verificar capabilities
docker inspect captive-portal-app | grep -A 10 CapAdd

# Ver regras atuais (no host)
sudo iptables -L -n -v

# Reconfigurar firewall
sudo ./scripts/setup-captive-firewall.sh
```

## 📚 Documentação Completa

Para mais detalhes, consulte:

- **[Deployment Docker Completo](DEPLOYMENT_DOCKER.md)** - Guia detalhado com troubleshooting
- **[README Principal](../README.md)** - Visão geral do projeto
- **[Documentação Técnica](README.md)** - Arquitetura e APIs

## 🚀 Deployment em Produção

### Auto-start com systemd

Crie `/etc/systemd/system/captive-portal.service`:

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

[Install]
WantedBy=multi-user.target
```

Habilitar:

```bash
sudo systemctl enable captive-portal
sudo systemctl start captive-portal
```

### Monitoramento

```bash
# Logs em tempo real
make logs

# Recursos (CPU/RAM)
make stats

# Usuários conectados
sudo iptables -L FORWARD -n -v | grep ACCEPT | wc -l
```

## ⚙️ Configuração de Rede

### 1. Configurar IP Forwarding (no host)

```bash
sudo sysctl -w net.ipv4.ip_forward=1
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf
```

### 2. Configurar Interface LAN (no host)

Editar `/etc/netplan/01-netcfg.yaml`:

```yaml
network:
  version: 2
  ethernets:
    eth0:  # WAN
      dhcp4: true
    eth1:  # LAN
      addresses:
        - 192.168.10.1/24
      dhcp4: false
```

Aplicar:

```bash
sudo netplan apply
```

### 3. Instalar e Configurar dnsmasq (no host)

```bash
# Instalar
sudo apt install -y dnsmasq

# Copiar configuração
sudo cp config/dnsmasq.conf /etc/dnsmasq.conf

# Reiniciar
sudo systemctl restart dnsmasq
sudo systemctl enable dnsmasq
```

## 🔐 Segurança

### Checklist Rápido

- [ ] Alterar `ADMIN_PASSWORD` no .env
- [ ] Gerar `SESSION_SECRET` forte
- [ ] Configurar OAuth callbacks corretos
- [ ] Habilitar firewall do host (ufw)
- [ ] Configurar backup automático
- [ ] Monitorar logs regularmente

### Gerar Secrets Fortes

```bash
# SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# ADMIN_PASSWORD
openssl rand -base64 32
```

## 🎯 Próximos Passos

1. ✅ Container rodando
2. ✅ Healthcheck passando
3. ✅ Firewall configurado
4. ⏳ Configurar OAuth (Google/Facebook)
5. ⏳ Configurar Access Point em modo bridge
6. ⏳ Testar fluxo completo de autenticação
7. ⏳ Configurar monitoramento e backups

---

**Dúvidas?** Consulte a [documentação completa](DEPLOYMENT_DOCKER.md) ou abra uma issue no GitHub.
