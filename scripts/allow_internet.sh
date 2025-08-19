#!/usr/bin/env bash
# Comentário: Script para liberar acesso à internet (placeholder)
# Uso: ./allow_internet.sh <ip> <mac>
set -euo pipefail

ip="${1:-}"
mac="${2:-}"

echo "[ALLOW] Liberando acesso para IP=$ip MAC=$mac (placeholder)" >&2
# Aqui você aplicaria regras de firewall/iptables/redirect específicas do seu gateway
exit 0
