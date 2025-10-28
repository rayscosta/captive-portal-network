# Guia de Instalação Rápida - Captive Portal Network

Este guia fornece instruções rápidas para instalar o sistema em um Gateway Linux Ubuntu.

## 📋 Pré-requisitos

- Ubuntu 22.04 LTS (Server ou Desktop) instalado
- Duas interfaces de rede físicas
- Acesso root (sudo)
- Conexão com a internet

## 🚀 Instalação Automática

```bash
# 1. Clone o repositório
git clone https://github.com/rayscosta/captive-portal-network.git
cd captive-portal-network

# 2. Torne o script executável
chmod +x scripts/install.sh

# 3. Execute o script de instalação
sudo ./scripts/install.sh
```

O script irá:
- ✅ Instalar todas as dependências (Node.js, iptables, dnsmasq, etc.)
- ✅ Configurar IP forwarding
- ✅ Criar usuário do sistema
- ✅ Instalar a aplicação em `/opt/captive-portal`
- ✅ Configurar serviços systemd
- ✅ Configurar dnsmasq (DHCP)
- ✅ Aplicar regras de firewall

## ⚙️ Configuração Pós-Instalação

### 1. Configurar Interfaces de Rede

Identifique suas interfaces:
```bash
ip addr show
```

Edite o Netplan:
```bash
sudo nano /etc/netplan/00-installer-config.yaml
```

Use o exemplo em `config/netplan-example.yaml` como base.

Aplique as configurações:
```bash
sudo netplan try  # Testar
sudo netplan apply  # Aplicar
```

### 2. Configurar Variáveis de Ambiente

Edite o arquivo `.env`:
```bash
sudo nano /opt/captive-portal/.env
```

Configure:
- `SESSION_SECRET` - Gere uma chave forte
- `ADMIN_USERNAME` e `ADMIN_PASSWORD`
- Credenciais OAuth (Google e Facebook)
- `INSTAGRAM_REDIRECT_URL`

### 3. Criar Administrador

```bash
cd /opt/captive-portal
sudo -u captive-portal node scripts/create_admin.js admin "SuaSenhaForte123"
```

### 4. Iniciar Serviços

```bash
# Iniciar firewall
sudo systemctl start captive-firewall
sudo systemctl status captive-firewall

# Iniciar aplicação
sudo systemctl start captive-portal
sudo systemctl status captive-portal
```

### 5. Verificar Logs

```bash
# Logs da aplicação
sudo journalctl -u captive-portal -f

# Logs do sistema
sudo tail -f /var/log/syslog

# Logs do dnsmasq
sudo journalctl -u dnsmasq -f
```

## 🧪 Testes

### Teste 1: Verificar Conectividade

```bash
# Ping na interface LAN
ping -c 4 192.168.10.1

# Ping na internet
ping -c 4 8.8.8.8
```

### Teste 2: Verificar API

```bash
curl http://localhost:3000/health
# Deve retornar: {"ok":true}
```

### Teste 3: Verificar Firewall

```bash
# Ver regras
sudo iptables -L -v -n

# Ver regras NAT
sudo iptables -t nat -L -v -n
```

### Teste 4: Verificar DHCP

```bash
# Ver concessões DHCP
cat /var/lib/misc/dnsmasq.leases
```

## 📱 Configurar Roteador como Access Point

Veja o guia completo em: [docs/DEPLOYMENT_LINUX_UBUNTU.md](../docs/DEPLOYMENT_LINUX_UBUNTU.md#10-configuração-do-roteador-doméstico-como-ap)

Resumo:
1. Acesse o painel do roteador (ex: 192.168.0.1)
2. Desabilite o servidor DHCP
3. Configure IP estático: 192.168.10.2
4. Configure gateway: 192.168.10.1
5. Configure Wi-Fi (SSID: "CaptivePortal_WiFi", segurança: Aberta)
6. Conecte cabo Ethernet de uma porta LAN do roteador para a interface LAN do gateway

## 🔧 Comandos Úteis

```bash
# Reiniciar serviços
sudo systemctl restart captive-portal
sudo systemctl restart dnsmasq

# Ver status
sudo systemctl status captive-portal
sudo systemctl status captive-firewall
sudo systemctl status dnsmasq

# Recarregar firewall
sudo /opt/captive-portal/scripts/setup-captive-firewall.sh
sudo netfilter-persistent save

# Listar clientes conectados
cat /var/lib/misc/dnsmasq.leases

# Ver regras de firewall para MACs autenticados
sudo iptables -L FORWARD -v -n | grep captive-user
```

## 🆘 Troubleshooting

### Problema: Clientes não recebem IP

```bash
# Verificar dnsmasq
sudo systemctl status dnsmasq
sudo journalctl -u dnsmasq -n 50

# Verificar interface LAN
ip addr show enp2s0
```

### Problema: Aplicação não inicia

```bash
# Ver logs de erro
sudo journalctl -u captive-portal -n 50

# Verificar se a porta está em uso
sudo lsof -i :3000
```

### Problema: Redirecionamento HTTP não funciona

```bash
# Verificar regras de NAT
sudo iptables -t nat -L PREROUTING -v -n | grep 80

# Recarregar firewall
sudo /opt/captive-portal/scripts/setup-captive-firewall.sh
```

## 📚 Documentação Completa

Para documentação detalhada, consulte:
- [Manual Executivo](docs/MANUAL_EXECUTIVO.md)
- [Guia de Implantação Completo](docs/DEPLOYMENT_LINUX_UBUNTU.md)
- [Documentação Técnica](docs/)

## 🔗 Links Úteis

- Repositório: https://github.com/rayscosta/captive-portal-network
- Issues: https://github.com/rayscosta/captive-portal-network/issues
