#!/usr/bin/env bash
# Script para bloquear acesso à internet de um cliente (sessão expirada)
# Uso: ./block_internet.sh <MAC_ADDRESS>
set -euo pipefail

MAC="${1:-}"
COMMENT="captive-user-${MAC}"

if [ -z "$MAC" ]; then
    echo "Erro: Endereço MAC não fornecido"
    echo "Uso: $0 <MAC_ADDRESS>"
    exit 1
fi

# Validar formato do MAC (básico)
if ! echo "$MAC" | grep -qE '^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$'; then
    echo "Erro: Formato de MAC inválido: $MAC"
    echo "Formato esperado: XX:XX:XX:XX:XX:XX"
    exit 1
fi

# Verificar se existe uma regra para este MAC
if ! iptables -C FORWARD -m mac --mac-source "$MAC" -j ACCEPT -m comment --comment "$COMMENT" 2>/dev/null; then
    echo "Não há regra ativa para MAC: $MAC"
    exit 0
fi

# Remover regra de FORWARD para este MAC
iptables -D FORWARD -m mac --mac-source "$MAC" -j ACCEPT -m comment --comment "$COMMENT" 2>/dev/null || {
    echo "Erro ao remover regra para MAC: $MAC"
    exit 1
}

echo "[BLOCK] Acesso bloqueado para MAC: $MAC"

# Log para auditoria
logger -t captive-portal "Acesso bloqueado para MAC: $MAC (sessão expirada)"

exit 0

