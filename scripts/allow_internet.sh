#!/usr/bin/env bash
# Script para liberar acesso à internet para um cliente autenticado
# Uso: ./allow_internet.sh <MAC_ADDRESS>
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

# Verificar se já existe uma regra para este MAC
if iptables -C FORWARD -m mac --mac-source "$MAC" -j ACCEPT -m comment --comment "$COMMENT" 2>/dev/null; then
    echo "Acesso já está liberado para MAC: $MAC"
    exit 0
fi

# Permitir FORWARD para este MAC específico (inserir no início da chain)
iptables -I FORWARD 1 -m mac --mac-source "$MAC" -j ACCEPT -m comment --comment "$COMMENT"

echo "[ALLOW] Acesso liberado para MAC: $MAC"

# Log para auditoria
logger -t captive-portal "Acesso liberado para MAC: $MAC"

exit 0

