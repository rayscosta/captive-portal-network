#!/bin/sh
# Entrypoint script para o container Docker
# Configura o firewall e inicia a aplicação

set -e

echo "🔥 Configurando firewall..."

# Verificar se temos permissão para manipular iptables
if ! iptables -L >/dev/null 2>&1; then
    echo "❌ ERRO: Sem permissão para acessar iptables!"
    echo "   Certifique-se de que o container tem as capabilities NET_ADMIN e NET_RAW"
    exit 1
fi

# Verificar se as interfaces de rede estão configuradas
if [ -z "$WAN_INTERFACE" ] || [ -z "$LAN_INTERFACE" ]; then
    echo "⚠️  AVISO: WAN_INTERFACE ou LAN_INTERFACE não configurados"
    echo "   Usando valores padrão: WAN=eth0, LAN=eth1"
    export WAN_INTERFACE="${WAN_INTERFACE:-eth0}"
    export LAN_INTERFACE="${LAN_INTERFACE:-eth1}"
fi

# Executar script de configuração do firewall
if [ -f "/app/scripts/setup-captive-firewall.sh" ]; then
    echo "📝 Executando setup-captive-firewall.sh..."
    bash /app/scripts/setup-captive-firewall.sh
    echo "✅ Firewall configurado!"
else
    echo "⚠️  AVISO: Script setup-captive-firewall.sh não encontrado"
fi

# Verificar se o banco de dados existe, senão criar
if [ ! -f "/app/data/database.sqlite" ]; then
    echo "💾 Banco de dados não encontrado, será criado na primeira execução..."
fi

echo "🚀 Iniciando aplicação Node.js..."
echo "   PORT: ${PORT:-3000}"
echo "   NODE_ENV: ${NODE_ENV:-production}"
echo ""

# Executar o comando passado para o container (geralmente "node src/server.js")
exec "$@"
