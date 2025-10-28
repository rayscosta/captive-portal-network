#!/usr/bin/env bash
# Comentário: Script para bloquear acesso à internet (reverso do allow_internet.sh)
# Uso: ./block_internet.sh <ip> <mac>
set -euo pipefail

ip="${1:-}"
mac="${2:-}"

echo "[BLOCK] Bloqueando acesso para IP=$ip MAC=$mac" >&2

# Comentário: validação de parâmetros
if [[ -z "$ip" ]] && [[ -z "$mac" ]]; then
  echo "[BLOCK] Erro: É necessário fornecer IP ou MAC" >&2
  exit 1
fi

# Comentário: exemplo de comandos iptables para bloquear acesso
# IMPORTANTE: Adapte conforme sua configuração de rede/gateway
#
# Exemplo para gateway/router Linux com iptables:
#
# 1. Remove regras de ACCEPT que foram criadas pelo allow_internet.sh
# if [[ -n "$ip" ]]; then
#   iptables -D FORWARD -s "$ip" -j ACCEPT 2>/dev/null || true
#   iptables -D FORWARD -d "$ip" -j ACCEPT 2>/dev/null || true
# fi
#
# if [[ -n "$mac" ]]; then
#   iptables -D FORWARD -m mac --mac-source "$mac" -j ACCEPT 2>/dev/null || true
# fi
#
# 2. Adiciona regra de redirect para captive portal (HTTP)
# if [[ -n "$ip" ]]; then
#   iptables -t nat -I PREROUTING -s "$ip" -p tcp --dport 80 -j DNAT --to-destination <GATEWAY_IP>:3000
# fi
#
# 3. Bloqueia HTTPS (ou redireciona para aviso)
# if [[ -n "$ip" ]]; then
#   iptables -I FORWARD -s "$ip" -p tcp --dport 443 -j DROP
# fi

echo "[BLOCK] Bloqueio aplicado (placeholder - implementar iptables)" >&2
exit 0
