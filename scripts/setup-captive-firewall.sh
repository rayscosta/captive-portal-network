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

# Regra 9: Permitir HTTPS para domínios OAuth (Google, Facebook)
echo "Permitindo acesso HTTPS para OAuth..."
# Google OAuth
iptables -A FORWARD -p tcp --dport 443 -m string --string "accounts.google.com" --algo bm -j ACCEPT
iptables -A FORWARD -p tcp --dport 443 -m string --string "oauth2.googleapis.com" --algo bm -j ACCEPT
# Facebook OAuth
iptables -A FORWARD -p tcp --dport 443 -m string --string "facebook.com" --algo bm -j ACCEPT
iptables -A FORWARD -p tcp --dport 443 -m string --string "graph.facebook.com" --algo bm -j ACCEPT

# Regra 10: BLOQUEAR todo o resto por padrão (será liberado por MAC após autenticação)
iptables -A FORWARD -j DROP

# === NAT para compartilhar internet ===
echo "Configurando NAT (MASQUERADE)..."
iptables -t nat -A POSTROUTING -o $WAN_INTERFACE -j MASQUERADE

echo "=== Firewall configurado com sucesso! ==="
echo ""
echo "Regras ativas:"
iptables -L -v -n --line-numbers
echo ""
echo "Regras NAT:"
iptables -t nat -L -v -n --line-numbers
