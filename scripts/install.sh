#!/bin/bash

# Script de Instalação do Captive Portal Network
# Para Ubuntu 22.04 LTS
# Execute com: sudo ./install.sh

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para imprimir mensagens
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    print_error "Este script deve ser executado como root (use sudo)"
    exit 1
fi

print_info "=== Instalação do Captive Portal Network ==="
echo ""

# 1. Atualizar sistema
print_info "Atualizando sistema..."
apt update && apt upgrade -y

# 2. Instalar dependências
print_info "Instalando dependências..."
apt install -y \
    curl \
    git \
    iptables \
    iptables-persistent \
    dnsmasq \
    net-tools \
    iproute2

# 3. Instalar Node.js 18.x
print_info "Instalando Node.js 18.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi

NODE_VERSION=$(node --version)
print_info "Node.js instalado: $NODE_VERSION"

# 4. Habilitar IP Forwarding
print_info "Habilitando IP Forwarding..."
if ! grep -q "net.ipv4.ip_forward=1" /etc/sysctl.conf; then
    echo "net.ipv4.ip_forward=1" >> /etc/sysctl.conf
fi
sysctl -w net.ipv4.ip_forward=1
sysctl -p

# 5. Criar usuário do sistema
print_info "Criando usuário captive-portal..."
if ! id "captive-portal" &>/dev/null; then
    useradd -r -s /bin/false -d /opt/captive-portal captive-portal
fi

# 6. Criar diretório da aplicação
print_info "Criando diretórios..."
mkdir -p /opt/captive-portal
CURRENT_DIR=$(pwd)

# 7. Copiar arquivos do projeto
print_info "Copiando arquivos do projeto..."
cp -r $CURRENT_DIR/* /opt/captive-portal/
chown -R captive-portal:captive-portal /opt/captive-portal

# 8. Instalar dependências do Node.js
print_info "Instalando dependências npm..."
cd /opt/captive-portal
sudo -u captive-portal npm install --production

# 9. Tornar scripts executáveis
print_info "Configurando permissões dos scripts..."
chmod +x /opt/captive-portal/scripts/*.sh

# 10. Configurar Netplan (pedir confirmação)
print_warn "Configuração de rede detectada."
print_warn "IMPORTANTE: Você precisa configurar as interfaces de rede manualmente."
print_warn "Execute: ip addr show"
print_warn "Depois edite: /etc/netplan/00-installer-config.yaml"
print_warn "Use o exemplo em: /opt/captive-portal/config/netplan-example.yaml"
echo ""
read -p "Pressione Enter para continuar..."

# 11. Configurar dnsmasq
print_info "Configurando dnsmasq..."
if [ -f /etc/dnsmasq.conf ]; then
    mv /etc/dnsmasq.conf /etc/dnsmasq.conf.backup.$(date +%Y%m%d%H%M%S)
fi
cp /opt/captive-portal/config/dnsmasq.conf /etc/dnsmasq.conf

# Perguntar qual é a interface LAN
read -p "Qual é o nome da interface LAN (ex: enp2s0)? " LAN_INTERFACE
sed -i "s/interface=enp2s0/interface=$LAN_INTERFACE/" /etc/dnsmasq.conf
sed -i "s/except-interface=enp1s0/except-interface=/" /etc/dnsmasq.conf

systemctl enable dnsmasq
systemctl restart dnsmasq

# 12. Configurar serviços systemd
print_info "Configurando serviços systemd..."

# Serviço do firewall
cp /opt/captive-portal/config/captive-firewall.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable captive-firewall

# Serviço da aplicação
cp /opt/captive-portal/config/captive-portal.service /etc/systemd/system/
# Ajustar usuário no serviço
sed -i "s/User=captive-portal/User=$(whoami)/" /etc/systemd/system/captive-portal.service
sed -i "s/Group=captive-portal/Group=$(whoami)/" /etc/systemd/system/captive-portal.service
systemctl daemon-reload
systemctl enable captive-portal

# 13. Criar arquivo .env se não existir
if [ ! -f /opt/captive-portal/.env ]; then
    print_info "Criando arquivo .env..."
    cp /opt/captive-portal/.env.example /opt/captive-portal/.env
    
    print_warn "IMPORTANTE: Edite o arquivo /opt/captive-portal/.env"
    print_warn "Configure as seguintes variáveis:"
    print_warn "  - SESSION_SECRET (gere uma chave forte)"
    print_warn "  - ADMIN_USERNAME e ADMIN_PASSWORD"
    print_warn "  - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL"
    print_warn "  - FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, FACEBOOK_CALLBACK_URL"
    print_warn "  - INSTAGRAM_REDIRECT_URL"
    echo ""
    read -p "Pressione Enter para continuar..."
fi

# 14. Inicializar banco de dados
print_info "Inicializando banco de dados..."
cd /opt/captive-portal
sudo -u captive-portal node src/db/connection.js || true

# 15. Criar admin (se necessário)
print_info "Para criar um usuário administrador, execute:"
print_info "  cd /opt/captive-portal"
print_info "  sudo -u captive-portal node scripts/create_admin.js <username> <password>"
echo ""

# 16. Configurar firewall
print_info "Configurando regras de firewall..."
read -p "Qual é o nome da interface WAN (ex: enp1s0)? " WAN_INTERFACE
read -p "Qual é o nome da interface LAN (ex: enp2s0)? " LAN_INTERFACE

sed -i "s/WAN_INTERFACE=\"enp1s0\"/WAN_INTERFACE=\"$WAN_INTERFACE\"/" /opt/captive-portal/scripts/setup-captive-firewall.sh
sed -i "s/LAN_INTERFACE=\"enp2s0\"/LAN_INTERFACE=\"$LAN_INTERFACE\"/" /opt/captive-portal/scripts/setup-captive-firewall.sh

# Executar script de firewall
/opt/captive-portal/scripts/setup-captive-firewall.sh

# Salvar regras permanentemente
netfilter-persistent save

print_info "=== Instalação concluída! ==="
echo ""
print_info "Próximos passos:"
print_info "1. Configure as interfaces de rede em /etc/netplan/00-installer-config.yaml"
print_info "2. Execute: sudo netplan apply"
print_info "3. Edite o arquivo /opt/captive-portal/.env com suas credenciais"
print_info "4. Crie um administrador: sudo -u captive-portal node /opt/captive-portal/scripts/create_admin.js admin senhaForte"
print_info "5. Inicie os serviços:"
print_info "   sudo systemctl start captive-firewall"
print_info "   sudo systemctl start captive-portal"
print_info "6. Verifique status: sudo systemctl status captive-portal"
print_info "7. Veja logs: sudo journalctl -u captive-portal -f"
echo ""
print_info "Acesse a aplicação em: http://192.168.10.1:3000"
print_info "Painel admin: http://192.168.10.1:3000/admin/login.html"
